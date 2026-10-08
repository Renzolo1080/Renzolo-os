import type { VerifiedTransaction, FlutterwaveProduct } from "./flutterwave";
import { parseTxRef } from "./flutterwave";
import { getSubscriptionPrice, type BillingInterval, type Price } from "./pricing";

/** Turning a payment into access ("fulfilment").
 *
 * Both ways Flutterwave tells us about a payment — the founder's browser
 * being redirected back (app/api/billing/callback) and the server-to-
 * server webhook (app/api/billing/webhook) — end up in fulfilTransaction
 * below. Neither is trusted on its own: each only supplies a transaction
 * ID, which is then looked up with Flutterwave directly, and the amount,
 * currency and reference are compared against what THIS app recorded
 * when the checkout was started (the `payments` table).
 *
 * This file has no database or network code in it. It works against the
 * small PaymentStore interface so the rules can be unit-tested with a
 * simulated store and simulated Flutterwave responses
 * (test/payments.test.ts); lib/payments-store.ts is the real store. */

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

export interface SubscriptionRecord {
  founderId: string;
  status: "none" | "active" | "past_due" | "canceled";
  billingInterval: BillingInterval | null;
  currentPeriodEnd: string | null;
  autoRenew: boolean;
  billingEmail: string | null;
}

export interface SubscriptionUpdate {
  founderId: string;
  billingInterval: BillingInterval;
  currentPeriodEnd: string;
  autoRenew: boolean;
  billingEmail: string | null;
  flutterwaveCustomerId: string | null;
}

export interface PaymentStore {
  findPaymentByTxRef(txRef: string): Promise<PaymentRecord | null>;
  findPaymentByTransactionId(transactionId: string): Promise<PaymentRecord | null>;
  /** Atomically moves a payment that is not yet successful (pending, or
   * failed on an earlier attempt and then retried by the customer) to
   * successful. Returns false if another request got there first — that
   * is how a webhook and a redirect arriving at the same moment are kept
   * from both granting access for one payment. */
  claimPayment(paymentId: string, transactionId: string, paidAmount: number, at: string): Promise<boolean>;
  /** Undoes claimPayment when the step after it failed, so a retry can succeed. */
  releasePayment(paymentId: string): Promise<void>;
  markPaymentFailed(paymentId: string, transactionId: string | null, note: string): Promise<void>;
  /** Records an automatic card renewal that Flutterwave charged on its own.
   * Returns false if this transaction was already recorded. */
  recordRenewal(input: { txRef: string; founderId: string; billingInterval: BillingInterval; amount: number; currency: string; transactionId: string; at: string }): Promise<boolean>;
  getSubscription(founderId: string): Promise<SubscriptionRecord | null>;
  findAutoRenewSubscriptionByEmail(email: string): Promise<SubscriptionRecord | null>;
  activateSubscription(update: SubscriptionUpdate): Promise<void>;
  setAutoRenew(founderId: string, autoRenew: boolean): Promise<void>;
  markAdvisorSessionPaid(sessionId: string, at: string): Promise<void>;
}

export type FulfilResult =
  | { outcome: "fulfilled"; product: FlutterwaveProduct; founderId: string; renewal: boolean }
  | { outcome: "already_fulfilled"; product: FlutterwaveProduct; founderId: string }
  | { outcome: "not_successful"; status: string; product: FlutterwaveProduct | null }
  | { outcome: "mismatch"; reason: string; product: FlutterwaveProduct }
  | { outcome: "unknown_reference" };

const DAY_MS = 24 * 60 * 60 * 1000;

/** How long after the paid-through date an auto-renewing subscription
 * keeps working. Flutterwave retries a failed renewal charge a few times
 * over roughly 90 minutes; this covers that plus webhook delay, so a
 * founder isn't locked out mid-renewal. One-off (non-renewing) payments
 * get no grace. */
export const AUTO_RENEW_GRACE_MS = DAY_MS;

/** Adds one billing period. Calendar-based, in UTC: a month means "same
 * day next month" (clamped to the last day when the next month is
 * shorter, e.g. Jan 31 → Feb 28/29), a year means same date next year. */
export function addPeriod(from: Date, interval: BillingInterval): Date {
  const y = from.getUTCFullYear();
  const m = from.getUTCMonth();
  const d = from.getUTCDate();
  const targetY = interval === "annual" ? y + 1 : m === 11 ? y + 1 : y;
  const targetM = interval === "annual" ? m : (m + 1) % 12;
  const lastDay = new Date(Date.UTC(targetY, targetM + 1, 0)).getUTCDate();
  return new Date(
    Date.UTC(targetY, targetM, Math.min(d, lastDay), from.getUTCHours(), from.getUTCMinutes(), from.getUTCSeconds(), from.getUTCMilliseconds())
  );
}

/** New paid-through date after a payment. Time already paid for is never
 * lost: paying early extends from the existing end date, paying after a
 * lapse starts a fresh period from now. */
export function extendPeriod(currentPeriodEnd: string | null | undefined, now: Date, interval: BillingInterval): Date {
  const currentEnd = currentPeriodEnd ? new Date(currentPeriodEnd) : null;
  const start = currentEnd && !Number.isNaN(currentEnd.getTime()) && currentEnd.getTime() > now.getTime() ? currentEnd : now;
  return addPeriod(start, interval);
}

/** The single definition of "does this founder currently have paid
 * access". A subscription with status 'active' and NO end date is a
 * manual grant (e.g. set by hand in Supabase for a pilot founder) and
 * never expires. */
