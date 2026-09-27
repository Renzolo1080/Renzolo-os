"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

const WIDGET_OPTIONS: { key: string; label: string; description: string }[] = [
  { key: "reminders", label: "Goal reminders banner", description: "Overdue / due-soon goals at the top of your dashboard." },
  { key: "valuation", label: "Estimated Venture Value", description: "Instant directional valuation range." },
  { key: "goalsProgress", label: "Goals & Progress list", description: "Per-block goal status you can update yourself." },
];

/** The dashboard's standard view (Venture Score, sub-scores, Health
 * Index, report/subscribe, Founder Tools link) is always shown to every
 * founder — this only controls a few additional, optional data points a
 * founder can choose to add to their own dashboard. */
export function DashboardCustomizer({ initialWidgets }: { initialWidgets: string[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [widgets, setWidgets] = useState<string[]>(initialWidgets);
  const [saving, setSaving] = useState(false);

  async function toggle(key: string) {
    const next = widgets.includes(key) ? widgets.filter((w) => w !== key) : [...widgets, key];
    setWidgets(next);
    setSaving(true);
    try {
      await fetch("/api/profile/dashboard-widgets", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ widgets: next }),
      });
      router.refresh();
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="rounded border">
      <button className="w-full flex justify-between items-center px-4 py-3 text-sm font-semibold text-navy" onClick={() => setOpen(!open)}>
        Customize your dashboard
        <span className="text-ink-soft">{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="px-4 pb-4 space-y-3">
          <p className="text-xs text-ink-soft">
            Your Venture Score, Market/Customer/Investor Readiness, Health Index, and Founder Tools link always
            show. Choose which of these additional data points to include too.
          </p>
          {WIDGET_OPTIONS.map((opt) => (
            <label key={opt.key} className="flex items-start gap-2">
              <input
                type="checkbox"
                className="mt-1"
                checked={widgets.includes(opt.key)}
                disabled={saving}
                onChange={() => toggle(opt.key)}
              />
              <span>
                <span className="block text-sm font-medium">{opt.label}</span>
                <span className="block text-xs text-ink-soft">{opt.description}</span>
              </span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}
