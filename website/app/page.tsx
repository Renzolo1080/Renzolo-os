import { Header, Footer } from "@/components/Chrome";
import { OsStory, OutcomeFlipCards, PricingTable, ReadinessTicker, RevealOnScroll, SnapshotTaster, StickyMobileCta, type Tier } from "@/components/BrandClient";
import { Button, DotGrid, Eyebrow, Glow, Portrait } from "@/components/Visuals";
import { HOW_TO_START, HowToStart, ProofBand } from "@/components/Flow";
import { PathChooser, type PathStage } from "@/components/PathChooser";
import { GuideForm } from "@/components/Forms";
import { AFFILIATION_NOTE, FOUNDER, RESULTS, TESTIMONIALS } from "@/lib/story";
import { APP_URL, appLink } from "@/lib/site";

/* The home page follows the brand book's story arc and 14-section flow:
   the founder is the hero, RENZOLO is the guide. Read top to bottom, the
   headlines alone tell the story. */

const WRAP = "mx-auto max-w-[1200px] px-4 md:px-8";
const SECTION = `${WRAP} py-16 md:py-24`;
const H2 = "font-display text-[34px] font-bold leading-[40px] tracking-[-0.015em] md:text-5xl md:leading-[54px]";

const STAGES = [
  ["Evaluate", "Take the free Snapshot, then your full Readiness Assessment, and see exactly where you stand and why."],
  ["Evolve", "Turn the results into a growth and readiness plan of 90 days to 36 months, built around the gaps that matter."],
  ["Execute", "Work the plan from your dashboard with goals, reminders, Lorenzo · AI and live sessions with a Founder Coach."],
  ["Elevate", "Re-assess, measure your progress and move to your next stage."],
];

const OS_MODULES = [
  { title: "Your dashboard", text: "Revenue, customers, cash and your score in one view, with goals tracked target against actual.", src: "/img/screen-dashboard.jpg", alt: "RENZOLO OS dashboard showing revenue, customers, cash, Total Readiness Score and goals" },
  { title: "Your strategic plan", text: "A guided plan built from your assessment: where you are, where you're going, and dated actions for every gap.", src: "/img/screen-plan.jpg", alt: "The Plan Builder checking a strategic plan for goals, measures and dated actions" },
  { title: "Market Intelligence", text: "Your industry and country researched each month, tied to your plan and targets, with sources.", src: "/img/screen-market.jpg", alt: "A Market Intelligence brief with recommendations for the founder's plan" },
  { title: "Your coaching team", text: "Lorenzo · AI coaches you any time from Lorenzo's 20-year playbook, with local to global insight and dated actions. Book a Founder Coach live when the decision is big.", src: "/img/screen-aicoach.jpg", alt: "The AI coach answering a pricing question with suggested actions" },
];

/** The five reasons, each with its proof (brand book: Why RENZOLO). */
const REASONS = [
  ["Experience", "Built by someone who has done this across Africa for 20 years.", "Lorenzo's 20+ years developing suppliers across Africa, the UK, Europe, the US, India, Latin America and the Caribbean, and six years leading the EY Africa Enterprise Impact Program."],
  ["Capability", "A platform and a coach, working together.", "RENZOLO OS™ (assessment, plan, dashboard, reports) plus your coaching team: Lorenzo · AI any time and live sessions with a Founder Coach."],
  ["Value", "Know exactly where you stand for $79.", "The standalone assessment with AI market insight; membership from $15 a month, every tier priced in plain numbers below."],
  ["Solution", "One path from where you are to customer, capital and investor ready.", "Evaluate. Evolve. Execute. Elevate., a plan length you choose (90 days to 36 months) and a dashboard that tracks it."],
  ["Differentiator", "Readiness that leads somewhere.", "One Readiness Score per outcome, and introductions to buyers, lenders and investors curated by the RENZOLO team."],
];

