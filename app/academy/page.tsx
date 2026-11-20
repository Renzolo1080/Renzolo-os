import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { loadAcademyViewer } from "@/lib/courses-server";
import { BUNDLE_SLUG, COURSES, courseQuote, lessonCount, memberDiscountPercent, alreadyOwnsAll, courseSalesEnabled } from "@/lib/courses";
import { formatPrice } from "@/lib/pricing";
import { REGION_NOTE } from "@/lib/region";
import { BuyCourseButton } from "@/components/academy/AcademyClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Founder Trajectory™ Academy courses | RENZOLO OS™" };

const ACCENT: Record<string, string> = { customer: "bg-brand", capital: "bg-gold", investment: "bg-navy" };
const STEPS = ["Evaluate.", "Evolve.", "Execute.", "Elevate."];
const VOLT = [
  ["V", "Vision", "Picture the outcome in detail."],
  ["O", "Opportunity and Obstacle", "Name the opening and the inner block, side by side."],
  ["L", "Lever", "Write the if-then move that beats the block."],
  ["T", "Thrust", "Keep a weekly rhythm, check your energy, log proof."],
];

/** The Academy catalog: three recorded readiness courses and the bundle.
 * Prices are for the visitor's price zone; members see their 20% price. */
export default async function AcademyPage() {
  const v = await loadAcademyViewer(await createClient());
  const pct = memberDiscountPercent();
  const sales = courseSalesEnabled();
  const bundle = courseQuote(BUNDLE_SLUG, v.tier, v.region);
  const bundleList = courseQuote(BUNDLE_SLUG, "growth", v.region);

  return (
    <main className="mx-auto max-w-6xl px-4 py-12 sm:px-8">
      <section className="max-w-3xl space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-text">Founder Trajectory™ Academy</p>
        <h1 className="text-4xl leading-tight text-navy sm:text-5xl">Courses that get you ready.</h1>
        <p className="text-lg text-ink-soft sm:text-xl">
          Short, recorded courses you work through at your own pace. Each one raises one readiness score and ends with a pack you can hand to a buyer, lender or
          investor.
        </p>
      </section>

      <section aria-label="Member pricing" className="mt-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/60 bg-[#fff8e1] px-6 py-4">
        <p>
          <strong>Members save {pct}% on every course.</strong> Courses are sold separately and are not included in any membership.
        </p>
        {!v.tier && (
          <a href="/pricing" className="font-semibold text-navy underline">
            Compare memberships
          </a>
        )}
      </section>

      <section aria-label="Courses" className="mt-8 grid gap-6 md:grid-cols-3">
        {COURSES.map((c) => {
          const q = courseQuote(c.slug, v.tier, v.region);
          const memberQ = courseQuote(c.slug, "growth", v.region);
          const owned = v.owned.includes(c.slug);
          return (
            <article key={c.slug} className="flex flex-col overflow-hidden rounded-3xl border border-line bg-white">
              <div aria-hidden="true" className={`h-2.5 ${ACCENT[c.score]}`} />
              <div className="flex flex-1 flex-col gap-3 p-7">
                <h2 className="text-2xl text-navy">{c.title}</h2>
                <p className="text-ink-soft">{c.tagline}</p>
                <p className="text-sm text-ink-soft">
                  {lessonCount(c)} lessons · {c.hours} · {c.weeks}
                </p>
                {owned ? (
                  <p className="font-semibold text-navy">You own this course.</p>
                ) : !sales ? (
                  <p className="font-semibold text-navy">Enrolment opens soon.</p>
                ) : (
                  <p className="flex items-baseline gap-3">
                    <span className="text-3xl font-bold text-navy">{formatPrice(q.charge)}</span>
                    <span className="text-sm text-ink-soft">{v.tier ? `was ${formatPrice(q.list)}` : `Members ${formatPrice(memberQ.charge)}`}</span>
                  </p>
                )}
                <div className="mt-auto flex flex-wrap gap-2.5 pt-2">
                  <a href={`/academy/${c.slug}`} className="btn-pop inline-flex min-h-[48px] items-center rounded-pill border-2 border-ink bg-brand px-6 font-semibold text-on-brand">
                    {owned ? "Open course" : "View course"}
                  </a>
                  {!owned && (
                    <a href={`/academy/${c.slug}/l01`} className="inline-flex min-h-[48px] items-center rounded-pill border border-navy px-6 font-semibold text-navy">
                      Free preview
                    </a>
                  )}
                </div>
              </div>
            </article>
          );
        })}
      </section>

      {sales && !alreadyOwnsAll(BUNDLE_SLUG, v.owned) && (
        <section aria-label="Bundle" className="mt-6 flex flex-wrap items-center justify-between gap-5 rounded-3xl bg-navy px-8 py-7 text-white">
          <div>
            <h2 className="text-2xl text-white">All three readiness courses</h2>
            <p className="mt-1 text-[#c9d2dc]">Customer, Capital and Investor Readiness. 54 lessons, lifetime access.</p>
          </div>
          <div className="flex flex-wrap items-center gap-5">
            <p>
              <span className="text-3xl font-bold">{formatPrice(bundle.charge)}</span>{" "}
              <span className="text-sm text-[#c9d2dc]">{v.tier ? `was ${formatPrice(bundle.list)}` : `Members ${formatPrice(bundleList.charge)}`}</span>
            </p>
            <BuyCourseButton course={BUNDLE_SLUG} label={v.userId ? "Get the bundle" : "Log in to buy"} signedIn={!!v.userId} returnTo="/academy" />
          </div>
        </section>
      )}
      {sales && <p className="mt-3 text-sm text-ink-soft">Course prices are in US dollars. {REGION_NOTE}</p>}

      <section className="mt-16 space-y-4">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-text">How every course works</p>
        <h2 className="text-3xl text-navy">One method, four steps, every course.</h2>
        <ol className="flex flex-wrap gap-3">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-2.5 rounded-pill border border-line bg-white px-4 py-2.5 font-semibold text-navy">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs text-white">{i + 1}</span>
              {s}
            </li>
          ))}
        </ol>
      </section>

      <section className="mt-10 space-y-4 rounded-panel bg-surface p-8">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-text">The VOLT method of Founder Trajectory™</p>
        <h2 className="text-2xl text-navy">Every module ends with a 5-minute VOLT practice.</h2>
        <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
          {VOLT.map(([l, t, d]) => (
            <div key={l} className="flex flex-col gap-1 rounded-2xl border border-line bg-white p-4">
              <span className="font-display text-3xl text-brand-text">{l}</span>
              <span className="font-semibold text-navy">{t}</span>
              <span className="text-sm text-ink-soft">{d}</span>
            </div>
          ))}
        </div>
        <p className="text-sm text-ink-soft">VOLT builds on published motivation research on mental contrasting and if-then planning.</p>
      </section>
    </main>
  );
}
