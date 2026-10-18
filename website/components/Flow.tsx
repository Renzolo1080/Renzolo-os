import { PROOF_STATS } from "@/lib/story";
import { appLink } from "@/lib/site";

/* Layout and flow pieces from the October 2026 benchmark: a proof band
   under the hero, tabs across the offer pages, and a closing call to
   action on every page. Copy comes from lib/story.ts and the existing
   pages, so these change the flow, not the words or the colours. */

const WRAP = "mx-auto max-w-[1200px] px-4 md:px-8";

/** Short labels for the band; the full labels stay on the About page. */
const SHORT: Record<string, string> = {
  "20+": "years developing suppliers and founders",
  "800+": "entrepreneurs trained",
  "19": "African countries reached",
  "$880k": "invested in founders' businesses",
};

/** 1. One proof band, straight after the hero. */
export function ProofBand() {
  return (
    <section aria-label="Lorenzo's track record" className="border-y border-line bg-surface">
      <div className={`${WRAP} grid items-center gap-6 py-6 md:grid-cols-[auto_1fr_auto] md:gap-10`}>
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text md:max-w-[9rem]">Lorenzo&apos;s track record</p>
        <ul className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
          {PROOF_STATS.map((p) => (
            <li key={p.figure}>
              <span className="block font-display text-3xl font-extrabold tracking-tight text-ink">{p.figure}</span>
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

/** 3. Tabs across the offer pages, so founders compare without the menu. */
export const OFFERS = [
  ["assessment", "Assessment", "/founder-trajectory/#assessment"],
  ["membership", "Membership", "/founder-trajectory/#membership"],
  ["coaching", "Coaching", "/founder-trajectory/#coaching"],
  ["academy", "Academy", "/academy/"],
] as const;

export function OfferTabs({ current }: { current: (typeof OFFERS)[number][0] }) {
  return (
    <nav aria-label="Our offers" className="border-b border-line bg-surface">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2">
        {OFFERS.map(([key, label, href]) => {
          const on = key === current;
          return (
            <li key={key} className="shrink-0">
              <a
                href={href}
                aria-current={on ? "page" : undefined}
                className={`inline-flex rounded-pill px-4 py-2 text-sm font-semibold transition-colors ${on ? "bg-ink text-surface" : "text-ink-muted hover:bg-surface-tint hover:text-ink"}`}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** 4. The closing call to action at the end of every page. */
export function PageEndCta({ campaign, title = "Know where you stand in seven minutes." }: { campaign: string; title?: string }) {
  return (
    <section className={`${WRAP} pb-16 pt-4 md:pb-24`}>
      <div className="reveal flex flex-col gap-6 rounded-panel bg-brand p-8 text-on-brand md:flex-row md:items-center md:justify-between md:p-12">
        <p className="max-w-2xl font-display text-[34px] font-bold leading-[40px] tracking-[-0.015em] md:text-5xl md:leading-[54px]">{title}</p>
        <div className="flex shrink-0 flex-col items-stretch gap-3 sm:flex-row sm:items-center">
          <a href={appLink("/snapshot", campaign)} className="inline-flex justify-center rounded-pill bg-ink px-6 py-3 font-semibold text-surface transition-colors hover:bg-ink/85">
            Start your assessment
          </a>
          <a href="/contact/" className="inline-flex justify-center rounded-pill border-2 border-ink/70 px-6 py-3 font-semibold text-on-brand transition-colors hover:border-ink">
            Talk to Lorenzo
          </a>
        </div>
      </div>
    </section>
  );
}
