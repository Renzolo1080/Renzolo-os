import { MembershipPlans } from "@/components/MembershipPlans";
import { TIER_FEATURES, TIER_TAGLINES, MEMBERSHIP_POLICIES } from "@/lib/tier-features";
import { buildCurrencyBlocks } from "@/lib/membership-view";
import { getOneOffPrice, formatPrice } from "@/lib/pricing";
import { requestRegion } from "@/lib/region-server";
import { ipCountryFrom, REGION_NOTE } from "@/lib/region";
import { headers } from "next/headers";

export const metadata = { title: "Membership and pricing · Founder Trajectory™" };

/** Public pricing: the three tiers, the one-time assessment and coaching.
 * Buttons lead to sign-up; the exact amount for an existing member is
 * worked out on the membership page once they're signed in. */
export default async function PricingPage() {
  // Each visitor sees only the prices for their region (lib/region.ts).
  const region = await requestRegion(null);
  const ip = ipCountryFrom(await headers());
  const blocks = buildCurrencyBlocks(ip, null, null, new Date(), region);
  const assessment = getOneOffPrice("assessment", false, blocks[0]?.currency === "USD" || region.zone === "intl" ? undefined : blocks[0]?.currency, process.env, region) ?? getOneOffPrice("assessment", false, undefined, process.env, region);
  const f = (p: ReturnType<typeof getOneOffPrice>) => (p ? formatPrice(p) : "");
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Founder Trajectory™ membership</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight">Choose the support that fits where you want to be.</h1>
          <p className="mt-4 max-w-2xl text-cream/85">
            Start with the Readiness Assessment on its own, or choose a membership: every membership includes it, plus a growth and readiness plan.
            Not sure yet? Take the free Readiness Snapshot.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <a href="#assessment" className="inline-block rounded-pill bg-brand px-6 py-3 font-semibold text-on-brand">
              Buy the assessment · {f(assessment)}
            </a>
            <a href="/snapshot" className="inline-block rounded-pill border-2 border-white/70 px-6 py-3 font-semibold text-white hover:bg-white/10">
              Take the free Snapshot first
            </a>
          </div>
        </div>
      </section>

      <section id="assessment" className="mx-auto max-w-6xl scroll-mt-24 px-4 pt-12 sm:px-6">
        <div className="flex flex-col gap-6 rounded-2xl border-2 border-brand bg-white p-6 shadow-sm md:flex-row md:items-center md:justify-between md:p-8">
          <div className="min-w-0 max-w-3xl">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">One-time · no membership needed</p>
            <p className="mt-1 text-2xl font-bold text-navy">Readiness Assessment</p>
            <p className="mt-2 text-ink-soft">
              The full assessment and detailed, downloadable AI Readiness Report, with your readiness scores, an AI market insight
              for your industry and country, and a recommendation of the membership tier that fits you. Join within 30 days and it carries straight
              into your membership.
            </p>
          </div>
          <div className="flex shrink-0 flex-col items-start gap-3 md:items-end">
            <p className="text-5xl font-bold text-navy">
              {f(assessment)} <span className="text-base font-normal text-ink-soft">one time</span>
            </p>
            <a href="/register" className="inline-block rounded-pill bg-brand px-6 py-3 font-semibold text-on-brand hover:bg-brand/90">
              Buy the assessment · {f(assessment)}
            </a>
          </div>
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
        <p className="mt-4 text-sm text-ink-soft">{REGION_NOTE}</p>
        <div className="mt-6 grid gap-4 rounded-2xl bg-surface-tint p-5 text-sm sm:grid-cols-2">
          <p>
            <b className="text-navy">Cancel any time.</b> <span className="text-ink-soft">You keep access until the end of what you paid for. The one-time assessment is refundable until your report is created. In the UK and EU you can also cancel within 14 days.</span>
          </p>
          <p>
            <b className="text-navy">Missed a goal while working your plan?</b> <span className="text-ink-soft">We&apos;ll re-assess with you and may add coaching time.</span>{" "}
            <a href="/refunds#progress-review" className="font-semibold text-brand-text underline">How the progress review works</a>
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-12 sm:px-6">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">For founders who want specific insight · no minimum</p>
          <p className="mt-1 text-xl font-bold text-navy">Expert Advisory Sessions</p>
          <p className="mt-1 text-sm text-ink-soft">One-on-one sessions with industry and market experts and experienced founders: advice specific to your industry, your market and your customers. Not general coaching: each session starts from a brief built on your assessment and plan, and agreed actions go straight into your plan.</p>
          <table className="mt-3 w-full text-left text-sm">
            <thead>
              <tr className="text-xs uppercase tracking-wide text-ink-soft">
                <th className="py-1 font-semibold">60-minute sessions</th>
                <th className="py-1 font-semibold">1 session</th>
                <th className="py-1 font-semibold">3 sessions</th>
              </tr>
            </thead>
            <tbody>
              {(
                [
                  ["none", "Not a member"],
                  ["essentials", "Essentials members"],
                  ["growth", "Growth members"],
                  ["elevate", "Elevate members"],
                ] as const
              ).map(([lvl, label]) => (
                <tr key={lvl} className="border-t border-navy/10">
                  <td className="py-1.5 text-navy">{label}</td>
                  <td className="py-1.5 font-semibold text-navy">{f(getOneOffPrice("coaching_single", lvl))}</td>
                  <td className="py-1.5 font-semibold text-navy">{f(getOneOffPrice("coaching_pack3", lvl))}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-sm text-ink-soft">
            Every membership includes coaching: Essentials 1 basic 30-minute session a quarter, Growth 2 30-minute sessions a quarter, Elevate one
            60-minute session a month. Expert Advisory Sessions are on top of those, at the prices above. A first session for non-members includes an intake review and session plan.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-6 rounded-2xl bg-surface-tint p-6">
          <h2 className="text-lg font-bold text-navy">Which plan is right for me?</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div><dt className="font-semibold text-navy">Readiness Assessment</dt><dd className="text-ink-soft">You want a clear, one-time picture of where your business stands and what to fix first.</dd></div>
            <div><dt className="font-semibold text-navy">Essentials</dt><dd className="text-ink-soft">You're early stage and will work your plan yourself, with a coaching check-in each quarter.</dd></div>
            <div><dt className="font-semibold text-navy">Growth</dt><dd className="text-ink-soft">You're operating and closing readiness gaps, and want an AI coach any time plus more live coaching.</dd></div>
            <div><dt className="font-semibold text-navy">Elevate</dt><dd className="text-ink-soft">You're preparing to raise capital or win large contracts and want hands-on support every month.</dd></div>
          </dl>
          <p className="mt-4 text-sm text-ink-soft">
            <b className="text-navy">Start small, move up any time.</b> Upgrading starts straight away and unused time on your current plan comes off the price.
          </p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-navy">How membership works</h2>
          <ul className="mt-3 space-y-2 text-sm text-ink-soft">
            {MEMBERSHIP_POLICIES.map((p) => (
              <li key={p} className="flex gap-2">
                <span className="text-brand-text">•</span>
                <span>{p}</span>
              </li>
            ))}
            <li className="flex gap-2">
              <span className="text-brand-text">•</span>
              <span>Cohorts and accelerators are priced separately. Members get priority when applying, and every founder must qualify.</span>
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
