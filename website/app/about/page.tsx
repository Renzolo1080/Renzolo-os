import { Header, Footer } from "@/components/Chrome";
import { Glow, OutcomeChips, Portrait, SignalBand } from "@/components/Visuals";
import { AFFILIATION_NOTE, CREDENTIALS, FOUNDER, PROOF_STATS, TRACK_RECORD } from "@/lib/story";
import { appLink } from "@/lib/site";

export const metadata = { title: "About", description: "Customer, capital and investor readiness for founders and suppliers, built by someone who has assessed and developed suppliers for large buyers. Founder Trajectory™, powered by RENZOLO OS™." };

const STEPS = [
  ["Evaluate", "See exactly where your business stands with the Readiness Snapshot and your full Readiness Assessment."],
  ["Evolve", "Turn the results into a growth and readiness plan, and update your strategy around the gaps that matter most."],
  ["Execute", "Work the plan with your dashboard, goals, AI coach, tools and one-on-one coaching."],
  ["Elevate", "Re-assess, measure your progress and move your business to its next stage."],
];

const ACCENTS = ["#E8603C", "#F4B740", "#22B8B0", "#C18B2C", "#087F77", "#E8603C"];

export default function AboutPage() {
  return (
    <>
      <Header campaign="about_header" />
      <main>
        <section data-theme="dark" className="relative overflow-hidden bg-night text-ink">
          <Glow />
          <div className="relative mx-auto max-w-6xl px-5 pb-16 pt-10 md:pt-16">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold-soft">About RENZOLO™</p>
            <h1 className="mt-4 max-w-4xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl" style={{ fontWeight: 800 }}>
              Customer, capital and investor readiness, <span className="text-gold">from the buyer&apos;s side of the table.</span>
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-relaxed text-mist">
              RENZOLO™ is a venture development firm. We give founders and suppliers a clear view of where their business stands, help them build a
              readiness and growth plan, and coach them to reach at least one of three outcomes:
            </p>
            <OutcomeChips className="mt-6" />
          </div>
        </section>
        <SignalBand />

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

        <section data-theme="dark" className="relative overflow-hidden bg-night text-ink">
          <Glow />
          <div className="relative mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">The proof behind the method</h2>
            <div className="mt-10 grid gap-px overflow-hidden rounded-3xl bg-white/10 sm:grid-cols-2 lg:grid-cols-4">
              {PROOF_STATS.map((p) => (
                <div key={p.label} className="bg-navy/80 p-6">
                  <p className="font-display text-ink text-5xl font-extrabold" style={{ fontWeight: 800 }}>{p.figure}</p>
                  <p className="mt-2 text-sm text-mist">{p.label}</p>
                </div>
              ))}
            </div>
            <ol className="mt-12 space-y-0 border-l-2 border-white/15">
              {TRACK_RECORD.map((t) => (
                <li key={t.org + t.years} className="relative pb-9 pl-8 last:pb-0">
                  <span aria-hidden="true" className="absolute -left-[9px] top-1.5 h-4 w-4 rounded-full bg-gold ring-4 ring-night" />
                  <p className="text-sm font-semibold uppercase tracking-wider text-gold-soft">{t.years}</p>
                  <p className="mt-1 font-display text-xl font-bold">{t.role}</p>
                  <p className="font-semibold text-mist">{t.org}</p>
                  <p className="mt-2 max-w-3xl text-mist">{t.text}</p>
                </li>
              ))}
            </ol>
            <p className="mt-10 max-w-3xl text-xs text-mist/70">{AFFILIATION_NOTE}</p>
          </div>
        </section>

        <section className="bg-white">
          <div className="mx-auto max-w-6xl px-5 py-16 md:py-24">
            <h2 className="font-display text-3xl font-bold tracking-tight md:text-4xl">Expertise behind every assessment</h2>
            <p className="mt-3 max-w-2xl text-lg text-muted">The readiness criteria in RENZOLO OS™ come from real supplier development and capital work.</p>
            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {CREDENTIALS.map((c, i) => (
                <li key={c.title} className="rounded-3xl border border-mist p-6">
                  <span aria-hidden="true" className="block h-1.5 w-10 rounded-full" style={{ background: ACCENTS[i % ACCENTS.length] }} />
                  {c.figure && <p className="mt-4 font-display text-4xl font-extrabold text-navy" style={{ fontWeight: 800 }}>{c.figure}</p>}
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
                <span className="font-display text-3xl font-extrabold" style={{ fontWeight: 800, color: ACCENTS[i] }}>
                  {i + 1}
                </span>
                <p className="font-display text-2xl font-bold">{name}</p>
                <p className="text-lg text-muted">{text}</p>
              </li>
            ))}
          </ol>
          <a href={appLink("/snapshot", "about")} className="mt-10 inline-block btn-pop rounded-pill border-2 border-ink bg-brand px-7 py-4 font-semibold text-on-brand">
            Take the free Readiness Snapshot
          </a>
        </section>
      </main>
      <Footer />
    </>
  );
}
