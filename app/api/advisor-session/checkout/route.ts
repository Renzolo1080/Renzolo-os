import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildTxRef, createHostedCheckout, FlutterwaveError } from "@/lib/flutterwave";
import { getAdvisorSessionPrice } from "@/lib/pricing";
import { getAppUrl } from "@/lib/app-url";

/** POST /api/advisor-session/checkout { reportId }
 * Starts checkout for a one-time paid 1:1 advisor coaching session and
 * returns { link } — the Flutterwave hosted payment page.
 *
 * This is the upsell path: the AI Diagnostic Report itself is already
 * delivered instantly (see app/api/report/route.ts) — this purchase
 * gets the founder time with a human advisor on top of that.
 *
 * Pricing (lib/pricing.ts): $30 USD for a founder in Africa — approved
 * by the founder for launch, reduced from the original $49 for
 * accessibility. A founder outside Africa gets $49, which is still an
 * unapproved placeholder. Both can be changed in settings. See
 * lib/geo.ts for how "African" is determined from profiles.country.
 *
 * The session row is created now, unpaid (paid_at empty). It only shows
 * up in the advisor queue once Flutterwave confirms the payment and the
 * server sets paid_at (lib/payments.ts). */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { reportId?: unknown } | null;
  const reportId = typeof body?.reportId === "string" ? body.reportId : null;
  if (!reportId) return NextResponse.json({ error: "Missing reportId" }, { status: 400 });

  // Read through the founder's own session: row-level security only
  // returns a report that belongs to them, so this doubles as the
  // ownership check.
  const { data: report } = await supabase.from("reports").select("id").eq("id", reportId).maybeSingle();
  if (!report) return NextResponse.json({ error: "Report not found" }, { status: 404 });

  const { data: profile } = await supabase.from("profiles").select("full_name, country").eq("id", user.id).single();
  const price = getAdvisorSessionPrice(profile?.country);

  const txRef = buildTxRef("advisor_session", user.id);
  const admin = createAdminClient();

  const { data: session, error: sessionError } = await admin
    .from("advisor_sessions")
    .insert({
      founder_id: user.id,
      report_id: report.id,
      status: "requested",
      price: price.amount,
      currency: price.currency,
      flutterwave_tx_ref: txRef,
    })
    .select("id")
    .single();
  if (sessionError || !session) {
    return NextResponse.json({ error: sessionError?.message ?? "Could not start checkout" }, { status: 500 });
  }

  const { data: payment, error: paymentError } = await admin
    .from("payments")
    .insert({
      tx_ref: txRef,
      founder_id: user.id,
      product: "advisor_session",
      advisor_session_id: session.id,
      amount: price.amount,
      currency: price.currency,
    })
    .select("id")
    .single();
  if (paymentError || !payment) {
    await admin.from("advisor_sessions").update({ status: "canceled" }).eq("id", session.id);
    return NextResponse.json({ error: paymentError?.message ?? "Could not start checkout" }, { status: 500 });
  }

  try {
    const link = await createHostedCheckout({
      txRef,
      amount: price.amount,
      currency: price.currency,
      redirectUrl: `${getAppUrl(req.url)}/api/billing/callback`,
      customer: { email: user.email!, name: profile?.full_name ?? undefined },
      title: "RENZOLO OS — 1:1 Advisor Session",
      description: "One-time paid coaching session with an advisor",
      meta: { founder_id: user.id, product: "advisor_session", advisor_session_id: session.id },
    });
    return NextResponse.json({ link });
  } catch (e) {
    const message = e instanceof FlutterwaveError ? e.message : "Could not reach the payment provider";
    await admin.from("payments").update({ status: "failed", note: `checkout not started: ${message}` }).eq("id", payment.id);
    await admin.from("advisor_sessions").update({ status: "canceled" }).eq("id", session.id);
    return NextResponse.json({ error: `Payment could not be started. ${message}` }, { status: 502 });
  }
}
