import { Header, Footer } from "@/components/Chrome";
import { Button, Eyebrow, Glow } from "@/components/Visuals";
import { appLink } from "@/lib/site";

/* Landing page for the free Readiness Snapshot, for organic posts and
   shared links. DRAFT for Lorenzo's approval (Nov 2026):
   - one call to action, at the top and repeated at the end
   - track-record figures without naming past organisations, pending
     Lorenzo's decision on which names may be used
   - no founder quotes until clients give permission
   Not linked from the main navigation. */

export const metadata = {
  title: "Free Readiness Snapshot",
  description:
    "Find out whether your business is ready to win customers, get credit or capital, or take investment. Free, 5 minutes or less, with a score at the end.",
};

const WRAP = "mx-auto max-w-[1200px] px-4 md:px-8";
const H2 = "font-display text-[30px] font-bold leading-[36px] tracking-[-0.015em] md:text-[42px] md:leading-[48px]";
const CTA = (campaign: string) => appLink("/snapshot", campaign);

const LOOKS_LIKE = [
  ["A sales problem", "Buyers are interested but don't sign. Often they can't see the proof, capacity or compliance they need before they can say yes."],
  ["A funding problem", "Lenders and grant panels pass. Often it's the records, cash-flow evidence or a plan that doesn't yet show how the money is used and repaid."],
  ["A pitch problem", "Investors take the call but not the deal. Often it's traction, structure or the numbers behind the story, not the slides."],
];

const OUTCOMES = [
  ["Win more customers", "Are you ready for larger buyers, corporate contracts and supplier programmes?"],
  ["Get credit or capital", "Are you ready to apply for a loan, grant or working-capital facility and be approved?"],
  ["Take investment", "Are you ready to bring in investors, partners or new owners on good terms?"],
];

const INSIDE = [
  ["Your Total Readiness Score", "One number for where your business stands today, with a readiness band."],
  ["Your strongest and weakest areas", "Across your business model, so you know what's holding you back most."],
  ["Your recommended next step", "A clear first move, whether you take it on your own or with RENZOLO."],
  ["Your results by email", "And waiting in your account if you sign up with the same email."],
];

const PROOF = [
  ["20+", "years developing suppliers and founders for large buyers"],
  ["800+", "entrepreneurs trained to become customer and investor ready"],
  ["4,000+", "founders reached across 19 African countries"],
  ["$2M+", "raised for founder development and access to capital in Wisconsin"],
];

const METHOD = ["Evaluate", "Evolve", "Execute", "Elevate"];

