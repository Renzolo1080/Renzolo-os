import { Header, Footer } from "@/components/Chrome";
import { PageHero } from "@/components/PageHero";
import { InterestForm } from "@/components/Forms";
import { appLink } from "@/lib/site";

export const metadata = { title: "Founder Trajectory™ Academy", description: "Foundations (8 weeks), the Growth Cohort (12 weeks) and the Elevate Cohort (6 months)." };

const PROGRAMS = [
  { name: "Foundations", length: "8 weeks", text: "Your customers, your offer, your numbers and a written growth plan. For Essentials members." },
  { name: "Growth Cohort", length: "12 weeks", text: "Traction and readiness: channels, pricing, cash flow and operations, then investor, lender and contract readiness. For Growth members." },
  { name: "Elevate Cohort", length: "6 months", text: "Hands-on support to raise, scale or win big contracts. For Elevate members, once a year." },
];

export default function AcademyPage() {
  return (
    <>
      <Header campaign="academy_header" />
      <main>
        <PageHero
          title="Grow alongside founders who are building too."
          intro="Founder Trajectory™ Academy cohorts are structured programs with live sessions and coaching. You work through your own growth and readiness plan, together with a group of founders at a similar stage."
        />
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <dl className="grid gap-px overflow-hidden rounded-3xl bg-mist md:grid-cols-3">
            {PROGRAMS.map((p) => (
              <div key={p.name} className="bg-paper p-7">
                <dt>
                  <span className="block text-sm font-semibold text-teal">{p.length}</span>
                  <span className="mt-1 block font-display text-2xl font-bold">{p.name}</span>
                </dt>
                <dd className="mt-2 text-muted">{p.text}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-16 grid gap-12 lg:grid-cols-2">
            <div>
              <h2 className="font-display text-3xl font-bold tracking-tight">How cohorts work</h2>
              <ul className="mt-6 space-y-4 text-lg">
                <li>Foundations and Growth cohorts open three times a year. The Elevate Cohort runs once a year.</li>
                <li>Cohorts have their own fee, separate from membership.</li>
                <li>Members get priority when applying. Every founder applies and must qualify, so each group is strong.</li>
                <li>You arrive with your Readiness Assessment and plan, so you know exactly what to work on from week one.</li>
              </ul>
              <p className="mt-8 text-muted">
                Not a member yet?{" "}
                <a href={appLink("/snapshot", "academy")} className="font-semibold text-teal underline">
                  Start with the free Readiness Snapshot
                </a>
                .
              </p>
            </div>
            <div>
              <h2 className="mb-6 font-display text-3xl font-bold tracking-tight">Register your interest</h2>
              <InterestForm />
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
