import type { VerifiedTransaction, FlutterwaveProduct } from "./flutterwave";
import { parseTxRef, normalizeTxRef } from "./flutterwave";
import type { BillingInterval, Price, Tier } from "./pricing";

/** Turning a payment into access ("fulfilment").
 *
 * Flutterwave tells us about a payment three ways, and all three end up
 * in the same place (fulfilVerified below):
 *  - the founder's browser is sent back to app/api/billing/callback
 *  - Flutterwave calls app/api/billing/webhook server-to-server
 *  - if a payment is still pending when the founder next opens their
 *    dashboard, it is looked up again (reconcilePendingPayments)
 *
 * None of them is trusted on its own. Each only supplies a transaction ID
 * or reference, which is then looked up with Flutterwave directly; the
 * amount, currency and reference are compared against what THIS app
 * recorded when the checkout was started (the `payments` table).
 *
 * Marking a payment paid and granting what it paid for happen as one
 * all-or-nothing step inside the database (the fulfil_payment and
 * record_renewal functions in supabase/schema.sql), so there is no state
 * in which money was taken, the payment says "successful", and nothing
 * was granted.
 *
 * This file has no database or network code in it. It works against the
 * small PaymentStore interface so the decision rules can be unit-tested
 * with a simulated store and simulated Flutterwave responses
 * (test/payments.test.ts). lib/payments-store.ts is the real store; the
 * database functions it calls are tested in test/db.test.ts. */

export type PaymentStatus = "pending" | "successful" | "failed";

export interface PaymentRecord {
  id: string;
  txRef: string;
  founderId: string;
  product: FlutterwaveProduct;
  billingInterval: BillingInterval | null;
  autoRenew: boolean;
  advisorSessionId: string | null;
  amount: number;
  currency: string;
  status: PaymentStatus;
  flutterwaveTransactionId: string | null;
}

/** What an automatic card renewal for a founder is expected to look like. */
export interface AutoRenewInfo {
  founderId: string;
  renewalInterval: BillingInterval;
  /** The tier being renewed (null for a membership from before tiers: Essentials). */
  renewalTier: Tier | null;
  renewalAmount: number | null;
  renewalCurrency: string | null;
  flutterwaveCustomerId: string | null;
}

export type GrantResult = "fulfilled" | "already_fulfilled";

export interface PaymentStore {
  findPaymentByTxRef(txRef: string): Promise<PaymentRecord | null>;
  findPaymentByTransactionId(transactionId: string): Promise<PaymentRecord | null>;
  /** Marks the payment successful and grants what it paid for, atomically.
   * Returns "already_fulfilled" if it had been granted before. */
  grantPayment(paymentId: string, tx: VerifiedTransaction, at: string): Promise<GrantResult>;
  markPaymentFailed(paymentId: string, transactionId: string | null, note: string): Promise<void>;
  /** Remembers Flutterwave's transaction ID on a payment that is still
   * pending, so it can be re-checked later without the founder. */
  notePendingTransaction(paymentId: string, transactionId: string): Promise<void>;
  /** The one auto-renewing subscription billed to this email, or null if
   * there is none — or more than one, in which case nobody is credited. */
  findAutoRenewByEmail(email: string): Promise<AutoRenewInfo | null>;
  /** Records an automatic renewal charge and extends the subscription,
   * atomically and at most once per Flutterwave transaction. */
  grantRenewal(input: { founderId: string; tx: VerifiedTransaction; at: string }): Promise<GrantResult | "no_auto_renew">;
  setAutoRenewOff(founderId: string): Promise<void>;
  /** This founder's payments that are still pending, were started inside
   * the window, and have not been re-checked since `notCheckedSince`. */
  listPendingPayments(founderId: string, startedAfter: string, notCheckedSince: string, limit: number): Promise<PaymentRecord[]>;
  markChecked(paymentId: string, at: string): Promise<void>;
}

export type FulfilResult =
  | { outcome: "fulfilled"; product: FlutterwaveProduct; founderId: string; renewal: boolean }
  | { outcome: "already_fulfilled"; product: FlutterwaveProduct; founderId: string }
  | { outcome: "not_successful"; status: string; product: FlutterwaveProduct | null }
  | { outcome: "mismatch"; reason: string; product: FlutterwaveProduct }
  /** `paid` is true when Flutterwave says money was taken but we could not
   * tie it to an order — a person needs to look at it. */
  | { outcome: "unknown_reference"; paid: boolean };

/** Who is asking. Only a webhook — which carries Flutterwave's secret
 * hash — may be treated as an automatic renewal. The browser return is
 * open to anyone who can type a URL, so it is limited to completing a
 * checkout that this app started and that is named in the URL. */
export type FulfilSource = "webhook" | "callback" | "reconcile";

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long after the paid-through date an auto-renewing subscription
 * keeps working. Covers Flutterwave's retries of a failed renewal charge,
 * webhook delay, and a renewal schedule that runs a day or two behind the
 * calendar month. One-off (non-renewing) payments get no grace.
 * Must match has_active_subscription() in supabase/schema.sql. */
