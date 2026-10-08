import {
  fulfilTransaction,
  handleSubscriptionCancelled,
  addPeriod,
  extendPeriod,
  isSubscriptionActive,
  daysUntilExpiry,
  type PaymentRecord,
  type PaymentStore,
  type SubscriptionRecord,
} from "../lib/payments";
import type { VerifiedTransaction } from "../lib/flutterwave";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

/** A simulated database: the same PaymentStore interface the real
 * Supabase store implements, held in memory. */
function makeStore() {
  const payments = new Map<string, PaymentRecord>();
  const subs = new Map<string, SubscriptionRecord>();
  const paidSessions = new Map<string, string>();
  let failNextActivation = false;
  const log: string[] = [];

  const store: PaymentStore = {
    async findPaymentByTxRef(txRef) {
      return [...payments.values()].find((p) => p.txRef === txRef) ?? null;
    },
    async findPaymentByTransactionId(id) {
      return [...payments.values()].find((p) => p.flutterwaveTransactionId === id) ?? null;
    },
    async claimPayment(paymentId, transactionId) {
      const p = payments.get(paymentId)!;
      if (p.status === "successful") return false;
      p.status = "successful";
      p.flutterwaveTransactionId = transactionId;
      return true;
    },
    async releasePayment(paymentId) {
      payments.get(paymentId)!.status = "pending";
    },
    async markPaymentFailed(paymentId, transactionId, note) {
      const p = payments.get(paymentId)!;
      if (p.status === "successful") return;
      p.status = "failed";
      p.flutterwaveTransactionId = transactionId;
      log.push(`failed:${note}`);
    },
    async recordRenewal(input) {
      if ([...payments.values()].some((p) => p.flutterwaveTransactionId === input.transactionId || p.txRef === input.txRef)) return false;
      payments.set(`renewal-${input.transactionId}`, {
        id: `renewal-${input.transactionId}`,
        txRef: input.txRef,
        founderId: input.founderId,
        product: "subscription",
        billingInterval: input.billingInterval,
        autoRenew: true,
        advisorSessionId: null,
        amount: input.amount,
        currency: input.currency,
        status: "successful",
        flutterwaveTransactionId: input.transactionId,
      });
      return true;
    },
    async getSubscription(founderId) {
      return subs.get(founderId) ?? null;
    },
    async findAutoRenewSubscriptionByEmail(email) {
      return [...subs.values()].find((s) => s.autoRenew && s.billingEmail === email.toLowerCase()) ?? null;
    },
    async activateSubscription(u) {
      if (failNextActivation) {
        failNextActivation = false;
        throw new Error("database unavailable");
      }
      subs.set(u.founderId, {
        founderId: u.founderId,
        status: "active",
        billingInterval: u.billingInterval,
        currentPeriodEnd: u.currentPeriodEnd,
        autoRenew: u.autoRenew,
        billingEmail: u.billingEmail,
      });
    },
    async setAutoRenew(founderId, autoRenew) {
      subs.get(founderId)!.autoRenew = autoRenew;
    },
    async markAdvisorSessionPaid(sessionId, at) {
      if (!paidSessions.has(sessionId)) paidSessions.set(sessionId, at);
    },
  };
  return { store, payments, subs, paidSessions, log, failActivationOnce: () => (failNextActivation = true) };
}

const FOUNDER = "11111111-1111-1111-1111-111111111111";
const NOW = new Date("2026-10-08T12:00:00.000Z");
const price = (i: "monthly" | "annual") => (i === "monthly" ? { amount: 9, currency: "USD" } : { amount: 90, currency: "USD" });

