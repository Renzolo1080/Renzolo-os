"use client";
import { useState } from "react";

/* The full feature comparison (same rows as the app's lib/tier-features.ts;
   keep them in step). Grouped, opening on the key rows. */
type Tier = "essentials" | "growth" | "elevate";
export type FeatureGroup = "Assessment and report" | "Plan and progress" | "Coaching" | "Capital and investor readiness" | "Support and programmes";
export const FEATURE_GROUPS: FeatureGroup[] = ["Assessment and report", "Plan and progress", "Coaching", "Capital and investor readiness", "Support and programmes"];

export interface TierFeature {
  label: string;
  group: FeatureGroup;
  key?: boolean;
  values: Record<Tier, boolean | string>;
}

export const TIER_FEATURES: TierFeature[] = [
  { group: "Assessment and report", label: "Full Readiness Assessment with AI insights", values: { essentials: true, growth: true, elevate: true } },
  { group: "Assessment and report", key: true, label: "Readiness Report", values: { essentials: "Full, downloadable", growth: "Full, downloadable", elevate: "Full, downloadable" } },
  { group: "Assessment and report", key: true, label: "Valuation range and Market, Customer and Investor readiness scores", values: { essentials: true, growth: true, elevate: true } },
  { group: "Assessment and report", label: "AI market insight for your industry and country", values: { essentials: true, growth: true, elevate: true } },
  { group: "Plan and progress", label: "90+ day growth and readiness plan (up to 36 months)", values: { essentials: true, growth: true, elevate: true } },
  { group: "Plan and progress", label: "Dashboard, goals, reminders and founder tools", values: { essentials: true, growth: true, elevate: true } },
  { group: "Plan and progress", label: "AI plan review and monthly Market Intelligence", values: { essentials: false, growth: true, elevate: true } },
  { group: "Coaching", key: true, label: "One-on-one coaching included", values: { essentials: "1 × 30 min a quarter", growth: "2 × 30 min a quarter", elevate: "1 × 60 min a month" } },
  { group: "Coaching", key: true, label: "Lorenzo · AI: coaching any time and weekly check-ins", values: { essentials: false, growth: true, elevate: true } },
  { group: "Coaching", label: "Advisor review of your report", values: { essentials: false, growth: true, elevate: true } },
  { group: "Coaching", label: "Expert Advisory Sessions (60 min) at member prices", values: { essentials: "$75", growth: "$105", elevate: "$120" } },
  { group: "Capital and investor readiness", label: "Document check (bank statements, financials, registration, tax)", values: { essentials: true, growth: true, elevate: true } },
  { group: "Capital and investor readiness", key: true, label: "Pitch and investor readiness review", values: { essentials: false, growth: false, elevate: true } },
  { group: "Support and programmes", label: "Priority support", values: { essentials: false, growth: false, elevate: true } },
  { group: "Support and programmes", label: "Priority when applying to cohorts (separate fee)", values: { essentials: "Launch", growth: "Launch and Build", elevate: "Launch, Build and Scale" } },
  { group: "Support and programmes", label: "Places", values: { essentials: "Open", growth: "Open", elevate: "Limited" } },
];

const TIERS: [Tier, string][] = [["essentials", "Essentials"], ["growth", "Growth"], ["elevate", "Elevate"]];

function Cell({ v }: { v: boolean | string }) {
  if (v === true) return <span aria-label="Included" className="font-bold text-brand">✓</span>;
  if (v === false) return <span aria-label="Not included" className="text-ink-muted/50">—</span>;
  return <span>{v}</span>;
}

export function CompareTable() {
  const [all, setAll] = useState(false);
  const [pick, setPick] = useState<Tier>("growth");
  const shown = all ? TIER_FEATURES : TIER_FEATURES.filter((f) => f.key);
  const hide = (k: Tier) => (k === pick ? "" : "hidden sm:table-cell");
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[13px] font-bold uppercase tracking-[0.16em] text-brand-text">Compare plans</p>
          <h2 className="mt-1 font-display text-3xl font-bold md:text-4xl">Full feature comparison</h2>
        </div>
        <div className="inline-flex rounded-pill bg-[#F3F5F8] p-1" role="group" aria-label="How much to show">
          {([[false, "Key features"], [true, "All features"]] as const).map(([v, label]) => (
            <button key={label} type="button" aria-pressed={all === v} onClick={() => setAll(v)} className={`rounded-pill px-4 py-2 text-sm font-semibold ${all === v ? "bg-ink text-white" : "text-ink"}`}>
              {label}
            </button>
          ))}
        </div>
      </div>
      <div className="mt-4 flex gap-2 sm:hidden" role="group" aria-label="Plan to show">
        {TIERS.map(([k, n]) => (
          <button key={k} type="button" aria-pressed={pick === k} onClick={() => setPick(k)} className={`flex-1 rounded-pill border px-3 py-2 text-sm font-semibold ${pick === k ? "border-ink bg-ink text-white" : "border-line text-ink"}`}>
            {n}
          </button>
        ))}
      </div>
      <div className="mt-5 overflow-x-auto rounded-[20px] border border-line bg-white">
        <table className="w-full text-left text-[15px] sm:min-w-[640px]">
          <thead>
            <tr className="border-b border-line">
              <th scope="col" className="p-4 font-bold">What&apos;s included</th>
              {TIERS.map(([k, n]) => (
                <th key={k} scope="col" className={`p-4 text-center font-bold ${hide(k)}`}>{n}</th>
              ))}
            </tr>
          </thead>
          {FEATURE_GROUPS.map((g) => {
            const rows = shown.filter((f) => f.group === g);
            if (!rows.length) return null;
            return (
              <tbody key={g}>
                <tr className="bg-[#F3F5F8]">
                  <th scope="rowgroup" colSpan={4} className="px-4 py-2.5 text-xs font-bold uppercase tracking-[0.12em]">{g}</th>
                </tr>
                {rows.map((f) => (
                  <tr key={f.label} className="border-b border-line/60 last:border-0">
                    <th scope="row" className="p-4 font-normal">{f.label}</th>
                    {TIERS.map(([k]) => (
                      <td key={k} className={`p-4 text-center ${hide(k)}`}><Cell v={f.values[k]} /></td>
                    ))}
                  </tr>
                ))}
              </tbody>
            );
          })}
        </table>
      </div>
      {!all && (
        <button type="button" onClick={() => setAll(true)} className="mt-3 text-sm font-bold text-brand-text hover:underline">
          Show all {TIER_FEATURES.length} features →
        </button>
      )}
    </div>
  );
}
