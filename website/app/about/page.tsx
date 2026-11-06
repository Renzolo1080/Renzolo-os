import { Header, Footer } from "@/components/Chrome";
import { OutcomeChips, Portrait } from "@/components/Visuals";
import { AFFILIATION_NOTE, CREDENTIALS, FOUNDER, PROOF_STATS, CAREER_STORY } from "@/lib/story";
import { appLink } from "@/lib/site";
import { PageEndCta } from "@/components/Flow";

export const metadata = { title: "About", description: "Customer, capital and investor readiness for founders and suppliers, built by someone who has assessed and developed suppliers for large buyers. Founder Trajectory™, powered by RENZOLO OS™." };

const STEPS = [
  ["Evaluate", "Know your readiness score, free in minutes, then go deeper with your full Readiness Assessment."],
  ["Evolve", "Develop your strategic growth plan, built to support your market growth."],
  ["Execute", "Work the plan with a Founder Coach, your dashboard and progress tracking."],
  ["Elevate", "Re-assess and move to your next stage."],
];

const ACCENTS = ["#E8603C", "#F4B740", "#22B8B0", "#C18B2C", "#087F77", "#E8603C"];

export default function AboutPage() {
  return (
    <>
      <Header campaign="about_header" />
      <main>
        <section className="mx-auto max-w-[1240px] px-4 pt-8 md:px-8 md:pt-10">
          <div data-theme="dark" className="relative overflow-hidden rounded-panel bg-night px-6 py-14 text-ink md:px-14 md:py-20">
          <img src="/img/burst-bright.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute -right-48 top-1/2 hidden h-[600px] w-[600px] -translate-y-1/2 object-cover opacity-90 [mask-image:radial-gradient(circle,#000_35%,transparent_70%)] md:block" />
          <div className="relative max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-soft">About RENZOLO™</p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-bold leading-[1.05] tracking-tight md:text-6xl">
              Ready for contracts, capital and investment, <span className="text-gold">from the buyer&apos;s side of the table.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
              RENZOLO™ is a venture development firm. We give founders and suppliers a clear view of where their business stands, help them build a
              readiness and growth plan, and coach them to reach at least one of three outcomes:
            </p>
            <OutcomeChips className="mt-6" />
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <a href={appLink("/snapshot", "about_hero")} className="rounded-pill bg-brand px-7 py-4 text-lg font-bold text-on-brand transition-colors hover:bg-brand/90">
                Start the free Snapshot
              </a>
              <a href="#proof" className="font-semibold text-gold-soft underline-offset-4 hover:underline">See the track record</a>
            </div>
          </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-6xl gap-12 px-5 py-16 md:grid-cols-[0.8fr_1.2fr] md:py-24">
          <div>
            <Portrait name={FOUNDER.name} photo={FOUNDER.photo} className="aspect-[4/5] w-full max-w-sm" />
            <p className="mt-5 font-display text-xl font-bold">{FOUNDER.name}</p>
            <p className="text-muted">{FOUNDER.title}</p>
          </div>
          <div>
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Why I built RENZOLO</h2>
            <div className="mt-6 space-y-5 text-lg leading-relaxed text-ink/80">
              {FOUNDER.story.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <figure className="mt-10 rounded-3xl bg-navy p-7 text-white">
              <blockquote className="font-display text-xl font-bold leading-snug md:text-2xl">“{FOUNDER.generationsQuote}”</blockquote>
              <figcaption className="mt-4 text-sm text-mist">Lorenzo Bell Jr., in “Building Tomorrow&apos;s Supply Chain”</figcaption>
            </figure>
          </div>
        </section>

        <section id="proof" className="mx-auto max-w-[1240px] scroll-mt-24 px-4 md:px-8">
          <div data-theme="dark" className="relative overflow-hidden rounded-panel bg-night text-ink">
          <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">The proof behind the method</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-5 sm:[&>*:last-child]:col-span-2 lg:[&>*:last-child]:col-span-1">
              {PROOF_STATS.map((p) => (
                <div key={p.label} className="bg-navy/80 p-6">
                  <p className="font-display text-ink text-5xl font-bold">{p.figure}</p>
                  <p className="mt-2 text-sm text-mist">{p.label}</p>
                </div>
              ))}
            </div>
            <div className="mt-12 max-w-3xl space-y-5 text-lg leading-relaxed text-mist">
              {CAREER_STORY.map((p) => (
                <p key={p.slice(0, 24)}>{p}</p>
              ))}
            </div>
            <p className="mt-10 max-w-3xl text-xs text-mist/70">{AFFILIATION_NOTE}</p>
          </div>
        </div>
        </section>

        <section id="expertise" className="scroll-mt-24 bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Expertise behind every assessment</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">The readiness criteria in RENZOLO OS™ come from real supplier development and capital work.</p>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CREDENTIALS.map((c, i) => (
                <li key={c.title} className="rounded-3xl border border-mist p-6">
                  <span aria-hidden="true" className="block h-1.5 w-10 rounded-full" style={{ background: ACCENTS[i % ACCENTS.length] }} />
                  {c.figure && <p className="mt-4 font-display text-4xl font-bold text-navy">{c.figure}</p>}
                  <p className="mt-4 font-display text-lg font-bold">{c.title}</p>
                  <p className="mt-2 text-muted">{c.text}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-5 py-16 md:py-24">
          <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">How we support your business</h2>
          <p className="mt-4 max-w-2xl text-lg text-muted">The Founder Trajectory™ Method, powered by RENZOLO OS™:</p>
          <ol className="mt-10 divide-y divide-mist border-y border-mist">
            {STEPS.map(([name, text], i) => (
              <li key={name} className="grid gap-2 py-7 md:grid-cols-[4rem_14rem_1fr] md:items-baseline md:gap-8">
                <span className="font-display text-3xl font-bold" style={{ fontWeight: 800, color: ACCENTS[i] }}>
                  {i + 1}
                </span>
                <p className="font-display text-2xl font-bold">{name}</p>
                <p className="text-lg text-muted">{text}</p>
              </li>
            ))}
          </ol>
        </section>
        <PageEndCta campaign="about_end" />
      </main>
      <Footer />
    </>
  );
}