function pending(over: Partial<PaymentRecord> = {}): PaymentRecord {
  return {
    id: "pay-1",
    txRef: `renzolo-subscription-${FOUNDER}-1760000000000123456`,
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
  return {
    id: "5001",
    txRef: `renzolo-subscription-${FOUNDER}-1760000000000123456`,
    status: "successful",
    amount: 9,
    currency: "USD",
    customerEmail: "founder@example.com",
    customerId: "77",
    paymentType: "mobilemoneyke",
    ...over,
  };
}

const deps = (s: ReturnType<typeof makeStore>, t: VerifiedTransaction, now: Date = NOW) => ({
  store: s.store,
  verify: async () => t,
  now: () => now,
  subscriptionPrice: price,
});

async function main() {
  // --- date arithmetic -------------------------------------------------
  assert(addPeriod(new Date("2026-10-08T12:00:00Z"), "monthly").toISOString() === "2026-11-08T12:00:00.000Z", "a month from 8 Oct is 8 Nov");
  assert(addPeriod(new Date("2026-01-31T00:00:00Z"), "monthly").toISOString() === "2026-02-28T00:00:00.000Z", "a month from 31 Jan clamps to 28 Feb");
  assert(addPeriod(new Date("2028-01-31T00:00:00Z"), "monthly").toISOString() === "2028-02-29T00:00:00.000Z", "…and to 29 Feb in a leap year");
  assert(addPeriod(new Date("2026-12-15T00:00:00Z"), "monthly").toISOString() === "2027-01-15T00:00:00.000Z", "a month from December rolls into the next year");
  assert(addPeriod(new Date("2026-10-08T12:00:00Z"), "annual").toISOString() === "2027-10-08T12:00:00.000Z", "a year from 8 Oct 2026 is 8 Oct 2027");
  assert(addPeriod(new Date("2028-02-29T00:00:00Z"), "annual").toISOString() === "2029-02-28T00:00:00.000Z", "a year from 29 Feb clamps to 28 Feb");
  assert(extendPeriod(null, NOW, "monthly").toISOString() === "2026-11-08T12:00:00.000Z", "first payment: period starts now");
  assert(extendPeriod("2026-10-20T00:00:00Z", NOW, "monthly").toISOString() === "2026-11-20T00:00:00.000Z", "paying early adds on top of the existing end date");
  assert(extendPeriod("2026-09-01T00:00:00Z", NOW, "monthly").toISOString() === "2026-11-08T12:00:00.000Z", "paying after a lapse starts a fresh period from now");

  // --- who has access --------------------------------------------------
  assert(isSubscriptionActive(null, NOW) === false, "no subscription row: no access");
  assert(isSubscriptionActive({ status: "none" }, NOW) === false, "status none: no access");
  assert(isSubscriptionActive({ status: "active", current_period_end: null }, NOW) === true, "active with no end date (manual grant): access");
  assert(isSubscriptionActive({ status: "active", current_period_end: "2026-10-09T00:00:00Z" }, NOW) === true, "active and paid through tomorrow: access");
  assert(isSubscriptionActive({ status: "active", current_period_end: "2026-10-08T11:59:59Z" }, NOW) === false, "paid-through date passed: no access");
  assert(isSubscriptionActive({ status: "active", current_period_end: "2026-10-08T00:00:00Z", auto_renew: true }, NOW) === true, "auto-renew gets a one-day grace while the card is retried");
  assert(isSubscriptionActive({ status: "active", current_period_end: "2026-10-06T00:00:00Z", auto_renew: true }, NOW) === false, "…but not beyond the grace");
  assert(isSubscriptionActive({ status: "canceled", current_period_end: "2027-01-01T00:00:00Z" }, NOW) === false, "canceled status: no access");
  assert(daysUntilExpiry({ status: "active", current_period_end: "2026-10-11T12:00:00Z" }, NOW) === 3, "3 days until expiry");
  assert(daysUntilExpiry({ status: "active", current_period_end: "2026-10-11T12:00:00Z", auto_renew: true }, NOW) === null, "no renew-soon notice when it renews itself");

  // --- a normal subscription payment -----------------------------------
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await fulfilTransaction("5001", deps(s, tx()));
    assert(r.outcome === "fulfilled", "successful payment of the right amount is fulfilled");
    const sub = s.subs.get(FOUNDER);
    assert(sub?.status === "active" && sub.currentPeriodEnd === "2026-11-08T12:00:00.000Z", "subscription is active and paid through one month from now");
    assert(sub?.autoRenew === false && sub.billingEmail === "founder@example.com", "one-off payment: not auto-renewing; payer email kept");

    const again = await fulfilTransaction("5001", deps(s, tx()));
    assert(again.outcome === "already_fulfilled", "the same transaction arriving again (webhook + redirect) is recognised");
    assert(s.subs.get(FOUNDER)?.currentPeriodEnd === "2026-11-08T12:00:00.000Z", "…and does NOT add a second month");
  }

  // --- annual + renewing early -----------------------------------------
  {
    const s = makeStore();
    s.subs.set(FOUNDER, { founderId: FOUNDER, status: "active", billingInterval: "monthly", currentPeriodEnd: "2026-10-20T00:00:00.000Z", autoRenew: false, billingEmail: null });
    s.payments.set("pay-1", pending({ billingInterval: "annual", amount: 90 }));
    const r = await fulfilTransaction("5001", deps(s, tx({ amount: 90 })));
    assert(r.outcome === "fulfilled" && s.subs.get(FOUNDER)?.currentPeriodEnd === "2027-10-20T00:00:00.000Z", "annual renewal while still active extends from the existing end date");
    assert(s.subs.get(FOUNDER)?.billingInterval === "annual", "plan switches to annual");
  }

  // --- things that must NOT grant access -------------------------------
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await fulfilTransaction("5001", deps(s, tx({ amount: 1 })));
    assert(r.outcome === "mismatch" && !s.subs.has(FOUNDER), "paying $1 for a $9 plan is refused");
    assert(s.payments.get("pay-1")?.status === "failed" && s.log[0].includes("amount mismatch"), "…and the payment is marked failed with the reason");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await fulfilTransaction("5001", deps(s, tx({ amount: 9, currency: "KES" })));
    assert(r.outcome === "mismatch" && !s.subs.has(FOUNDER), "9 KES instead of 9 USD is refused");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await fulfilTransaction("5001", deps(s, tx({ status: "failed" })));
    assert(r.outcome === "not_successful" && !s.subs.has(FOUNDER) && s.payments.get("pay-1")?.status === "failed", "a failed charge grants nothing and closes the payment");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await fulfilTransaction("5001", deps(s, tx({ status: "pending" })));
    assert(r.outcome === "not_successful" && s.payments.get("pay-1")?.status === "pending", "a still-pending charge (mobile money awaiting PIN) grants nothing but stays open");
    const later = await fulfilTransaction("5001", deps(s, tx()));
    assert(later.outcome === "fulfilled", "…and is fulfilled once Flutterwave reports it successful");
  }
  {
    const s = makeStore();
    const r = await fulfilTransaction("5001", deps(s, tx()));
    assert(r.outcome === "unknown_reference" && !s.subs.has(FOUNDER), "a reference in our format with no checkout behind it is refused");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    s.payments.set("pay-2", pending({ id: "pay-2", txRef: "renzolo-subscription-other-1", status: "successful", flutterwaveTransactionId: "5001" }));
    const r = await fulfilTransaction("5001", deps(s, tx()));
    assert(r.outcome === "mismatch" && !s.subs.has(FOUNDER), "one Flutterwave transaction can't be used to pay for two orders");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    let threw = false;
    try {
      await fulfilTransaction("5001", { store: s.store, verify: async () => { throw new Error("Flutterwave unreachable"); } });
    } catch {
      threw = true;
    }
    assert(threw && !s.subs.has(FOUNDER) && s.payments.get("pay-1")?.status === "pending", "if Flutterwave can't be reached, nothing is granted and the payment stays open");
  }

  // --- overpayment, retry after failure, database hiccup ----------------
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    const r = await fulfilTransaction("5001", deps(s, tx({ amount: 10 })));
    assert(r.outcome === "fulfilled", "paying more than the price is still fulfilled");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    await fulfilTransaction("5001", deps(s, tx({ status: "failed" })));
    const r = await fulfilTransaction("5002", deps(s, tx({ id: "5002" })));
    assert(r.outcome === "fulfilled" && s.subs.has(FOUNDER), "a customer who fails once and retries successfully in the same checkout gets access");
  }
  {
    const s = makeStore();
    s.payments.set("pay-1", pending());
    s.failActivationOnce();
    let threw = false;
    try {
      await fulfilTransaction("5001", deps(s, tx()));
    } catch {
      threw = true;
    }
    assert(threw && s.payments.get("pay-1")?.status === "pending", "if saving the subscription fails, the payment is reopened rather than lost");
    const retry = await fulfilTransaction("5001", deps(s, tx()));
    assert(retry.outcome === "fulfilled" && s.subs.has(FOUNDER), "…and the retry completes it");
  }

  // --- advisor session -------------------------------------------------
  {
    const s = makeStore();
    const ref = `renzolo-advisor_session-${FOUNDER}-1760000000000999999`;
    s.payments.set("pay-1", pending({ txRef: ref, product: "advisor_session", billingInterval: null, advisorSessionId: "sess-1", amount: 30 }));
    const r = await fulfilTransaction("5001", deps(s, tx({ txRef: ref, amount: 30 })));
    assert(r.outcome === "fulfilled" && r.product === "advisor_session" && s.paidSessions.has("sess-1"), "advisor session payment marks the session paid");
    assert(!s.subs.has(FOUNDER), "…and does not touch the subscription");
    const low = makeStore();
    low.payments.set("pay-1", pending({ txRef: ref, product: "advisor_session", billingInterval: null, advisorSessionId: "sess-1", amount: 30 }));
    const r2 = await fulfilTransaction("5001", deps(low, tx({ txRef: ref, amount: 9 })));
    assert(r2.outcome === "mismatch" && !low.paidSessions.has("sess-1"), "paying the $9 subscription price for a $30 session is refused");
  }

  // --- automatic card renewals (charged by Flutterwave on its own) ------
  {
    const s = makeStore();
    s.subs.set(FOUNDER, { founderId: FOUNDER, status: "active", billingInterval: "monthly", currentPeriodEnd: "2026-10-08T12:00:00.000Z", autoRenew: true, billingEmail: "founder@example.com" });
    const renewal = tx({ id: "6001", txRef: "FLW-SUBSCRIPTION-abc123" });
    const r = await fulfilTransaction("6001", deps(s, renewal));
    assert(r.outcome === "fulfilled" && r.renewal === true, "a renewal charge is matched to the founder by payer email");
    assert(s.subs.get(FOUNDER)?.currentPeriodEnd === "2026-11-08T12:00:00.000Z", "…and extends the subscription by one period");
    const dup = await fulfilTransaction("6001", deps(s, renewal));
    assert(dup.outcome === "already_fulfilled" && s.subs.get(FOUNDER)?.currentPeriodEnd === "2026-11-08T12:00:00.000Z", "the same renewal delivered twice extends only once");
    const cheap = await fulfilTransaction("6002", deps(s, tx({ id: "6002", txRef: "FLW-SUBSCRIPTION-def456", amount: 1 })));
    assert(cheap.outcome === "mismatch", "an underpaid renewal is refused");
    const stranger = await fulfilTransaction("6003", deps(s, tx({ id: "6003", txRef: "FLW-SUBSCRIPTION-xyz", customerEmail: "someone-else@example.com" })));
    assert(stranger.outcome === "unknown_reference", "a charge from an email with no auto-renewing subscription is ignored");
  }
  {
    const s = makeStore();
    s.subs.set(FOUNDER, { founderId: FOUNDER, status: "active", billingInterval: "monthly", currentPeriodEnd: "2026-11-08T12:00:00.000Z", autoRenew: false, billingEmail: "founder@example.com" });
    const r = await fulfilTransaction("6001", deps(s, tx({ id: "6001", txRef: "SOME-OTHER-PAYMENT" })));
    assert(r.outcome === "unknown_reference" && s.subs.get(FOUNDER)?.currentPeriodEnd === "2026-11-08T12:00:00.000Z", "an unrelated charge never extends a subscription that isn't on auto-renew");
  }

  // --- cancelling auto-renew -------------------------------------------
  {
    const s = makeStore();
    s.subs.set(FOUNDER, { founderId: FOUNDER, status: "active", billingInterval: "monthly", currentPeriodEnd: "2026-11-08T12:00:00.000Z", autoRenew: true, billingEmail: "founder@example.com" });
    const changed = await handleSubscriptionCancelled("Founder@Example.com", s.store);
    const sub = s.subs.get(FOUNDER)!;
    assert(changed && sub.autoRenew === false, "cancelling switches auto-renew off (email matched case-insensitively)");
    assert(sub.status === "active" && sub.currentPeriodEnd === "2026-11-08T12:00:00.000Z", "…and keeps the time already paid for");
    assert((await handleSubscriptionCancelled("", s.store)) === false, "a cancellation with no email does nothing");
  }

  console.log("\nAll payment fulfilment tests completed.");
}

main().catch((e) => {
  console.error("FAIL: test run crashed:", e);
  process.exitCode = 1;
});
