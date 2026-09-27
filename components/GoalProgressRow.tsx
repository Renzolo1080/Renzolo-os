"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  on_track: "On track",
  at_risk: "At risk",
  behind: "Behind",
  done: "Done",
};

const STATUS_COLORS: Record<string, string> = {
  not_started: "bg-gray-100 text-gray-700",
  on_track: "bg-teal/10 text-teal",
  at_risk: "bg-yellow-100 text-yellow-800",
  behind: "bg-red-100 text-red-700",
  done: "bg-green-100 text-green-700",
};

interface Props {
  blockResponseId: string;
  label: string;
  goalTarget: string;
  targetDate: string | null;
  status: string;
  overdue: boolean;
}

export function GoalProgressRow({ blockResponseId, label, goalTarget, targetDate, status, overdue }: Props) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [localStatus, setLocalStatus] = useState(status);

  async function handleChange(next: string) {
    setLocalStatus(next);
    setSaving(true);
    try {
      await fetch(`/api/block-responses/${blockResponseId}/progress`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ progressStatus: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex items-center justify-between gap-3 py-3 border-b last:border-b-0">
      <div className="min-w-0">
        <p className="font-medium text-sm">{label}</p>
        {goalTarget && <p className="text-xs text-ink-soft truncate">{goalTarget}</p>}
        {targetDate && (
          <p className={`text-xs mt-0.5 ${overdue && localStatus !== "done" ? "text-red-600 font-semibold" : "text-ink-soft"}`}>
            Target: {new Date(targetDate).toLocaleDateString()}
            {overdue && localStatus !== "done" ? " — OVERDUE" : ""}
          </p>
        )}
      </div>
      <select
        className={`rounded px-2 py-1 text-xs font-semibold shrink-0 ${STATUS_COLORS[localStatus] ?? ""}`}
        value={localStatus}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
      >
        {Object.entries(STATUS_LABELS).map(([value, label]) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    </div>
  );
}
