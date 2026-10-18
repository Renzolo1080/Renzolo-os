"use client";
import { useState } from "react";
import { REVIEW_CRITERIA, type PlanReview } from "@/lib/plan-review";

export interface SavedReview {
  review: PlanReview;
  createdAt: string;
  /** The plan's saved time when it was reviewed. */
  planUpdatedAt: string;
}

const tone = (n: number) => (n >= 75 ? "bg-teal" : n >= 50 ? "bg-gold" : "bg-red-500");

/** The AI plan review: run it, and show the latest result. */
export function PlanReviewPanel({
  canReview,
  ready,
  initialReview,
  beforeReview,
  planSavedAt,
}: {
  canReview: boolean;
  ready: { ready: boolean; missing: string[] };
  initialReview: SavedReview | null;
  /** Saves unsaved changes first; false stops the review. */
  beforeReview: () => Promise<boolean>;
  planSavedAt: string | null;
}) {
  const [saved, setSaved] = useState<SavedReview | null>(initialReview);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setBusy(true);
    setError(null);
    try {
      if (!(await beforeReview())) throw new Error("Save your plan first.");
      const res = await fetch("/api/plan/review", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setSaved({ review: data.review, createdAt: data.createdAt, planUpdatedAt: data.createdAt });
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  if (!canReview) {
    return (
      <div className="rounded-2xl bg-navy p-6 text-white">
        <p className="text-lg font-semibold">AI plan review</p>
        <p className="mt-1 text-sm text-cream/80">
          Get your plan scored on whether it's up to date, fixes your weakest areas, has measurable goals, is doable, is funded and covers the whole business, with
          specific fixes. Included with Growth, Elevate and the one-time Readiness Assessment.
        </p>
        <a href="/dashboard/subscribe" className="mt-4 inline-block rounded-lg bg-brand px-5 py-3 font-semibold text-on-brand">
          See Growth
        </a>
      </div>
    );
  }

  const r = saved?.review;
  const changed = saved && planSavedAt && new Date(planSavedAt).getTime() > new Date(saved.planUpdatedAt).getTime() + 1000;
  return (
    <div className="space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-navy">AI plan review</h2>
          <p className="mt-1 text-sm text-ink-soft">Judged against your latest assessment. Takes about a minute.</p>
        </div>
        <button type="button" onClick={run} disabled={busy || !ready.ready} className="rounded-lg bg-brand px-5 py-3 font-semibold text-on-brand disabled:opacity-50">
          {busy ? "Reviewing your plan…" : r ? "Review my plan again" : "Review my plan"}
        </button>
      </div>
      {!ready.ready && <p className="rounded-lg bg-cream p-3 text-sm">Before the review, add: {ready.missing.join("; ")}.</p>}
      {changed && <p className="text-sm text-teal">You've changed your plan since this review.</p>}
      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
      {r && (
        <div className="space-y-5">
          <div className="flex items-center gap-4 rounded-xl bg-navy p-4 text-white">
            <p className="text-4xl font-bold">{r.overall}</p>
            <p className="text-sm text-cream/90">{r.verdict}</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {r.criteria.map((c) => {
              const def = REVIEW_CRITERIA.find((x) => x.key === c.key)!;
              return (
                <div key={c.key} className="rounded-lg border border-gray-200 p-3">
                  <div className="flex justify-between text-sm font-semibold text-navy">
                    <span>{def.label}</span>
                    <span>{c.score}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded bg-gray-100">
                    <div className={`h-1.5 ${tone(c.score)}`} style={{ width: `${c.score}%` }} />
                  </div>
                  <p className="mt-2 text-xs text-ink-soft">{c.comment}</p>
                </div>
              );
            })}
          </div>
          {r.fixes.length > 0 && (
            <div>
              <p className="font-semibold text-navy">Fix these first</p>
              <ol className="mt-2 space-y-2">
                {r.fixes.map((f, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{i + 1}</span>
                    <span>
                      <span className="font-semibold">{f.area}: </span>
                      {f.issue} <span className="text-teal">→ {f.fix}</span>
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          )}
          {r.strengths.length > 0 && (
            <div>
              <p className="font-semibold text-navy">What's working</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {r.strengths.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          {r.questions.length > 0 && (
            <div>
              <p className="font-semibold text-navy">Questions to answer</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {r.questions.map((s, i) => (
                  <li key={i}>{s}</li>
                ))}
              </ul>
            </div>
          )}
          <p className="text-xs italic text-ink-soft">AI-generated review, {new Date(saved!.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}. A coach can go through it with you in a session.</p>
        </div>
      )}
    </div>
  );
}
