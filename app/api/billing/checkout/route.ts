import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildTxRef, createHostedCheckout, FlutterwaveError } from "@/lib/flutterwave";
import { getSubscriptionPrice, isBillingInterval } from "@/lib/pricing";
import { getAppUrl } from "@/lib/app-url";

/** POST /api/billing/checkout { interval: "monthly" | "annual", autoRenew?: boolean }
 * Starts a subscription checkout and returns { link } — the Flutterwave
 * hosted payment page to send the founder to.
 *
 * Two ways to pay, because Flutterwave's recurring billing is card-only:
 *  - default: a one-off payment for one period, by ANY method Flutterwave
 *    offers (card, M-Pesa and other mobile money, bank). The founder
 *    renews by paying again; the dashboard reminds them.
 *  - autoRenew: card only, charged automatically each period through a
 *    Flutterwave Payment Plan. Only offered when the plan IDs are set.
 *
 * Prices come from settings (lib/pricing.ts). The expected amount is
 * recorded in the payments table BEFORE the founder is sent to pay, and
 * access is only granted when Flutterwave confirms that amount was paid
 * (lib/payments.ts). */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { interval?: unknown; autoRenew?: unknown } | null;
  const interval = body?.interval;
  if (!isBillingInterval(interval)) return NextResponse.json({ error: "Invalid interval" }, { status: 400 });

  const planId = interval === "monthly" ? process.env.FLUTTERWAVE_MONTHLY_PLAN_ID : process.env.FLUTTERWAVE_ANNUAL_PLAN_ID;
  const autoRenew = body?.autoRenew === true && !!planId;

  const price = getSubscriptionPrice(interval);
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const txRef = buildTxRef("subscription", user.id);
  const admin = createAdminClient();
  const { data: payment, error: insertError } = await admin
    .from("payments")
    .insert({
      tx_ref: txRef,
      founder_id: user.id,
      product: "subscription",
      billing_interval: interval,
      auto_renew: autoRenew,
      amount: price.amount,
      currency: price.currency,
    })
    .select("id")
    .single();
  if (insertError || !payment) {
    return NextResponse.json({ error: insertError?.message ?? "Could not start checkout" }, { status: 500 });
  }

  try {
    const link = await createHostedCheckout({
      txRef,
      amount: price.amount,
      currency: price.currency,
      redirectUrl: `${getAppUrl(req.url)}/api/billing/callback`,
      customer: { email: user.email!, name: profile?.full_name ?? undefined },
      title: "RENZOLO OS Subscription",
      description: `${interval === "monthly" ? "Monthly" : "Annual"} plan${autoRenew ? " (renews automatically)" : ""}`,
      paymentPlan: autoRenew ? planId : undefined,
      meta: { founder_id: user.id, product: "subscription", interval },
    });
    return NextResponse.json({ link });
  } catch (e) {
    const message = e instanceof FlutterwaveError ? e.message : "Could not reach the payment provider";
    await admin.from("payments").update({ status: "failed", note: `checkout not started: ${message}` }).eq("id", payment.id);
    return NextResponse.json({ error: `Payment could not be started. ${message}` }, { status: 502 });
  }
}