const TIERS: Tier[] = [
  { name: "Essentials", for: "Know where you stand and work your plan.", prices: { monthly: 15, quarterly: 45, annual: 150 }, gets: ["Full Readiness Assessment with AI insights", "Readiness Report (summary)", "Growth and readiness plan, 90 days to 36 months", "Dashboard, goals, reminders and tools"], start: HOW_TO_START.essentials },
  { name: "Growth", for: "Go deeper, with coaching to carry out your plan.", prices: { quarterly: 117, annual: 390 }, gets: ["Everything in Essentials", "Full report with valuation range and market insight", "Lorenzo · AI any time, plus plan review", "Two one-on-one coaching sessions a quarter"], popular: true, start: HOW_TO_START.growth },
  { name: "Elevate", for: "Hands-on support to raise, scale or win big contracts.", prices: { quarterly: 447, annual: 1490 }, gets: ["Everything in Growth", "Two one-on-one coaching sessions a month", "Pitch and investor readiness review", "Priority support. Limited places"], start: HOW_TO_START.elevate },
];

/** "Find your path": where the founder is today, and the first step. */
const PATHS: PathStage[] = [
  { key: "idea", label: "I have an idea or I'm just starting", who: "No steady customers yet", first: { name: "Free Snapshot", note: "See where you stand in about seven minutes." }, then: { name: "Launch or Essentials", note: "The 8-week Launch cohort, or Essentials from $15 a month." }, start: "Take the free Snapshot, then choose Launch or Essentials.", cta: { label: "Start the free Snapshot", href: appLink("/snapshot", "path_idea") } },
  { key: "first", label: "I have my first customers", who: "Selling, but not yet steady", first: { name: "Readiness Assessment", note: "The full report, a valuation range and AI market insight, for $79." }, then: { name: "Essentials or Growth", note: "Work the plan, with coaching on Growth." }, start: HOW_TO_START.assessment, cta: { label: "Get the assessment", href: appLink("/pricing", "path_first") } },
  { key: "growing", label: "I'm growing, with steady customers", who: "Ready to work the plan with a coach", first: { name: "Growth membership", note: "Your plan, dashboard and your coaching team." }, then: { name: "Build cohort", note: "12 weeks: traction first, then readiness for loans, grants and contracts." }, start: HOW_TO_START.growth, cta: { label: "See Growth", href: "#pricing" } },
  { key: "raise", label: "I'm ready to raise or win big contracts", who: "Capital, investors or large buyers next", first: { name: "Elevate membership", note: "Two coaching sessions a month and a pitch and investor readiness review." }, then: { name: "Scale cohort", note: "6 months, selective, with curated introductions." }, start: HOW_TO_START.elevate, cta: { label: "See Elevate", href: "#pricing" } },
];

const ACADEMY_START: Record<string, string> = { Launch: HOW_TO_START.launch, Build: HOW_TO_START.build, Scale: HOW_TO_START.scale };
const ACADEMY = [
  ["Launch", "8 weeks", "Self-paced for early-stage founders: all nine parts of your business model, Lorenzo · AI coaching and one 30-minute live session, ending with a written plan."],
  ["Build", "12 weeks", "For businesses with customers: traction first, then readiness for loans, grants, contracts and investors. Live group sessions and coaching."],
  ["Scale", "6 months", "Selective and hands-on: raise capital, scale or win large contracts, with curated introductions to investors, lenders and buyers."],
];

const FAQ = [
  ["How do I pay?", "Prices are in US dollars. You pay by card or mobile money, including M-Pesa, through Flutterwave."],
  ["What does the free Snapshot give me?", "Your Total Readiness Score, your Strategic Plan Readiness, your strongest area, the three areas holding you back and a recommended next move, in about seven minutes, with no account needed."],
  ["What is the difference between the $79 assessment and membership?", "The assessment gives you the full report once, with a valuation range and AI market insight. Membership adds the plan, the dashboard and, on Growth and Elevate, your coaching team: Lorenzo · AI any time and live sessions with a Founder Coach."],
  ["How does coaching work?", "You prepare a short brief, book a time on your coach's calendar and meet for 30 to 60 minutes. Agreed actions go straight into your plan."],
  ["Can I get a refund?", "Our refund policy sets out exactly when and how refunds apply."],
];

