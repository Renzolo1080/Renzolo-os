"use client";
import { useState } from "react";
import { TierCheck } from "./TierCheck";
import { track } from "@/lib/track";
import type { Tier, BillingInterval } from "@/lib/pricing";

export interface Quote {
  kind: "new" | "renewal" | "upgrade" | "downgrade";
  charge: string;
  credit: string | null;
  extraDays: number;
  startsAt: string;
}

export interface PlanCell {
  interval: BillingInterval;
  intervalName: string;
  price: string;
  per: string;
  perMonth: string | null;
  note: string | null;
  /** Member mode: what choosing this costs and when it starts. Null in public mode. */
  quote: Quote | null;
  /** Member mode: why this can't be chosen right now. */
  blocked: string | null;
  autoRenewAvailable: boolean;
}

export interface CurrencyBlock {
  currency: string;
  methods: string;
  tiers: Record<Tier, PlanCell[]>;
}

const TIER_ORDER: Tier[] = ["essentials", "growth", "elevate"];
const NAMES: Record<Tier, string> = { essentials: "Essentials", growth: "Growth", elevate: "Elevate" };

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
}

/** Tier cards with a billing-period choice, then the full comparison
 * table. In "public" mode buttons lead to sign-up; in "member" mode they
 * start a checkout for the exact amount the server worked out. */
