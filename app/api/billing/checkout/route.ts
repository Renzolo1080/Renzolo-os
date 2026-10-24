import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { buildTxRef, createHostedCheckout, FlutterwaveError, type FlutterwaveProduct } from "@/lib/flutterwave";
import {
  getMembershipPrice,
  getOneOffPrice,
  coachingBuyerLevel,
  membershipCurrenciesFor,
  oneOffCurrenciesFor,
  mainCurrency,
  isTier,
  isBillingInterval,
  isOneOffItem,
  tierOffersInterval,
  paymentPlanId,
  COACHING_QUANTITY,
  TIER_NAMES,
  INTERVAL_NAMES,
  type Price,
} from "@/lib/pricing";
import { planChange, entitlements, elevateSeatLimit } from "@/lib/membership";
import { loadMembership, countElevateMembers } from "@/lib/membership-server";
import { getAppUrl } from "@/lib/app-url";

/** POST /api/billing/checkout — starts a Flutterwave checkout and returns
 * { link }, the hosted payment page to send the founder to.
 *
 * Body, one of:
 *   { kind: "membership", tier, interval, currency?, autoRenew? }
 *   { kind: "assessment", currency? }                       the $79 one-time assessment
 *   { kind: "coaching", item: "coaching_single" | "coaching_pack3", currency? }
 *
 * Every amount is worked out here on the server from lib/pricing.ts and
 * lib/membership.ts (upgrade credit, downgrade timing), recorded in the
 * payments table BEFORE the founder is sent to pay, and only granted when
 * Flutterwave confirms that amount was paid (lib/payments.ts). Nothing the
 * browser sends about price is trusted. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const kind = body?.kind ?? "membership";
  const { data: profile } = await supabase.from("profiles").select("full_name, country").eq("id", user.id).single();
  const m = await loadMembership(supabase, user.id);
  const admin = createAdminClient();
  const requested = typeof body?.currency === "string" ? body.currency.trim().toUpperCase() : null;

  let product: FlutterwaveProduct;
  let price: Price;
  let title: string;
  let description: string;
  let row: Record<string, unknown> = {};
  let planId: string | undefined;

  if (kind === "membership") {
    const tier = body?.tier;
    const interval = body?.interval;
    if (!isTier(tier) || !isBillingInterval(interval) || !tierOffersInterval(tier, interval)) {
      return NextResponse.json({ error: "That plan isn't available." }, { status: 400 });
    }
    const currencies = membershipCurrenciesFor(profile?.country);
    const currency = requested ?? currencies[currencies.length - 1];
    if (!currencies.includes(currency)) return NextResponse.json({ error: "That currency isn't available for your account." }, { status: 400 });
    const listPrice = getMembershipPrice(tier, interval, currency);
    if (!listPrice) return NextResponse.json({ error: "That currency isn't available for your account." }, { status: 400 });

    if (tier === "elevate" && m.tier !== "elevate") {
      const taken = await countElevateMembers(admin);
      if (taken >= elevateSeatLimit()) {
        return NextResponse.json({ error: "Elevate is full right now. Join the waitlist and we'll offer you a seat when one opens.", waitlist: true }, { status: 409 });
      }
    }

    const currentList =
      m.tier && m.current.lastPayment ? getMembershipPrice(m.tier, m.current.lastPayment.interval, currency) : null;
    const change = planChange(m.current, { tier, interval, listPrice }, new Date(), currentList);
    if (!change.ok) return NextResponse.json({ error: change.reason }, { status: 409 });

    const plan = paymentPlanId(tier, interval);
    const autoRenew =
      body?.autoRenew === true && !!plan && listPrice.currency === mainCurrency() && (change.kind === "new" || change.kind === "renewal") && change.credit === 0;
    if (autoRenew) planId = plan!;

    product = "subscription";
    price = change.charge;
    title = `Founder Trajectory™ ${TIER_NAMES[tier]} membership`;
    description = `${INTERVAL_NAMES[interval]} · ${change.kind === "upgrade" ? "upgrade" : change.kind === "downgrade" ? "starts when your current period ends" : "membership"}${autoRenew ? " (renews automatically)" : ""}`;
    row = {
      tier,
      billing_interval: interval,
      auto_renew: autoRenew,
      change_kind: change.kind,
      credit_applied: change.credit,
      extra_days: change.extraDays,
    };
  } else if (kind === "assessment") {
    if (entitlements(m.tier).fullReport) {
      return NextResponse.json({ error: "Your membership already includes the full Readiness Assessment." }, { status: 409 });
    }
    const currencies = oneOffCurrenciesFor("assessment", false, profile?.country);
    const currency = requested ?? currencies[currencies.length - 1];
    const p = currencies.includes(currency) ? getOneOffPrice("assessment", false, currency) : null;
    if (!p) return NextResponse.json({ error: "That currency isn't available for your account." }, { status: 400 });
    product = "assessment";
    price = p;
    title = "Founder Trajectory™ Readiness Assessment";
    description = "One-time full Readiness Assessment and report";
  } else if (kind === "coaching") {
    const item = body?.item;
    if (!isOneOffItem(item) || item === "assessment") return NextResponse.json({ error: "Choose one session or three." }, { status: 400 });
    const { data: pastCoaching } = await supabase.from("payments").select("id").eq("founder_id", user.id).eq("product", "coaching").eq("status", "successful").limit(1);
    const level = coachingBuyerLevel({ member: !!m.tier, boughtAssessment: m.purchases.length > 0, hadCoaching: (pastCoaching ?? []).length > 0 });
    const currencies = oneOffCurrenciesFor(item, level, profile?.country);
    const currency = requested ?? currencies[currencies.length - 1];
    const p = currencies.includes(currency) ? getOneOffPrice(item, level, currency) : null;
    if (!p) return NextResponse.json({ error: "That currency isn't available for your account." }, { status: 400 });
    product = "coaching";
    price = p;
    const n = COACHING_QUANTITY[item];
    title = `Founder Trajectory™ coaching (${n} session${n > 1 ? "s" : ""})`;
    description = `${n} one-on-one coaching session${n > 1 ? "s" : ""}, valid for a year`;
    row = { quantity: n };
  } else {
    return NextResponse.json({ error: "Unknown purchase." }, { status: 400 });
  }

  const txRef = buildTxRef(product, user.id);
  const { data: payment, error: insertError } = await admin
    .from("payments")
    .insert({ tx_ref: txRef, founder_id: user.id, product, amount: price.amount, currency: price.currency, ...row })
    .select("id")
    .single();
  if (insertError || !payment) {
    return NextResponse.json({ error: "Could not start checkout. Please try again." }, { status: 500 });
  }

  try {
    const link = await createHostedCheckout({
      txRef,
      amount: price.amount,
      currency: price.currency,
      redirectUrl: `${getAppUrl(req.url)}/api/billing/callback`,
      customer: { email: user.email!, name: profile?.full_name ?? undefined },
      title,
      description,
      paymentPlan: planId,
      meta: { founder_id: user.id, product },
    });
    return NextResponse.json({ link });
  } catch (e) {
    const message = e instanceof FlutterwaveError ? e.message : "Could not reach the payment provider";
    await admin.from("payments").update({ status: "failed", note: `checkout not started: ${message}` }).eq("id", payment.id);
    return NextResponse.json({ error: `Payment could not be started. ${message}` }, { status: 502 });
  }
}
