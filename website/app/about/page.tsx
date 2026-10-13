import { Header, Footer } from "@/components/Chrome";
import { PageHero } from "@/components/PageHero";
import { appLink } from "@/lib/site";

export const metadata = { title: "About", description: "RENZOLO™ gets businesses ready for customers and investors with Founder Trajectory™, powered by RENZOLO OS™." };

/** Experience and impact: bullet points with real figures, supplied by
 * Lorenzo. The section stays hidden until this list has entries, so the
 * page never shows placeholder claims. Example shape:
 *   { figure: "120+", text: "founders and suppliers assessed across ..." } */
const CREDIBILITY: { figure?: string; text: string }[] = [];

const STEPS = [
  ["Evaluate", "See exactly where your business stands with the Readiness Snapshot and your full Readiness Assessment."],
  ["Evolve", "Turn the results into a growth and readiness plan, and update your strategy around the gaps that matter most."],
  ["Execute", "Work the plan with your dashboard, goals, reminders, tools and coaching."],
  ["Elevate", "Re-assess, measure your progress and move your business to its next stage."],
];

export default function AboutPage() {
  return (
    <>
      <Header campaign="about_header" />
      <main>
        <PageHero
          title="We get businesses ready to grow, get funded and scale."
          intro="RENZOLO™ is a venture development firm. We give founders an honest view of where their business stands, then the plan, coaching and connections to close the gaps that customers, lenders and investors look for."
        />

        {CREDIBILITY.length > 0 && (
          <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Experience and impact</h2>
            <ul className="mt-10 grid gap-x-10 gap-y-8 md:grid-cols-2">
              {CREDIBILITY.map((c) => (
                <li key={c.text} className="border-l-4 border-gold pl-5">
                  {c.figure && <p className="font-display text-4xl font-extrabold text-navy" style={{ fontWeight: 800 }}>{c.figure}</p>}
                  <p className="mt-1 text-lg text-muted">{c.text}</p>
                </li>
              ))}
            </ul>
          </section>
        )}

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">We get your business ready for customers and investors</h2>
            <p className="mt-4 max-w-2xl text-lg text-muted">Founder Trajectory™ is powered by RENZOLO OS™, to help founders:</p>
            <ol className="mt-10 divide-y divide-mist border-y border-mist">
              {STEPS.map(([name, text], i) => (
                <li key={name} className="grid gap-2 py-7 md:grid-cols-[4rem_14rem_1fr] md:items-baseline md:gap-8">
                  <span className="font-display text-3xl font-extrabold text-gold" style={{ fontWeight: 800 }}>{i + 1}</span>
                  <p className="font-display text-2xl font-bold">{name}</p>
                  <p className="text-lg text-muted">{text}</p>
                </li>
              ))}
            </ol>
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
