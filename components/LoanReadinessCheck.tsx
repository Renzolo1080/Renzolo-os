"use client";
import { useMemo, useState } from "react";
import { loanCheck } from "@/lib/free-tools";

/** Public loan readiness check (lib/free-tools.ts). Runs in the browser;
 * nothing is sent or saved. */
export function LoanReadinessCheck({ snapshotHref }: { snapshotHref: string }) {
  const [v, setV] = useState({ monthlyRevenue: "", monthlyCosts: "", loanAmount: "", termMonths: "24", annualRatePct: "18", monthsTrading: "" });
  const [docs, setDocs] = useState({ bankStatements6m: false, registered: false, taxUpToDate: false });
  const n = (s: string) => Number(s.replace(/,/g, "")) || 0;
  const ready = n(v.monthlyRevenue) > 0 && n(v.loanAmount) > 0 && v.monthsTrading !== "";
  const r = useMemo(
    () =>
      loanCheck({
        monthlyRevenue: n(v.monthlyRevenue),
        monthlyCosts: n(v.monthlyCosts),
        loanAmount: n(v.loanAmount),
        termMonths: n(v.termMonths),
        annualRatePct: n(v.annualRatePct),
        monthsTrading: n(v.monthsTrading),
        ...docs,
      }),
    [v, docs]
  );
  const field = (key: keyof typeof v, label: string, hint?: string) => (
    <label className="block text-sm">
      <span className="font-medium text-navy">{label}</span>
      {hint && <span className="block text-xs text-ink-soft">{hint}</span>}
      <input inputMode="decimal" value={v[key]} onChange={(e) => setV({ ...v, [key]: e.target.value })} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" />
    </label>
  );
  const tick = (key: keyof typeof docs, label: string) => (
    <label className="flex items-start gap-2 text-sm">
      <input type="checkbox" className="mt-1" checked={docs[key]} onChange={(e) => setDocs({ ...docs, [key]: e.target.checked })} />
      <span>{label}</span>
    </label>
  );
  const tone = r.band === "Ready to apply" ? "bg-teal text-white" : r.band === "Nearly ready" ? "bg-gold/25 text-navy" : "bg-red-100 text-red-800";
  return (
    <div className="grid gap-6 lg:grid-cols-[1.1fr_1fr]">
      <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
        <p className="text-xs text-ink-soft">Use your own currency throughout. Nothing you type here is sent or saved.</p>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("monthlyRevenue", "Average monthly sales", "Last 6 months")}
          {field("monthlyCosts", "Monthly running costs", "Include repayments on existing loans")}
          {field("loanAmount", "Loan you want")}
          {field("termMonths", "Repay over (months)")}
          {field("annualRatePct", "Interest rate (% a year)", "An estimate is fine")}
          {field("monthsTrading", "Months trading")}
        </div>
        <div className="space-y-2 pt-1">
          {tick("bankStatements6m", "I have 6+ months of business bank statements")}
          {tick("registered", "The business is registered")}
          {tick("taxUpToDate", "Our tax filings are up to date")}
        </div>
      </div>
      <div className="rounded-2xl bg-navy p-6 text-white" aria-live="polite">
        {!ready ? (
          <p className="text-cream/80">Fill in your sales, the loan you want and how long you've traded to see your result.</p>
        ) : (
          <>
            <p className="text-sm text-cream/70">Loan readiness</p>
            <p className="mt-1 text-5xl font-bold">
              {r.score}
              <span className="text-lg font-normal text-cream/70"> / 100</span>
            </p>
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-sm font-semibold ${tone}`}>{r.band}</span>
            <dl className="mt-5 grid grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-cream/70">Estimated repayment</dt>
                <dd className="text-lg font-semibold">{r.monthlyRepayment.toLocaleString(undefined, { maximumFractionDigits: 0 })} / month</dd>
              </div>
              <div>
                <dt className="text-cream/70">Repayment cover</dt>
                <dd className="text-lg font-semibold">{r.coverage === null ? "—" : `${r.coverage}×`}</dd>
              </div>
            </dl>
            {r.fixes.length > 0 && (
              <>
                <p className="mt-5 text-sm font-semibold">Fix these first</p>
                <ol className="mt-2 list-decimal space-y-2 pl-5 text-sm text-cream/90">
                  {r.fixes.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ol>
              </>
            )}
            <div className="mt-6 rounded-xl bg-white/10 p-4">
              <p className="text-sm">A loan is only one way to fund growth. See your full picture across customers, capital and investment.</p>
              <a href={snapshotHref} className="mt-3 inline-block rounded-pill bg-brand px-5 py-2.5 font-semibold text-on-brand">
                Start the free Snapshot
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
