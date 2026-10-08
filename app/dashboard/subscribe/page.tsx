import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { SubscribeOptions, type PlanOption } from "@/components/SubscribeOptions";
import { getSubscriptionPrice, formatPrice } from "@/lib/pricing";
import { isSubscriptionActive } from "@/lib/payments";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
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

  const active = isSubscriptionActive(subscription);
  const monthly = getSubscriptionPrice("monthly");
  const annual = getSubscriptionPrice("annual");

  // Only claim a saving that is true for the prices currently set.
  const monthsFree = monthly.currency === annual.currency ? (monthly.amount * 12 - annual.amount) / monthly.amount : 0;
  const annualNote =
    monthsFree >= 1 ? `${Number.isInteger(monthsFree) ? monthsFree : monthsFree.toFixed(1)} month${monthsFree === 1 ? "" : "s"} free compared with paying monthly` : null;

  const plans: PlanOption[] = [
    {
      interval: "monthly",
      name: "Monthly",
      price: formatPrice(monthly),
      per: "per month",
      note: null,
      autoRenewAvailable: !!process.env.FLUTTERWAVE_MONTHLY_PLAN_ID,
    },
    {
      interval: "annual",
      name: "Annual",
      price: formatPrice(annual),
      per: "per year",
      note: annualNote,
      autoRenewAvailable: !!process.env.FLUTTERWAVE_ANNUAL_PLAN_ID,
    },
  ];

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <h1 className="text-2xl font-bold text-navy mt-3 mb-2">{active ? "Your subscription" : "Subscribe to RENZOLO OS"}</h1>

      {active ? (
        <div className="rounded border border-gold bg-cream p-4 text-sm mb-6">
          <p className="font-semibold text-navy">Your subscription is active.</p>
          {subscription?.current_period_end ? (
            <p className="text-ink-soft mt-1">
              {subscription.auto_renew
                ? `It renews automatically by card on ${formatDate(subscription.current_period_end)}.`
                : `It is paid through ${formatDate(subscription.current_period_end)}. Paying again now adds time on top of that date, so nothing you have already paid for is lost.`}
            </p>
          ) : (
            <p className="text-ink-soft mt-1">It has no end date.</p>
          )}
        </div>
      ) : (
        <p className="text-ink-soft mb-6">
          Unlock your full Diagnostic Report and the option to book a 1:1 session with an advisor.
        </p>
      )}

      {!(active && subscription?.auto_renew) && <SubscribeOptions plans={plans} renewing={active} />}

      <p className="mt-6 text-xs text-ink-soft">
        Payment is handled by Flutterwave on their secure page. You can pay by card, mobile money (including M-Pesa) or
        bank, depending on your country. Card and mobile-money details are never entered on or stored by this site.
      </p>
    </main>
  );
}
