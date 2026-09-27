"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface Recommendation {
  id: string;
  source: "ai" | "advisor";
  block_key: string | null;
  title: string;
  detail: string | null;
  created_at: string;
  advisor_name?: string | null;
}

/** Third Founder Tool: a combined list of targets/goals/next-steps from
 * two sources — the AI Diagnostic Report's own action plan (source:
 * 'ai', auto-extracted when the report is generated — see
 * lib/recommendations.ts) and anything a human advisor/coach adds
 * (source: 'advisor', from the /advisor queue). Read-only aside from
 * the one-click "Add to Milestones" action, which reuses the existing
 * Milestone Planner rather than duplicating its own tracking. */
export function RecommendationsPanel({ assessmentId, recommendations }: { assessmentId: string; recommendations: Recommendation[] }) {
  const router = useRouter();
  const [addedIds, setAddedIds] = useState<Set<string>>(new Set());

  async function handleAddToMilestones(rec: Recommendation) {
    await fetch("/api/milestones", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ assessmentId, blockKey: rec.block_key, title: rec.title }),
    });
    setAddedIds(new Set([...addedIds, rec.id]));
    router.refresh();
  }

  if (recommendations.length === 0) {
    return (
      <p className="text-sm text-ink-soft">
        No recommendations yet — generate your AI Diagnostic Report from the dashboard, or ask an advisor
        during a 1:1 session, and they'll show up here.
      </p>
    );
  }

  return (
    <div className="rounded border divide-y">
      {recommendations.map((rec) => (
        <div key={rec.id} className="p-3 flex items-start justify-between gap-3">
          <div className="min-w-0">
            <span
              className={`inline-block text-xs font-semibold rounded px-2 py-0.5 mr-2 ${
                rec.source === "ai" ? "bg-teal/10 text-teal" : "bg-gold/20 text-navy"
              }`}
            >
              {rec.source === "ai" ? "AI" : rec.advisor_name ? `Coach · ${rec.advisor_name}` : "Coach"}
            </span>
            <span className="text-sm">{rec.title}</span>
            {rec.detail && <p className="text-xs text-ink-soft mt-1">{rec.detail}</p>}
          </div>
          <button
            onClick={() => handleAddToMilestones(rec)}
            disabled={addedIds.has(rec.id)}
            className="text-xs text-navy shrink-0 disabled:opacity-50"
          >
            {addedIds.has(rec.id) ? "Added" : "+ Add to Milestones"}
          </button>
        </div>
      ))}
    </div>
  );
}
