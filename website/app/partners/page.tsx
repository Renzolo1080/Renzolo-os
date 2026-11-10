import { Header, Footer } from "@/components/Chrome";
import { ProofPanel } from "@/components/Proof";

/* Partners (approved Nov 9, 2026): for buyers, agencies, lenders, investors
   and foundations who want businesses ready to win. Claims stay within what
   the partner portal does today: readiness baselines, progress and a
   shareable report. Contract, capital and jobs outcomes come later. */

export const metadata = {
  title: "Partners",
  description: "Partner with RENZOLO™ to get the founders and suppliers you care about ready to win contracts, access capital and attract investment, and to measure their progress.",
};

const WRAP = "mx-auto max-w-[1240px] px-4 md:px-8";
const EYEBROW = "text-[15px] font-bold uppercase tracking-[0.16em] text-brand-text";
const H2 = "font-display text-[32px] font-bold leading-[1.12] md:text-[44px]";
const CTA = "inline-flex min-h-[48px] items-center justify-center rounded-pill bg-brand px-7 py-4 text-lg font-bold text-on-brand transition-colors hover:bg-brand/90";

const WHO: [string, string, string[]][] = [
  ["Corporate buyers and procurement teams", "Build a stronger, more resilient supply base.", ["Assess current and prospective suppliers against your standards", "Close capability gaps before contracts are awarded", "Meet local-content and social-value goals with evidence"]],
  ["Governments and development agencies", "Turn enterprise programmes into measurable progress.", ["Readiness baselines for every business you support", "Coaching and plans that continue after the workshop ends", "Progress reporting for your board and funders"]],
  ["Lenders, investors and funds", "See a pipeline of businesses that are ready, not just interested.", ["Founders assessed against what lenders and investors check", "Readiness scores and plans before the first meeting", "Introductions once readiness requirements are met"]],
  ["Foundations and ecosystem builders", "Extend your reach without extending your team.", ["Sponsor founders in your focus regions or sectors", "Women- and youth-led business cohorts", "One platform for assessment, coaching and tracking"]],
];

const WAYS: [string, string][] = [
  ["Sponsor a readiness cohort", "Fund a group of founders or suppliers through Founder Trajectory™: full Readiness Assessment, a growth plan, coaching and progress tracking, delivered at scale."],
  ["Run a supplier readiness programme", "Assess the businesses already in your supply chain or applicant pool, see where each one stands, and focus development where it changes outcomes."],
  ["Meet ready businesses", "Meet founders who meet your readiness criteria and have chosen to be introduced, ready for contracts, credit or investment."],
];

const SEE: [string, string][] = [
  ["Readiness baselines", "for every business, across customer, capital and investment readiness."],
  ["Progress over time", "as founders close gaps against their plans."],
  ["Who has finished", "their assessment and growth plan, at a glance."],
  ["One partner report", "you can share with your board, members or funders."],
];

const START: [string, string, string][] = [
  ["Talk to us", "Share your goals, the businesses you want to reach and what success looks like.", "#FF5A1F"],
  ["Design the programme", "We shape the cohort, criteria and reporting around your outcomes.", "#E6197F"],
  ["Launch and measure", "Founders get assessed, planned and coached; you see their progress.", "#3B1694"],
];

export default function PartnersPage() {
  return (
    <>
      <Header campaign="partners_header" />
      <main>
        <section className={`${WRAP} pt-8 md:pt-10`}>
          <div className="relative overflow-hidden rounded-panel bg-night px-6 py-16 text-white md:px-14 md:py-20">
            <img src="/img/burst-bright.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute -right-48 top-1/2 hidden h-[620px] w-[620px] -translate-y-1/2 object-cover opacity-90 [mask-image:radial-gradient(circle,#000_35%,transparent_70%)] md:block" />
            <div className="relative max-w-[720px]">
              <p className="text-[15px] font-bold uppercase tracking-[0.16em] text-gold">Partners</p>
              <h1 className="mt-4 font-display text-[38px] font-bold leading-[1.08] md:text-[56px]">Build a pipeline of businesses ready to win.</h1>
              <p className="mt-6 text-lg leading-relaxed text-[#C5CDD7] md:text-xl">Partner with RENZOLO to get the founders and suppliers you care about ready to win contracts, access capital and attract investment, and to measure their progress.</p>
              <a href="/contact/" className={`${CTA} mt-9`}>
                Talk to our partnerships team
              </a>
            </div>
          </div>
        </section>

        <section className={`${WRAP} py-20 md:py-24`}>
          <p className={EYEBROW}>Who we partner with</p>
          <h2 className={`${H2} mt-3 max-w-[860px]`}>For organisations that need businesses ready, not just willing.</h2>
          <div className="mt-12 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,480px),1fr))]">
            {WHO.map(([title, lead, points]) => (
              <div key={title} className="rounded-[24px] border border-line bg-white p-8">
                <h3 className="font-sans text-[23px] font-bold">{title}</h3>
                <p className="mt-2 text-[17px] text-ink-muted">{lead}</p>
                <ul className="mt-5 space-y-2.5">
                  {points.map((pt) => (
                    <li key={pt} className="flex gap-2.5 text-base leading-snug">
                      <span aria-hidden="true" className="font-bold text-brand-text">
                        ✓
                      </span>
                      <span>{pt}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        <section className={`${WRAP} pb-20 md:pb-24`}>
          <p className={EYEBROW}>Ways to partner</p>
          <h2 className={`${H2} mt-3`}>Three ways to work with us</h2>
          <ol className="mt-12 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(260px,1fr))]">
            {WAYS.map(([title, text], i) => (
              <li key={title} className="rounded-[24px] border border-line bg-white p-8">
                <p className="font-display text-xl font-bold text-brand-text">0{i + 1}</p>
                <h3 className="mb-2 mt-3.5 font-sans text-[23px] font-bold">{title}</h3>
                <p className="text-[17px] leading-relaxed text-ink-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className={`${WRAP} pb-20 md:pb-24`}>
          <div className="flex flex-wrap gap-12 rounded-[24px] bg-[#F3F5F8] p-8 md:p-14">
            <div className="min-w-0 flex-[1_1_320px]">
              <p className={EYEBROW}>What you see</p>
              <h2 className={`${H2} mt-3`}>Evidence, not anecdotes.</h2>
            </div>
            <ul className="min-w-0 flex-[1_1_480px] space-y-4 text-lg leading-relaxed text-ink-muted">
              {SEE.map(([b, rest]) => (
                <li key={b}>
                  <b className="text-ink">{b}</b> {rest}
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className={`${WRAP} pb-20 md:pb-24`}>
          <ProofPanel />
        </section>

        <section className={`${WRAP} pb-20 md:pb-24`}>
          <p className={EYEBROW}>How it starts</p>
          <ol className="mt-7 flex flex-wrap gap-6 rounded-[20px] bg-[#F3F5F8] p-7">
            {START.map(([title, text, color], i) => (
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
        </section>

        <section className={`${WRAP} pb-20 md:pb-24`}>
          <div className="flex flex-wrap items-center justify-between gap-8 rounded-panel bg-night px-8 py-14 text-white md:px-16">
            <h2 className="max-w-[640px] font-display text-[32px] font-bold leading-[1.1] md:text-[42px]">Let&apos;s build your pipeline of ready businesses.</h2>
            <a href="/contact/" className={CTA}>
              Talk to our partnerships team
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
