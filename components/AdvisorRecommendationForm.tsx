"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Lets an advisor/coach add their own recommendation to a founder's
 * Recommendations list (app/tools), alongside whatever the AI report
 * already extracted automatically. Deliberately just title + optional
 * detail — not a full coaching-notes editor. */
export function AdvisorRecommendationForm({ assessmentId, reportId }: { assessmentId: string; reportId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function handleSubmit() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/recommendations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, reportId, title, detail }),
      });
      if (res.ok) {
        setTitle("");
        setDetail("");
        setSaved(true);
        router.refresh();
      }
    } finally {
      setSaving(false);
    }
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="text-sm text-teal mt-2">
        + Add a recommendation for this founder
      </button>
    );
  }

  return (
    <div className="mt-2 space-y-2 rounded border p-3 bg-cream">
      <input
        className="w-full rounded border px-2 py-1 text-sm"
        placeholder="Recommendation (e.g. Renegotiate your supplier contract before scaling)"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      <textarea
        className="w-full rounded border px-2 py-1 text-sm"
        rows={2}
        placeholder="Optional detail"
        value={detail}
        onChange={(e) => setDetail(e.target.value)}
      />
      <div className="flex items-center gap-2">
        <button
          onClick={handleSubmit}
          disabled={saving || !title.trim()}
          className="rounded bg-teal px-3 py-1.5 text-white text-xs font-semibold disabled:opacity-50"
        >
          {saving ? "Saving…" : "Save Recommendation"}
        </button>
        {saved && <span className="text-xs text-teal">Saved.</span>}
      </div>
    </div>
  );
}
