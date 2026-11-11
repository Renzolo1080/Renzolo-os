import { Header, Footer } from "@/components/Chrome";
import { HeroZoom } from "@/components/HeroZoom";
import { ProofPanel } from "@/components/Proof";
import { APP_URL, appLink } from "@/lib/site";
import { AssessmentOffer } from "@/components/AssessmentOffer";
import { Price } from "@/components/RegionPrice";

/* Home page, v6 "global firm" (approved Nov 9, 2026): zooming hero, the
   Founder Trajectory™ method, who we are, services, track record,
   memberships, inside RENZOLO OS™, FAQs and a closing call to action. */

const WRAP = "mx-auto max-w-[1240px] px-4 md:px-8";
const EYEBROW = "text-[15px] font-bold uppercase tracking-[0.16em] text-brand-text";
const H2 = "font-display text-[34px] font-bold leading-[1.12] md:text-[46px]";
const CTA = "inline-flex min-h-[48px] items-center justify-center rounded-pill bg-brand px-7 py-4 text-lg font-bold text-on-brand transition-colors hover:bg-brand/90";

const METHOD: [string, string, string][] = [
  ["Evaluate", "Know your readiness score, free in minutes.", "#FF5A1F"],
  ["Evolve", "Develop your strategic growth plan.", "#B8177F"],
  ["Execute", "Founder Coach, dashboard, progress tracking.", "#6A2BCB"],
  ["Elevate", "Re-assess and move to your next stage.", "#3B1694"],
];

const SERVICES: [string, string][] = [
  ["Readiness Assessment", "A full view of your business against what buyers, lenders and investors check, with your Total Readiness Score and valuation range."],
  ["Growth planning", "A strategic plan built to support your market growth, from 90 days to 36 months, with dated actions for every gap."],
  ["Founder coaching", "Live sessions with a Founder Coach and an AI coach any time, keeping you on plan until you're ready."],
  ["Buyer and investor matching", "Full introductions to buyers, lenders and investors once you meet the readiness requirements."],
];

const JOURNEY: [string, string, string][] = [
  ["Start free", "Readiness Snapshot: your score and three biggest gaps.", "#FF5A1F"],
  ["Get the full picture", "Readiness Assessment, one time, or included in every membership.", "#E6197F"],
  ["Work the plan, coached", "Choose the membership that fits where you're going.", "#3B1694"],
];

type Plan = { name: string; who: string; price: React.ReactNode; per: React.ReactNode; items: string[]; color: string; featured?: boolean };
const PLANS: Plan[] = [
  { name: "Essentials", who: "For early-stage founders getting the basics right.", price: <Price k="essentials.quarterly" />, per: <>a quarter · or <Price k="essentials.annual" /> a year</>, color: "#FF5A1F", items: ["Full Readiness Assessment and report", "Valuation range and AI market insight", "Growth plan, dashboard and reminders", "One 30-minute coaching session a quarter"] },
  { name: "Growth", who: "For growing businesses closing their readiness gaps.", price: <Price k="growth.quarterly" />, per: <>a quarter · or <Price k="growth.annual" /> a year</>, color: "#E6197F", featured: true, items: ["Everything in Essentials", "AI coach any time, with weekly check-ins", "Plan review, Market Intelligence and advisor review", "Two 30-minute coaching sessions a quarter"] },
  { name: "Elevate", who: "For businesses ready to get in front of buyers and funders.", price: <Price k="elevate.quarterly" />, per: <>a quarter · or <Price k="elevate.annual" /> a year</>, color: "#3B1694", items: ["Everything in Growth", "One 60-minute coaching session a month", "Pitch and investor readiness review", "Priority support · limited places"] },
];

