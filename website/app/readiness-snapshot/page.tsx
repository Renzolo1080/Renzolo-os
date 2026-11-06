import { Header, Footer } from "@/components/Chrome";

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
    "Find out whether your business is ready to win more contracts, access capital or attract investment. Free, 5 minutes or less, with a score at the end.",
};

const WRAP = "mx-auto max-w-[1240px] px-4 md:px-8";
const H2 = "font-display text-[32px] font-bold leading-[1.12] md:text-[44px]";
const EYEBROW = "text-[15px] font-bold uppercase tracking-[0.16em] text-brand-text";
const BTN = "inline-flex items-center justify-center rounded-pill bg-brand px-7 py-4 text-lg font-bold text-on-brand transition-colors hover:bg-brand/90";
const CTA = (campaign: string) => appLink("/snapshot", campaign);

const LOOKS_LIKE = [
  ["A sales problem", "Buyers are interested but don't sign. Often they can't see the proof, capacity or compliance they need before they can say yes."],
  ["A funding problem", "Lenders and grant panels pass. Often it's the records, cash-flow evidence or a plan that doesn't yet show how the money is used and repaid."],
  ["A pitch problem", "Investors take the call but not the deal. Often it's traction, structure or the numbers behind the story, not the slides."],
];

const OUTCOMES = [
  ["Win more contracts", "Are you ready for larger buyers, corporate and government contracts and supplier programmes?"],
  ["Access capital", "Are you ready to apply for a loan, grant or working-capital facility and be approved?"],
  ["Attract investment", "Are you ready to bring in investors, partners or new owners on good terms?"],
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

const METHOD: [string, string, string][] = [
  ["Evaluate", "Know your readiness score, free in minutes.", "#FF5A1F"],
  ["Evolve", "Develop your strategic growth plan.", "#B8177F"],
  ["Execute", "Founder Coach, dashboard, progress tracking.", "#6A2BCB"],
  ["Elevate", "Re-assess and move to your next stage.", "#3B1694"],
];

export default function ReadinessSnapshotLanding() {
  return (
    <>
      <Header campaign="snapshot_landing_header" />
      <main>
        {/* Hero: audience line, reframe headline, one call to action, the bright burst */}
        <section className={`${WRAP} flex flex-wrap items-center gap-12 pb-20 pt-12 md:pt-16`}>
          <div className="min-w-0 flex-[1_1_480px]">
            <p className={EYEBROW}>For early- and growth-stage businesses in Africa, the Caribbean and the US</p>
            <h1 className="mt-4 font-display text-[38px] font-bold leading-[1.08] md:text-[56px]">
              Customers and funders keep saying &ldquo;not yet&rdquo;? It&apos;s usually readiness, not your pitch.
            </h1>
            <p className="mt-6 max-w-[540px] text-xl leading-relaxed text-ink-muted">
              Most business owners fix the problem they can see. The free Readiness Snapshot shows the one that&apos;s actually holding you back, and
              gives you a score to prove it, in 5 minutes or less.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-6">
              <a href={CTA("snapshot_landing_hero")} className={BTN}>
                Start the free Snapshot
              </a>
              <p className="text-[15px] text-ink-muted">Free · 5 minutes or less · No card needed</p>
            </div>
          </div>
          <div className="min-w-0 flex-[0_1_420px]">
            <div className="relative aspect-square w-full overflow-hidden rounded-panel bg-black">
              <img src="/img/burst-bright.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
            </div>
          </div>
        </section>

        {/* Why it looks like something else */}
        <section className={`${WRAP} py-16 md:py-20`}>
          <h2 className={`${H2} max-w-3xl`}>You&apos;ve done the work. So why does the next step keep slipping?</h2>
          <p className="mt-4 max-w-2xl text-lg text-ink-muted">You pitched the buyer, applied for the loan, sent the deck. The answer came back the same. Here&apos;s what&apos;s often really going on.</p>
          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {LOOKS_LIKE.map(([title, text]) => (
              <div key={title} className="rounded-[24px] border border-line bg-surface-raised p-7">
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-text">Looks like</p>
                <h3 className="mt-2 font-sans text-2xl font-bold text-ink">{title}</h3>
                <p className="mt-2 text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
          <p className="mt-8 max-w-3xl font-display text-xl font-bold text-ink">
            Until you measure readiness, you can spend months fixing symptoms while the real gap stays open.
          </p>
        </section>

        {/* Three outcomes */}
        <section className={WRAP}>
          <div className="rounded-panel bg-night px-6 py-14 text-white md:px-14 md:py-20">
            <p className="text-[15px] font-bold uppercase tracking-[0.16em] text-gold">Three outcomes</p>
            <h2 className={`${H2} mt-3`}>Ready for what? Your Snapshot looks at all three.</h2>
            <p className="mt-4 max-w-2xl text-lg text-[#C5CDD7]">Most businesses need one of these next, and each asks something different of you.</p>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              {OUTCOMES.map(([title, text], i) => (
                <div key={title} className="rounded-[20px] border border-white/15 bg-white/5 p-7">
                  <div aria-hidden="true" className="h-[3px] w-12 rounded" style={{ background: ["#FF5A1F", "#E6197F", "#1E6BFF"][i] }} />
                  <h3 className="mb-2 mt-5 font-sans text-2xl font-bold">{title}</h3>
                  <p className="text-lg leading-relaxed text-[#C5CDD7]">{text}</p>
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
                  <span className="block font-sans text-lg font-bold text-ink">{title}</span>
                  <span className="block text-ink-muted">{text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Proof */}
        <section className={WRAP}>
          <div className="rounded-panel bg-night px-6 py-12 text-white md:px-14 md:py-16">
            <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold">Track record, before RENZOLO</p>
            <h2 className={`${H2} mt-3`}>Built on 20+ years of getting businesses ready</h2>
            <ul className="mt-10 grid grid-cols-2 gap-6 lg:grid-cols-4">
              {PROOF.map(([figure, label]) => (
                <li key={figure}>
                  <span className="block font-display text-[44px] font-bold leading-none">{figure}</span>
                  <span className="mt-2 block text-base text-[#C5CDD7]">{label}</span>
                </li>
              ))}
            </ul>
            <p className="mt-10 max-w-3xl text-lg text-[#C5CDD7]">
              Lorenzo Bell Jr. has spent his career on the buyer&apos;s side of the table: assessing suppliers, developing them until they were ready,
              and connecting them to contracts, lenders and investors. He is a U.S. Navy veteran and the founder of RENZOLO.
            </p>
          </div>
        </section>

        {/* Method, on the bright burst */}
        <section className={`${WRAP} flex flex-wrap items-center gap-12 py-20`}>
          <div className="min-w-0 flex-[1_1_380px]">
            <p className={EYEBROW}>The Founder Trajectory™ method</p>
            <h2 className={`${H2} mt-3`}>Your score is the start of a path, not a verdict.</h2>
            <p className="mt-4 max-w-xl text-lg text-ink-muted">From &ldquo;not yet&rdquo; to ready, one step at a time, powered by RENZOLO OS™.</p>
          </div>
          <div className="min-w-0 flex-[1_1_460px]">
            <div className="relative overflow-hidden rounded-panel bg-black px-6 py-9 md:px-8">
              <img src="/img/burst-bright.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              <ol className="relative flex max-w-[440px] flex-col gap-2.5">
                {METHOD.map(([name, text, color], i) => (
                  <li key={name} className="rounded-pill bg-white px-5 py-2.5 text-black shadow-[0_8px_24px_rgba(0,0,0,0.18)]" style={{ border: `6px solid ${color}` }}>
                    <p className="text-[19px] font-bold uppercase tracking-[0.08em]">
                      {i + 1}. {name}
                    </p>
                    <p className="mt-0.5 text-[15px] text-[#333]">{text}</p>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* Closing call to action */}
        <section className={`${WRAP} pb-16 md:pb-24`}>
          <div className="relative flex flex-wrap items-center justify-between gap-8 overflow-hidden rounded-panel bg-night px-8 py-14 text-white md:px-16">
            <img
              src="/img/burst-bright.jpg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 object-cover opacity-85 [mask-image:radial-gradient(circle,#000_35%,transparent_70%)]"
            />
            <div className="relative min-w-0 flex-[1_1_380px]">
              <p className="font-display text-[32px] font-bold leading-[1.12] md:text-[44px]">Find out what &ldquo;not yet&rdquo; really means for your business.</p>
              <p className="mt-3 text-lg text-[#C5CDD7]">Free. 5 minutes or less. Your score the moment you finish.</p>
            </div>
            <a href={CTA("snapshot_landing_end")} className={`${BTN} relative`}>
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
