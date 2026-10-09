import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature, verifyTransaction } from "@/lib/flutterwave";
import { fulfilTransaction, handleSubscriptionCancelled } from "@/lib/payments";
import { createPaymentStore } from "@/lib/payments-store";
import { getSubscriptionPriceIn } from "@/lib/pricing";

export const dynamic = "force-dynamic";

/** POST /api/billing/webhook — Flutterwave calls this on payment events.
 *
 * Set this URL and a secret hash in the Flutterwave dashboard (Settings →
 * Webhooks); the same hash goes in FLUTTERWAVE_WEBHOOK_SECRET_HASH.
 *
 * - charge.completed: the transaction ID from the body is verified with
 *   Flutterwave and fulfilled through lib/payments.ts — the body's own
 *   amount/status fields are never used to grant anything. Covers first
 *   payments (subscription or advisor session) and automatic card
 *   renewals alike.
 * - subscription.cancelled: card auto-renewal was cancelled; access that
 *   was already paid for runs to its end date.
 *
 * Responds 200 for anything it understood (including "nothing to do"),
 * because Flutterwave treats any other status as a failed delivery. It
 * responds 500 only when something on our side broke mid-way, so that
 * Flutterwave's retry (when enabled in their dashboard) gets another go.
 * A payment that was taken but could not be applied is written to the
 * server log with "NEEDS ATTENTION" so it can be found. */
export async function POST(req: NextRequest) {
  if (!verifyWebhookSignature(req.headers.get("verif-hash"))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await req.json().catch(() => null);
  if (!event || typeof event !== "object") return NextResponse.json({ received: true, ignored: "unreadable body" });

  const store = createPaymentStore(createAdminClient());

  try {
    if (event.event === "charge.completed" && event.data?.id != null) {
      const id = String(event.data.id);
      const result = await fulfilTransaction(
        id,
        { store, verify: (txId) => verifyTransaction(txId), subscriptionPrice: (interval, currency) => getSubscriptionPriceIn(interval, currency) },
        { source: "webhook" }
      );
      if (result.outcome === "mismatch") console.error("NEEDS ATTENTION — payment taken but not applied (mismatch):", id, result.reason);
      if (result.outcome === "unknown_reference" && result.paid) console.error("NEEDS ATTENTION — payment taken but no matching order:", id);
      return NextResponse.json({ received: true, outcome: result.outcome });
    }

    if (event.event === "subscription.cancelled") {
      const changed = await handleSubscriptionCancelled(event.data?.customer?.email, store);
      return NextResponse.json({ received: true, outcome: changed ? "auto_renew_off" : "no_matching_subscription" });
    }

    return NextResponse.json({ received: true, ignored: event.event ?? "unknown event" });
  } catch (e) {
    console.error("Webhook processing failed:", e);
    return NextResponse.json({ error: "Processing failed" }, { status: 500 });
  }
}