export default function Home() {
  return (
    <>
      <Header campaign="home_header" />
      <RevealOnScroll />
      <main>
        {/* 2. Hero: the ambition */}
        <section id="hero" className="relative overflow-hidden">
          <Glow />
          <div className={`relative grid items-center gap-12 ${WRAP} pb-16 pt-12 md:pt-20 lg:grid-cols-[1.1fr_1fr]`}>
            <div className="hero-in">
              <Eyebrow>Founder Trajectory™, powered by RENZOLO OS™</Eyebrow>
              <h1 className="mt-4 font-display text-[44px] font-extrabold leading-[48px] tracking-[-0.02em] md:text-[72px] md:leading-[76px]">
                Ready for customers, capital and investors.
              </h1>
              <p className="max-w-xl pt-6 text-lg leading-7 text-ink-muted">
                Know exactly where your business stands, build the plan to close the gaps, and get coached to the standard buyers, lenders and investors look for.
              </p>
              <div className="flex flex-wrap items-center gap-4 pt-8">
                <Button href={appLink("/snapshot", "home_hero")}>Start your assessment</Button>
                <Button href="#method" variant="secondary">See how it works</Button>
              </div>
            </div>
            <div className="relative">
              <div className="float-in relative mx-auto max-w-[420px]">
                <ReadinessTicker className="card-pulse" />
              </div>
            </div>
          </div>
        </section>

        {/* 2b. Proof, straight after the ambition */}
        <ProofBand />

        {/* 3. Three outcomes */}
        <section className="bg-surface-tint">
          <div className={SECTION}>
            <Eyebrow className="reveal">Three outcomes</Eyebrow>
            <h2 className={`reveal mt-2 max-w-3xl ${H2}`}>Pick the yes you need next.</h2>
            <div className="reveal mt-12">
              <OutcomeFlipCards hrefs={Object.fromEntries(["customers", "capital", "investors"].map((k) => [k, appLink(`/snapshot?goal=${k}`, `home_outcome_${k}`)]))} />
            </div>
          </div>
        </section>

        {/* 4. The gap */}
        <section>
          <div className={`${SECTION} grid gap-10 md:grid-cols-2`}>
            <div>
              <Eyebrow className="reveal">The gap</Eyebrow>
              <h2 className={`reveal mt-2 ${H2}`}>Lenders and buyers keep saying &ldquo;not yet&rdquo;.</h2>
            </div>
            <div className="reveal space-y-4 text-lg leading-7 text-ink-muted">
              <p>Your plan is scattered across notebooks and spreadsheets. You are not sure what a buyer, a bank or an investor will check. Every programme gives you more advice, and the answer is still &ldquo;come back when you&apos;re ready&rdquo;.</p>
              <p className="font-display text-2xl font-bold leading-8 text-ink">You don&apos;t need more advice. You need to know exactly where you stand.</p>
            </div>
          </div>
        </section>

        {/* 5. The method */}
        <section id="method" className="bg-surface-tint">
          <div className={SECTION}>
            <Eyebrow className="reveal">The Founder Trajectory™ Method</Eyebrow>
            <h2 className={`reveal mt-2 ${H2}`}>Evaluate. Evolve. Execute. Elevate.</h2>
            <p className="reveal mt-4 max-w-2xl text-lg text-ink-muted">Four steps, repeated as you grow. Tap a stage to see what happens in it.</p>
            <div className="reveal relative mt-12">
              <span aria-hidden="true" className="absolute left-6 right-6 top-[24px] hidden h-1 rounded-pill bg-line md:block" />
              <span aria-hidden="true" className="method-line absolute left-6 right-6 top-[24px] hidden h-1 origin-left rounded-pill bg-brand md:block" />
              <ol className="relative grid gap-4 md:grid-cols-4">
                {STAGES.map(([name, text], i) => (
                  <li key={name}>
                    <details className="group" open={i === 0}>
                      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-pill border-2 border-ink bg-surface-raised py-2 pl-2 pr-4 font-semibold group-open:bg-brand group-open:text-on-brand [&::-webkit-details-marker]:hidden">
                        <span className="inline-grid h-8 w-8 place-items-center rounded-pill bg-surface-tint font-display text-sm font-extrabold text-ink group-open:bg-ink group-open:text-surface">{i + 1}</span>
                        {name}
                      </summary>
                      <p className="mt-3 px-2 text-ink-muted">{text}</p>
                    </details>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </section>

        {/* 5b. Free method guide (lead capture for founders not ready to assess) */}
        <section id="guide">
          <div className={`${SECTION} grid items-center gap-10 lg:grid-cols-[0.9fr_1.1fr]`}>
            <div className="reveal">
              <img src="/img/guide-cover.png" alt="The Founder Trajectory Method guide: three outcomes, four steps, the five parts of the Total Readiness Score and where to start" width={510} height={660} className="mx-auto w-full max-w-[360px] -rotate-2 rounded-card border border-line shadow-card" loading="lazy" />
            </div>
            <div>
              <Eyebrow className="reveal">Free guide</Eyebrow>
              <h2 className={`reveal mt-2 ${H2}`}>The Founder Trajectory™ Method on one page.</h2>
              <p className="reveal mt-4 max-w-xl text-lg text-ink-muted">The three outcomes, the four steps, how the Total Readiness Score is measured and where to start. Print it, share it with your team, keep it on your desk.</p>
              <div className="reveal mt-8"><GuideForm source="home_guide" /></div>
            </div>
          </div>
        </section>

        {/* 6. Readiness Snapshot taster */}
        <section>
          <div className={`${SECTION} grid items-center gap-10 lg:grid-cols-[1fr_1.2fr]`}>
            <div>
              <Eyebrow className="reveal">Free Readiness Snapshot</Eyebrow>
              <h2 className={`reveal mt-2 ${H2}`}>Start with three questions.</h2>
              <p className="reveal mt-4 text-lg text-ink-muted">Answer three now, then finish the free Snapshot in the app: about seven minutes in all, no account needed.</p>
            </div>
            <div className="reveal">
              <SnapshotTaster appUrl={APP_URL} />
            </div>
          </div>
        </section>

        {/* 7. RENZOLO OS showcase: the tool (night band, premium) */}
        <section id="os" data-theme="dark" className="premium relative bg-night text-ink">
          <DotGrid />
          <Glow />
          <div className={`relative ${SECTION}`}>
            <Eyebrow className="reveal">RENZOLO OS™</Eyebrow>
            <h2 className={`reveal mt-2 max-w-3xl ${H2}`}>One place to plan, track and get coached.</h2>
            <p className="reveal mt-4 max-w-xl text-lg text-ink-muted">Real screens from a sample business.</p>
            <div className="mt-12">
              <OsStory modules={OS_MODULES} />
            </div>
          </div>
        </section>

        {/* 8. Why RENZOLO: the guide (premium) */}
        <section id="why" className="premium">
          <div className={SECTION}>
            <Eyebrow className="reveal">Why RENZOLO</Eyebrow>
            <h2 className={`reveal mt-2 max-w-4xl ${H2}`}>
              Other tools help you run your business. RENZOLO gets you ready for customers, capital and investors, and connects you to them.
            </h2>
            <div className="mt-12 grid gap-12 md:grid-cols-[0.8fr_1.2fr]">
              <div className="reveal">
                <Portrait name={FOUNDER.name} photo={FOUNDER.photo} className="aspect-[4/5] w-full max-w-sm" />
                <p className="mt-4 font-display text-xl font-bold">{FOUNDER.name}</p>
                <p className="text-ink-muted">{FOUNDER.title}</p>
              </div>
              <div className="reveal">
                <blockquote className="font-display text-2xl font-bold leading-8 md:text-[28px] md:leading-9">&ldquo;{FOUNDER.pullQuote}&rdquo;</blockquote>
                <p className="mt-6 max-w-[60ch] text-lg leading-7 text-ink-muted">{FOUNDER.short}</p>
                <a href="/about/" className="mt-4 inline-block font-semibold text-teal-text underline underline-offset-4">Read Lorenzo&apos;s story</a>
              </div>
            </div>

            <dl className="reveal mt-16 divide-y divide-line border-y border-line">
              {REASONS.map(([reason, say, proof]) => (
                <div key={reason} className="grid gap-2 py-6 md:grid-cols-[10rem_1fr_1.3fr] md:gap-8">
                  <dt className="text-[13px] font-bold uppercase tracking-[0.08em] text-brand-text">{reason}</dt>
                  <dd className="font-display text-xl font-bold leading-7">{say}</dd>
                  <dd className="text-ink-muted">{proof}</dd>
                </div>
              ))}
            </dl>

            {/* Results strip: Lorenzo's track record until RENZOLO has its own results */}
            <div className="reveal mt-16">
              <p className="text-[13px] font-bold uppercase tracking-[0.08em] text-ink-muted">{RESULTS.label}</p>
              <div className="mt-4 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
                {RESULTS.stats.map((s) => (
                  <div key={s.label}>
                    <p className="font-display text-5xl font-bold leading-[54px]">{s.figure}</p>
                    <p className="mt-1 text-[13px] font-medium text-ink-muted">{s.label}</p>
                  </div>
                ))}
              </div>
              <p className="mt-6 max-w-3xl text-[13px] text-ink-muted">{RESULTS.base} {AFFILIATION_NOTE}</p>
            </div>
          </div>
        </section>

        {/* 9. Testimonials: shown once there are at least four real ones */}
        {TESTIMONIALS.length >= 4 && (
          <section className="bg-surface-tint">
            <div className={SECTION}>
              <Eyebrow>Founders on RENZOLO</Eyebrow>
              <ul className="mt-8 flex snap-x gap-6 overflow-x-auto pb-4">
                {TESTIMONIALS.map((t) => (
                  <li key={t.name} className="w-[300px] shrink-0 snap-start rounded-card border border-line bg-surface-raised p-6">
                    <span className="rounded-pill bg-gold px-3 py-1 text-[13px] font-bold text-on-gold">{t.result}</span>
                    <p className="mt-4 text-[17px] font-medium leading-[26px]">&ldquo;{t.quote}&rdquo;</p>
                    <p className="mt-4 font-bold">{t.name}</p>
                    <p className="text-[13px] text-ink-muted">{t.business} · {t.place}</p>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        )}

        {/* 10. Pricing: the choice (premium) */}
        {/* 9b. Find your path */}
        <section id="path">
          <div className={SECTION}>
            <Eyebrow className="reveal">Find your path</Eyebrow>
            <h2 className={`reveal mt-2 max-w-3xl ${H2}`}>Where is your business today?</h2>
            <p className="reveal mt-4 max-w-2xl text-lg text-ink-muted">Pick the one that fits. We&apos;ll show you the path founders like you take, and the first step.</p>
            <div className="reveal mt-10">
              <PathChooser stages={PATHS} fallbackHref={appLink("/snapshot", "path_fallback")} />
            </div>
          </div>
        </section>

        <section id="pricing" className="premium bg-surface-tint">
          <div className={SECTION}>
            <Eyebrow className="reveal">Pricing</Eyebrow>
            <h2 className={`reveal mt-2 ${H2}`}>Start small. Go as deep as you need.</h2>
            <div className="reveal mt-12 flex flex-col gap-6 rounded-panel border border-line bg-surface-raised p-8 md:flex-row md:items-center md:justify-between">
              <div>
                <p className="font-display text-[32px] font-bold leading-[38px]">Readiness Assessment</p>
                <p className="mt-1 max-w-xl text-ink-muted">The full report once, with a valuation range, AI market insight for your industry and country, and the plan that fits you. No membership needed.</p>
                <HowToStart text={HOW_TO_START.assessment} className="mt-3" />
              </div>
              <div className="flex items-center gap-6">
                <p className="font-display text-5xl font-bold">$79</p>
                <Button href={appLink("/pricing", "home_pricing_assessment")} variant="secondary">Get the assessment</Button>
              </div>
            </div>
            <div className="reveal mt-12">
              <PricingTable tiers={TIERS} appUrl={APP_URL} />
            </div>
            <p className="mt-6 text-[13px] text-ink-muted">Prices in US dollars. One-on-one coaching sessions from $59 for members.</p>
          </div>
        </section>

        {/* 11. Academy (premium) */}
        <section className="premium">
          <div className={SECTION}>
            <Eyebrow className="reveal">Founder Trajectory™ Academy</Eyebrow>
            <h2 className={`reveal mt-2 ${H2}`}>Grow alongside founders building too.</h2>
            <div className="reveal mt-12 grid gap-6 md:grid-cols-3">
              {ACADEMY.map(([name, length, text]) => (
                <div key={name} className="rounded-card border border-line bg-surface-raised p-8">
                  <p className="font-mono text-sm font-medium text-ink-muted">{length}</p>
                  <h3 className="mt-2 font-display text-[32px] font-bold leading-[38px]">{name}</h3>
                  <p className="mt-3 text-ink-muted">{text}</p>
                  <HowToStart text={ACADEMY_START[name]} className="mt-5 border-t border-line pt-4" />
                </div>
              ))}
            </div>
            <div className="reveal mt-8">
              <Button href="/academy/" variant="link">Explore the Academy</Button>
            </div>
          </div>
        </section>

        {/* 12. FAQ */}
        <section className="bg-surface-tint">
          <div className={`${SECTION} grid gap-10 md:grid-cols-[1fr_1.6fr]`}>
            <div>
              <Eyebrow className="reveal">Questions</Eyebrow>
              <h2 className={`reveal mt-2 ${H2}`}>Good to know.</h2>
            </div>
            <div className="reveal divide-y divide-line border-y border-line">
              {FAQ.map(([q, a]) => (
                <details key={q} className="group py-5">
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-xl font-bold [&::-webkit-details-marker]:hidden">
                    {q}
                    <span aria-hidden="true" className="text-2xl text-brand-text transition group-open:rotate-45">+</span>
                  </summary>
                  <p className="mt-3 text-ink-muted">
                    {a}
                    {q.startsWith("Can I get a refund") && (
                      <>
                        {" "}
                        <a href={`${APP_URL}/refunds`} className="font-semibold text-teal-text underline underline-offset-4">Read the refund policy</a>
                      </>
                    )}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* 13. Final call to action */}
        <section className={`${WRAP} py-16 md:py-24`}>
          <div className="reveal flex flex-col gap-6 rounded-panel bg-brand p-8 text-on-brand md:flex-row md:items-center md:justify-between md:p-12">
            <p className={`max-w-2xl ${H2}`}>Know where you stand in seven minutes.</p>
            <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
              <a href={appLink("/snapshot", "home_final_cta")} className="inline-flex justify-center rounded-pill bg-ink px-6 py-3 font-semibold text-surface transition-colors hover:bg-ink/85">
                Start your assessment
              </a>
              <a href="/contact/" className="inline-flex justify-center rounded-pill border-2 border-ink/70 px-6 py-3 font-semibold text-on-brand transition-colors hover:border-ink">
                Talk to Lorenzo
              </a>
            </div>
          </div>
        </section>
      </main>
      <Footer />
      <StickyMobileCta href={appLink("/snapshot", "home_sticky")} label="Start your assessment" />
    </>
  );
}
