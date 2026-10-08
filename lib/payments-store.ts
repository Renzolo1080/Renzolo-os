import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentRecord, PaymentStore, SubscriptionRecord } from "./payments";

/** The real PaymentStore, backed by Supabase. Always constructed with the
 * service-role (admin) client: founders have read-only access to
 * payments and subscriptions (see supabase/schema.sql), so nothing here
 * can be done from a browser session. */

function toPayment(row: any): PaymentRecord {
  return {
    id: row.id,
    txRef: row.tx_ref,
    founderId: row.founder_id,
    product: row.product,
    billingInterval: row.billing_interval ?? null,
    autoRenew: !!row.auto_renew,
    advisorSessionId: row.advisor_session_id ?? null,
    amount: Number(row.amount),
    currency: row.currency,
    status: row.status,
    flutterwaveTransactionId: row.flutterwave_transaction_id ?? null,
  };
}

function toSubscription(row: any): SubscriptionRecord {
  return {
    founderId: row.founder_id,
    status: row.status,
    billingInterval: row.billing_interval ?? null,
    currentPeriodEnd: row.current_period_end ?? null,
    autoRenew: !!row.auto_renew,
    billingEmail: row.billing_email ?? null,
  };
}

function check(error: { message: string } | null, what: string) {
  if (error) throw new Error(`${what}: ${error.message}`);
}

export function createPaymentStore(admin: SupabaseClient): PaymentStore {
  return {
    async findPaymentByTxRef(txRef) {
      if (!txRef) return null;
      const { data, error } = await admin.from("payments").select("*").eq("tx_ref", txRef).maybeSingle();
      check(error, "Looking up payment");
      return data ? toPayment(data) : null;
    },

    async findPaymentByTransactionId(transactionId) {
      const { data, error } = await admin.from("payments").select("*").eq("flutterwave_transaction_id", transactionId).maybeSingle();
      check(error, "Looking up payment by transaction");
      return data ? toPayment(data) : null;
    },

    async claimPayment(paymentId, transactionId, paidAmount, at) {
      const { data, error } = await admin
        .from("payments")
        .update({ status: "successful", flutterwave_transaction_id: transactionId, paid_amount: paidAmount, fulfilled_at: at, note: null })
        .eq("id", paymentId)
        .neq("status", "successful")
        .select("id");
      check(error, "Claiming payment");
      return (data ?? []).length === 1;
    },

    async releasePayment(paymentId) {
      const { error } = await admin.from("payments").update({ status: "pending", fulfilled_at: null }).eq("id", paymentId);
      check(error, "Releasing payment");
    },

    async markPaymentFailed(paymentId, transactionId, note) {
      const { error } = await admin
        .from("payments")
        .update({ status: "failed", flutterwave_transaction_id: transactionId, note })
        .eq("id", paymentId)
        .neq("status", "successful");
      check(error, "Marking payment failed");
    },

    async recordRenewal(input) {
      const { error } = await admin.from("payments").insert({
        tx_ref: input.txRef,
        founder_id: input.founderId,
        product: "subscription",
        billing_interval: input.billingInterval,
        auto_renew: true,
        amount: input.amount,
        currency: input.currency,
        status: "successful",
        flutterwave_transaction_id: input.transactionId,
        paid_amount: input.amount,
        fulfilled_at: input.at,
        note: "automatic card renewal",
      });
      // 23505 = unique violation: this transaction (or reference) is already recorded.
      if (error && (error as any).code === "23505") return false;
      check(error, "Recording renewal");
      return true;
    },

    async getSubscription(founderId) {
      const { data, error } = await admin.from("subscriptions").select("*").eq("founder_id", founderId).maybeSingle();
      check(error, "Looking up subscription");
      return data ? toSubscription(data) : null;
    },

    async findAutoRenewSubscriptionByEmail(email) {
      const { data, error } = await admin
        .from("subscriptions")
        .select("*")
        .eq("billing_email", email.toLowerCase())
        .eq("auto_renew", true)
        .limit(1)
        .maybeSingle();
      check(error, "Looking up subscription by email");
      return data ? toSubscription(data) : null;
    },

    async activateSubscription(update) {
      const { error } = await admin.from("subscriptions").upsert(
        {
          founder_id: update.founderId,
          status: "active",
          billing_interval: update.billingInterval,
          current_period_end: update.currentPeriodEnd,
          auto_renew: update.autoRenew,
          billing_email: update.billingEmail,
          flutterwave_customer_id: update.flutterwaveCustomerId,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "founder_id" }
      );
      check(error, "Activating subscription");
    },

    async setAutoRenew(founderId, autoRenew) {
      const { error } = await admin.from("subscriptions").update({ auto_renew: autoRenew, updated_at: new Date().toISOString() }).eq("founder_id", founderId);
      check(error, "Updating auto-renew");
    },

    async markAdvisorSessionPaid(sessionId, at) {
      const { error } = await admin.from("advisor_sessions").update({ paid_at: at }).eq("id", sessionId).is("paid_at", null);
      check(error, "Marking advisor session paid");
    },
  };
}
