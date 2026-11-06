import { Header, Footer } from "@/components/Chrome";
import { APP_URL, appLink } from "@/lib/site";

/* Home page, Option B v5 (approved Nov 5, 2026): one call to action, the
   Founder Trajectory™ method on the bright colour burst, benefits, track
   record on a navy panel, three steps with prices, three outcomes, what's
   inside RENZOLO OS™, FAQs and a closing call to action. */

const WRAP = "mx-auto max-w-[1240px] px-4 md:px-8";
const EYEBROW = "text-[15px] font-bold uppercase tracking-[0.16em] text-brand-text";
const H2 = "font-display text-[34px] font-bold leading-[1.12] md:text-[46px]";
const CTA = "inline-flex items-center justify-center rounded-pill bg-brand px-7 py-4 text-lg font-bold text-on-brand transition-colors hover:bg-brand/90";

const METHOD: [string, string, string][] = [
  ["Evaluate", "Know your readiness score, free in minutes.", "#FF5A1F"],
  ["Evolve", "Develop your strategic growth plan.", "#B8177F"],
  ["Execute", "Founder Coach, dashboard, progress tracking.", "#6A2BCB"],
  ["Elevate", "Re-assess and move to your next stage.", "#3B1694"],
];

const BENEFITS: [string, string, string][] = [
  ["Know where you stand.", "Your Total Readiness Score and the gaps holding you back.", "#FF5A1F"],
  ["A plan built to support your market growth.", "90 days to 36 months, with dated actions.", "#E6197F"],
  ["Track your progress.", "Revenue, customers, cash and goals on one dashboard.", "#6A2BCB"],
  ["Coaching when you need it.", "Lorenzo · AI any time, plus live sessions with a Founder Coach.", "#3B1694"],
  ["Get in front of the yes.", "Matching to buyers and funders once you meet the readiness requirements.", "#071727"],
];

const PROOF: [string, string][] = [
  ["20+", "years developing founders and suppliers"],
  ["7,000+", "suppliers and entrepreneurs trained"],
  ["4,000+", "founders benefited across 30+ countries"],
  ["$10M", "raised for founder development and investment"],
  ["$4.2B", "in customer contracts matched to founders"],
];

const STEPS: [string, string, string, string][] = [
  ["See where you stand", "The free Readiness Snapshot: your Total Readiness Score, biggest gaps and best next move.", "Free", "#FF5A1F"],
  ["Get the full picture", "The Readiness Assessment: a full report with a valuation range and AI market insight.", "$60 one time", "#E6197F"],
  ["Work the plan, coached", "A membership: your plan, dashboard, tools and coaching. Includes your assessment.", "From $60 a quarter", "#3B1694"],
];

const OUTCOMES: [string, string, string][] = [
  ["Win more contracts", "Ready for buyers and contracts.", "#FF5A1F"],
  ["Access capital", "Ready for loans, credit and grants.", "#E6197F"],
  ["Attract investment", "Ready for investors and partners.", "#1E6BFF"],
];

const INSIDE: [string, string, string, string][] = [
  ["Your dashboard", "Score, goals and the numbers that matter.", "/img/screen-dashboard.jpg", "The dashboard with revenue, customers, cash, Total Readiness Score and goals"],
  ["Your strategic plan", "Dated actions for every gap.", "/img/screen-plan.jpg", "The Plan Builder checking a strategic plan for goals, measures and dated actions"],
  ["Market Intelligence", "Your industry and country, with sources.", "/img/screen-market.jpg", "A Market Intelligence brief with recommendations for the founder's plan"],
  ["Your coaching team", "Lorenzo · AI any time, and a Founder Coach.", "/img/screen-aicoach.jpg", "The AI coach answering a pricing question with suggested actions"],
];

const FAQ: [string, string][] = [
  ["What does the free Snapshot give me?", "Your Total Readiness Score, your biggest gaps and your best next move, in about five minutes."],
  ["What's the difference between the $60 assessment and a membership?", "The assessment is a one-time full report. A membership includes the assessment and keeps you moving with your plan, dashboard, tools and coaching."],
  ["How does coaching work?", "Lorenzo · AI answers any time from your plan. Essentials includes one 30-minute session a quarter, Growth two 30-minute sessions a quarter, and Elevate one 60-minute session a month."],
  ["Who is it for, and where?", "Early- and growth-stage businesses in Africa, the Caribbean and the United States. Prices are in US dollars, with the amount in your currency shown at checkout."],
  ["Is my business information safe?", "We never sell it. You can download or delete your data any time, and we share your profile only with your permission."],
];