export const AUTO_RENEW_GRACE_MS = 3 * DAY_MS;

type SubscriptionLike = { status?: string | null; current_period_end?: string | null; auto_renew?: boolean | null } | null | undefined;

/** The single definition, on the app side, of "does this founder
 * currently have paid access". A subscription with status 'active' and NO
 * end date is a manual grant (e.g. set by hand in Supabase for a pilot
 * founder) and never expires. */
export function isSubscriptionActive(sub: SubscriptionLike, now: Date = new Date()): boolean {
  if (!sub || sub.status !== "active") return false;
  if (!sub.current_period_end) return true;
  const end = new Date(sub.current_period_end).getTime();
  if (Number.isNaN(end)) return false;
  return end + (sub.auto_renew ? AUTO_RENEW_GRACE_MS : 0) > now.getTime();
}

/** Days until access ends, for the "renew soon" notice. Null when there
 * is no end date or the subscription renews by itself. */
export function daysUntilExpiry(sub: SubscriptionLike, now: Date = new Date()): number | null {
  if (!sub || sub.status !== "active" || !sub.current_period_end || sub.auto_renew) return null;
  const end = new Date(sub.current_period_end).getTime();
  if (Number.isNaN(end)) return null;
  return Math.ceil((end - now.getTime()) / DAY_MS);
}

function checkAmount(tx: VerifiedTransaction, expected: Price): string | null {
  if (tx.currency !== expected.currency.toUpperCase()) {
    return `currency mismatch: paid in ${tx.currency || "unknown"}, expected ${expected.currency}`;
  }
  if (!Number.isFinite(tx.amount) || tx.amount < expected.amount) {
    return `amount mismatch: paid ${tx.amount} ${tx.currency}, expected ${expected.amount} ${expected.currency}`;
  }
  return null;
}

export interface FulfilDeps {
  store: PaymentStore;
  verify: (transactionId: string) => Promise<VerifiedTransaction>;
  now?: () => Date;
  /** Today's subscription price in a currency — the fallback for checking
   * a renewal when the subscription has no renewal amount stored. */
  subscriptionPrice?: (tier: Tier, interval: BillingInterval, currency: string) => Price | null;
}

export interface FulfilOptions {
  source: FulfilSource;
  /** The tx_ref from the return URL. Required when source is "callback". */
  expectedTxRef?: string | null;
}

/** Verifies a transaction with Flutterwave and, if it is a genuine,
 * successful, correctly-priced payment for something this app sold,
 * grants what was paid for — exactly once, however many times and from
 * however many directions it is reported. */
export async function fulfilTransaction(transactionId: string, deps: FulfilDeps, options: FulfilOptions): Promise<FulfilResult> {
  let expected: PaymentRecord | null = null;
  if (options.source === "callback") {
    // Before spending a Flutterwave API call on an ID from a URL, make
    // sure the URL names a checkout that actually exists.
    const ref = normalizeTxRef(options.expectedTxRef);
    expected = ref ? await deps.store.findPaymentByTxRef(ref) : null;
    if (!expected) return { outcome: "unknown_reference", paid: false };
  }
  const tx = await deps.verify(transactionId);
  return fulfilVerified(tx, deps, options.source, expected);
}

