import { Header, Footer } from "@/components/Chrome";
import { PageHero } from "@/components/PageHero";
import { InterestForm } from "@/components/Forms";
import { appLink } from "@/lib/site";

export const metadata = { title: "Founder Trajectory™ Academy", description: "Six, eight and twelve-week cohorts where founders work through their plans together." };

const PROGRAMS = [
  { name: "Foundations", length: "6 weeks", text: "Customers, your offer and a written plan." },
  { name: "Traction", length: "8 weeks", text: "Channels, pricing, cash flow and operations." },
  { name: "Readiness", length: "12 weeks", text: "Investor, lender and contract readiness: ready to raise or scale." },
  { name: "Elevate Cohort", length: "Once a year", text: "For Elevate members: hands-on support to raise, scale or win big contracts." },
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
          <dl className="grid gap-px overflow-hidden rounded-3xl bg-mist sm:grid-cols-2 lg:grid-cols-4">
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
                <li>Three Academy cohorts a year for Essentials and Growth members, and one Elevate Cohort a year.</li>
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
