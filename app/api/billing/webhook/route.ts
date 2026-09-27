import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature, parseTxRef } from "@/lib/flutterwave";

/** POST /api/billing/webhook — Flutterwave calls this on payment events.
 * One webhook, two possible effects, disambiguated by the tx_ref prefix
 * (see lib/flutterwave.ts parseTxRef): a "subscription" charge activates
 * the founder's subscription; an "advisor_session" charge marks that
 * paid 1:1 session request ready for an advisor to schedule. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("verif-hash");
  if (!verifyWebhookSignature(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await req.json();
  const supabase = createAdminClient();

  if (event.event === "charge.completed" && event.data?.status === "successful") {
    const parsed = parseTxRef(event.data.tx_ref);
    if (parsed?.product === "subscription") {
      await supabase.from("subscriptions").upsert(
        {
          founder_id: parsed.founderId,
          status: "active",
          flutterwave_customer_id: event.data.customer?.id?.toString(),
          current_period_end: null, // set from the plan's next-billing-date field once live
          updated_at: new Date().toISOString(),
        },
        { onConflict: "founder_id" }
      );
    } else if (parsed?.product === "advisor_session") {
      await supabase
        .from("advisor_sessions")
        .update({ status: "requested" }) // stays "requested" (now paid) until an advisor sets scheduled_at
        .eq("flutterwave_tx_ref", event.data.tx_ref);
    }
  }

  return NextResponse.json({ received: true });
}
