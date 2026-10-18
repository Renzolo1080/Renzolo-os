import { Header, Footer } from "@/components/Chrome";
import { PageHero } from "@/components/PageHero";
import { appLink } from "@/lib/site";
import { Faq } from "@/components/Faq";
import { OfferTabs, PageEndCta } from "@/components/Flow";

export const metadata = { title: "Founder Trajectory™", description: "Membership that turns a readiness assessment into a plan, a dashboard and coaching. Powered by RENZOLO OS™." };

const TIERS = [
  { name: "Essentials", price: "$15 a month", for: "Know where you stand and work your plan.", gets: ["Full Readiness Assessment with AI insights", "Readiness Report (summary)", "Growth and readiness plan, 90 days to 36 months", "Dashboard, goals, reminders and tools"] },
  { name: "Growth", price: "$39 a month, billed quarterly", for: "Go deeper, with coaching to carry out your plan.", gets: ["Everything in Essentials", "Full, downloadable report with valuation range and market insight", "Advisor review of your report", "Two one-on-one coaching sessions a quarter"] },
  { name: "Elevate", price: "$149 a month, billed quarterly", for: "Hands-on support to raise, scale or win big contracts.", gets: ["Everything in Growth", "Two one-on-one coaching sessions a month", "Pitch and investor readiness review", "Priority support. Limited places"] },
];

export default function FounderTrajectoryPage() {
  return (
    <>
      <Header campaign="ft_header" />
      <main>
        <PageHero
          title="A membership that turns where you are into where you're going."
          intro="Founder Trajectory™ gives founders and suppliers a comprehensive view of where their business stands. It starts with a full Readiness Assessment of your strategic plan and the nine building blocks of your business model. Then it gives you a plan, a dashboard to work it, and coaching to keep you moving. It runs on RENZOLO OS™, our venture readiness platform."
        >
          <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center">
            <a href={appLink("/snapshot", "ft_hero")} className="btn-pop rounded-pill border-2 border-ink bg-brand px-7 py-4 text-center text-lg font-semibold text-on-brand">
              Start with the free Snapshot
            </a>
            <a href={appLink("/pricing", "ft_hero")} className="text-center font-semibold text-gold-soft underline-offset-4 hover:underline">
              Compare plans and prices
            </a>
          </div>
        </PageHero>
        <OfferTabs current="membership" />

        <section id="assessment" className="mx-auto max-w-6xl scroll-mt-24 px-5 py-16 md:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">What the assessment looks at</h2>
          <div className="mt-10 grid gap-10 md:grid-cols-2">
            <div>
              <p className="font-display text-xl font-bold">Your strategic plan</p>
              <p className="mt-2 text-muted">
                Whether it's written down, sets measurable goals, has a budget behind it, gets reviewed, and covers every part of your business model.
              </p>
            </div>
            <div>
              <p className="font-display text-xl font-bold">Your business model</p>
              <p className="mt-2 text-muted">
                Customers, your offer, how you reach customers, how you keep them, revenue, people and resources, operations, partners, and costs and
                margins. Based on the Business Model Canvas.
              </p>
            </div>
          </div>
        </section>

        <section id="membership" className="scroll-mt-24 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Three levels of support</h2>
            <div className="mt-10 grid gap-6 lg:grid-cols-3">
              {TIERS.map((t, i) => (
                <div key={t.name} className={`rounded-3xl p-7 ${i === 1 ? "bg-navy text-white" : "bg-paper"}`}>
                  <p className="font-display text-2xl font-bold">{t.name}</p>
                  <p className={`mt-1 font-semibold ${i === 1 ? "text-gold-soft" : "text-teal"}`}>{t.price}</p>
                  <p className={`mt-3 ${i === 1 ? "text-mist" : "text-muted"}`}>{t.for}</p>
                  <ul className="mt-5 space-y-2 text-sm">
                    {t.gets.map((g) => (
                      <li key={g} className="flex gap-2">
                        <span aria-hidden="true" className="text-gold">✓</span>
                        <span>{g}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
            <p className="mt-8 max-w-3xl text-muted">
              Prefer a one-time answer? The Readiness Assessment ($79) gives you the full report, a valuation range, an AI market insight and a
              recommendation of the plan that fits you, with no membership. Coaching sessions are from $59 for members.
            </p>
            <a href={appLink("/pricing", "ft_tiers")} className="mt-6 inline-block rounded-full border-2 border-navy px-6 py-3 font-semibold text-navy hover:bg-navy hover:text-white">
              See full pricing
            </a>
          </div>
        </section>

        <section id="coaching" className="mx-auto max-w-6xl scroll-mt-24 px-5 pt-16 md:pt-24">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Your coaching team</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <div className="rounded-card border border-line bg-surface-tint p-7">
              <p className="font-display text-xl font-bold">Lorenzo · AI, any time</p>
              <p className="mt-2 text-muted">Lorenzo · AI coaches you any time from Lorenzo&apos;s 20-year playbook, with local to global insight and dated actions. Included with Growth and Elevate.</p>
            </div>
            <div className="rounded-card border border-line bg-surface-tint p-7">
              <p className="font-display text-xl font-bold">Live sessions with Lorenzo</p>
              <p className="mt-2 text-muted">You prepare a short brief, book a time on your coach&apos;s calendar and meet for 30 to 60 minutes. Agreed actions go straight into your plan. Two sessions a quarter on Growth, two a month on Elevate, or from $59 a session for members.</p>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Most asked questions</h2>
          <div className="mt-8">
            <Faq />
          </div>
        </section>
        <PageEndCta campaign="ft_end" />
      </main>
      <Footer />
    </>
  );
}
