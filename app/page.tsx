import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";
import { QUICK_QUESTIONS, STAGES } from "@/lib/quickcheck";
import { Button, Eyebrow, Glow, OutcomeCards, TrajectoryBlocks } from "@/components/brand/Visuals";
import { ReadinessTicker } from "@/components/brand/BrandClient";

/** Why founders choose RENZOLO (brand book: never name competitors; contrast
 * with categories and show the proof). */
const WHY = [
  {
    title: "Built around the outcome you need",
    text: "Pick your goal: win customers, qualify for capital or attract investors. Your assessment, plan, market brief and coaching all work toward it. The approach behind 800+ founders trained in 19 African countries.",
  },
  {
    title: "Built from the buyer's side of the table",
    text: "Readiness checked against what procurement teams, lenders and investors look for, by a founder with 20+ years developing suppliers for global buyers across Africa, Europe, the Americas and India.",
  },
  {
    title: "AI and human coaching, at founder prices",
    text: "One founder, one price in US dollars, from $15 a month. An AI coach that knows your plan, plus one-on-one coaching for the big decisions.",
  },
];

const METHOD = [
  {
    name: "Evaluate",
    body: "Start with the free Readiness Snapshot, then complete your full Readiness Assessment. You get a Readiness Report that shows exactly where you stand and why.",
  },
  {
    name: "Evolve",
    body: "Turn your results into a growth and readiness plan of 90 days to 36 months, and update your strategic plan around the gaps that matter most.",
  },
  {
    name: "Execute",
    body: "Work the plan from your dashboard with goals, reminders, tools and coaching, from AI insight to one-on-one sessions, depending on your membership.",
  },
  {
    name: "Elevate",
    body: "Re-assess, measure your progress, and move to your next stage, with priority access to Founder Trajectory™ Academy cohorts.",
  },
];

