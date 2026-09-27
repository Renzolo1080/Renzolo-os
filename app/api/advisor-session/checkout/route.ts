import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateCheckout } from "@/lib/flutterwave";

/** ADVISOR_SESSION_PRICE is a placeholder, same status as the
 * subscription PRICING in app/api/billing/checkout/route.ts — needs a
 * real decision, not a code change, before launch. */
const ADVISOR_SESSION_PRICE = { amount: 49, currency: "USD" };

/** POST /api/advisor-session/checkout { reportId }
 * Starts checkout for a one-time paid 1:1 advisor coaching session.
 * This is the upsell path: the AI Diagnostic Report itself is already
 * delivered instantly (see app/api/report/route.ts) — this purchase
 * gets the founder time with a human advisor on top of that, not access
 * to the report in the first place. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { reportId } = (await req.json()) as { reportId: string };

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const { tx_ref, payload } = await initiateCheckout({
    product: "advisor_session",
    founderId: user.id,
    email: user.email!,
    name: profile?.full_name ?? user.email!,
    amount: ADVISOR_SESSION_PRICE.amount,
    currency: ADVISOR_SESSION_PRICE.currency,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?session=requested`,
  });

  // Recorded as "requested" now, before payment confirms — the webhook
  // flips it to a paid/confirmed state once Flutterwave calls back.
  // Keeping the row from checkout time (not just from the webhook) means
  // an advisor can already see intent even if the payment step stalls.
  const { error } = await supabase.from("advisor_sessions").insert({
    founder_id: user.id,
    report_id: reportId,
    status: "requested",
    price: ADVISOR_SESSION_PRICE.amount,
    currency: ADVISOR_SESSION_PRICE.currency,
    flutterwave_tx_ref: tx_ref,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tx_ref, payload });
}
