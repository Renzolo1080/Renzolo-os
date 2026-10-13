import { Header, Footer } from "@/components/Chrome";
import { PageHero } from "@/components/PageHero";
import { appLink } from "@/lib/site";

export const metadata = { title: "About", description: "RENZOLO builds the tools and programs that get founders ready to grow, get funded and scale." };

const SYSTEMS = [
  { name: "RENZOLO OS™", role: "The platform", text: "Our venture readiness platform: assessments, scoring, reports, plans and progress tracking.", status: "Live" },
  { name: "Founder Trajectory™", role: "The method and membership", text: "Evaluate, Evolve, Execute, Elevate: the way founders move from where they are to where they want to be. Includes the Academy.", status: "Live" },
  { name: "RENZOLO Network™ and RENZOLO Capital™", role: "The connections", text: "Connecting ready founders with partners, buyers and capital.", status: "In development" },
];

export default function AboutPage() {
  return (
    <>
      <Header campaign="about_header" />
      <main>
        <PageHero
          title="We build ventures that are ready."
          intro="RENZOLO is a venture development company. We give founders an honest view of where their business stands, and the plan, coaching and connections to get it ready to grow, get funded and scale."
        />
        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[1fr_1.4fr] md:py-24">
          <div className="flex aspect-[4/5] max-w-sm items-end rounded-3xl bg-navy p-7">
            <p className="font-display text-6xl font-extrabold text-gold-soft" style={{ fontWeight: 800 }} aria-hidden="true">
              LB
            </p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Lorenzo Bell Jr.</h2>
            <p className="mt-1 font-semibold text-teal">Founder and CEO</p>
            <div className="mt-6 space-y-4 text-lg leading-relaxed">
              <p>
                Lorenzo founded Renzolo Enterprises LLC to close a gap he saw again and again: capable founders shut out of funding, contracts and
                growth because they couldn't show they were ready, and couldn't see what "ready" required.
              </p>
              <p>
                A U.S. Navy veteran, he built Founder Trajectory™ on the discipline of knowing exactly where you stand, setting a clear objective and
                executing against it. RENZOLO starts in the United States, Kenya and South Africa.
              </p>
            </div>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">How RENZOLO fits together</h2>
            <div className="mt-10 divide-y divide-mist border-y border-mist">
              {SYSTEMS.map((s) => (
                <div key={s.name} className="grid gap-2 py-7 md:grid-cols-[16rem_1fr_9rem] md:items-baseline md:gap-10">
                  <div>
                    <p className="font-display text-xl font-bold">{s.name}</p>
                    <p className="text-sm text-muted">{s.role}</p>
                  </div>
                  <p className="text-muted">{s.text}</p>
                  <p className={`text-sm font-semibold md:text-right ${s.status === "Live" ? "text-teal" : "text-gold"}`}>{s.status}</p>
                </div>
              ))}
            </div>
            <a href={appLink("/snapshot", "about")} className="mt-10 inline-block rounded-full bg-gold px-7 py-4 font-semibold text-white">
              Take the free Readiness Snapshot
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
