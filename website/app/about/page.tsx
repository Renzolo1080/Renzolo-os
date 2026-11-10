import { Header, Footer } from "@/components/Chrome";
import { HeroZoom } from "@/components/HeroZoom";
import { ProofPanel } from "@/components/Proof";
import { FOUNDER } from "@/lib/story";
import { appLink } from "@/lib/site";

/* About us (approved Nov 9, 2026): purpose, mission, vision, values, our
   story in the firm's voice, a leadership card and the track record. */

export const metadata = {
  title: "About us",
  description: "RENZOLO™ is a global venture development and capital infrastructure firm that gets founders and CEOs ready to win contracts, access capital and attract investment.",
};

const WRAP = "mx-auto max-w-[1240px] px-4 md:px-8";
const EYEBROW = "text-[15px] font-bold uppercase tracking-[0.16em] text-brand-text";
const PILL = "inline-flex min-h-[48px] items-center rounded-pill px-7 py-3.5 text-lg font-bold";

const VALUES: [string, string][] = [
  ["Readiness over hype", "We measure what buyers, lenders and investors actually check, and tell founders the truth about where they stand."],
  ["Evidence, not promises", "Every score, plan and recommendation is tied to proof a decision-maker can see."],
  ["Execution", "A plan only matters if it gets done. We coach and track until it does."],
  ["Access", "World-class readiness support at a price early-stage founders can afford, wherever they start."],
];

export default function AboutPage() {
  return (
    <>
      <Header campaign="about_header" />
      <main>
        <HeroZoom eyebrow="About us" title="We get businesses ready for the yes." intro="A global venture development and capital infrastructure firm, built for founders and CEOs ready to grow." minHeight="min-h-[440px] md:min-h-[520px]" />

        <section className={`${WRAP} pt-20 md:pt-24`}>
          <p className={EYEBROW}>Our purpose</p>
          <h2 className="mt-3 max-w-[860px] font-display text-[32px] font-bold leading-[1.12] md:text-[46px]">Talented founders shouldn&apos;t lose opportunities because nobody showed them what ready looks like.</h2>
          <div className="mt-12 grid gap-6 [grid-template-columns:repeat(auto-fit,minmax(min(100%,340px),1fr))]">
            <Card label="Our mission" text="To get founders and CEOs ready to win contracts, capital and investment, and connect them to the people who can say yes." />
            <Card label="Our vision" text="A world where every capable founder, wherever they start, is ready when opportunity arrives." />
          </div>
        </section>

        <section className={`${WRAP} pt-20`}>
          <p className={EYEBROW}>Our values</p>
          <div className="mt-7 grid gap-8 [grid-template-columns:repeat(auto-fit,minmax(240px,1fr))]">
            {VALUES.map(([title, text]) => (
              <div key={title}>
                <h3 className="mb-2 font-sans text-[21px] font-bold">{title}</h3>
                <p className="text-[17px] leading-relaxed text-ink-muted">{text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className={`${WRAP} py-20 md:py-24`}>
          <div className="flex flex-wrap gap-14 border-t border-line pt-16">
            <div className="min-w-0 flex-[1_1_380px]">
              <p className={EYEBROW}>Our story</p>
              <h2 className="mt-3 font-display text-[32px] font-bold leading-[1.12] md:text-[42px]">Built from 25+ years on the buyer&apos;s side of the table.</h2>
            </div>
            <div className="min-w-0 flex-[1_1_520px] space-y-5 text-lg leading-relaxed text-ink-muted md:text-[19px]">
              <p>Our founder, coaches and team have spent more than 25 years assessing suppliers for global companies, developing them until they met the standard, and connecting them to contracts, lenders and investors across Africa, the UK, Europe, the US, India, Latin America and the Caribbean.</p>
              <p>The same pattern showed up everywhere: good businesses lost opportunities not because they were weak, but because they couldn&apos;t show they were ready. RENZOLO exists to change that, for every founder, not just the few who win a place in a programme.</p>
              <p>Founder Trajectory™, powered by RENZOLO OS™, turns what procurement teams, credit committees and investors check into a score, a plan and coaching any founder can use.</p>
            </div>
          </div>
        </section>

        <section className={`${WRAP} pb-20`}>
          <p className={EYEBROW}>Leadership</p>
          <div className="mt-6 flex max-w-[760px] items-center gap-6 rounded-[24px] border border-line bg-white p-7">
            {FOUNDER.photo ? (
              <img src={FOUNDER.photo} alt={FOUNDER.name} className="h-[88px] w-[88px] shrink-0 rounded-full object-cover" />
            ) : (
              <span aria-hidden="true" className="flex h-[88px] w-[88px] shrink-0 items-center justify-center rounded-full bg-ink font-display text-2xl font-bold text-white">
                LB
              </span>
            )}
            <div className="min-w-0">
              <p className="text-[22px] font-bold">Lorenzo Bell Jr.</p>
              <p className="mt-0.5 text-base font-bold text-brand-text">Founder &amp; CEO</p>
              <p className="mt-2 text-[17px] leading-relaxed text-ink-muted">25+ years developing suppliers and founders for global buyers, lenders and investors. U.S. Navy veteran.</p>
            </div>
          </div>
        </section>

        <section id="proof" className={`${WRAP} scroll-mt-24 pb-20 md:pb-24`}>
          <ProofPanel />
        </section>

        <section className={`${WRAP} flex flex-wrap items-center justify-between gap-6 pb-20 md:pb-24`}>
          <h2 className="font-display text-[32px] font-bold leading-[1.1] md:text-[40px]">See where your business stands.</h2>
          <div className="flex flex-wrap gap-4">
            <a href={appLink("/snapshot", "about_end")} className={`${PILL} bg-brand text-on-brand hover:bg-brand/90`}>
              Start the free Snapshot
            </a>
            <a href="/contact/" className={`${PILL} border-2 border-ink text-ink hover:bg-ink/5`}>
              Talk to our team
            </a>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}

function Card({ label, text }: { label: string; text: string }) {
  return (
    <div className="rounded-[24px] border border-line bg-white p-9">
      <p className="text-sm font-bold uppercase tracking-[0.16em] text-brand-text">{label}</p>
      <p className="mt-3.5 font-display text-[22px] font-bold leading-snug md:text-[26px]">{text}</p>
    </div>
  );
}
