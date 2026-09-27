import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateCheckout } from "@/lib/flutterwave";
import { isAfricanCountry } from "@/lib/geo";

/** Approved by the founder for launch, scoped to the African market
 * this product actually targets: $30 USD, reduced from the original $49
 * placeholder specifically for accessibility — a single one-time
 * session shouldn't cost more than several months of the subscription
 * itself. Flutterwave settles in local currency at checkout, so this
 * one USD figure already reaches every target market within Africa.
 * A founder outside Africa falls back to the original $49 — that price
 * is still an unapproved placeholder (same status as the subscription
 * PRICING in app/api/billing/checkout/route.ts), a real decision to
 * make only if/when this product expands beyond its Africa-only launch.
 * See lib/geo.ts for how "African" is determined from profiles.country. */
const AFRICAN_SESSION_PRICE = { amount: 30, currency: "USD" };
const NON_AFRICAN_SESSION_PRICE = { amount: 49, currency: "USD" };

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

  const { data: profile } = await supabase.from("profiles").select("full_name, country").eq("id", user.id).single();

  const sessionPrice = isAfricanCountry(profile?.country) ? AFRICAN_SESSION_PRICE : NON_AFRICAN_SESSION_PRICE;

  const { tx_ref, payload } = await initiateCheckout({
    product: "advisor_session",
    founderId: user.id,
    email: user.email!,
    name: profile?.full_name ?? user.email!,
    amount: sessionPrice.amount,
    currency: sessionPrice.currency,
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
    price: sessionPrice.amount,
    currency: sessionPrice.currency,
    flutterwave_tx_ref: tx_ref,
  });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ tx_ref, payload });
}
