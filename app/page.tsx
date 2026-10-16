import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";
import { QUICK_QUESTIONS, STAGES } from "@/lib/quickcheck";
import { Glow, OutcomeChips, ProductShowcase, SignalBand } from "@/components/brand/Visuals";

/** Why founders choose RENZOLO over a team operating system (competitors
 * are named only in the private comparison doc). */
const WHY = [
  {
    title: "Built around the outcome you need",
    text: "Pick your goal: win customers, qualify for capital or attract investors. Your assessment, plan, market brief and coaching all work toward it.",
    accent: "#E8603C",
  },
  {
    title: "Built from the buyer's side of the table",
    text: "Readiness checked against what procurement teams, lenders and investors look for, by a founder who has developed suppliers for large buyers.",
    accent: "#F4B740",
  },
  {
    title: "AI and human coaching, at founder prices",
    text: "One founder, one price in US dollars, from $15 a month. An AI coach that knows your plan, plus one-on-one coaching for the big decisions.",
    accent: "#22B8B0",
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
        {/* Hero */}
        <section className="relative overflow-hidden bg-navy text-white">
          <Glow />
          <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 pb-14 pt-12 sm:px-6 sm:pb-20 sm:pt-16 lg:grid-cols-[1.05fr_1fr]">
            <div className="rise">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Customer, capital and investor readiness</p>
              <h1 className="mt-4 max-w-3xl text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-6xl">
                Get ready. <span className="text-gradient">Get chosen.</span> Grow.
              </h1>
              <p className="mt-5 max-w-xl text-lg text-cream/85">
                Founder Trajectory™ shows exactly where your business stands against your strategic plan and the nine building blocks of your
                business model, builds the plan to close the gaps, and coaches you to the standard buyers, lenders and investors look for.
                Powered by RENZOLO OS™.
              </p>
              <OutcomeChips className="mt-6" />
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
                <a href="/snapshot" className="rounded-full bg-gold px-7 py-4 text-center text-lg font-semibold text-white shadow-[0_10px_30px_-10px_rgba(193,139,44,.8)] hover:opacity-95">
                  Start your free Readiness Snapshot
                </a>
                <span className="text-sm text-cream/70 sm:ml-2">5 to 7 minutes · no account needed</span>
              </div>
              <p className="mt-6 text-sm text-cream/70">
                Already a member?{" "}
                <a href="/login" className="font-semibold text-white underline">
                  Log in
                </a>
              </p>
            </div>
            <ProductShowcase />
          </div>
        </section>
        <SignalBand />

        {/* Why RENZOLO */}
        <section className="mx-auto max-w-6xl px-4 pt-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Why founders choose us</p>
          <h2 className="mt-2 max-w-3xl text-2xl font-bold text-navy sm:text-3xl">Operating systems help you run your team. RENZOLO gets your business chosen.</h2>
          <div className="mt-8 grid gap-5 md:grid-cols-3">
            {WHY.map((w) => (
              <div key={w.title} className="rounded-2xl bg-white p-6 shadow-sm">
                <span aria-hidden="true" className="block h-1.5 w-10 rounded-full" style={{ background: w.accent }} />
                <p className="mt-4 text-lg font-bold text-navy">{w.title}</p>
                <p className="mt-2 text-sm text-ink-soft">{w.text}</p>
              </div>
            ))}
          </div>
        </section>

        {/* The method */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">How it works</p>
          <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">The Founder Trajectory™ Method</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">Four steps, repeated as you grow. Each cycle leaves your business more ready than the last.</p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {METHOD.map((m, i) => (
              <li key={m.name} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full font-bold text-white" style={{ background: ["#E8603C", "#C18B2C", "#087F77", "#22B8B0"][i] }}>{i + 1}</span>
                <p className="mt-4 text-lg font-bold text-navy">{m.name}</p>
                <p className="mt-2 text-sm text-ink-soft">{m.body}</p>
              </li>
            ))}
          </ol>
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
              <a href="/snapshot" className="rounded-lg bg-gold px-7 py-4 text-center text-lg font-semibold text-white">
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
