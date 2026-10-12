import type { SupabaseClient } from "@supabase/supabase-js";
import type { PaymentRecord, PaymentStore, AutoRenewInfo, GrantResult } from "./payments";

/** The real PaymentStore, backed by Supabase. Always constructed with the
 * service-role (admin) client: founders have read-only access to
 * payments and subscriptions (see supabase/schema.sql), so nothing here
 * can be done from a browser session.
 *
 * The two operations that grant access (grantPayment, grantRenewal) call
 * database functions, so each is a single all-or-nothing transaction —
 * see fulfil_payment and record_renewal in supabase/schema.sql. */

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

    async grantPayment(paymentId, tx, at) {
      const { data, error } = await admin.rpc("fulfil_payment", {
        p_payment_id: paymentId,
        p_transaction_id: tx.id,
        p_paid_amount: tx.amount,
        p_customer_email: tx.customerEmail,
        p_customer_id: tx.customerId,
        p_now: at,
      });
      check(error, "Granting payment");
      if (data !== "fulfilled" && data !== "already_fulfilled") throw new Error(`Granting payment: unexpected result ${JSON.stringify(data)}`);
      return data as GrantResult;
    },

    async markPaymentFailed(paymentId, transactionId, note) {
      const { error } = await admin
        .from("payments")
        .update({ status: "failed", flutterwave_transaction_id: transactionId, note })
        .eq("id", paymentId)
        .neq("status", "successful");
      check(error, "Marking payment failed");
    },

    async notePendingTransaction(paymentId, transactionId) {
      const { error } = await admin
        .from("payments")
        .update({ flutterwave_transaction_id: transactionId })
        .eq("id", paymentId)
        .neq("status", "successful");
      check(error, "Noting pending transaction");
    },

    async findAutoRenewByEmail(email) {
      const { data, error } = await admin
        .from("subscriptions")
        .select("founder_id, renewal_interval, renewal_amount, renewal_currency, flutterwave_customer_id")
        .eq("billing_email", email.toLowerCase())
        .eq("auto_renew", true)
        .not("renewal_interval", "is", null)
        .limit(2);
      check(error, "Looking up subscription by email");
      // Two founders billed to one email: there is no safe way to choose,
      // so nobody is credited and the charge is flagged for a person.
      if (!data || data.length !== 1) return null;
      const row: any = data[0];
      const info: AutoRenewInfo = {
        founderId: row.founder_id,
        renewalInterval: row.renewal_interval,
        renewalAmount: row.renewal_amount === null || row.renewal_amount === undefined ? null : Number(row.renewal_amount),
        renewalCurrency: row.renewal_currency ?? null,
        flutterwaveCustomerId: row.flutterwave_customer_id ?? null,
      };
      return info;
    },

    async grantRenewal({ founderId, tx, at }) {
      const { data, error } = await admin.rpc("record_renewal", {
        p_founder: founderId,
        p_transaction_id: tx.id,
        p_amount: tx.amount,
        p_currency: tx.currency,
        p_customer_email: tx.customerEmail,
        p_customer_id: tx.customerId,
        p_now: at,
      });
      check(error, "Recording renewal");
      if (data !== "fulfilled" && data !== "already_fulfilled" && data !== "no_auto_renew") {
        throw new Error(`Recording renewal: unexpected result ${JSON.stringify(data)}`);
      }
      return data;
    },

    async setAutoRenewOff(founderId) {
      const { error } = await admin.from("subscriptions").update({ auto_renew: false, updated_at: new Date().toISOString() }).eq("founder_id", founderId);
      check(error, "Switching auto-renew off");
    },

    async listPendingPayments(founderId, startedAfter, notCheckedSince, limit) {
      const { data, error } = await admin
        .from("payments")
        .select("*")
        .eq("founder_id", founderId)
        .eq("status", "pending")
        .gte("created_at", startedAfter)
        .or(`last_checked_at.is.null,last_checked_at.lt.${notCheckedSince}`)
        .order("created_at", { ascending: false })
        .limit(limit);
      check(error, "Listing pending payments");
      return (data ?? []).map(toPayment);
    },

    async markChecked(paymentId, at) {
      const { error } = await admin.from("payments").update({ last_checked_at: at }).eq("id", paymentId);
      check(error, "Marking payment checked");
    },
  };
}