export function isSubscriptionActive(
  sub: { status?: string | null; current_period_end?: string | null; auto_renew?: boolean | null } | null | undefined,
  now: Date = new Date()
): boolean {
  if (!sub || sub.status !== "active") return false;
  if (!sub.current_period_end) return true;
  const end = new Date(sub.current_period_end).getTime();
  if (Number.isNaN(end)) return false;
  return end + (sub.auto_renew ? AUTO_RENEW_GRACE_MS : 0) > now.getTime();
}

/** Days until access ends, for the "renew soon" notice. Null when there
 * is no end date or the subscription renews by itself. */
export function daysUntilExpiry(
  sub: { status?: string | null; current_period_end?: string | null; auto_renew?: boolean | null } | null | undefined,
  now: Date = new Date()
): number | null {
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
  /** Injected so tests don't depend on environment settings. */
  subscriptionPrice?: (interval: BillingInterval) => Price;
}

/** Verifies a transaction with Flutterwave and, if it is a genuine,
 * successful, correctly-priced payment for something this app sold,
 * grants what was paid for — exactly once, however many times it is
 * called for the same transaction. */
export async function fulfilTransaction(transactionId: string, deps: FulfilDeps): Promise<FulfilResult> {
  const { store, verify } = deps;
  const now = (deps.now ?? (() => new Date()))();
  const priceFor = deps.subscriptionPrice ?? ((i: BillingInterval) => getSubscriptionPrice(i));

  const tx = await verify(transactionId);

  const payment = await store.findPaymentByTxRef(tx.txRef);

  if (!payment) {
    // Not a checkout this app started. The only legitimate case is an
    // automatic card renewal, which Flutterwave charges itself under its
    // own reference. Anything shaped like OUR reference with no record
    // behind it is refused outright.
    if (parseTxRef(tx.txRef)) return { outcome: "unknown_reference" };
    if (tx.status !== "successful") return { outcome: "not_successful", status: tx.status, product: null };
    if (!tx.customerEmail) return { outcome: "unknown_reference" };

    const sub = await store.findAutoRenewSubscriptionByEmail(tx.customerEmail);
    if (!sub || !sub.billingInterval) return { outcome: "unknown_reference" };

    const problem = checkAmount(tx, priceFor(sub.billingInterval));
    if (problem) return { outcome: "mismatch", reason: problem, product: "subscription" };

    const recorded = await store.recordRenewal({
      txRef: tx.txRef || `flw-renewal-${tx.id}`,
      founderId: sub.founderId,
      billingInterval: sub.billingInterval,
      amount: tx.amount,
      currency: tx.currency,
      transactionId: tx.id,
      at: now.toISOString(),
    });
    if (!recorded) return { outcome: "already_fulfilled", product: "subscription", founderId: sub.founderId };

    await store.activateSubscription({
      founderId: sub.founderId,
      billingInterval: sub.billingInterval,
      currentPeriodEnd: extendPeriod(sub.currentPeriodEnd, now, sub.billingInterval).toISOString(),
      autoRenew: true,
      billingEmail: tx.customerEmail,
      flutterwaveCustomerId: tx.customerId,
    });
    return { outcome: "fulfilled", product: "subscription", founderId: sub.founderId, renewal: true };
  }

  if (payment.status === "successful") {
    return { outcome: "already_fulfilled", product: payment.product, founderId: payment.founderId };
  }

  // One Flutterwave transaction can only ever pay for one of our payments.
  const reused = await store.findPaymentByTransactionId(tx.id);
  if (reused && reused.id !== payment.id) {
    return { outcome: "mismatch", reason: "transaction already used for a different payment", product: payment.product };
  }

  if (tx.status !== "successful") {
    // "pending" may still complete (mobile money waits on the customer's
    // phone), so only a definite failure closes the payment.
    if (tx.status === "failed") await store.markPaymentFailed(payment.id, tx.id, "Flutterwave reported the charge as failed");
    return { outcome: "not_successful", status: tx.status, product: payment.product };
  }

  const problem = checkAmount(tx, { amount: payment.amount, currency: payment.currency });
  if (problem) {
    await store.markPaymentFailed(payment.id, tx.id, problem);
    return { outcome: "mismatch", reason: problem, product: payment.product };
  }

  const claimed = await store.claimPayment(payment.id, tx.id, tx.amount, now.toISOString());
  if (!claimed) return { outcome: "already_fulfilled", product: payment.product, founderId: payment.founderId };

  try {
    if (payment.product === "subscription") {
      const interval = payment.billingInterval ?? "monthly";
      const existing = await store.getSubscription(payment.founderId);
      await store.activateSubscription({
        founderId: payment.founderId,
        billingInterval: interval,
        currentPeriodEnd: extendPeriod(existing?.currentPeriodEnd, now, interval).toISOString(),
        autoRenew: payment.autoRenew,
        billingEmail: tx.customerEmail,
        flutterwaveCustomerId: tx.customerId,
      });
    } else if (payment.advisorSessionId) {
      await store.markAdvisorSessionPaid(payment.advisorSessionId, now.toISOString());
    }
  } catch (e) {
    // Put the payment back to pending so the next attempt (Flutterwave
    // retries webhooks; the founder may also reload) can finish the job.
    await store.releasePayment(payment.id);
    throw e;
  }

  return { outcome: "fulfilled", product: payment.product, founderId: payment.founderId, renewal: false };
}

/** A founder (or Flutterwave, after repeated failed charges) cancelled
 * card auto-renewal. Access already paid for is kept until its end date;
 * only the "renews by itself" flag is switched off. */
export async function handleSubscriptionCancelled(customerEmail: string | null | undefined, store: PaymentStore): Promise<boolean> {
  const email = (customerEmail ?? "").trim().toLowerCase();
  if (!email) return false;
  const sub = await store.findAutoRenewSubscriptionByEmail(email);
  if (!sub) return false;
  await store.setAutoRenew(sub.founderId, false);
  return true;
}
