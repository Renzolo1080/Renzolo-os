import { CohortForm } from "@/components/PublicForms";

export const metadata = {
  title: "Founder Trajectory™ Academy · cohorts",
  description: "Structured 6, 8 and 12-week cohorts where founders work through their growth and readiness plan together, with coaching.",
};

const FORMATS = [
  { name: "Foundations", weeks: "6 weeks", focus: "Customers, your offer and a written plan." },
  { name: "Traction", weeks: "8 weeks", focus: "Channels, pricing, cash flow and operations." },
  { name: "Readiness", weeks: "12 weeks", focus: "Investor, lender and contract readiness: ready to raise or scale." },
  { name: "Elevate Cohort", weeks: "Once a year", focus: "For Elevate members: hands-on support to raise, scale or win big contracts." },
];

export default function ProgramsPage() {
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Founder Trajectory™ Academy</p>
          <h1 className="mt-3 max-w-3xl text-4xl font-bold leading-tight">Grow alongside founders who are building too.</h1>
          <p className="mt-4 max-w-2xl text-cream/85">
            Academy cohorts are structured, self-paced programs with live sessions and coaching, built on the Founder Trajectory™ method: Evaluate,
            Evolve, Execute, Elevate. You work through your own growth and readiness plan, together with a group of founders.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
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
                "Three Academy cohorts a year for Essentials and Growth members.",
                "One dedicated Elevate cohort a year, for Elevate members.",
                "Cohorts have their own fee, separate from membership.",
                "Members get priority when applying. Every founder applies and must qualify, so each cohort is a strong group.",
                "Your Readiness Assessment and plan are your starting point, so you arrive knowing exactly what to work on.",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="font-bold text-gold">✓</span>
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
