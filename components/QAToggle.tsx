"use client";
import { useEffect, useState } from "react";

/** Admin-only control (rendered only for profile.role === "admin" — see
 * app/advisor/page.tsx). Flips app_settings.qa_review_enabled live, no
 * redeploy: on during a pilot/testing phase so every report gets a human
 * look, off once volume makes 100% review infeasible. A Low-confidence
 * report is still queued for review either way (server-side logic in
 * app/api/report/route.ts) — this switch only controls the default for
 * everything else. */
export function QAToggle() {
  const [enabled, setEnabled] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/admin/qa-setting")
      .then((res) => res.json())
      .then((data) => setEnabled(data.qaReviewEnabled))
      .catch(() => setError("Could not load QA setting"));
  }, []);

  async function handleToggle() {
    if (enabled === null) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/admin/qa-setting", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qaReviewEnabled: !enabled }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setEnabled(data.qaReviewEnabled);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded border p-4 mb-8 bg-cream flex items-center justify-between">
      <div>
        <p className="font-semibold text-navy">Mandatory human QA review</p>
        <p className="text-sm text-ink-soft">
          {enabled === null
            ? "Loading…"
            : enabled
            ? "On — every new report is queued for advisor review."
            : "Off — only Low-confidence reports are queued for review."}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
      <button
        onClick={handleToggle}
        disabled={enabled === null || loading}
        className={`rounded px-5 py-2 text-sm font-semibold disabled:opacity-50 ${
          enabled ? "bg-navy text-white" : "bg-teal text-white"
        }`}
      >
        {loading ? "Saving…" : enabled ? "Turn Off" : "Turn On"}
      </button>
    </div>
  );
}
