import { PROOF_STATS } from "@/lib/story";
import { appLink } from "@/lib/site";

/* Layout and flow pieces from the October 2026 benchmark: a proof band
   under the hero, tabs across the offer pages, and a closing call to
   action on every page. Copy comes from lib/story.ts and the existing
   pages, so these change the flow, not the words or the colours. */

const WRAP = "mx-auto max-w-[1200px] px-4 md:px-8";

/** Short labels for the band; the full labels stay on the About page. */
const SHORT: Record<string, string> = {
  "25+": "years developing founders and suppliers",
  "7,000+": "suppliers and entrepreneurs trained",
  "4,000+": "founders benefited across 30+ countries",
  "$10M": "raised for founder development and investment",
  "$4.2B": "in customer contracts matched to founders",
};

/** 1. One proof band, straight after the hero. */
export function ProofBand() {
  return (
    <section aria-label="Our track record" className="border-y border-line bg-surface">
      <div className={`${WRAP} grid items-center gap-6 py-6 md:grid-cols-[auto_1fr_auto] md:gap-10`}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text md:max-w-[11rem]">Our track record</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-5">
          {PROOF_STATS.map((p) => (
            <li key={p.figure}>
              <span className="block font-display text-3xl font-bold tracking-tight text-ink">{p.figure}</span>
              <span className="mt-0.5 block text-sm leading-5 text-ink-muted">{SHORT[p.figure] ?? p.label}</span>
            </li>
          ))}
        </ul>
        <a href="/about/#proof" className="text-sm font-semibold text-teal-text underline-offset-4 hover:underline">
          See the full track record →
        </a>
      </div>
    </section>
  );
}

/** 4. The closing call to action at the end of every page. */
export function PageEndCta({ campaign, title = "Know where you stand in minutes." }: { campaign: string; title?: string }) {
  return (
    <section className={`${WRAP} pb-16 pt-4 md:pb-24`}>
      <div className="reveal relative flex flex-col gap-6 overflow-hidden rounded-panel bg-night p-8 text-white md:flex-row md:items-center md:justify-between md:p-14">
        <img src="/img/burst-bright.jpg" alt="" aria-hidden="true" className="pointer-events-none absolute -right-40 top-1/2 h-[520px] w-[520px] -translate-y-1/2 object-cover opacity-85 [mask-image:radial-gradient(circle,#000_35%,transparent_70%)]" />
        <p className="relative max-w-2xl font-display text-[34px] font-bold leading-[1.1] md:text-[46px]">{title}</p>
        <div className="relative flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <a href={appLink("/snapshot", campaign)} className="inline-flex justify-center rounded-pill bg-brand px-7 py-4 text-lg font-bold text-on-brand transition-colors hover:bg-brand/90">
            Start the free Snapshot
          </a>
          <a href="/contact/" className="inline-flex justify-center rounded-pill border-2 border-white/60 px-6 py-3.5 font-semibold text-white transition-colors hover:border-white">
            Talk to our team
          </a>
        </div>
      </div>
    </section>
  );
}

/** 3. "How to start" for every offer, so nobody has to guess the first step. */
export const HOW_TO_START = {
  assessment: "Buy it and start today. It carries into a membership if you join within 30 days.",
  essentials: "Take the free Snapshot, then choose Essentials.",
  growth: "Take the free Snapshot or the one-time assessment, then choose Growth.",
  elevate: "Take the one-time assessment first. Places are limited.",
  launch: "Register your interest. We email you when applications open.",
  build: "For businesses with customers. Register your interest to hear first.",
  scale: "Apply after your assessment. Selective, once a year.",
} as const;

export function HowToStart({ text, dark = false, className = "" }: { text: string; dark?: boolean; className?: string }) {
  return (
    <p className={`flex gap-2 text-sm ${dark ? "text-mist" : "text-ink-muted"} ${className}`}>
      <span className={`shrink-0 font-semibold ${dark ? "text-gold-soft" : "text-brand-text"}`}>How to start:</span>
      <span>{text}</span>
    </p>
  );
}