export default function HomePage() {
  return (
    <>
      <main>
        {/* Hero (light, per the brand book: the website and app landing stay light) */}
        <section id="hero" className="relative overflow-hidden">
          <Glow />
          <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 pb-16 pt-12 sm:px-6 sm:pt-16 lg:grid-cols-[1.1fr_1fr]">
            <div className="hero-in">
              <Eyebrow>Venture Readiness Assessment and Development Support</Eyebrow>
              <h1 className="mt-4 text-[44px] font-extrabold leading-[48px] tracking-[-0.02em] text-ink sm:text-[64px] sm:leading-[68px]">
                Ready for customers, capital and investors.
              </h1>
              <p className="max-w-xl pt-5 text-lg leading-7 text-ink-muted">
                Founder Trajectory™ shows exactly where your business stands against your strategic plan and the nine building blocks of your business model, builds
                the plan to close the gaps, and coaches you to the standard buyers, lenders and investors look for. Powered by RENZOLO OS™.
              </p>
              <div className="flex flex-col gap-3 pt-8 sm:flex-row sm:items-center">
                <Button href="/snapshot" className="sm:whitespace-nowrap">Start your free Readiness Snapshot</Button>
                <span className="text-sm text-ink-muted sm:ml-2">5 to 7 minutes · no account needed</span>
              </div>
              <p className="pt-6 text-sm text-ink-muted">
                Already a member?{" "}
                <a href="/login" className="font-semibold text-teal-text underline underline-offset-4">
                  Log in
                </a>
              </p>
            </div>
            <div className="relative">
              <TrajectoryBlocks className="absolute -bottom-6 left-6 right-6 opacity-90" />
              <div className="float-in relative mx-auto max-w-[420px]">
                <ReadinessTicker />
              </div>
            </div>
          </div>
        </section>

        {/* Three outcomes */}
        <section className="bg-surface-tint">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <Eyebrow>Three outcomes</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">Pick the yes you need next.</h2>
            <div className="mt-10">
              <OutcomeCards hrefFor={(k) => `/snapshot?goal=${k}`} />
            </div>
          </div>
        </section>

        {/* Why RENZOLO */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <Eyebrow>Why founders choose us</Eyebrow>
          <h2 className="mt-2 max-w-4xl text-3xl font-bold text-ink sm:text-4xl">
            Other tools help you run your business. RENZOLO gets you ready for customers, capital and investors, and connects you to them.
          </h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-card border border-line bg-surface-raised p-6">
                <p className="text-lg font-bold text-ink">{w.title}</p>
                <p className="mt-2 text-ink-muted">{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The method */}
        <section className="bg-surface-tint">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <Eyebrow>How it works</Eyebrow>
            <h2 className="mt-2 text-3xl font-bold text-ink sm:text-4xl">The Founder Trajectory™ Method</h2>
            <p className="mt-3 max-w-2xl text-ink-muted">Evaluate. Evolve. Execute. Elevate. Four steps, repeated as you grow.</p>
            <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {METHOD.map((m, i) => (
                <li key={m.name} className="rounded-card border border-line bg-surface-raised p-6">
                  <span className={`flex h-9 w-9 items-center justify-center rounded-pill font-display font-extrabold ${i === 0 ? "bg-brand text-on-brand" : "bg-surface-tint text-ink"}`}>{i + 1}</span>
                  <p className="mt-4 text-lg font-bold text-ink">{m.name}</p>
                  <p className="mt-2 text-sm text-ink-muted">{m.body}</p>
                </li>
              ))}
            </ol>
          </div>
        </section>

        {/* What the Snapshot looks at */}
        <section className="bg-white">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 md:grid-cols-2">
            <div>
              <h2 className="text-2xl font-bold text-navy sm:text-3xl">What the Snapshot looks at</h2>
              <p className="mt-3 text-ink-soft">
                Readiness is more than a good idea. Investors, lenders and partners look for a clear plan and a business model that holds up.
                The Snapshot checks both.
              </p>
              <div className="mt-6 rounded-2xl border border-gold/40 bg-cream p-6">
                <p className="font-semibold text-navy">Your strategic plan</p>
                <p className="mt-1 text-sm text-ink-soft">
                  Is it written down, does it set measurable goals, is it funded, do you review it, and does it address every part of your
                  business model?
                </p>
              </div>
            </div>
            <div>
              <p className="font-semibold text-navy">Your business model, all nine building blocks</p>
              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                {QUICK_QUESTIONS.map((q) => (
                  <div key={q.key} className="rounded-xl border border-gray-200 px-3 py-3 text-sm font-medium text-navy">
                    {q.area}
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs text-ink-soft">Based on the Business Model Canvas.</p>
            </div>
          </div>
        </section>

        {/* Every stage */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 className="text-2xl font-bold text-navy sm:text-3xl">Built for every stage of your Founder Trajectory™</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">Whether you're discovering an idea or preparing for an exit, the platform meets you where you are.</p>
          <ol className="mt-8 flex flex-wrap gap-2">
            {STAGES.map((s, i) => (
              <li key={s} className="flex items-center gap-2">
                <span className="rounded-full bg-white px-4 py-2 text-sm font-medium text-navy shadow-sm">{s.split(":")[0]}</span>
                {i < STAGES.length - 1 && (
                  <span aria-hidden="true" className="text-gold">
                    →
                  </span>
                )}
              </li>
            ))}
          </ol>
        </section>

        {/* Subscription */}
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <h2 className="text-2xl font-bold sm:text-3xl">With a Founder Trajectory™ membership</h2>
            <p className="mt-3 max-w-2xl text-cream/80">The Snapshot shows where the gaps are. Membership shows why they're there, what to do about them, and keeps you on track. Choose the level of coaching and support that fits you.</p>
            <div className="mt-8">
              <SubscriptionFeatures dark />
            </div>
            <div className="mt-10 flex flex-col gap-3 sm:flex-row">
              <a href="/snapshot" className="rounded-lg bg-brand px-7 py-4 text-center text-lg font-semibold text-on-brand">
                Start with the free Snapshot
              </a>
              <a href="/pricing" className="rounded-lg border border-cream/40 px-7 py-4 text-center text-lg font-semibold text-white">
                See membership options
              </a>
            </div>
          </div>
        </section>

      </main>
    </>
  );
}
