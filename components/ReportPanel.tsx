"use client";
import { useState } from "react";
import { ReportMarkdown } from "./ReportMarkdown";

interface Report {
  id: string;
  diagnostic_markdown: string;
  level?: string | null;
}

interface Props {
  assessmentId: string;
  scoreId: string;
  /** A report already generated for this score, shown straight away. */
  initialReport?: Report | null;
  /** The founder is now entitled to the full report (e.g. after upgrading
   * from Essentials), so a summary report can be replaced by a full one. */
  canUpgradeToFull?: boolean;
  /** Why the report shown is out of date (newer score, plan or plan review), if it is. */
  outdatedReason?: string | null;
}

/** Requests the AI Readiness Report and shows it immediately. Advisor
 * review, where it applies, happens afterwards in the background and
 * never gates delivery (see app/api/report/route.ts). */
export function ReportPanel({ assessmentId, scoreId, initialReport = null, canUpgradeToFull = false, outdatedReason = null }: Props) {
  const [outdated, setOutdated] = useState<string | null>(outdatedReason);
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(initialReport);
  const [error, setError] = useState<string | null>(null);

  async function generate(refresh = false) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, scoreId, refresh }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setReport(data.report);
      setOutdated(null);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  if (!report) {
    return (
      <div className="rounded-2xl border border-gold bg-white p-6">
        <p className="font-semibold text-navy">Your Readiness Report is ready to create</p>
        <p className="mt-1 text-sm text-ink-soft">It takes a minute or two: we research your market and write your growth and readiness plan.</p>
        <button onClick={() => generate()} disabled={loading} className="mt-4 rounded-lg bg-gold px-5 py-3 font-semibold text-white disabled:opacity-50">
          {loading ? "Creating your report…" : "Create my Readiness Report"}
        </button>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  const summary = report.level === "summary";
  return (
    <div className="space-y-4">
      {outdated && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-teal/50 bg-white p-4 text-sm">
          <span>
            <span className="font-semibold text-navy">{outdated}</span> Update your report to include it.
          </span>
          <button onClick={() => generate(true)} disabled={loading} className="rounded-lg bg-navy px-4 py-2 font-semibold text-white disabled:opacity-50">
            {loading ? "Updating your report… (1-2 minutes)" : "Update my report"}
          </button>
          {error && <p className="w-full text-sm text-red-600">{error}</p>}
        </div>
      )}
      <div className="rounded-2xl border bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
          <p className="font-semibold text-navy">{summary ? "Your Readiness Report (summary)" : "Your Readiness Report"}</p>
          {!summary && (
            <a href={`/report/${report.id}`} target="_blank" rel="noopener" className="rounded-lg border border-navy px-3 py-1.5 text-sm font-semibold text-navy">
              Download / print
            </a>
          )}
        </div>
        <ReportMarkdown markdown={report.diagnostic_markdown} />
      </div>

      {summary && (
        <div className="rounded-2xl bg-navy p-6 text-white">
          {canUpgradeToFull ? (
            <>
              <p className="font-semibold">Your membership now includes the full report</p>
              <p className="mt-1 text-sm text-cream/80">Create it to add your market insight, growth scenarios and a downloadable copy.</p>
              <button onClick={() => generate(true)} disabled={loading} className="mt-4 rounded-lg bg-gold px-5 py-3 font-semibold text-white disabled:opacity-50">
                {loading ? "Creating your full report…" : "Create my full report"}
              </button>
              {error && <p className="mt-2 text-sm text-red-300">{error}</p>}
            </>
          ) : (
            <>
              <p className="font-semibold">Want the full picture?</p>
              <p className="mt-1 text-sm text-cream/80">
                Growth adds the full, downloadable report with an AI market insight, your valuation range, readiness scores and 2 coaching sessions
                a quarter.
              </p>
              <a href="/dashboard/subscribe" className="mt-4 inline-block rounded-lg bg-gold px-5 py-3 font-semibold text-white">
                See Growth
              </a>
            </>
          )}
        </div>
      )}

      <div className="rounded-2xl border p-6">
        <p className="mb-1 font-semibold text-navy">Want to go deeper?</p>
        <p className="mb-3 text-sm text-ink-soft">Book a one-on-one coaching session to walk through this report and build out your plan together.</p>
        <a href="/dashboard/subscribe#one-time" className="inline-block rounded-lg bg-navy px-5 py-3 font-semibold text-white">
          Coaching sessions
        </a>
      </div>
    </div>
  );
}
