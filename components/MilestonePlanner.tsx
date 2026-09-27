"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface BlockOption {
  key: string;
  label: string;
  priority: boolean;
}

export interface Milestone {
  id: string;
  block_key: string | null;
  title: string;
  target_date: string | null;
  completed: boolean;
}

/** A deliberately simple milestone/goal planner (Founder Tools): one flat
 * list per assessment, each milestone optionally tied to a BMC block —
 * not a full quarterly/monthly hierarchy, per the "not too complex"
 * scope decision. Blocks flagged as gap-to-target priorities are marked
 * so founders naturally plan against their weakest areas first. */
export function MilestonePlanner({
  assessmentId,
  blockOptions,
  initialMilestones,
}: {
  assessmentId: string;
  blockOptions: BlockOption[];
  initialMilestones: Milestone[];
}) {
  const router = useRouter();
  const [milestones, setMilestones] = useState(initialMilestones);
  const [title, setTitle] = useState("");
  const [blockKey, setBlockKey] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleAdd() {
    if (!title.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/milestones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, blockKey: blockKey || null, title, targetDate: targetDate || null }),
      });
      const data = await res.json();
      if (res.ok) {
        setMilestones([...milestones, data.milestone]);
        setTitle("");
        setTargetDate("");
      }
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  async function handleToggle(id: string, completed: boolean) {
    setMilestones(milestones.map((m) => (m.id === id ? { ...m, completed } : m)));
    await fetch(`/api/milestones/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ completed }),
    });
    router.refresh();
  }

  async function handleDelete(id: string) {
    setMilestones(milestones.filter((m) => m.id !== id));
    await fetch(`/api/milestones/${id}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="space-y-4">
      <div className="rounded border p-4 space-y-3">
        <p className="font-semibold text-navy">Add a milestone</p>
        <input
          className="w-full rounded border px-3 py-2 text-sm"
          placeholder="e.g. Sign first distribution partner"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
        <div className="flex gap-2">
          <select className="flex-1 rounded border px-3 py-2 text-sm" value={blockKey} onChange={(e) => setBlockKey(e.target.value)}>
            <option value="">No specific block</option>
            {blockOptions.map((b) => (
              <option key={b.key} value={b.key}>
                {b.priority ? "⚠ " : ""}
                {b.label}
              </option>
            ))}
          </select>
          <input
            type="date"
            className="rounded border px-3 py-2 text-sm"
            value={targetDate}
            onChange={(e) => setTargetDate(e.target.value)}
          />
        </div>
        <button
          onClick={handleAdd}
          disabled={saving || !title.trim()}
          className="rounded bg-navy px-4 py-2 text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving ? "Adding…" : "Add Milestone"}
        </button>
      </div>

      {milestones.length === 0 ? (
        <p className="text-sm text-ink-soft">No milestones yet — break your goals into concrete steps above.</p>
      ) : (
        <div className="rounded border divide-y">
          {milestones.map((m) => {
            const blockLabel = blockOptions.find((b) => b.key === m.block_key)?.label;
            const overdue = m.target_date && !m.completed && new Date(m.target_date).getTime() < Date.now();
            return (
              <div key={m.id} className="flex items-center gap-3 p-3">
                <input type="checkbox" checked={m.completed} onChange={(e) => handleToggle(m.id, e.target.checked)} />
                <div className="flex-1 min-w-0">
                  <p className={`text-sm ${m.completed ? "line-through text-ink-soft" : ""}`}>{m.title}</p>
                  <p className={`text-xs ${overdue ? "text-red-600 font-semibold" : "text-ink-soft"}`}>
                    {blockLabel ? `${blockLabel} · ` : ""}
                    {m.target_date ? new Date(m.target_date).toLocaleDateString() : "No date"}
                    {overdue ? " — OVERDUE" : ""}
                  </p>
                </div>
                <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600">
                  Remove
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
