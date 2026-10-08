"use client";
import { useState } from "react";

interface Report {
  id: string;
  diagnostic_markdown: string;
}

interface Props {
  assessmentId: string;
  scoreId: string;
  /** A report already generated for this score, if there is one — shown
   * immediately so returning to the dashboard (including coming back
   * from paying for an advisor session) never loses it. */
  initialReport?: Report | null;
}

/** Requests the AI Diagnostic Report and shows it immediately — this is
 * an instant response, not something the founder waits on. Advisor
 * review happens afterward, in the background, as quality assurance; it
 * does not gate delivery (see app/api/report/route.ts). Once a report
 * exists, offers the paid 1:1 Advisor Session as an optional upsell. */
export function ReportPanel({ assessmentId, scoreId, initialReport = null }: Props) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<Report | null>(initialReport);
  const [error, setError] = useState<string | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);

  async function handleGetReport() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, scoreId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setReport(data.report);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleBookSession() {
    if (!report) return;
    setBookingLoading(true);
    try {
      const res = await fetch("/api/advisor-session/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId: report.id }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.link) throw new Error(data.error ?? "Something went wrong starting your payment.");
      // Hand off to Flutterwave's hosted payment page. The button stays in
      // its loading state while the browser navigates away.
      window.location.assign(data.link);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong starting your payment.");
      setBookingLoading(false);
    }
  }

  if (!report) {
    return (
      <div>
        <button
          onClick={handleGetReport}
          disabled={loading}
          className="rounded bg-gold px-5 py-3 text-white font-semibold disabled:opacity-50"
        >
          {loading ? "Generating your report…" : "Get My Full Diagnostic Report"}
        </button>
        {error && <p className="mt-2 text-red-600 text-sm">{error}</p>}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-4 bg-cream">
        <pre className="whitespace-pre-wrap text-sm">{report.diagnostic_markdown}</pre>
      </div>
      <div className="rounded border p-6">
        <p className="font-semibold mb-1">Want to go deeper?</p>
        <p className="text-sm text-ink-soft mb-3">
          Book a paid 1:1 session with an advisor to walk through this report and build out your plan together.
        </p>
        <button
          onClick={handleBookSession}
          disabled={bookingLoading}
          className="rounded bg-navy px-5 py-3 text-white font-semibold disabled:opacity-50"
        >
          {bookingLoading ? "Taking you to payment…" : "Book a 1:1 Advisor Session"}
        </button>
        {error && (
          <p role="alert" className="mt-2 text-red-600 text-sm">
            {error}
          </p>
        )}
      </div>
    </div>
  );
}
