"use client";

import { useRef, useState } from "react";

/** 1. "Find your path": the founder picks where their business is today and
 * sees the recommended path and the first step. Built from the offers
 * already on the site; no new prices or promises. Motion is limited to the
 * colour change on the chosen stage (and, on a phone, bringing the result
 * into view). */
export type PathStage = {
  key: string;
  label: string;
  who: string;
  first: { name: string; note: string };
  then: { name: string; note: string };
  start: string;
  cta: { label: string; href: string };
};

export function PathChooser({ stages, fallbackHref }: { stages: PathStage[]; fallbackHref: string }) {
  const [on, setOn] = useState(stages[0].key);
  const panel = useRef<HTMLDivElement>(null);
  // On a phone the result sits below the choices: bring it into view.
  const choose = (key: string) => {
    setOn(key);
    if (window.matchMedia("(max-width: 1023px)").matches && panel.current) {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      panel.current.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "nearest" });
    }
  };
  const s = stages.find((x) => x.key === on) ?? stages[0];
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.35fr]">
      <div role="radiogroup" aria-label="Where is your business today?" className="grid gap-3">
        {stages.map((x, i) => {
          const sel = x.key === on;
          return (
            <button
              key={x.key}
              type="button"
              role="radio"
              aria-checked={sel}
              onClick={() => choose(x.key)}
              className={`flex items-center gap-4 rounded-card border-2 p-4 text-left transition-colors duration-200 ${sel ? "border-ink bg-ink text-surface" : "border-line bg-surface-raised text-ink hover:border-ink/40"}`}
            >
              <span className={`inline-grid h-9 w-9 shrink-0 place-items-center rounded-pill font-display text-sm font-extrabold ${sel ? "bg-brand text-on-brand" : "bg-surface-tint text-ink"}`}>{i + 1}</span>
              <span>
                <span className="block font-semibold">{x.label}</span>
                <span className={`block text-sm ${sel ? "text-surface/75" : "text-ink-muted"}`}>{x.who}</span>
              </span>
            </button>
          );
        })}
      </div>

      <div ref={panel} aria-live="polite" className="rounded-panel border border-line bg-surface-raised p-6 md:p-8">
        <p className="text-xs font-semibold uppercase tracking-[0.16em] text-brand-text">Recommended path</p>
        <ol className="mt-4 grid gap-3 sm:grid-cols-2">
          <li className="rounded-card bg-surface-tint p-5">
            <span className="font-mono text-xs font-medium text-ink-muted">First</span>
            <span className="mt-1 block font-display text-2xl font-bold leading-7">{s.first.name}</span>
            <span className="mt-2 block text-sm text-ink-muted">{s.first.note}</span>
          </li>
          <li className="rounded-card border border-line p-5">
            <span className="font-mono text-xs font-medium text-ink-muted">Then</span>
            <span className="mt-1 block font-display text-2xl font-bold leading-7">{s.then.name}</span>
            <span className="mt-2 block text-sm text-ink-muted">{s.then.note}</span>
          </li>
        </ol>
        <p className="mt-5 text-sm text-ink-muted">
          <span className="font-semibold text-brand-text">How to start: </span>
          {s.start}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a href={s.cta.href} className="btn-pop inline-flex justify-center rounded-pill border-2 border-ink bg-brand px-6 py-3 font-semibold text-on-brand">
            {s.cta.label}
          </a>
          {!s.cta.href.includes("/snapshot") && (
            <a href={fallbackHref} className="text-sm font-semibold text-teal-text underline-offset-4 hover:underline">
              Not sure? Take the free Snapshot →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
