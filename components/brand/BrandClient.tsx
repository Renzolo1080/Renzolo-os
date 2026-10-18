"use client";

/** Interactive RENZOLO Vibrant pieces: header shadow on scroll, the sample
 * Readiness ticker, the 3-question Snapshot taster, the RENZOLO OS scroll
 * story, the pricing toggle and the sticky mobile call to action. All
 * motion respects prefers-reduced-motion (see globals.css). */

import { useEffect, useRef, useState } from "react";

/* ---------- Sticky header shadow ---------- */
export function ScrollShadow() {
  useEffect(() => {
    const h = document.getElementById("site-header");
    if (!h) return;
    const on = () => h.classList.toggle("shadow-soft", window.scrollY > 8);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  return null;
}

/* ---------- ReadinessTicker (sample data) ---------- */
const SERIES: Record<string, number[]> = {
  "1H": [71.9, 72, 72, 72.1, 72.2, 72.2, 72.4],
  "1D": [70.6, 70.6, 71.1, 71.3, 71.8, 72, 72.4],
  "1W": [68.2, 68.9, 69.5, 70.1, 70.4, 70.6, 72.4],
  "1M": [61.5, 63, 64.2, 66.8, 68, 70.6, 72.4],
  "1Y": [44, 49.5, 53, 58.2, 63.4, 68.9, 72.4],
};
const CHANGE: Record<string, string> = {
  "1H": "+0.5 ▲ (+0.7%)",
  "1D": "+1.8 ▲ (+2.5%)",
  "1W": "+4.2 ▲ (+6.2%)",
  "1M": "+10.9 ▲ (+17.7%)",
  "1Y": "+28.4 ▲ (+64.5%)",
};

export function ReadinessTicker({ className = "" }: { className?: string }) {
  const [range, setRange] = useState("1D");
  const p = SERIES[range];
  const mn = Math.min(...p) - 0.5;
  const mx = Math.max(...p) + 0.5;
  const d = p.map((v, i) => `${i ? "L" : "M"}${((i * 300) / (p.length - 1)).toFixed(1)} ${(68 - ((v - mn) / (mx - mn)) * 62).toFixed(1)}`).join("");
  return (
    <section aria-label="Readiness Score, sample data" className={`rounded-panel border border-line bg-surface-raised p-6 shadow-soft ${className}`}>
      <div className="flex items-center justify-between text-[13px] font-semibold text-ink-muted">
        <span className="inline-flex items-center gap-2 text-ink">
          <span aria-hidden="true" className="live-dot h-2 w-2 rounded-pill bg-teal" />
          Live
        </span>
        <span className="rounded-pill bg-surface-tint px-2 py-0.5 text-xs font-bold uppercase tracking-wider text-ink">Sample</span>
      </div>
      <p className="mt-2 text-sm font-semibold text-ink-muted">Readiness Score</p>
      <div className="mt-1 flex items-baseline gap-3">
        <span className="font-mono text-[44px] font-semibold leading-[48px] tracking-tight [font-variant-numeric:tabular-nums]">72.4</span>
        <span className="font-mono text-sm font-medium text-tick-up [font-variant-numeric:tabular-nums]">{CHANGE[range]}</span>
      </div>
      <div role="group" aria-label="Time range" className="mt-4 flex gap-1">
        {Object.keys(SERIES).map((r) => (
          <button
            key={r}
            type="button"
            aria-pressed={r === range}
            onClick={() => setRange(r)}
            className={`rounded-pill border px-3 py-1 font-mono text-xs font-semibold ${r === range ? "border-ink bg-ink text-surface-raised" : "border-line text-ink-muted"}`}
          >
            {r}
          </button>
        ))}
      </div>
      <svg viewBox="0 0 300 72" preserveAspectRatio="none" aria-hidden="true" className="mt-2 block h-[72px] w-full">
        <path d={`${d}L300 72L0 72Z`} className="fill-teal/10" />
        <path d={d} fill="none" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" className="stroke-tick-up" />
      </svg>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {[
          ["Customers", "78.1", "+0.6 ▲", true],
          ["Capital", "69.3", "+2.4 ▲", true],
          ["Investors", "61.0", "−0.4 ▼", false],
        ].map(([lab, val, ch, up]) => (
          <div key={lab as string} className="rounded-lg bg-surface px-3 py-2">
            <p className="text-xs font-medium text-ink-muted">{lab}</p>
            <p className="font-mono text-base font-semibold [font-variant-numeric:tabular-nums]">
              {val} <span className={up ? "text-tick-up" : "text-tick-down"}>{ch}</span>
            </p>
          </div>
        ))}
      </div>
      <div className="mt-4 border-t border-line pt-3">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-brand-text">Today&apos;s movers</p>
        {[
          ["September bank statement added", "+1.2", true],
          ["Pricing task completed", "+0.8", true],
          ["Investor deck overdue", "−0.4", false],
        ].map(([t, v, up]) => (
          <p key={t as string} className="mt-1 flex justify-between gap-3 text-sm">
            <span>{t}</span>
            <span className={`font-mono font-medium ${up ? "text-tick-up" : "text-tick-down"}`}>{v}</span>
          </p>
        ))}
      </div>
      <p className="mt-3 text-xs font-medium text-ink-muted">Sample data · Updated 2 min ago · Sector index 64.8</p>
    </section>
  );
}

/* ---------- Readiness Snapshot taster ---------- */
const TASTER = [
  { q: "What do you want next for your business?", key: "goal", options: [["customers", "More customers"], ["capital", "A loan or grant"], ["investors", "Investors or partners"]] },
  { q: "Where is your business today?", key: "stage", options: [["idea", "Idea or pre-revenue"], ["early", "Early revenue"], ["growing", "Growing steadily"]] },
  { q: "Do you have a written plan?", key: "plan", options: [["current", "Yes, up to date"], ["old", "Yes, but out of date"], ["none", "Not yet"]] },
] as const;

export function SnapshotTaster({ appUrl }: { appUrl: string }) {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const done = step >= TASTER.length;
  const pick = (key: string, val: string) => {
    setAnswers((a) => ({ ...a, [key]: val }));
    setStep((s) => s + 1);
  };
  const params = new URLSearchParams({ ...answers, utm_source: "website", utm_medium: "referral", utm_campaign: "home_taster" });
  const pct = Math.round((Math.min(step, TASTER.length) / TASTER.length) * 100);
  return (
    <div className="rounded-panel border border-line bg-surface-raised p-6 md:p-8">
      <div className="h-2.5 overflow-hidden rounded-pill bg-surface-tint">
        <div className="h-full rounded-pill bg-teal transition-all duration-500" style={{ width: `${pct}%` }} />
      </div>
      <p className="mt-2 text-[13px] font-medium text-ink-muted">{done ? "3 of 3 answered" : `Question ${step + 1} of 3`}</p>
      {!done ? (
        <div key={step} className="pop-in">
          <h3 className="mt-4 font-display text-2xl font-bold">{TASTER[step].q}</h3>
          <div className="mt-5 flex flex-wrap gap-3">
            {TASTER[step].options.map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => pick(TASTER[step].key, val)}
                className="rounded-pill border-2 border-ink bg-surface-raised px-5 py-2.5 font-semibold text-ink hover:bg-surface-tint"
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="pop-in">
          <h3 className="mt-4 font-display text-2xl font-bold">You&apos;re 3 questions in. Your full Snapshot takes about 5 more minutes.</h3>
          <p className="mt-2 text-ink-muted">See your Venture Score, your strongest area, the three areas holding you back and your best next move. Free, no account needed.</p>
          <div className="mt-6 flex flex-wrap items-center gap-4">
            <a href={`${appUrl}/snapshot?${params.toString()}`} className="btn-pop inline-flex items-center rounded-pill border-2 border-ink bg-brand px-6 py-3 font-semibold text-on-brand">
              See your full snapshot
            </a>
            <button type="button" onClick={() => { setStep(0); setAnswers({}); }} className="font-semibold text-teal-text underline underline-offset-4">
              Start again
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- RENZOLO OS scroll story ---------- */
export type OsModule = { title: string; text: string; src: string; alt: string };

export function OsStory({ modules }: { modules: OsModule[] }) {
  const [active, setActive] = useState(0);
  const refs = useRef<(HTMLLIElement | null)[]>([]);
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.isIntersecting && setActive(Number((e.target as HTMLElement).dataset.i))),
      { rootMargin: "-45% 0px -45% 0px" }
    );
    refs.current.forEach((el) => el && io.observe(el));
    return () => io.disconnect();
  }, []);
  return (
    <>
      {/* Desktop: pinned screen, modules scroll past */}
      <div className="hidden gap-12 lg:grid lg:grid-cols-[1.2fr_1fr]">
        <div className="sticky top-28 h-fit">
          <div className="relative overflow-hidden rounded-panel border border-[var(--glass-edge)] shadow-soft">
            {modules.map((m, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={m.src}
                src={m.src}
                alt={i === active ? m.alt : ""}
                aria-hidden={i !== active}
                className={`block w-full transition-opacity duration-300 ${i === 0 ? "relative" : "absolute inset-0"} ${i === active ? "opacity-100" : "opacity-0"}`}
                width={1280}
                height={800}
                loading={i === 0 ? "eager" : "lazy"}
              />
            ))}
          </div>
        </div>
        <ol>
          {modules.map((m, i) => (
            <li key={m.title} data-i={i} ref={(el) => { refs.current[i] = el; }} className="flex min-h-[55vh] flex-col justify-center">
              <p className={`font-mono text-sm ${i === active ? "text-gold" : "text-ink-muted"}`}>0{i + 1}</p>
              <h3 className="mt-2 font-display text-[32px] font-bold leading-[38px]">{m.title}</h3>
              <p className="mt-3 max-w-md text-lg text-ink-muted">{m.text}</p>
            </li>
          ))}
        </ol>
      </div>
      {/* Phones: swipeable carousel */}
      <ul className="-mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto px-4 pb-4 lg:hidden">
        {modules.map((m) => (
          <li key={m.title} className="w-[85%] shrink-0 snap-start">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={m.src} alt={m.alt} className="block w-full rounded-card" width={1280} height={800} loading="lazy" />
            <h3 className="mt-4 font-display text-xl font-bold">{m.title}</h3>
            <p className="mt-1 text-ink-muted">{m.text}</p>
          </li>
        ))}
      </ul>
    </>
  );
}

/* ---------- Pricing with billing toggle ---------- */
type Interval = "monthly" | "quarterly" | "annual";
export type Tier = {
  name: string;
  for: string;
  prices: Partial<Record<Interval, number>>;
  gets: string[];
  popular?: boolean;
};

export function PricingTable({ tiers, appUrl }: { tiers: Tier[]; appUrl: string }) {
  const [iv, setIv] = useState<Interval>("quarterly");
  const label: Record<Interval, string> = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };
  const per: Record<Interval, string> = { monthly: "a month", quarterly: "a quarter", annual: "a year" };
  return (
    <div>
      <div role="group" aria-label="Billing period" className="inline-flex rounded-pill border-2 border-line bg-surface-raised p-1">
        {(Object.keys(label) as Interval[]).map((k) => (
          <button key={k} type="button" aria-pressed={k === iv} onClick={() => setIv(k)} className={`rounded-pill px-4 py-2 text-sm font-semibold ${k === iv ? "bg-ink text-surface-raised" : "text-ink-muted"}`}>
            {label[k]}
          </button>
        ))}
      </div>
      <div className="mt-10 grid gap-6 md:grid-cols-3">
        {tiers.map((t) => {
          const price = t.prices[iv];
          const fallback = !price ? (Object.keys(t.prices) as Interval[])[0] : null;
          const shown = price ?? t.prices[fallback as Interval]!;
          const monthly = t.prices.monthly ? t.prices.monthly * 12 : null;
          const saving = iv === "annual" && t.prices.quarterly ? Math.round(t.prices.quarterly * 4 - shown) : iv === "annual" && monthly ? monthly - shown : 0;
          return (
            <div key={t.name} className="relative flex flex-col rounded-panel border border-line bg-surface-raised p-8">
              {t.popular && <span className="absolute -top-3 left-8 rounded-pill bg-gold px-3 py-1 text-xs font-bold text-on-gold">Most popular</span>}
              <h3 className="font-display text-[32px] font-bold leading-[38px]">{t.name}</h3>
              <p className="mt-1 text-ink-muted">{t.for}</p>
              <p className="mt-6">
                <span className="font-display text-5xl font-bold">${shown.toLocaleString("en-US")}</span>
                <span className="ml-1 text-ink-muted">{per[(price ? iv : fallback) as Interval]}</span>
              </p>
              <p className="mt-1 min-h-[1.25rem] text-[13px] font-medium text-ink-muted">
                {!price ? `Billed ${label[fallback as Interval].toLowerCase()}` : saving > 0 ? `Save $${saving} a year` : "Billed in USD. Cancel anytime."}
              </p>
              <ul className="mt-6 space-y-2">
                {t.gets.map((g) => (
                  <li key={g} className="flex gap-2">
                    <span aria-hidden="true" className="font-bold text-teal-text">✓</span>
                    {g}
                  </li>
                ))}
              </ul>
              <a
                href={`${appUrl}/pricing?tier=${t.name.toLowerCase()}&interval=${price ? iv : fallback}&utm_source=website&utm_medium=referral&utm_campaign=home_pricing`}
                className={`mt-8 inline-flex justify-center rounded-pill px-6 py-3 font-semibold ${t.popular ? "btn-pop border-2 border-ink bg-brand text-on-brand" : "border-[1.5px] border-ink/35 text-ink transition-colors hover:border-ink hover:bg-surface"}`}
              >
                Choose {t.name}
              </a>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ---------- Sticky mobile call to action ---------- */
export function StickyMobileCta({ href, label }: { href: string; label: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting));
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  return (
    <div className={`fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface-raised/95 p-3 backdrop-blur transition-transform md:hidden ${show ? "translate-y-0" : "translate-y-full"}`}>
      <a href={href} className="flex w-full justify-center rounded-pill border-2 border-ink bg-brand px-6 py-3 font-semibold text-on-brand">
        {label}
      </a>
    </div>
  );
}

/* ---------- Fade-up reveals ---------- */
export function RevealOnScroll() {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".reveal"));
    if (!("IntersectionObserver" in window)) {
      els.forEach((e) => e.classList.add("in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) =>
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("in");
            io.unobserve(e.target);
          }
        }),
      { rootMargin: "0px 0px -10% 0px" }
    );
    els.forEach((e, i) => {
      e.style.transitionDelay = `${(i % 4) * 60}ms`;
      io.observe(e);
    });
    return () => io.disconnect();
  }, []);
  return null;
}

/* ---------- Outcome cards that flip (hover on desktop, tap on phones) ---------- */
const OUTCOME_FLIP = [
  {
    key: "customers", num: "01", label: "Customers", title: "Win more customers", text: "Get ready for buyers, tenders and supplier programmes.",
    tile: "bg-brand text-on-brand", back: "bg-brand text-on-brand", backTitle: "Your path to buyer-ready",
    gets: ["Your Customer readiness score", "A plan for the gaps buyers check", "Coaching for your next big contract"],
    icon: <path d="M3 9h18l-1.5 11h-15zM8 9V6a4 4 0 0 1 8 0v3" />,
  },
  {
    key: "capital", num: "02", label: "Capital", title: "Access credit and grants", text: "Get your plan, numbers and records lender-ready.",
    tile: "bg-gold text-on-gold", back: "bg-gold text-on-gold", backTitle: "Lender-ready numbers",
    gets: ["Your Venture and plan readiness scores", "Cash flow, records and plan gaps named", "Market Intelligence for your country"],
    icon: <path d="M3 10l9-6 9 6M5 10v8M9.5 10v8M14.5 10v8M19 10v8M3 21h18" />,
  },
  {
    key: "investors", num: "03", label: "Investors", title: "Attract investment", text: "Show investors and partners a business ready to grow.",
    tile: "bg-teal text-on-teal", back: "bg-teal text-on-teal", backTitle: "Investor-ready story",
    gets: ["Your Investor readiness score", "Valuation range and market insight", "Pitch and investor readiness review"],
    icon: <path d="M3 17l6-6 4 4 8-8M15 7h6v6" />,
  },
];

export function OutcomeFlipCards({ hrefs }: { hrefs: Record<string, string> }) {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {OUTCOME_FLIP.map((o) => (
        <div key={o.key} className="flip h-[300px]">
          <div className="flip-inner" aria-pressed={open === o.key}>
            <button
              type="button"
              onClick={() => setOpen(open === o.key ? null : o.key)}
              aria-label={`${o.label}: see what you get`}
              className="flip-face flex flex-col gap-2 rounded-card border border-line bg-surface-raised p-7 text-left shadow-card"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-card ${o.tile}`}>
                <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{o.icon}</svg>
              </span>
              <span className="mt-2 text-[13px] font-bold uppercase tracking-[0.08em] text-brand-text">{o.label}</span>
              <span className="font-display text-[22px] font-bold leading-7 text-ink">{o.title}</span>
              <span className="text-ink-muted">{o.text}</span>
              <span className="mt-auto text-[13px] font-semibold text-teal-text">Hover or tap to see what you get</span>
            </button>
            <div className={`flip-face flip-back flex flex-col gap-2 rounded-card p-7 ${o.back}`}>
              <span className="text-[13px] font-bold uppercase tracking-[0.08em]">What you get</span>
              <span className="font-display text-[22px] font-bold leading-7">{o.backTitle}</span>
              <ul className="mt-1 space-y-1">
                {o.gets.map((g) => (
                  <li key={g}>✓ {g}</li>
                ))}
              </ul>
              <div className="mt-auto flex items-center justify-between gap-3">
                <a href={hrefs[o.key]} className="font-bold underline underline-offset-4">Start your assessment</a>
                <button type="button" onClick={() => setOpen(null)} className="text-sm font-semibold underline underline-offset-4 md:hidden">Back</button>
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
