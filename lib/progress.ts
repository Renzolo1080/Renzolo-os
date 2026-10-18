import type { PlanGoal } from "./plan";

/** Target vs actual for plan goals, and the founder's monthly numbers.
 * Pure, so it can be tested. */

export interface Checkin {
  goal_id: string;
  value: number;
  note?: string | null;
  checked_on: string; // YYYY-MM-DD
}

export type GoalStatus = "achieved" | "on_track" | "at_risk" | "behind" | "overdue" | "no_data" | "not_set";

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  achieved: "Achieved",
  on_track: "On track",
  at_risk: "At risk",
  behind: "Behind",
  overdue: "Overdue",
  no_data: "No check-in yet",
  not_set: "Needs a target",
};

export interface GoalProgress {
  goal: PlanGoal;
  actual: number | null;
  actualOn: string | null;
  /** Share of the way from baseline to target, 0-100+ (null without data). */
  percent: number | null;
  /** Where it should be by now if progress were steady, 0-100. */
  expected: number | null;
  status: GoalStatus;
  daysLeft: number | null;
  points: { date: string; value: number }[];
}

const DAY = 864e5;
const dayNum = (d: string) => Math.floor(Date.parse(`${d}T00:00:00Z`) / DAY);

/** How a goal is going. Works for goals that go down as well as up
 * (e.g. cutting costs). Status compares progress with the steady pace
 * from the start date (or first check-in) to the due date:
 *   within 10 points of pace: on track; within 25: at risk; else behind. */
export function goalProgress(goal: PlanGoal, checkins: Checkin[], today: string = new Date().toISOString().slice(0, 10)): GoalProgress {
  const points = checkins
    .filter((c) => c.goal_id === goal.id && Number.isFinite(Number(c.value)))
    .map((c) => ({ date: c.checked_on, value: Number(c.value) }))
    .sort((a, b) => a.date.localeCompare(b.date));
  const last = points[points.length - 1] ?? null;
  const daysLeft = goal.date ? dayNum(goal.date) - dayNum(today) : null;
  const base: GoalProgress = { goal, actual: last?.value ?? null, actualOn: last?.date ?? null, percent: null, expected: null, status: "not_set", daysLeft, points };
  if (goal.baseline === null || goal.target === null || goal.target === goal.baseline || !goal.date) return base;

  const span = goal.target - goal.baseline;
  const percent = last ? Math.round(((last.value - goal.baseline) / span) * 100) : null;
  const startDay = goal.start ? dayNum(goal.start) : points[0] ? dayNum(points[0].date) : dayNum(today);
  const total = dayNum(goal.date) - startDay;
  const expected = total <= 0 ? 100 : Math.max(0, Math.min(100, Math.round(((dayNum(today) - startDay) / total) * 100)));

  let status: GoalStatus;
  if (percent !== null && percent >= 100) status = "achieved";
  else if (daysLeft !== null && daysLeft < 0) status = "overdue";
  else if (percent === null) status = "no_data";
  else if (percent >= expected - 10) status = "on_track";
  else if (percent >= expected - 25) status = "at_risk";
  else status = "behind";
  return { ...base, percent, expected, status };
}

export interface MonthlyUpdate {
  period: string; // YYYY-MM-01
  revenue: number | null;
  customers: number | null;
  cash: number | null;
  wins?: string | null;
  challenges?: string | null;
  asks?: string | null;
}

export interface Kpi {
  key: "revenue" | "customers" | "cash";
  label: string;
  latest: number | null;
  previous: number | null;
  /** Change on the previous month, as a percentage (null if not comparable). */
  change: number | null;
  series: { period: string; value: number }[];
}

/** Revenue, customers and cash from the monthly updates, oldest first. */
export function kpis(updates: MonthlyUpdate[]): Kpi[] {
  const sorted = updates.slice().sort((a, b) => a.period.localeCompare(b.period));
  const make = (key: Kpi["key"], label: string): Kpi => {
    const series = sorted.filter((u) => u[key] !== null && u[key] !== undefined).map((u) => ({ period: u.period, value: Number(u[key]) }));
    const latest = series[series.length - 1]?.value ?? null;
    const previous = series[series.length - 2]?.value ?? null;
    const change = latest !== null && previous !== null && previous !== 0 ? Math.round(((latest - previous) / Math.abs(previous)) * 100) : null;
    return { key, label, latest, previous, change, series: series.slice(-12) };
  };
  return [make("revenue", "Revenue this month"), make("customers", "Customers"), make("cash", "Cash in the bank")];
}

/** Months of cash left at the recent rate of change, when cash is falling. */
export function runwayMonths(updates: MonthlyUpdate[]): number | null {
  const cash = updates
    .filter((u) => u.cash !== null && u.cash !== undefined)
    .sort((a, b) => a.period.localeCompare(b.period))
    .slice(-4)
    .map((u) => Number(u.cash));
  if (cash.length < 2) return null;
  const burn = (cash[0] - cash[cash.length - 1]) / (cash.length - 1);
  if (burn <= 0) return null;
  return Math.max(0, Math.round((cash[cash.length - 1] / burn) * 10) / 10);
}

/** The first day of the month for a date, as YYYY-MM-01. */
export function periodOf(d: string | Date = new Date()): string {
  const iso = typeof d === "string" ? d : d.toISOString();
  return `${iso.slice(0, 7)}-01`;
}

export function formatAmount(n: number | null, unit: string = ""): string {
  if (n === null || !Number.isFinite(n)) return "–";
  const abs = Math.abs(n);
  const short = abs >= 1e6 ? `${(n / 1e6).toFixed(abs >= 1e7 ? 0 : 1)}m` : abs >= 1e4 ? `${Math.round(n / 1e3)}k` : n.toLocaleString("en-US", { maximumFractionDigits: 1 });
  if (unit === "$") return n < 0 ? `-$${short.replace("-", "")}` : `$${short}`;
  if (unit === "%") return `${short}%`;
  if (!unit || unit === "other") return short;
  return `${short} ${unit}`;
}
