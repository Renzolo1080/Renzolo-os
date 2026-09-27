import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { verifyWebhookSignature } from "@/lib/flutterwave";

/** POST /api/billing/webhook — Flutterwave calls this on payment events.
 * Verifies the `verif-hash` header against FLUTTERWAVE_WEBHOOK_SECRET_HASH
 * before trusting the payload, per Flutterwave's webhook security model. */
export async function POST(req: NextRequest) {
  const signature = req.headers.get("verif-hash");
  if (!verifyWebhookSignature(signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const event = await req.json();
  const supabase = createAdminClient();

  if (event.event === "charge.completed" && event.data?.status === "successful") {
    const founderId = extractFounderId(event.data.tx_ref);
    if (founderId) {
      await supabase.from("subscriptions").upsert(
        {
          founder_id: founderId,
          status: "active",
          flutterwave_customer_id: event.data.customer?.id?.toString(),
          current_period_end: null, // set from the plan's next-billing-date field once live
          updated_at: new Date().toISOString(),
        },
        { onConflict: "founder_id" }
      );
    }
  }

  return NextResponse.json({ received: true });
}

function extractFounderId(txRef: string): string | null {
  // tx_ref format: renzolo-<founderId>-<timestamp>, set in lib/flutterwave.ts
  const match = /^renzolo-(.+)-\d+$/.exec(txRef ?? "");
  return match ? match[1] : null;
}
