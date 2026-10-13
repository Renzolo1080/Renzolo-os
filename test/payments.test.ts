import {
  fulfilTransaction,
  fulfilVerified,
  handleSubscriptionCancelled,
  reconcilePendingPayments,
  isSubscriptionActive,
  daysUntilExpiry,
  type AutoRenewInfo,
  type PaymentRecord,
  type PaymentStore,
} from "../lib/payments";
import type { VerifiedTransaction } from "../lib/flutterwave";

/** Decision-rule tests: given what Flutterwave says about a transaction
 * and what this app recorded, is access granted or refused? Run against a
 * simulated store and simulated Flutterwave. The all-or-nothing database
 * step behind grantPayment/grantRenewal is tested for real in
 * test/db.test.ts. */

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

function makeStore() {
  const payments = new Map<string, PaymentRecord>();
  const autoRenew: (AutoRenewInfo & { email: string })[] = [];
  const grants: string[] = []; // one entry per thing actually granted
  const renewalsSeen = new Set<string>();
  const checked: string[] = [];
  const log: string[] = [];

  const store: PaymentStore = {
    async findPaymentByTxRef(txRef) {
      return [...payments.values()].find((p) => p.txRef === txRef) ?? null;
    },
    async findPaymentByTransactionId(id) {
      return [...payments.values()].find((p) => p.flutterwaveTransactionId === id) ?? null;
    },
    async grantPayment(paymentId, tx) {
      const p = payments.get(paymentId)!;
      if (p.status === "successful") return "already_fulfilled";
      p.status = "successful";
      p.flutterwaveTransactionId = tx.id;
      grants.push(p.product === "subscription" ? `subscription:${p.founderId}:${p.billingInterval}` : `session:${p.advisorSessionId}`);
      return "fulfilled";
    },
    async markPaymentFailed(paymentId, transactionId, note) {
      const p = payments.get(paymentId)!;
      if (p.status === "successful") return;
      p.status = "failed";
      p.flutterwaveTransactionId = transactionId;
      log.push(`failed:${note}`);
    },
    async notePendingTransaction(paymentId, transactionId) {
      payments.get(paymentId)!.flutterwaveTransactionId = transactionId;
    },
    async findAutoRenewByEmail(email) {
      const matches = autoRenew.filter((a) => a.email === email.toLowerCase());
      return matches.length === 1 ? matches[0] : null;
    },
    async grantRenewal({ founderId, tx }) {
      if (!autoRenew.some((a) => a.founderId === founderId)) return "no_auto_renew";
      if (renewalsSeen.has(tx.id)) return "already_fulfilled";
      renewalsSeen.add(tx.id);
      grants.push(`renewal:${founderId}`);
      return "fulfilled";
    },
    async setAutoRenewOff(founderId) {
      const i = autoRenew.findIndex((a) => a.founderId === founderId);
      if (i >= 0) autoRenew.splice(i, 1);
      log.push(`auto_renew_off:${founderId}`);
    },
    async listPendingPayments(founderId, _startedAfter, _notCheckedSince, limit) {
      return [...payments.values()].filter((p) => p.founderId === founderId && p.status === "pending").slice(0, limit);
    },
    async markChecked(paymentId) {
      checked.push(paymentId);
    },
  };
  return { store, payments, autoRenew, grants, checked, log };
}

const FOUNDER = "11111111-1111-1111-1111-111111111111";
const OTHER = "22222222-2222-2222-2222-222222222222";
const NOW = new Date("2026-10-08T12:00:00.000Z");
const REF = `renzolo-subscription-${FOUNDER}-1760000000000123456789`;
const SESSION_REF = `renzolo-advisor_session-${FOUNDER}-1760000000000999999999`;

function pending(over: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "pay-1",
    txRef: REF,
    founderId: FOUNDER,
    product: "subscription",
    billingInterval: "monthly",
    autoRenew: false,
    advisorSessionId: null,
    amount: 9,
    currency: "USD",
    status: "pending",
    flutterwaveTransactionId: null,
    ...over,
  };
}

