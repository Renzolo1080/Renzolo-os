/** The "Your next steps" card on the founder dashboard: the founder's
 * steps in order, which one is current, and progress ("Step 2 of 4").
 * Locked steps (not in the founder's membership) don't count towards
 * progress. Pure, so it can be tested. */

export interface Step {
  key: string;
  label: string;
  /** Short status, e.g. "6 of 9 areas". */
  value: string;
  done: boolean;
  /** Good enough to move on, even if not fully done. */
  ok: boolean;
  href: string;
  locked: boolean;
  /** What unlocks a locked step. */
  unlock?: string;
}

export interface StepInput {
  areasAnswered: number;
  areasTotal: number;
  planCompleteness: number | null;
  review: { overall: number } | null;
  marketDate: string | null;
  report: { exists: boolean; current: boolean };
  access: { member: boolean; growth: boolean };
}

export function founderSteps(d: StepInput): Step[] {
  return [
    { key: "assessment", label: "Full assessment", value: `${d.areasAnswered} of ${d.areasTotal} areas`, done: d.areasAnswered >= d.areasTotal, ok: d.areasAnswered >= 3, href: "/assessment/details", locked: false },
    { key: "plan", label: "Strategic plan", value: d.planCompleteness === null ? "Not started" : `${d.planCompleteness}% complete`, done: (d.planCompleteness ?? 0) >= 100, ok: (d.planCompleteness ?? 0) >= 60, href: "/plan", locked: !d.access.member, unlock: "With a membership" },
    { key: "review", label: "Plan review", value: d.review ? `${d.review.overall}/100` : "Not yet", done: !!d.review && d.review.overall >= 75, ok: !!d.review, href: "/plan", locked: !d.access.growth, unlock: "With Growth" },
    { key: "market", label: "Market Intelligence", value: d.marketDate ?? "Not yet", done: !!d.marketDate, ok: !!d.marketDate, href: "/market", locked: !d.access.growth, unlock: "With Growth" },
    { key: "report", label: "Readiness Report", value: d.report.exists ? (d.report.current ? "Up to date" : "Update available") : "Not yet", done: d.report.exists && d.report.current, ok: d.report.exists, href: "#report", locked: false },
  ];
}

export interface StepProgress {
  /** The step to do now, or null when everything open is done. */
  next: Step | null;
  /** 1-based position of the current step among the open (unlocked) steps. */
  position: number;
  total: number;
  doneCount: number;
  /** 0–100, for the progress bar. */
  percent: number;
}

export function stepProgress(steps: Step[]): StepProgress {
  const open = steps.filter((s) => !s.locked);
  const next = open.find((s) => !s.ok) ?? open.find((s) => !s.done) ?? null;
  const doneCount = open.filter((s) => s.done).length;
  const total = open.length;
  const position = next ? open.indexOf(next) + 1 : total;
  return { next, position, total, doneCount, percent: total ? Math.round((doneCount / total) * 100) : 0 };
}

/** "We'll remind you on Thursday" (or a date further out). */
export function reminderNote(date: string | null, today: string): string | null {
  if (!date) return null;
  const d = new Date(`${date}T00:00:00Z`);
  const t = new Date(`${today.slice(0, 10)}T00:00:00Z`);
  const days = Math.round((d.getTime() - t.getTime()) / 864e5);
  if (days < 0) return null;
  if (days === 0) return "We'll send you a reminder today.";
  if (days === 1) return "We'll remind you tomorrow.";
  const when = days < 7 ? d.toLocaleDateString("en-GB", { weekday: "long", timeZone: "UTC" }) : d.toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });
  return `We'll remind you on ${when}.`;
}