export function MembershipPlans({
  mode,
  blocks,
  currentTier,
  elevateFull,
  onWaitlist,
  features,
  taglines,
  signupHref = "/register",
}: {
  mode: "public" | "member";
  blocks: CurrencyBlock[];
  currentTier: Tier | null;
  elevateFull: boolean;
  onWaitlist: boolean;
  features: { label: string; values: Record<Tier, boolean | string> }[];
  taglines: Record<Tier, string>;
  signupHref?: string;
}) {
  const [currency, setCurrency] = useState(blocks[0]?.currency ?? "USD");
  const block = blocks.find((b) => b.currency === currency) ?? blocks[0];
  const [chosen, setChosen] = useState<Record<Tier, BillingInterval>>({
    essentials: block?.tiers.essentials[0]?.interval ?? "monthly",
    growth: "quarterly",
    elevate: "quarterly",
  });
  const [autoRenew, setAutoRenew] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitlisted, setWaitlisted] = useState(onWaitlist);
  if (!block) return null;

  async function checkout(tier: Tier, cell: PlanCell) {
    setBusy(tier);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "membership", tier, interval: cell.interval, currency: block.currency, autoRenew: cell.autoRenewAvailable && autoRenew }),
      });
      const data = await res.json().catch(() => ({}));
      if (data.waitlist) setError(data.error);
      if (!res.ok || !data.link) throw new Error(data.error ?? "Something went wrong starting your payment.");
      track("begin_checkout", { item: `membership_${tier}_${cell.interval}` });
      window.location.assign(data.link);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong starting your payment.");
      setBusy(null);
    }
  }

  async function joinWaitlist() {
    setBusy("waitlist");
    setError(null);
    const res = await fetch("/api/membership/waitlist", { method: "POST" });
    setBusy(null);
    if (res.ok) setWaitlisted(true);
    else setError("Could not add you to the waitlist. Please try again.");
  }

  function actionLabel(tier: Tier, cell: PlanCell): string {
    const q = cell.quote;
    if (!q) return `Choose ${NAMES[tier]}`;
    if (q.kind === "upgrade") return `Upgrade: ${q.charge} today`;
    if (q.kind === "downgrade") return `Switch to ${NAMES[tier]} at renewal`;
    if (q.kind === "renewal") return `Renew ${NAMES[tier]} · ${q.charge}`;
    return `Choose ${NAMES[tier]} · ${q.charge}`;
  }

  return (
    <div>
      {blocks.length > 1 && (
        <div className="mb-6 flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-navy">Pay in</span>
          {blocks.map((b) => (
            <button
              key={b.currency}
              type="button"
              aria-pressed={b.currency === block.currency}
              onClick={() => setCurrency(b.currency)}
              className={`rounded-lg border px-4 py-2 text-sm ${b.currency === block.currency ? "border-navy bg-navy text-white" : "border-navy text-navy"}`}
            >
              {b.currency}
            </button>
          ))}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {TIER_ORDER.map((tier) => {
          const cells = block.tiers[tier];
          const cell = cells.find((c) => c.interval === chosen[tier]) ?? cells[0];
          const isCurrent = currentTier === tier;
          const featured = tier === "growth";
          const full = tier === "elevate" && elevateFull && currentTier !== "elevate";
          return (
            <div
              key={tier}
              className={`relative flex flex-col rounded-2xl p-6 shadow-sm ${featured ? "bg-navy text-white ring-2 ring-gold" : "bg-white"}`}
            >
              {featured && <span className="absolute -top-3 left-6 rounded-full bg-brand px-3 py-1 text-xs font-semibold text-on-brand">Most popular</span>}
              <div className="flex items-center justify-between">
                <p className={`text-xl font-bold ${featured ? "text-white" : "text-navy"}`}>{NAMES[tier]}</p>
                {isCurrent && <span className="rounded-full bg-teal px-3 py-1 text-xs font-semibold text-white">Your plan</span>}
              </div>
              <p className={`mt-1 text-sm ${featured ? "text-cream/80" : "text-ink-soft"}`}>{taglines[tier]}</p>

              {cells.length > 1 && (
                <div className={`mt-4 inline-flex rounded-lg p-1 ${featured ? "bg-navy-panel" : "bg-cream"}`} role="group" aria-label={`${NAMES[tier]} billing period`}>
                  {cells.map((c) => (
                    <button
                      key={c.interval}
                      type="button"
                      aria-pressed={c.interval === cell.interval}
                      onClick={() => setChosen((s) => ({ ...s, [tier]: c.interval }))}
                      className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                        c.interval === cell.interval ? "bg-brand text-on-brand" : featured ? "text-cream" : "text-navy"
                      }`}
                    >
                      {c.intervalName}
                    </button>
                  ))}
                </div>
              )}

              <p className="mt-4">
                <span className={`text-4xl font-bold ${featured ? "text-white" : "text-navy"}`}>{cell.perMonth ?? cell.price}</span>
                <span className={featured ? "text-cream/70" : "text-ink-soft"}>{cell.perMonth ? " /month" : ` ${cell.per}`}</span>
              </p>
              <p className={`text-sm ${featured ? "text-cream/70" : "text-ink-soft"}`}>{cell.perMonth ? `${cell.price} ${cell.per}` : " "}</p>
              <p className={`mt-1 min-h-[1.25rem] text-sm font-semibold ${featured ? "text-gold" : "text-brand-text"}`}>{cell.note ?? ""}</p>

              {cell.quote && cell.quote.kind === "upgrade" && cell.quote.credit && (
                <p className={`mt-2 text-xs ${featured ? "text-cream/80" : "text-ink-soft"}`}>
                  Includes {cell.quote.credit} credit for unused time on your current plan
                  {cell.quote.extraDays > 0 ? `, plus ${Math.floor(cell.quote.extraDays)} extra days` : ""}. Starts today.
                </p>
              )}
              {cell.quote && cell.quote.kind === "downgrade" && (
                <p className={`mt-2 text-xs ${featured ? "text-cream/80" : "text-ink-soft"}`}>
                  You keep your current plan until {formatDate(cell.quote.startsAt)}, then {NAMES[tier]} starts.
                </p>
              )}
              {cell.quote && cell.quote.kind === "renewal" && (
                <p className={`mt-2 text-xs ${featured ? "text-cream/80" : "text-ink-soft"}`}>Added on after {formatDate(cell.quote.startsAt)}, so no time is lost.</p>
              )}

              <div className="mt-auto pt-5">
                {mode === "public" ? (
                  <a href={signupHref} className={`block rounded-lg px-5 py-3 text-center font-semibold ${featured ? "bg-brand text-on-brand" : "bg-navy text-on-brand"}`}>
                    Get started
                  </a>
                ) : full ? (
                  waitlisted ? (
                    <p className="rounded-lg border border-gold px-4 py-3 text-center text-sm">You're on the Elevate waitlist. We'll be in touch when a seat opens.</p>
                  ) : (
                    <button type="button" onClick={joinWaitlist} disabled={busy !== null} className="w-full rounded-lg border border-brand-text px-5 py-3 font-semibold text-brand-text disabled:opacity-50">
                      {busy === "waitlist" ? "Adding you…" : "Elevate is full: join the waitlist"}
                    </button>
                  )
                ) : cell.blocked ? (
                  <p className={`text-xs ${featured ? "text-cream/80" : "text-ink-soft"}`}>{cell.blocked}</p>
                ) : (
                  <button
                    type="button"
                    onClick={() => checkout(tier, cell)}
                    disabled={busy !== null}
                    className={`w-full rounded-lg px-5 py-3 font-semibold disabled:opacity-50 ${featured ? "bg-brand text-on-brand" : "bg-navy text-on-brand"}`}
                  >
                    {busy === tier ? "Taking you to payment…" : actionLabel(tier, cell)}
                  </button>
                )}
                {mode === "member" && cell.autoRenewAvailable && cell.quote && (cell.quote.kind === "new" || cell.quote.kind === "renewal") && (
                  <label className={`mt-3 flex items-start gap-2 text-xs ${featured ? "text-cream/80" : "text-ink-soft"}`}>
                    <input type="checkbox" className="mt-0.5" checked={autoRenew} onChange={(e) => setAutoRenew(e.target.checked)} />
                    <span>Renew automatically by card</span>
                  </label>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {error && (
        <p role="alert" className="mt-4 text-sm text-red-600">
          {error}
        </p>
      )}
      <p className="mt-3 text-sm text-ink-soft">{block.methods}</p>

      <div className="mt-10 overflow-x-auto rounded-2xl bg-white shadow-sm">
        <table className="w-full min-w-[640px] text-left text-sm">
          <caption className="sr-only">What each membership includes</caption>
          <thead>
            <tr className="border-b border-gray-200">
              <th scope="col" className="p-4 font-semibold text-navy">
                What's included
              </th>
              {TIER_ORDER.map((t) => (
                <th key={t} scope="col" className="p-4 text-center font-semibold text-navy">
                  {NAMES[t]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {features.map((f) => (
              <tr key={f.label} className="border-b border-gray-100 last:border-0">
                <th scope="row" className="p-4 font-normal">
                  {f.label}
                </th>
                {TIER_ORDER.map((t) => (
                  <td key={t} className="p-4 text-center">
                    <TierCheck value={f.values[t]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
