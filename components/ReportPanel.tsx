"use client";
import { useState } from "react";

interface Props {
  assessmentId: string;
  scoreId: string;
}

/** Requests the AI Diagnostic Report and shows it immediately — this is
 * an instant response, not something the founder waits on. Advisor
 * review happens afterward, in the background, as quality assurance; it
 * does not gate delivery (see app/api/report/route.ts). Once a report
 * exists, offers the paid 1:1 Advisor Session as an optional upsell. */
export function ReportPanel({ assessmentId, scoreId }: Props) {
  const [loading, setLoading] = useState(false);
  const [report, setReport] = useState<{ id: string; diagnostic_markdown: string } | null>(null);
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
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      // In production this redirects to the Flutterwave-hosted checkout
      // page using data.payload; left as a next step to wire up once a
      // live Flutterwave account exists.
      alert("Checkout started — you'll be redirected to complete payment.");
    } catch (e: any) {
      setError(e.message);
    } finally {
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
          {bookingLoading ? "Starting checkout…" : "Book a 1:1 Advisor Session"}
        </button>
      </div>
    </div>
  );
}
