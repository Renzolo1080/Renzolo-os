import { MembershipPlans } from "@/components/MembershipPlans";
import { TIER_FEATURES, TIER_TAGLINES, MEMBERSHIP_POLICIES } from "@/lib/tier-features";
import { buildCurrencyBlocks } from "@/lib/membership-view";
import { getOneOffPrice, formatPrice } from "@/lib/pricing";

export const metadata = { title: "Membership and pricing · Founder Trajectory™" };

/** Public pricing: the three tiers, the one-time assessment and coaching.
 * Buttons lead to sign-up; the exact amount for an existing member is
 * worked out on the membership page once they're signed in. */
export default function PricingPage() {
  const blocks = buildCurrencyBlocks(null, null, null);
  const f = (p: ReturnType<typeof getOneOffPrice>) => (p ? formatPrice(p) : "");
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Founder Trajectory™ membership</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight">Choose the support that fits where you want to be.</h1>
          <p className="mt-4 max-w-2xl text-cream/85">
            Every membership starts with your full Readiness Assessment and a growth and readiness plan. Not sure which fits? Start with the free
            Readiness Snapshot.
          </p>
          <a href="/snapshot" className="mt-6 inline-block rounded-lg bg-gold px-6 py-3 font-semibold text-white">
            Take the free Snapshot first
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <MembershipPlans
          mode="public"
          blocks={blocks}
          currentTier={null}
          elevateFull={false}
          onWaitlist={false}
          features={TIER_FEATURES}
          taglines={TIER_TAGLINES}
          signupHref="/register"
        />
      </section>

      <section className="mx-auto grid max-w-6xl gap-5 px-4 pb-12 sm:px-6 md:grid-cols-2">
        <div className="rounded-2xl border border-gold/50 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">One-time · no membership</p>
          <p className="mt-1 text-xl font-bold text-navy">Readiness Assessment</p>
          <p className="mt-2 text-4xl font-bold text-navy">{f(getOneOffPrice("assessment", false))}</p>
          <p className="mt-3 text-sm text-ink-soft">
            The full assessment and detailed, downloadable AI Readiness Report, with your valuation range, readiness scores, an AI market insight
            for your industry and country, and a recommendation of the membership tier that fits you. Join within 30 days and it carries straight
            into your membership.
          </p>
          <a href="/register" className="mt-5 inline-block rounded-lg bg-navy px-5 py-3 font-semibold text-white">
            Create an account to buy
          </a>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">No minimum</p>
          <p className="mt-1 text-xl font-bold text-navy">One-on-one coaching</p>
          <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-lg bg-cream p-3">
              <p className="text-ink-soft">1 session</p>
              <p className="text-2xl font-bold text-navy">{f(getOneOffPrice("coaching_single", false))}</p>
              <p className="text-ink-soft">Members {f(getOneOffPrice("coaching_single", true))}</p>
              <p className="text-ink-soft">Starting with coaching {f(getOneOffPrice("coaching_single", "starter"))}</p>
            </div>
            <div className="rounded-lg bg-cream p-3">
              <p className="text-ink-soft">3 sessions</p>
              <p className="text-2xl font-bold text-navy">{f(getOneOffPrice("coaching_pack3", false))}</p>
              <p className="text-ink-soft">Members {f(getOneOffPrice("coaching_pack3", true))}</p>
              <p className="text-ink-soft">Starting with coaching {f(getOneOffPrice("coaching_pack3", "starter"))}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-ink-soft">
            Standard prices are for assessment and cohort clients. Starting with coaching includes an intake review and session plan on your first purchase.
            Growth and Elevate include coaching sessions every period.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy">How membership works</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {MEMBERSHIP_POLICIES.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-gold">•</span>
                <span>{p}</span>
              </li>
            ))}
            <li className="flex gap-2">
              <span className="text-gold">•</span>
              <span>Cohorts and accelerators are priced separately. Members get priority when applying, and every founder must qualify.</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
