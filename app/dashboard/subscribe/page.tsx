import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscribeOptions, type CurrencyOption, type PlanOption } from "@/components/SubscribeOptions";
import { getSubscriptionPrice, getSubscriptionPriceIn, subscriptionCurrenciesFor, formatPrice, type Price } from "@/lib/pricing";
import { isSubscriptionActive } from "@/lib/payments";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** What can be used to pay, per currency — taken from Flutterwave's
 * published payment-methods table, NOT yet confirmed against the live
 * checkout page. Kept deliberately modest: a currency not listed here
 * gets a neutral line rather than a promise. */
function methodsFor(currency: string): string {
  switch (currency) {
    case "USD":
      return "US dollar payments are by card or US bank account. Mobile money such as M-Pesa is only offered when paying in local currency.";
    case "KES":
      return "Kenyan shilling payments can be made by M-Pesa or card.";
    case "ZAR":
      return "South African rand payments can be made by card, bank account or 1Voucher.";
    default:
      return `The payment methods offered are the ones Flutterwave supports for ${currency}.`;
  }
}

export default async function SubscribePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, auto_renew, billing_interval")
    .eq("founder_id", user.id)
    .maybeSingle();
  const { data: profile } = await supabase.from("profiles").select("country").eq("id", user.id).single();

  const active = isSubscriptionActive(subscription);
  const neverExpires = active && !subscription?.current_period_end;
  const mainCurrency = getSubscriptionPrice("monthly").currency;

  const options: CurrencyOption[] = subscriptionCurrenciesFor(profile?.country).flatMap((currency) => {
    const monthly = getSubscriptionPriceIn("monthly", currency);
    const annual = getSubscriptionPriceIn("annual", currency);
    if (!monthly || !annual) return [];
    return [{ currency, methods: methodsFor(currency), plans: buildPlans(monthly, annual, currency === mainCurrency) }];
  });

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <h1 className="text-2xl font-bold text-navy mt-3 mb-2">{active ? "Your membership" : "Become a Founder Trajectory™ member"}</h1>

      {active ? (
        <div className="rounded border border-gold bg-cream p-4 text-sm mb-6">
          <p className="font-semibold text-navy">Your membership is active.</p>
          {subscription?.current_period_end ? (
            <p className="text-ink-soft mt-1">
              {subscription.auto_renew
                ? `Your card is charged automatically; the current period runs to ${formatDate(subscription.current_period_end)}. To stop automatic renewal, use the cancellation link in the reminder email Flutterwave sends before each charge.`
                : `It is paid through ${formatDate(subscription.current_period_end)}. Paying again now adds time on top of that date, so nothing you have already paid for is lost.`}
            </p>
          ) : (
            <p className="text-ink-soft mt-1">It has no end date, so there is nothing to pay.</p>
          )}
        </div>
      ) : (
        <p className="text-ink-soft mb-6">Unlock your full Diagnostic Report and the option to book a 1:1 session with an advisor.</p>
      )}

      {!neverExpires && !(active && subscription?.auto_renew) && <SubscribeOptions options={options} renewing={active} />}

      <p className="mt-6 text-xs text-ink-soft">
        Payment is handled by Flutterwave on their secure page. Card and mobile-money details are never entered on or stored
        by this site.
      </p>
    </main>
  );
}

function buildPlans(monthly: Price, annual: Price, isMainCurrency: boolean): PlanOption[] {
  // Only claim a saving that is true for the prices currently set.
  const monthsFree = (monthly.amount * 12 - annual.amount) / monthly.amount;
  const annualNote =
    monthsFree >= 1 ? `${Number.isInteger(monthsFree) ? monthsFree : monthsFree.toFixed(1)} month${monthsFree === 1 ? "" : "s"} free compared with paying monthly` : null;
  return [
    {
      interval: "monthly",
      name: "Monthly",
      price: formatPrice(monthly),
      per: "per month",
      note: null,
      autoRenewAvailable: isMainCurrency && !!process.env.FLUTTERWAVE_MONTHLY_PLAN_ID,
    },
    {
      interval: "annual",
      name: "Annual",
      price: formatPrice(annual),
      per: "per year",
      note: annualNote,
      autoRenewAvailable: isMainCurrency && !!process.env.FLUTTERWAVE_ANNUAL_PLAN_ID,
    },
  ];
}