function tx(over: Partial<VerifiedTransaction> = {}): VerifiedTransaction {
  return { id: "5001", txRef: REF, status: "successful", amount: 9, currency: "USD", customerEmail: "founder@example.com", customerId: "77", paymentType: "card", ...over };
}

type S = ReturnType<typeof makeStore>;
const deps = (s: S, t: VerifiedTransaction) => ({
  store: s.store,
  verify: async () => t,
  now: () => NOW,
  subscriptionPrice: (_t: string, i: string, c: string) => (c === "USD" ? { amount: i === "monthly" ? 9 : 90, currency: "USD" } : null),
});
const viaWebhook = (s: S, t: VerifiedTransaction) => fulfilTransaction(t.id, deps(s, t), { source: "webhook" });
const viaCallback = (s: S, t: VerifiedTransaction, urlRef: string | null = t.txRef) => fulfilTransaction(t.id, deps(s, t), { source: "callback", expectedTxRef: urlRef });

async function main() {
  // --- who has access --------------------------------------------------
  assert(isSubscriptionActive(null, NOW) === false, "no subscription row: no access");
  assert(isSubscriptionActive({ status: "none" }, NOW) === false, "status none: no access");
  assert(isSubscriptionActive({ status: "active", current_period_end: null }, NOW) === true, "active with no end date (manual grant): access");
  assert(isSubscriptionActive({ status: "active", current_period_end: "2026-10-09T00:00:00Z" }, NOW) === true, "active and paid through tomorrow: access");
  assert(isSubscriptionActive({ status: "active", current_period_end: "2026-10-08T11:59:59Z" }, NOW) === false, "paid-through date passed, one-off payer: no access");
  assert(isSubscriptionActive({ status: "active", current_period_end: "2026-10-06T00:00:00Z", auto_renew: true }, NOW) === true, "auto-renew keeps access for 3 days while the card is retried");
  assert(isSubscriptionActive({ status: "active", current_period_end: "2026-10-05T11:00:00Z", auto_renew: true }, NOW) === false, "…but not beyond 3 days");
  assert(isSubscriptionActive({ status: "canceled", current_period_end: "2027-01-01T00:00:00Z" }, NOW) === false, "canceled status: no access");
  assert(isSubscriptionActive({ status: "active", current_period_end: "not a date" }, NOW) === false, "unreadable end date: no access (never unlimited by accident)");
  assert(daysUntilExpiry({ status: "active", current_period_end: "2026-10-11T12:00:00Z" }, NOW) === 3, "3 days until expiry");
  assert(daysUntilExpiry({ status: "active", current_period_end: "2026-10-11T12:00:00Z", auto_renew: true }, NOW) === null, "no renew-soon notice when it renews itself");
  assert(daysUntilExpiry({ status: "active", current_period_end: null }, NOW) === null, "no renew-soon notice for a manual grant");

  // --- a normal payment, reported from every direction ------------------
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await viaWebhook(s, tx());
    assert(r.outcome === "fulfilled" && s.grants.length === 1 && s.grants[0] === `subscription:${FOUNDER}:monthly`, "webhook: successful payment of the right amount is granted");
    const again = await viaCallback(s, tx());
    assert(again.outcome === "already_fulfilled" && s.grants.length === 1, "the browser return arriving afterwards grants nothing more");
    const third = await viaWebhook(s, tx());
    assert(third.outcome === "already_fulfilled" && s.grants.length === 1, "a repeated webhook grants nothing more");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await viaCallback(s, tx());
    assert(r.outcome === "fulfilled" && s.grants.length === 1, "browser return first: granted");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await viaWebhook(s, tx({ amount: 10 }));
    assert(r.outcome === "fulfilled", "paying more than the price is still granted");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await viaWebhook(s, tx({ txRef: `${REF}_PMCKDU_1`, id: "5002" }));
    assert(r.outcome === "fulfilled" && s.grants.length === 1, "a retried attempt carrying Flutterwave's retry marker is matched to the same order");
  }

  // --- things that must NOT grant access -------------------------------
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await viaWebhook(s, tx({ amount: 1 }));
    assert(r.outcome === "mismatch" && s.grants.length === 0, "paying $1 for a $9 plan is refused");
    assert(s.payments.get("pay-1")?.status === "failed" && s.log[0].includes("amount mismatch"), "…and the payment is marked failed with the reason");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await viaWebhook(s, tx({ amount: 9, currency: "KES" }));
    assert(r.outcome === "mismatch" && s.grants.length === 0, "9 KES instead of 9 USD is refused");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending({ amount: 1200, currency: "KES" }));
    const r = await viaWebhook(s, tx({ amount: 1200, currency: "KES", paymentType: "mpesa" }));
    assert(r.outcome === "fulfilled", "a local-currency order paid in that currency is granted");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await viaWebhook(s, tx({ status: "failed" }));
    assert(r.outcome === "not_successful" && s.grants.length === 0 && s.payments.get("pay-1")?.status === "failed", "a failed charge grants nothing and closes the payment");
    const retry = await viaWebhook(s, tx({ id: "5002" }));
    assert(retry.outcome === "fulfilled" && s.grants.length === 1, "…and a later successful attempt on the same order is still granted");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await viaCallback(s, tx({ status: "pending" }));
    const p = s.payments.get("pay-1")!;
    assert(r.outcome === "not_successful" && s.grants.length === 0 && p.status === "pending", "a still-pending charge (mobile money awaiting PIN) grants nothing and stays open");
    assert(p.flutterwaveTransactionId === "5001", "…and its transaction ID is kept so it can be re-checked later");
  }
  {
    const s = makeStore();
    const r = await viaWebhook(s, tx());
    assert(r.outcome === "unknown_reference" && s.grants.length === 0, "a reference in our format with no checkout behind it is refused");
    assert(r.outcome === "unknown_reference" && r.paid === true, "…and flagged as money taken with no order, for a person to look at");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    s.payments.set("pay-2", pending({ id: "pay-2", txRef: "renzolo-subscription-other-1", status: "successful", flutterwaveTransactionId: "5001" }));
    const r = await viaWebhook(s, tx());
    assert(r.outcome === "mismatch" && s.grants.length === 0, "one Flutterwave transaction can't pay for two orders");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    let threw = false;
    try {
      await fulfilTransaction("5001", { store: s.store, verify: async () => { throw new Error("Flutterwave unreachable"); } }, { source: "webhook" });
    } catch {
      threw = true;
    }
    assert(threw && s.grants.length === 0 && s.payments.get("pay-1")?.status === "pending", "if Flutterwave can't be reached, nothing is granted and the payment stays open");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    let threw = false;
    try {
      await fulfilTransaction("5001", { store: { ...s.store, grantPayment: async () => { throw new Error("database unavailable"); } }, verify: async () => tx() }, { source: "webhook" });
    } catch {
      threw = true;
    }
    assert(threw && s.payments.get("pay-1")?.status === "pending", "if the database step fails, the error is raised (so Flutterwave retries) and the payment is not marked paid");
  }

  // --- the browser return is tightly limited ---------------------------
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    let verifyCalls = 0;
    const d = { ...deps(s, tx()), verify: async () => { verifyCalls++; return tx(); } };
    const noRef = await fulfilTransaction("5001", d, { source: "callback", expectedTxRef: null });
    const badRef = await fulfilTransaction("5001", d, { source: "callback", expectedTxRef: "renzolo-subscription-nobody-1" });
    assert(noRef.outcome === "unknown_reference" && badRef.outcome === "unknown_reference" && s.grants.length === 0, "a return address naming no real order is refused");
    assert(verifyCalls === 0, "…without spending a call to Flutterwave on it");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    s.payments.set("pay-2", pending({ id: "pay-2", txRef: SESSION_REF, product: "advisor_session", billingInterval: null, advisorSessionId: "sess-1", amount: 30 }));
    // A real $9 subscription transaction pasted onto the $30 session order's return address.
    const r = await viaCallback(s, tx(), SESSION_REF);
    assert(r.outcome === "mismatch" && s.grants.length === 0, "a transaction pasted onto a different order's return address is refused");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    s.autoRenew.push({ email: "founder@example.com", founderId: FOUNDER, renewalInterval: "monthly", renewalTier: null, renewalAmount: 9, renewalCurrency: "USD", flutterwaveCustomerId: "77" });
    const foreign = tx({ id: "6001", txRef: "FLW-SUBSCRIPTION-abc" });
    const r = await viaCallback(s, foreign, REF);
    assert(r.outcome === "mismatch" && s.grants.length === 0, "the browser return can never be used to claim an automatic renewal");
  }

  // --- advisor session -------------------------------------------------
  {
    const s = makeStore();
    s.payments.set("pay-1", pending({ txRef: SESSION_REF, product: "advisor_session", billingInterval: null, advisorSessionId: "sess-1", amount: 30 }));
    const r = await viaWebhook(s, tx({ txRef: SESSION_REF, amount: 30 }));
    assert(r.outcome === "fulfilled" && r.product === "advisor_session" && s.grants[0] === "session:sess-1", "advisor session payment marks that session paid");
    const low = makeStore();
    low.payments.set("pay-1", pending({ txRef: SESSION_REF, product: "advisor_session", billingInterval: null, advisorSessionId: "sess-1", amount: 30 }));
    const r2 = await viaWebhook(low, tx({ txRef: SESSION_REF, amount: 9 }));
    assert(r2.outcome === "mismatch" && low.grants.length === 0, "paying the $9 subscription price for a $30 session is refused");
  }

  // --- automatic card renewals (charged by Flutterwave on its own) ------
  const renewing = (over: Partial<AutoRenewInfo & { email: string }> = {}) => ({
    email: "founder@example.com",
    founderId: FOUNDER,
    renewalInterval: "monthly" as const,
    renewalTier: null,
    renewalAmount: 9 as number | null,
    renewalCurrency: "USD" as string | null,
    flutterwaveCustomerId: "77" as string | null,
    ...over,
  });
  const renewal = (over: Partial<VerifiedTransaction> = {}) => tx({ id: "6001", txRef: "FLW-SUBSCRIPTION-abc123", ...over });
  {
    const s = makeStore();
    s.autoRenew.push(renewing());
    const r = await viaWebhook(s, renewal());
    assert(r.outcome === "fulfilled" && r.renewal === true && s.grants[0] === `renewal:${FOUNDER}`, "a renewal charge reported by webhook is matched to the founder by payer email");
    const dup = await viaWebhook(s, renewal());
    assert(dup.outcome === "already_fulfilled" && s.grants.length === 1, "the same renewal delivered twice extends only once");
    const cheap = await viaWebhook(s, renewal({ id: "6002", amount: 1 }));
    assert(cheap.outcome === "mismatch" && s.grants.length === 1, "an underpaid renewal is refused");
    const stranger = await viaWebhook(s, renewal({ id: "6003", customerEmail: "someone-else@example.com" }));
    assert(stranger.outcome === "unknown_reference" && s.grants.length === 1, "a charge from an email with no auto-renewing subscription is not credited to anyone");
    const otherCustomer = await viaWebhook(s, renewal({ id: "6004", customerId: "999" }));
    assert(otherCustomer.outcome === "unknown_reference" && s.grants.length === 1, "same email but a different Flutterwave customer number is not credited");
  }
  {
    const s = makeStore();
    s.autoRenew.push(renewing({ renewalAmount: 9 }));
    // Today's price has gone up to $12; this subscriber's plan still charges the $9 they agreed to.
    const d = { ...deps(s, renewal()), subscriptionPrice: () => ({ amount: 12, currency: "USD" }) };
    const r = await fulfilTransaction("6001", d, { source: "webhook" });
    assert(r.outcome === "fulfilled", "a renewal is checked against the price agreed at sign-up, not today's price setting");
  }
  {
    const s = makeStore();
    s.autoRenew.push(renewing({ renewalAmount: null, renewalCurrency: null }));
    const ok = await viaWebhook(s, renewal());
    assert(ok.outcome === "fulfilled", "with no agreed price on record, today's price is the fallback");
    const s2 = makeStore();
    s2.autoRenew.push(renewing({ renewalAmount: null, renewalCurrency: null }));
    const none = await viaWebhook(s2, renewal({ currency: "KES", amount: 9 }));
    assert(none.outcome === "mismatch" && s2.grants.length === 0, "…and a renewal in a currency with no price at all is refused");
  }
  {
    const s = makeStore();
    s.autoRenew.push(renewing(), renewing({ founderId: OTHER }));
    const r = await viaWebhook(s, renewal());
    assert(r.outcome === "unknown_reference" && s.grants.length === 0, "two founders billed to one email: nobody is credited rather than guessing");
  }
  {
    const s = makeStore();
    const r = await viaWebhook(s, renewal());
    assert(r.outcome === "unknown_reference" && s.grants.length === 0, "an unrelated charge never extends a subscription that isn't on auto-renew");
    const failed = await viaWebhook(s, renewal({ status: "failed" }));
    assert(failed.outcome === "not_successful", "a failed foreign charge is simply not successful");
  }

  // --- cancelling auto-renew -------------------------------------------
  {
    const s = makeStore();
    s.autoRenew.push(renewing());
    const changed = await handleSubscriptionCancelled("Founder@Example.com", s.store);
    assert(changed && s.log.includes(`auto_renew_off:${FOUNDER}`), "cancelling switches auto-renew off (email matched case-insensitively)");
    assert((await handleSubscriptionCancelled("", s.store)) === false, "a cancellation with no email does nothing");
    assert((await handleSubscriptionCancelled("nobody@example.com", s.store)) === false, "a cancellation for an unknown email does nothing");
  }

  // --- re-checking pending payments from the dashboard ------------------
  {
    const s = makeStore();
    s.payments.set("pay-1", pending({ flutterwaveTransactionId: "5001" }));
    const calls: string[] = [];
    const results = await reconcilePendingPayments(FOUNDER, {
      ...deps(s, tx()),
      verify: async (id) => { calls.push(`id:${id}`); return tx(); },
      verifyByReference: async (ref) => { calls.push(`ref:${ref}`); return tx(); },
    });
    assert(results.length === 1 && results[0].outcome === "fulfilled" && s.grants.length === 1, "a pending payment that has since gone through is completed when the founder opens the dashboard");
    assert(calls.length === 1 && calls[0] === "id:5001", "…looked up by the transaction ID we kept");
    assert(s.checked.includes("pay-1"), "…and stamped as checked so it isn't re-checked on every page view");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const calls: string[] = [];
    const results = await reconcilePendingPayments(FOUNDER, {
      ...deps(s, tx()),
      verify: async (id) => { calls.push(`id:${id}`); return tx(); },
      verifyByReference: async (ref) => { calls.push(`ref:${ref}`); return tx(); },
    });
    assert(results[0]?.outcome === "fulfilled" && calls[0] === `ref:${REF}`, "with no transaction ID on record (tab closed, no webhook) it is looked up by our reference");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const results = await reconcilePendingPayments(FOUNDER, {
      ...deps(s, tx()),
      verifyByReference: async () => { throw new Error("No transaction was found"); },
    });
    assert(results.length === 0 && s.grants.length === 0 && s.payments.get("pay-1")?.status === "pending", "an abandoned checkout (nothing at Flutterwave) is left alone and never throws");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const results = await reconcilePendingPayments(FOUNDER, {
      ...deps(s, tx()),
      verifyByReference: async () => tx({ txRef: "renzolo-subscription-someone-else-1" }),
    });
    assert(results.length === 0 && s.grants.length === 0, "a lookup that returns a different order's transaction is ignored");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const results = await reconcilePendingPayments(OTHER, { ...deps(s, tx()), verifyByReference: async () => tx() });
    assert(results.length === 0 && s.grants.length === 0, "one founder opening their dashboard never touches another founder's payments");
  }
  {
    const s = makeStore();
    s.autoRenew.push(renewing());
    const r = await fulfilVerified(renewal(), deps(s, renewal()), "reconcile");
    assert(r.outcome === "unknown_reference" && s.grants.length === 0, "the dashboard re-check can never claim an automatic renewal either");
  }

  console.log("\nAll payment decision-rule tests completed.");
}

main().catch((e) => {
  console.error("FAIL: test run crashed:", e);
  process.exitCode = 1;
});
