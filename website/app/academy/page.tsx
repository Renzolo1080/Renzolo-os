import { Header, Footer } from "@/components/Chrome";
import { PageHero } from "@/components/PageHero";
import { InterestForm } from "@/components/Forms";
import { appLink } from "@/lib/site";
import { OfferTabs, PageEndCta } from "@/components/Flow";

export const metadata = { title: "Founder Trajectory™ Academy", description: "Three development levels: Launch (8 weeks), Build (12 weeks) and Scale (6 months)." };

const PROGRAMS = [
  { name: "Launch", length: "8 weeks", text: "Self-paced, high-volume programme for early-stage founders: all nine parts of your business model in 8 weeks, Lorenzo · AI coaching and one 30-minute live session, ending with a written plan." },
  { name: "Build", length: "12 weeks", text: "For businesses with customers: traction first (channels, pricing, cash flow, operations), then readiness for loans, grants, contracts and investors. Live group sessions and coaching." },
  { name: "Scale", length: "6 months", text: "Selective, hands-on programme to raise capital, scale or win large contracts, with introductions to investors, lenders and buyers. Once a year." },
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
        <OfferTabs current="academy" />
        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="mb-8 font-display text-3xl font-bold tracking-tight md:text-4xl">Founder Trajectory™ Academy: Development Levels</h2>
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
                <li>Launch and Build open three times a year. Scale runs once a year.</li>
                <li>Cohorts run for a set time and have their own fee. Membership is separate and lasts as long as you like.</li>
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
        <PageEndCta campaign="academy_end" />
      </main>
      <Footer />
    </>
  );
}
