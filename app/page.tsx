import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";
import { QUICK_QUESTIONS, STAGES } from "@/lib/quickcheck";

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
        <section className="bg-navy text-white">
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6 sm:pb-24 sm:pt-20">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Venture Readiness Assessment and Development Support</p>
            <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">
              Know exactly where your business stands, and what to do next.
            </h1>
            <p className="mt-5 max-w-2xl text-lg text-cream/85">
              Founder Trajectory™ gives founders and suppliers a comprehensive view of where their business stands against their strategic plan
              and the nine building blocks of their business model, a readiness and growth plan to close the gaps, and coaching to elevate it to
              the level partners, investors and customers look for. Powered by RENZOLO OS™.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <a href="/snapshot" className="rounded-lg bg-gold px-7 py-4 text-center text-lg font-semibold text-white hover:opacity-95">
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
        </section>

        {/* The method */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">How it works</p>
          <h2 className="mt-2 text-2xl font-bold text-navy sm:text-3xl">The Founder Trajectory™ Method</h2>
          <p className="mt-3 max-w-2xl text-ink-soft">Four steps, repeated as you grow. Each cycle leaves your business more ready than the last.</p>
          <ol className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {METHOD.map((m, i) => (
              <li key={m.name} className="rounded-2xl bg-white p-6 shadow-sm">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gold font-bold text-white">{i + 1}</span>
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
