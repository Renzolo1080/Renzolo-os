import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildTxRef, createHostedCheckout, FlutterwaveError } from "@/lib/flutterwave";
import { getSubscriptionPrice, getSubscriptionPriceIn, subscriptionCurrenciesFor, isBillingInterval } from "@/lib/pricing";
import { isSubscriptionActive } from "@/lib/payments";
import { getAppUrl } from "@/lib/app-url";

/** POST /api/billing/checkout { interval: "monthly" | "annual", currency?: string, autoRenew?: boolean }
 * Starts a subscription checkout and returns { link } — the Flutterwave
 * hosted payment page to send the founder to.
 *
 * Two ways to pay, because Flutterwave's recurring billing is card-only:
 *  - default: a one-off payment for one period, by whatever methods
 *    Flutterwave offers for the currency being charged. The founder
 *    renews by paying again; the dashboard reminds them.
 *  - autoRenew: card only, charged automatically each period through a
 *    Flutterwave Payment Plan. Only offered in the main currency and only
 *    when the plan IDs are set.
 *
 * Currency: the main currency, or the founder's local currency when a
 * price has been set for it (lib/pricing.ts explains why that matters for
 * mobile money). Any other currency is refused.
 *
 * The expected amount is recorded in the payments table BEFORE the
 * founder is sent to pay, and access is only granted when Flutterwave
 * confirms that amount was paid (lib/payments.ts). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { interval?: unknown; currency?: unknown; autoRenew?: unknown } | null;
  const interval = body?.interval;
  if (!isBillingInterval(interval)) return NextResponse.json({ error: "Invalid interval" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("full_name, country").eq("id", user.id).single();

  const mainCurrency = getSubscriptionPrice(interval).currency;
  const requested = typeof body?.currency === "string" ? body.currency.trim().toUpperCase() : mainCurrency;
  if (!subscriptionCurrenciesFor(profile?.country).includes(requested)) {
    return NextResponse.json({ error: "That currency isn't available for your account." }, { status: 400 });
  }
  const price = getSubscriptionPriceIn(interval, requested);
  if (!price) return NextResponse.json({ error: "That currency isn't available for your account." }, { status: 400 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, auto_renew")
    .eq("founder_id", user.id)
    .maybeSingle();
  if (subscription?.auto_renew && isSubscriptionActive(subscription)) {
    // Their card is already being charged each period; a second payment
    // on top would just be paying twice.
    return NextResponse.json({ error: "Your subscription already renews automatically by card, so there is nothing to pay." }, { status: 409 });
  }

  const planId = interval === "monthly" ? process.env.FLUTTERWAVE_MONTHLY_PLAN_ID : process.env.FLUTTERWAVE_ANNUAL_PLAN_ID;
  // A Payment Plan is created in one currency; charging it in another fails.
  const autoRenew = body?.autoRenew === true && !!planId && price.currency === mainCurrency;

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