const INSIDE: [string, string, string, string][] = [
  ["Your dashboard", "Score, goals and the numbers that matter.", "/img/screen-dashboard.jpg", "The dashboard with revenue, customers, cash, Total Readiness Score and goals"],
  ["Your strategic plan", "Dated actions for every gap.", "/img/screen-plan.jpg", "The Plan Builder checking a strategic plan for goals, measures and dated actions"],
  ["Market Intelligence", "Your industry and country, with sources.", "/img/screen-market.jpg", "A Market Intelligence brief with recommendations for the founder's plan"],
  ["Your coaching team", "An AI coach any time, and a Founder Coach.", "/img/screen-aicoach.jpg", "The AI coach answering a pricing question with suggested actions"],
];

const FAQ: [string, string][] = [
  ["What does the free Snapshot give me?", "Your Total Readiness Score, your three biggest gaps and your best next move, in about five minutes."],
  ["What's the difference between the one-time assessment and a membership?", "The assessment is a one-time readiness report with an AI market insight. A membership adds your valuation range and keeps you moving with your plan, dashboard, tools and one-on-one coaching."],
  ["How does coaching work?", "With Growth and Elevate, your AI coach answers any time from your plan. Essentials includes one 30-minute session a quarter, Growth two 30-minute sessions a quarter, and Elevate one 60-minute session a month."],
  ["Who is it for, and where?", "Early- and growth-stage founders and CEOs, wherever they are. We're starting in Africa, the United States and the United Kingdom. Prices are in US dollars; pay by card, or mobile money where available."],
  ["Is my business information safe?", "We never sell it. You can download or delete your data any time, and we share your profile only with your permission."],
];