/** The decision rules, given a transaction Flutterwave has vouched for. */
export async function fulfilVerified(tx: VerifiedTransaction, deps: FulfilDeps, source: FulfilSource, expected: PaymentRecord | null = null): Promise<FulfilResult> {
  const { store } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const ref = normalizeTxRef(tx.txRef);
  const successful = tx.status === "successful";

  const payment = ref ? await store.findPaymentByTxRef(ref) : null;

  if (expected && (!payment || payment.id !== expected.id)) {
    // The URL named one order but the transaction belongs to another (or
    // to none): someone pasted a transaction ID onto a different order.
    return { outcome: "mismatch", reason: "transaction does not belong to the order named in the return address", product: expected.product };
  }

  if (!payment) {
    // Not a checkout this app started. The only legitimate case is an
    // automatic card renewal, which Flutterwave charges by itself under
    // its own reference — and only a webhook may claim one.
    if (parseTxRef(ref)) return { outcome: "unknown_reference", paid: successful };
    if (!successful) return { outcome: "not_successful", status: tx.status, product: null };
    if (source !== "webhook" || !tx.customerEmail) return { outcome: "unknown_reference", paid: true };

    const sub = await store.findAutoRenewByEmail(tx.customerEmail);
    if (!sub) return { outcome: "unknown_reference", paid: true };

    // Where we know Flutterwave's customer number for this founder, the
    // charge must come from that same customer, not merely the same email.
    if (sub.flutterwaveCustomerId && tx.customerId && sub.flutterwaveCustomerId !== tx.customerId) {
      return { outcome: "unknown_reference", paid: true };
    }

    // Compared with what was agreed when auto-renew was switched on, so a
    // later price change doesn't reject existing subscribers' renewals.
    const expectedPrice: Price | null =
      sub.renewalAmount !== null && sub.renewalCurrency
        ? { amount: sub.renewalAmount, currency: sub.renewalCurrency }
        : deps.subscriptionPrice?.(sub.renewalTier ?? "essentials", sub.renewalInterval, tx.currency) ?? null;
    if (!expectedPrice) return { outcome: "mismatch", reason: "no renewal price on record for this subscription", product: "subscription" };
    const problem = checkAmount(tx, expectedPrice);
    if (problem) return { outcome: "mismatch", reason: problem, product: "subscription" };

    const granted = await store.grantRenewal({ founderId: sub.founderId, tx, at: now.toISOString() });
    if (granted === "no_auto_renew") return { outcome: "unknown_reference", paid: true };
    return granted === "fulfilled"
      ? { outcome: "fulfilled", product: "subscription", founderId: sub.founderId, renewal: true }
      : { outcome: "already_fulfilled", product: "subscription", founderId: sub.founderId };
  }

  if (payment.status === "successful") {
    return { outcome: "already_fulfilled", product: payment.product, founderId: payment.founderId };
  }

  // One Flutterwave transaction can only ever pay for one of our payments.
  const reused = await store.findPaymentByTransactionId(tx.id);
  if (reused && reused.id !== payment.id) {
    return { outcome: "mismatch", reason: "transaction already used for a different payment", product: payment.product };
  }

  if (!successful) {
    if (tx.status === "failed") {
      await store.markPaymentFailed(payment.id, tx.id, "Flutterwave reported the charge as failed");
    } else {
      // Still in progress (mobile money waits on the customer's phone).
      // Keep the ID so the dashboard can re-check it without the founder.
      await store.notePendingTransaction(payment.id, tx.id);
    }
    return { outcome: "not_successful", status: tx.status, product: payment.product };
  }

  const problem = checkAmount(tx, { amount: payment.amount, currency: payment.currency });
  if (problem) {
    await store.markPaymentFailed(payment.id, tx.id, problem);
    return { outcome: "mismatch", reason: problem, product: payment.product };
  }

  const granted = await store.grantPayment(payment.id, tx, now.toISOString());
  return granted === "fulfilled"
    ? { outcome: "fulfilled", product: payment.product, founderId: payment.founderId, renewal: false }
    : { outcome: "already_fulfilled", product: payment.product, founderId: payment.founderId };
}

/** Card auto-renewal was cancelled (by the founder from Flutterwave's
 * email, or by Flutterwave after repeated failed charges). Access already
 * paid for is kept until its end date; only the "renews by itself" flag
 * is switched off. */
export async function handleSubscriptionCancelled(customerEmail: string | null | undefined, store: PaymentStore): Promise<boolean> {
  const email = (customerEmail ?? "").trim().toLowerCase();
  if (!email) return false;
  const sub = await store.findAutoRenewByEmail(email);
  if (!sub) return false;
  await store.setAutoRenewOff(sub.founderId);
  return true;
}

export interface ReconcileDeps extends FulfilDeps {
  verifyByReference: (txRef: string) => Promise<VerifiedTransaction>;
}

/** Only payments started within this long are worth re-checking. */
export const RECONCILE_WINDOW_MS = 24 * 60 * 60 * 1000;
/** …and each is re-checked at most this often. */
export const RECONCILE_MIN_INTERVAL_MS = 2 * 60 * 1000;
/** …and at most this many per dashboard visit. */
export const RECONCILE_MAX_PER_VISIT = 3;

/** The safety net for "I paid but nothing happened". Called when a
 * founder opens their dashboard: any of THEIR payments that is still
 * pending is looked up with Flutterwave again and completed if it has
 * since gone through. This is what makes it true to tell a founder
 * "refresh shortly — you don't need to pay again", even if the webhook
 * never arrives.
 *
 * Deliberately bounded (recent payments only, a few per visit, each at
 * most every couple of minutes) so an abandoned checkout doesn't turn
 * every page view into calls to Flutterwave. Never throws: a failed
 * re-check just leaves the payment pending for next time. */
export async function reconcilePendingPayments(founderId: string, deps: ReconcileDeps): Promise<FulfilResult[]> {
  const now = (deps.now ?? (() => new Date()))();
  const results: FulfilResult[] = [];
  let pending: PaymentRecord[];
  try {
    pending = await deps.store.listPendingPayments(
      founderId,
      new Date(now.getTime() - RECONCILE_WINDOW_MS).toISOString(),
      new Date(now.getTime() - RECONCILE_MIN_INTERVAL_MS).toISOString(),
      RECONCILE_MAX_PER_VISIT
    );
  } catch {
    return results;
  }

  for (const payment of pending) {
    try {
      await deps.store.markChecked(payment.id, now.toISOString());
      const tx = payment.flutterwaveTransactionId ? await deps.verify(payment.flutterwaveTransactionId) : await deps.verifyByReference(payment.txRef);
      // Belt and braces: whatever Flutterwave returned must be for this payment.
      if (normalizeTxRef(tx.txRef) !== payment.txRef) continue;
      results.push(await fulfilVerified(tx, deps, "reconcile"));
    } catch {
      // No transaction yet for an abandoned checkout, or Flutterwave was
      // unreachable. Either way: try again on a later visit.
    }
  }
  return results;
}