export default function Home() {
  return (
    <>
      <Header campaign="home_header" />
      <main>
        {/* Hero */}
        <section className={`${WRAP} flex flex-wrap items-center gap-12 pb-20 pt-12 md:pb-24 md:pt-16`}>
          <div className="min-w-0 flex-[1_1_440px]">
            <p className={EYEBROW}>Founder Trajectory™</p>
            <h1 className="mt-4 font-display text-[40px] font-bold leading-[1.08] md:text-[52px]">Get ready for the yes: contracts, capital, investment.</h1>
            <p className="mt-6 max-w-[500px] text-xl leading-relaxed text-ink-muted">
              See where your business stands, build the plan, and get coached to the standard buyers, lenders and investors look for.
            </p>
            <div className="mt-9 flex flex-wrap items-center gap-6">
              <a href={appLink("/snapshot", "home_hero")} className={CTA}>
                Start the free Snapshot
              </a>
              <a href="#how" className="text-[17px] font-bold text-ink underline-offset-4 hover:underline">
                See how it works →
              </a>
            </div>
            <p className="mt-5 text-[15px] text-ink-muted">Free · about 5 minutes · no card needed</p>
          </div>
          <div className="min-w-0 flex-[1_1_460px]">
            <div className="relative overflow-hidden rounded-panel bg-black px-6 py-9 md:px-8 md:py-10">
              <img src="/img/burst-bright.jpg" alt="" aria-hidden="true" className="absolute inset-0 h-full w-full object-cover" />
              <p className="relative mb-4 text-sm font-bold uppercase tracking-[0.16em] text-white [text-shadow:0_1px_8px_rgba(0,0,0,0.5)]">The Founder Trajectory™ method</p>
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

        {/* Benefits */}
        <section className={`${WRAP} pb-20`}>
          <p className={EYEBROW}>Founder Trajectory™, powered by RENZOLO OS™</p>
          <h2 className={`${H2} mt-3`}>Everything you need to get ready, in one place.</h2>
          <ul className="mt-8 grid gap-x-10 gap-y-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {BENEFITS.map(([title, text, color]) => (
              <li key={title} className="flex items-start gap-3.5">
                <span aria-hidden="true" className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full text-[15px] font-bold text-white" style={{ background: color }}>
                  ✓
                </span>
                <span className="text-lg leading-snug">
                  <b>{title}</b> {text}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Track record */}
        <section id="proof" className={WRAP}>
          <div className="flex flex-wrap items-center gap-10 rounded-panel bg-night px-6 py-10 text-white md:px-14 md:py-12">
            <div className="flex min-w-0 items-center gap-5">
              <div role="img" aria-label="Placeholder for Lorenzo's photo" className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full border-2 border-dashed border-white/50 bg-white/10 text-center text-xs font-bold text-[#C5CDD7]">
                [Photo]
              </div>
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.12em] text-gold md:whitespace-nowrap">Track record, before RENZOLO</p>
                <p className="mt-1.5 text-xl font-bold">Built by Lorenzo Bell Jr.</p>
                <p className="mt-0.5 text-base text-[#C5CDD7] md:whitespace-nowrap">Founder and CEO. U.S. Navy veteran.</p>
              </div>
            </div>
            <div className="grid min-w-0 flex-[2_1_560px] grid-cols-2 gap-6 sm:grid-cols-3">
              {PROOF.map(([figure, label]) => (
                <div key={figure}>
                  <p className="font-display text-[44px] font-bold leading-none">{figure}</p>
                  <p className="mt-1.5 text-base text-[#C5CDD7]">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="how" className={`${WRAP} py-20 md:py-24`}>
          <p className={EYEBROW}>How it works</p>
          <h2 className={`${H2} mt-3`}>Three steps. Start free.</h2>
          <ol className="mt-12 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(280px,1fr))]">
            {STEPS.map(([title, text, price, color], i) => (
              <li key={title} className="flex flex-col gap-2.5 rounded-[24px] border border-line p-8">
                <p className="flex h-11 w-11 items-center justify-center rounded-full text-xl font-bold" style={{ background: color, color: i === 0 ? "#071727" : "#FFFFFF" }}>
                  {i + 1}
                </p>
                <h3 className="mt-2.5 font-sans text-2xl font-bold">{title}</h3>
                <p className="text-[17px] leading-relaxed text-ink-muted">{text}</p>
                <p className="mt-2 font-display text-[28px] font-bold">{price}</p>
              </li>
            ))}
          </ol>
          <div className="mt-8 flex flex-wrap items-center gap-6">
            <a href={appLink("/snapshot", "home_steps")} className={CTA}>
              Start the free Snapshot
            </a>
            <a href={`${APP_URL}/pricing`} className="text-[17px] font-bold text-ink underline-offset-4 hover:underline">
              Compare memberships →
            </a>
          </div>
        </section>

        {/* Three outcomes */}
        <section className={WRAP}>
          <div className="rounded-panel bg-night px-6 py-16 text-white md:px-14 md:py-[88px]">
            <p className="text-[15px] font-bold uppercase tracking-[0.16em] text-gold">Three outcomes</p>
            <h2 className={`${H2} mt-3`}>Pick the yes you need next.</h2>
            <div className="mt-12 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
              {OUTCOMES.map(([title, text, color]) => (
                <div key={title} className="rounded-[20px] border border-white/15 bg-white/5 p-8">
                  <div aria-hidden="true" className="h-[3px] w-12 rounded" style={{ background: color }} />
                  <h3 className="mb-2 mt-6 font-sans text-2xl font-bold">{title}</h3>
                  <p className="text-lg leading-relaxed text-[#C5CDD7]">{text}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Inside RENZOLO OS */}
        <section id="os" className={`${WRAP} py-20 md:py-24`}>
          <p className={EYEBROW}>Inside RENZOLO OS™</p>
          <h2 className={`${H2} mt-3 max-w-[900px]`}>Instead of a consultant, a spreadsheet and a lender&apos;s checklist: one place.</h2>
          <p className="mt-4 max-w-[620px] text-[19px] leading-relaxed text-ink-muted">See where you stand, plan, track progress and get coached, all working together.</p>
          <div className="mt-12 grid gap-7 [grid-template-columns:repeat(auto-fit,minmax(250px,1fr))]">
            {INSIDE.map(([title, text, src, alt]) => (
              <div key={title} className="flex flex-col gap-3.5">
                <img src={src} alt={alt} loading="lazy" className="aspect-[16/10] w-full rounded-2xl border border-line object-cover object-left-top shadow-[0_12px_32px_rgba(7,23,39,0.10)]" />
                <div>
                  <h3 className="mb-1.5 font-sans text-[21px] font-bold">{title}</h3>
                  <p className="text-base leading-relaxed text-ink-muted">{text}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mx-auto max-w-[900px] px-4 pb-20 md:px-8 md:pb-24">
          <p className={EYEBROW}>Questions</p>
          <h2 className={`${H2} mb-8 mt-3`}>Good to know.</h2>
          {FAQ.map(([q, a], i) => (
            <details key={q} className={`border-t border-line py-5 ${i === FAQ.length - 1 ? "border-b" : ""}`}>
              <summary className="cursor-pointer text-xl font-bold">{q}</summary>
              <p className="mt-3 text-[17px] leading-relaxed text-ink-muted">{a}</p>
            </details>
          ))}
        </section>

        {/* Closing call to action */}
        <section className={`${WRAP} pb-20 md:pb-24`}>
          <div className="relative flex flex-wrap items-center justify-between gap-10 overflow-hidden rounded-panel bg-night px-8 py-14 text-white md:px-16 md:py-[72px]">
            <img
              src="/img/burst-bright.jpg"
              alt=""
              aria-hidden="true"
              className="pointer-events-none absolute -right-40 top-1/2 h-[560px] w-[560px] -translate-y-1/2 object-cover opacity-85 [mask-image:radial-gradient(circle,#000_35%,transparent_70%)]"
            />
            <div className="relative min-w-0 flex-[1_1_380px]">
              <h2 className="font-display text-[34px] font-bold leading-[1.1] md:text-[46px]">Know where you stand in minutes.</h2>
              <p className="mt-4 text-[19px] text-[#C5CDD7]">Free. Mostly dropdowns and taps. No card needed.</p>
            </div>
            <a href={appLink("/snapshot", "home_end")} className={`${CTA} relative`}>
              Start the free Snapshot
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