export default function Home() {
  return (
    <>
      <Header campaign="home_header" />
      <main>
        <HeroZoom eyebrow="Venture development & capital infrastructure" title="Get ready to win." intro="We help founders and CEOs get ready to win contracts, access capital and attract investment.">
          <div className="mt-9 flex flex-wrap justify-center gap-4">
            <a href={appLink("/snapshot", "home_hero")} className={CTA}>
              Start the free Snapshot
            </a>
            <a href="/contact/" className="inline-flex min-h-[48px] items-center rounded-pill border-2 border-white px-7 py-3.5 text-lg font-bold text-white hover:bg-white/10">
              Talk to our team
            </a>
          </div>
          <p className="mt-5 text-[15px] [text-shadow:0_1px_12px_rgba(0,0,0,0.6)]">Free · about 5 minutes · no card needed</p>
        </HeroZoom>

        {/* Who we are + the method */}
        <section className={`${WRAP} flex flex-wrap items-center gap-12 py-20 md:py-24`}>
          <div className="min-w-0 flex-[1_1_440px]">
            <p className={EYEBROW}>Who we are</p>
            <h2 className={`${H2} mt-3`}>We see your business the way buyers, lenders and investors do.</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink-muted md:text-[19px]">
              <p>RENZOLO is a global venture development and capital infrastructure firm. Our approach comes from more than 25 years on the buyer&apos;s side of the table: assessing suppliers for global companies, developing them until they meet the standard, and connecting them to contracts, lenders and investors.</p>
              <p>Founder Trajectory™, powered by RENZOLO OS™, puts that same standard in every founder&apos;s hands: a clear score, a growth plan, coaching, and a path to the people who can say yes.</p>
            </div>
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

        {/* Services */}
        <section id="services" className={`${WRAP} scroll-mt-24 pb-20 md:pb-24`}>
          <p className={EYEBROW}>What we do</p>
          <h2 className={`${H2} mt-3`}>Our services</h2>
          <ol className="mt-12 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {SERVICES.map(([title, text], i) => (
              <li key={title} className="rounded-[24px] border border-line bg-white p-8">
                <p className="font-display text-xl font-bold text-brand-text">0{i + 1}</p>
                <h3 className="mb-2 mt-3.5 font-sans text-[23px] font-bold">{title}</h3>
                <p className="text-[17px] leading-relaxed text-ink-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* Track record */}
        <section id="proof" className={`${WRAP} pb-20 md:pb-24`}>
          <ProofPanel title="25+ years of getting businesses ready, across 30+ countries." regions />
        </section>

        {/* Memberships */}
        <section id="memberships" className={`${WRAP} scroll-mt-24 pb-20 md:pb-24`}>
          <p className={EYEBROW}>Memberships</p>
          <h2 className={`${H2} mt-3`}>Choose how far you want to go.</h2>
          <p className="mt-4 max-w-[680px] text-lg leading-relaxed text-ink-muted md:text-[19px]">Start with the Readiness Assessment on its own, or choose a membership: every membership includes it. Prices are set for each region and shown in your local currency.</p>
          <AssessmentOffer campaign="home_assessment" className="mt-9" />
          <ol className="mt-9 flex flex-wrap gap-6 rounded-[20px] bg-[#F3F5F8] p-7">
            {JOURNEY.map(([title, text, color], i) => (
              <li key={title} className="flex min-w-0 flex-[1_1_260px] items-start gap-3.5">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full font-bold text-white" style={{ background: color }}>
                  {i + 1}
                </span>
                <span>
                  <b className="block text-lg">{title}</b>
                  <span className="text-base leading-snug text-ink-muted">{text}</span>
                </span>
              </li>
            ))}
          </ol>
          <div className="mt-12 grid items-stretch gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr))]">
            {PLANS.map((p) => (
              <div key={p.name} className={`relative flex flex-col rounded-[24px] bg-white px-8 py-9 ${p.featured ? "border-2 border-ink" : "border border-line"}`}>
                {p.featured && <span className="absolute right-6 top-6 rounded-pill bg-ink px-3 py-1.5 text-xs font-bold uppercase tracking-[0.12em] text-white">Recommended</span>}
                <div aria-hidden="true" className="h-1 w-12 rounded" style={{ background: p.color }} />
                <h3 className="mb-1.5 mt-5 font-sans text-[26px] font-bold">{p.name}</h3>
                <p className="text-base text-ink-muted">{p.who}</p>
                <p className="mt-5 font-display text-[44px] font-bold leading-none">{p.price}</p>
                <p className="mb-5 mt-1.5 text-[15px] text-ink-muted">{p.per}</p>
                <ul className="mb-7 flex-1 space-y-2.5">
                  {p.items.map((it) => (
                    <li key={it} className="flex gap-2.5 text-base leading-snug text-ink-muted">
                      <span aria-hidden="true" className="font-bold" style={{ color: p.color }}>
                        ✓
                      </span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
                <a
                  href={appLink("/pricing", `home_plan_${p.name.toLowerCase()}`)}
                  className={`rounded-pill px-6 py-3.5 text-center text-[17px] font-bold ${p.featured ? "bg-ink text-white hover:bg-ink/90" : "border-2 border-ink text-ink hover:bg-ink/5"}`}
                >
                  Choose {p.name}
                </a>
              </div>
            ))}
          </div>
          <p className="mt-7 text-[17px]">
            <a href={`${APP_URL}/pricing`} className="font-bold text-ink underline underline-offset-4">
              Compare all features and extra coaching on the pricing page →
            </a>
          </p>
        </section>

        {/* Inside RENZOLO OS */}
        <section id="os" className={`${WRAP} pb-20 md:pb-24`}>
          <p className={EYEBROW}>Inside RENZOLO OS™</p>
          <h2 className={`${H2} mt-3 max-w-[900px]`}>Instead of a consultant, a spreadsheet and a lender&apos;s checklist: one place.</h2>
          <p className="mt-4 max-w-[620px] text-lg leading-relaxed text-ink-muted md:text-[19px]">See where you stand, plan, track progress and get coached, all working together.</p>
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
              <p className="mt-5 text-[17px]">
                <a href="/contact/" className="font-bold text-gold underline-offset-4 hover:underline">
                  Or talk to our team →
                </a>
              </p>
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
