"use client";
import { useState } from "react";
import { DOC_TYPES, MAX_BYTES, documentChecklist, lenderChecks, type DocType, type Extraction } from "@/lib/doc-intake";

export interface DocRow {
  id: string;
  doc_type: string;
  file_name: string;
  result: Extraction;
  created_at: string;
}

const FIGURE_LABELS: Record<keyof Extraction["figures"], string> = {
  totalInflows: "Money in",
  totalOutflows: "Money out",
  openingBalance: "Opening balance",
  closingBalance: "Closing balance",
  averageMonthlyInflow: "Average money in a month",
  revenue: "Revenue",
  expenses: "Expenses",
  netProfit: "Net profit",
  totalAssets: "Total assets",
  totalLiabilities: "Total liabilities",
};
const DOT = { ok: "bg-teal", warn: "bg-gold", fix: "bg-red-600", missing: "bg-gray-300" } as const;

/** Upload a financial or compliance document; see the figures a lender
 * looks at and what to fix. Only the figures are kept (lib/doc-intake.ts). */
export function DocumentIntake({ initial, today }: { initial: DocRow[]; today: string }) {
  const [rows, setRows] = useState<DocRow[]>(initial);
  const [docType, setDocType] = useState<DocType>("bank_statement");
  const [file, setFile] = useState<File | null>(null);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const checklist = documentChecklist(rows, today);

  async function upload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return setError("Choose a file to upload.");
    if (file.size > MAX_BYTES) return setError("That file is over 8 MB. Upload a smaller copy, or split a long statement.");
    setBusy(true);
    setError(null);
    const body = new FormData();
    body.append("file", file);
    body.append("docType", docType);
    body.append("consent", consent ? "yes" : "no");
    try {
      const res = await fetch("/api/documents", { method: "POST", body });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Something went wrong.");
      setRows((r) => [json.row as DocRow, ...r]);
      setFile(null);
      const input = document.getElementById("doc-file") as HTMLInputElement | null;
      if (input) input.value = "";
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }

  async function remove(id: string) {
    const res = await fetch(`/api/documents?id=${id}`, { method: "DELETE" });
    if (res.ok) setRows((r) => r.filter((x) => x.id !== id));
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Your lender document checklist</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {checklist.map((c) => (
            <li key={c.key} className="flex items-start gap-3 rounded-xl border border-gray-200 p-3">
              <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[c.status]}`} aria-hidden="true" />
              <span>
                <span className="block font-semibold text-navy">{c.label}</span>
                <span className="block text-sm text-ink-soft">{c.note}</span>
              </span>
            </li>
          ))}
        </ul>
      </section>

      <form onSubmit={upload} className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Check a document</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">What is it?</span>
            <select value={docType} onChange={(e) => setDocType(e.target.value as DocType)} className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2">
              {DOC_TYPES.map((d) => (
                <option key={d.key} value={d.key}>
                  {d.label}
                </option>
              ))}
            </select>
            <span className="mt-1 block text-xs text-ink-soft">{DOC_TYPES.find((d) => d.key === docType)!.hint}</span>
          </label>
          <label className="block text-sm">
            <span className="font-medium">File (PDF, JPG or PNG, up to 8 MB)</span>
            <input id="doc-file" type="file" accept="application/pdf,image/jpeg,image/png,image/webp" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="mt-1 block w-full text-sm" />
          </label>
        </div>
        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
          <span>
            I'm happy for RENZOLO's AI to read this document once. RENZOLO keeps only the figures and checks shown below, never the file, account numbers or
            transactions, and I can delete them at any time. <a href="/privacy" className="underline">Privacy</a>
          </span>
        </label>
        {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
        <button type="submit" disabled={busy || !consent || !file} className="rounded-pill bg-brand px-5 py-2.5 font-semibold text-on-brand disabled:opacity-50">
          {busy ? "Reading your document…" : "Check this document"}
        </button>
      </form>

      {rows.map((r) => {
        const checks = lenderChecks(r.result, today);
        const figs = Object.entries(r.result.figures).filter(([, v]) => v !== null) as [keyof Extraction["figures"], number][];
        const label = DOC_TYPES.find((d) => d.key === r.doc_type)?.label ?? r.doc_type;
        return (
          <article key={r.id} className="rounded-2xl bg-white p-5 shadow-sm">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h3 className="font-semibold text-navy">{label}</h3>
              <span className="text-xs text-ink-soft">
                {r.file_name} · checked {r.created_at.slice(0, 10)}
              </span>
            </div>
            <p className="mt-1 text-sm text-ink-soft">
              {[r.result.businessName, r.result.periodStart && r.result.periodEnd ? `${r.result.periodStart} to ${r.result.periodEnd}` : null, r.result.currency].filter(Boolean).join(" · ")}
            </p>
            {figs.length > 0 && (
              <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
                {figs.map(([k, v]) => (
                  <div key={k} className="rounded-lg bg-cream p-3">
                    <dt className="text-xs text-ink-soft">{FIGURE_LABELS[k]}</dt>
                    <dd className="font-semibold text-navy">{v.toLocaleString()}</dd>
                  </div>
                ))}
              </dl>
            )}
            <ul className="mt-3 space-y-1 text-sm">
              {checks.map((c) => (
                <li key={c.text} className="flex items-start gap-2">
                  <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${DOT[c.level]}`} aria-hidden="true" />
                  <span>{c.text}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => remove(r.id)} className="mt-3 text-sm text-red-700 underline">
              Delete these results
            </button>
          </article>
        );
      })}
    </div>
  );
}