export default function ReadinessSnapshotLanding() {
  return (
    <>
      <Header campaign="snapshot_landing_header" />
      <main>
        {/* Hero: audience line, reframe headline, one call to action */}
        <section className="relative overflow-hidden bg-night text-white">
          <Glow />
          <div className={`${WRAP} relative py-16 md:py-24`}>
            <Eyebrow className="!text-gold">For early- and growth-stage businesses in Africa, the Caribbean and the US</Eyebrow>
            <h1 className="mt-4 max-w-4xl font-display text-[38px] font-extrabold leading-[44px] tracking-[-0.02em] md:text-[60px] md:leading-[66px]">
              Customers and funders keep saying &ldquo;not yet&rdquo;? It&apos;s usually readiness, not your pitch.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-7 text-white/80">
              Most business owners fix the problem they can see. The free Readiness Snapshot shows the one that&apos;s actually holding you back, and
              gives you a score to prove it, in 5 minutes or less.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button href={CTA("snapshot_landing_hero")}>Start the free Snapshot</Button>
              <p className="text-sm text-white/70">Free · 5 minutes or less · No card needed</p>
            </div>
          </div>
        </section>

        {/* Why it looks like something else */}
        <section className={`${WRAP} py-16 md:py-20`}>
          <h2 className={`${H2} max-w-3xl`}>You&apos;ve done the work. So why does the next step keep slipping?</h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-muted">You pitched the buyer, applied for the loan, sent the deck. The answer came back the same. Here&apos;s what&apos;s often really going on.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {LOOKS_LIKE.map(([title, text]) => (
              <div key={title} className="rounded-panel border border-line bg-surface-raised p-6">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-text">Looks like</p>
                <h3 className="mt-2 font-display text-xl font-bold text-ink">{title}</h3>
                <p className="mt-2 text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl font-display text-xl font-bold text-ink">
            Until you measure readiness, you can spend months fixing symptoms while the real gap stays open.
          </p>
        </section>

        {/* Three outcomes */}
        <section className="bg-surface">
          <div className={`${WRAP} py-16 md:py-20`}>
            <h2 className={H2}>Ready for what? Your Snapshot looks at all three.</h2>
            <p className="mt-4 max-w-2xl text-lg text-ink-muted">Most businesses need one of these next, and each asks something different of you.</p>
            <div className="mt-10 grid gap-5 md:grid-cols-3">
              {OUTCOMES.map(([title, text]) => (
                <div key={title} className="rounded-panel border-t-4 border-brand bg-surface-raised p-6 shadow-sm">
                  <h3 className="font-display text-xl font-bold text-ink">{title}</h3>
                  <p className="mt-2 text-ink-muted">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* What's inside */}
        <section className={`${WRAP} py-16 md:py-20`}>
          <h2 className={H2}>What you get from your free Snapshot</h2>
          <ul className="mt-8 grid gap-6 md:grid-cols-2">
            {INSIDE.map(([title, text], i) => (
              <li key={title} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-night font-bold text-white">{i + 1}</span>
                <span>
                  <span className="block font-display text-lg font-bold text-ink">{title}</span>
                  <span className="block text-ink-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Proof */}
        <section className="bg-night text-white">
          <div className={`${WRAP} py-16 md:py-20`}>
            <h2 className={H2}>Built on 20+ years of getting businesses ready</h2>
            <p className="mt-3 text-white/75">Lorenzo Bell Jr.&apos;s track record, before RENZOLO.</p>
            <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {PROOF.map(([figure, label]) => (
                <li key={figure} className="border-l-4 border-brand pl-4">
                  <span className="block font-display text-4xl font-extrabold text-gold">{figure}</span>
                  <span className="mt-1 block text-sm text-white/75">{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-10 max-w-3xl text-white/85">
              Lorenzo has spent his career on the buyer&apos;s side of the table: assessing suppliers, developing them until they were ready, and connecting
              them to contracts, lenders and investors. He is a U.S. Navy veteran and the founder of RENZOLO.
            </p>
          </div>
        </section>

        {/* Method */}
        <section className={`${WRAP} py-16 md:py-20`}>
          <h2 className={H2}>Your score is the start of a path, not a verdict</h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-muted">
            The Founder Trajectory™ method takes you from &ldquo;not yet&rdquo; to ready, one step at a time, powered by RENZOLO OS™.
          </p>
          <ol className="mt-8 flex flex-wrap gap-3">
            {METHOD.map((m, i) => (
              <li key={m} className="rounded-pill border-2 border-ink px-5 py-2 font-display font-bold text-ink">
                {i + 1}. {m}
              </li>
            ))}
          </ol>
        </section>

        {/* Closing call to action */}
        <section className={`${WRAP} pb-16 md:pb-24`}>
          <div className="flex flex-col gap-6 rounded-panel bg-brand p-8 text-on-brand md:flex-row md:items-center md:justify-between md:p-12">
            <div>
              <p className="max-w-2xl font-display text-[30px] font-bold leading-[36px] md:text-[42px] md:leading-[48px]">Find out what &ldquo;not yet&rdquo; really means for your business.</p>
              <p className="mt-2 opacity-90">Free. 5 minutes or less. Your score the moment you finish.</p>
            </div>
            <a href={CTA("snapshot_landing_end")} className="inline-flex shrink-0 justify-center rounded-pill bg-ink px-6 py-3 font-semibold text-surface transition-colors hover:bg-ink/85">
              Start the free Snapshot
            </a>
          </div>
        </section>

        {/* Disclaimers (include in legal review) */}
        <section className={`${WRAP} pb-12 text-xs leading-5 text-ink-muted`}>
          <p>
            <b>Results.</b> Scores, examples and outcomes are for guidance only. Results depend on your market, industry, execution and wider economic
            conditions. RENZOLO does not guarantee any customer, credit, funding, investment, revenue or valuation outcome.
          </p>
          <p className="mt-2">
            <b>Not professional advice.</b> The Readiness Snapshot is educational and does not create an advisory, fiduciary, legal, accounting or
            investment relationship. Speak to a licensed professional before major financial or legal decisions.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
