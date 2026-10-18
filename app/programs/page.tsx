import { CohortForm } from "@/components/PublicForms";

export const metadata = {
  title: "Founder Trajectory™ Academy · cohorts",
  description: "Founder Trajectory™ Academy development levels: Launch (8 weeks), Build (12 weeks) and Scale (6 months).",
};

const FORMATS = [
  { name: "Launch", weeks: "8 weeks", focus: "Self-paced, high-volume programme for early-stage founders: all nine parts of your business model in 8 weeks, Lorenzo · AI coaching and one 30-minute live session, ending with a written plan." },
  { name: "Build", weeks: "12 weeks", focus: "For businesses with customers: traction first (channels, pricing, cash flow, operations), then readiness for loans, grants, contracts and investors. Live group sessions and coaching." },
  { name: "Scale", weeks: "6 months", focus: "Selective, hands-on programme to raise capital, scale or win large contracts, with introductions to investors, lenders and buyers. Once a year." },
];

export default function ProgramsPage() {
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Founder Trajectory™ Academy</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight">Grow alongside founders who are building too.</h1>
          <p className="mt-4 max-w-2xl text-cream/85">
            Academy cohorts are structured, self-paced programs with live sessions and coaching, built on the Founder Trajectory™ Method: Evaluate,
            Evolve, Execute, Elevate. You work through your own growth and readiness plan, together with a group of founders.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <h2 className="mb-6 text-2xl font-bold text-navy">Founder Trajectory™ Academy: Development Levels</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {FORMATS.map((f) => (
            <div key={f.name} className="rounded-2xl bg-white p-6 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-teal">{f.weeks}</p>
              <p className="mt-1 text-2xl font-bold text-navy">{f.name}</p>
              <p className="mt-2 text-sm text-ink-soft">{f.focus}</p>
            </div>
          ))}
        </div>

        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          <div>
            <h2 className="text-2xl font-bold text-navy">How cohorts work</h2>
            <ul className="mt-4 space-y-3 text-sm">
              {[
                "Launch and Build open three times a year. Scale runs once a year.",
                "Cohorts run for a set time and have their own fee. Membership is separate and lasts as long as you like.",
                "Members get priority when applying. Every founder applies and must qualify, so each cohort is a strong group.",
                "Your Readiness Assessment and plan are your starting point, so you arrive knowing exactly what to work on.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="font-bold text-teal-text">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-ink-soft">
              Not a member yet?{" "}
              <a href="/snapshot" className="font-semibold text-teal underline">
                Start with the free Readiness Snapshot
              </a>{" "}
              or{" "}
              <a href="/pricing" className="font-semibold text-teal underline">
                see membership options
              </a>
              .
            </p>
          </div>
          <div>
            <h2 className="mb-4 text-2xl font-bold text-navy">Register your interest</h2>
            <CohortForm />
          </div>
        </div>
      </section>
    </main>
  );
}
