import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { MembershipPlans } from "@/components/MembershipPlans";
import { OneOffPurchases, type OneOffPrices } from "@/components/OneOffPurchases";
import { TIER_FEATURES, TIER_TAGLINES, MEMBERSHIP_POLICIES } from "@/lib/tier-features";
import { buildCurrencyBlocks } from "@/lib/membership-view";
import { loadMembership, countElevateMembers } from "@/lib/membership-server";
import { entitlements, upcomingTier, elevateSeatLimit } from "@/lib/membership";
import { getOneOffPrice, oneOffCurrenciesFor, formatPrice, coachingBuyerLevel, TIER_NAMES, INTERVAL_NAMES, isBillingInterval } from "@/lib/pricing";

export const dynamic = "force-dynamic";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Membership: current plan, the three tiers (with the exact cost of
 * upgrading, renewing or moving down), the one-time assessment, and
 * coaching. */
export default async function MembershipPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profile }, m, { data: waitRow }] = await Promise.all([
    supabase.from("profiles").select("country").eq("id", user.id).single(),
    loadMembership(supabase, user.id),
    supabase.from("elevate_waitlist").select("founder_id").eq("founder_id", user.id).maybeSingle(),
  ]);
  const sub = m.subscription;
  const ent = entitlements(m.tier, m.purchases.length > 0);
  const upcoming = upcomingTier(sub);
  const elevateFull = process.env.SUPABASE_SERVICE_ROLE_KEY ? (await countElevateMembers(createAdminClient())) >= elevateSeatLimit() : false;

  const blocks = buildCurrencyBlocks(profile?.country, m.current, m.tier);
  const member = !!m.tier;
  const { data: pastCoaching } = await supabase.from("payments").select("id").eq("product", "coaching").eq("status", "successful").limit(1);
  const level = coachingBuyerLevel({ member, boughtAssessment: m.purchases.length > 0, hadCoaching: (pastCoaching ?? []).length > 0 });
  const oneOffCurrencies = Array.from(
    new Set([...oneOffCurrenciesFor("assessment", false, profile?.country), ...oneOffCurrenciesFor("coaching_single", level, profile?.country)])
  );
  const prices: OneOffPrices[] = oneOffCurrencies.map((c) => {
    const f = (p: ReturnType<typeof getOneOffPrice>) => (p ? formatPrice(p) : null);
    return { currency: c, assessment: f(getOneOffPrice("assessment", false, c)), single: f(getOneOffPrice("coaching_single", level, c)), pack: f(getOneOffPrice("coaching_pack3", level, c)) };
  });
  const std = (item: "coaching_single" | "coaching_pack3") => {
    const p = getOneOffPrice(item, false);
    return p ? formatPrice(p) : null;
  };

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-teal">Founder Trajectory™ membership</p>
      <h1 className="mt-1 text-3xl font-bold text-navy">{m.tier ? "Your membership" : "Choose your membership"}</h1>

      {m.tier && sub ? (
        <div className="mt-4 rounded-2xl border border-gold bg-white p-5 text-sm shadow-sm">
          <p className="text-base font-semibold text-navy">
            {TIER_NAMES[m.tier]}
            {sub.billing_interval && isBillingInterval(sub.billing_interval) ? ` · ${INTERVAL_NAMES[sub.billing_interval]}` : ""}
          </p>
          {sub.current_period_end ? (
            <p className="mt-1 text-ink-soft">
              {sub.auto_renew
                ? `Your card is charged automatically; the current period runs to ${formatDate(sub.current_period_end)}. To stop automatic renewal, use the link in the reminder email Flutterwave sends before each charge.`
                : `Paid through ${formatDate(sub.current_period_end)}. Renewing adds time on top of that date, so nothing you've paid for is lost.`}
            </p>
          ) : (
            <p className="mt-1 text-ink-soft">Set up by our team, with no end date.</p>
          )}
          {upcoming && (
            <p className="mt-1 text-ink-soft">
              {TIER_NAMES[upcoming.tier]} starts on {formatDate(upcoming.from)}.
            </p>
          )}
          {ent.includedCoaching && <p className="mt-1 text-ink-soft">Includes {ent.includedCoaching}.</p>}
        </div>
      ) : (
        <p className="mt-2 max-w-2xl text-ink-soft">
          Every membership starts with your full Readiness Assessment and a growth and readiness plan. Choose the level of coaching and support
          that fits you.
          {m.purchases.length > 0 ? " Your Readiness Assessment carries into your membership." : ""}
        </p>
      )}

      <div className="mt-8">
        <MembershipPlans
          mode="member"
          blocks={blocks}
          currentTier={m.tier}
          elevateFull={elevateFull}
          onWaitlist={!!waitRow}
          features={TIER_FEATURES}
          taglines={TIER_TAGLINES}
        />
      </div>

      <section className="mt-12" id="one-time">
        <h2 className="text-2xl font-bold text-navy">{ent.fullReport ? "Coaching" : "Assessment and coaching"}</h2>
        <div className="mt-5">
          <OneOffPurchases
            prices={prices}
            showAssessment={!ent.fullReport}
            member={member}
            level={level}
            coachingAvailable={m.coachingAvailable}
            nextCoachingFrom={m.nextCoachingFrom}
            standardSingle={std("coaching_single")}
            standardPack={std("coaching_pack3")}
          />
        </div>
      </section>

      <section className="mt-12 rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-navy">How membership works</h2>
        <ul className="mt-3 space-y-2 text-sm text-ink-soft">
          {MEMBERSHIP_POLICIES.map((p) => (
            <li key={p} className="flex gap-2">
              <span className="text-brand-text">•</span>
              <span>{p}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-ink-soft">
          Payment is handled by Flutterwave on their secure page. Card and mobile-money details are never entered on or stored by this site.
        </p>
      </section>
    </main>
  );
}
