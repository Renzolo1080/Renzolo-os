/** The founder dashboard.
 *
 * Every founder gets the same STANDARD dashboard, modelled on what the
 * best founder/CEO dashboards share (board-pack KPI pages, OKR trackers,
 * monthly investor updates):
 *   1. Key numbers: revenue, customers, cash (with trend), Venture Score,
 *      plan progress.
 *   2. Goals: target vs actual, pace status and due date.
 *   3. Coming up: goal and action completion dates, overdue flagged.
 *   4. Monthly update: wins, challenges and where help is needed.
 *   plus the founder's next steps and their Readiness Report.
 *
 * On top of that a founder chooses 3 to 5 EXTRA views from the catalogue
 * below (or a starter set), saved to their profile in order. Pure, so it
 * can be tested. */

export type ExtraKey =
  | "goalCharts"
  | "kpiTrends"
  | "readiness"
  | "valuation"
  | "areas"
  | "gaps"
  | "history"
  | "health"
  | "risks"
  | "planReview"
  | "market"
  | "recommendations"
  | "coaching"
  | "invite";

/** What a view needs: "member" (any membership or the one-time
 * assessment), "growth" (Growth, Elevate or the one-time assessment) or
 * nothing. A locked view shows what it would add, so it isn't hidden. */
export type Need = "none" | "member" | "growth";

export interface ExtraDef {
  key: ExtraKey;
  label: string;
  description: string;
  kind: "Chart" | "Numbers" | "List" | "Notes";
  need: Need;
}

export const EXTRAS: ExtraDef[] = [
  { key: "goalCharts", label: "Goal charts", description: "Each goal's expected path against your actual check-ins.", kind: "Chart", need: "member" },
  { key: "kpiTrends", label: "Revenue, customers and cash trends", description: "Your monthly numbers over the last 12 months, with cash runway.", kind: "Chart", need: "member" },
  { key: "readiness", label: "Market, Customer and Investor readiness", description: "The three scores partners, customers and investors look at.", kind: "Numbers", need: "growth" },
  { key: "valuation", label: "Estimated business value", description: "A directional valuation range and how it's worked out.", kind: "Numbers", need: "growth" },
  { key: "areas", label: "Nine business areas", description: "A score for each part of your business model, weakest first.", kind: "Chart", need: "none" },
  { key: "gaps", label: "Weakest areas", description: "The three areas holding your score back most.", kind: "List", need: "none" },
  { key: "history", label: "Venture Score over time", description: "Your score at each assessment.", kind: "Chart", need: "none" },
  { key: "health", label: "Health Index", description: "How sound the business is and how much evidence backs it.", kind: "Numbers", need: "none" },
  { key: "risks", label: "Risk register", description: "The risks in your plan, how likely they are and your response.", kind: "List", need: "member" },
  { key: "planReview", label: "Plan review", description: "Your latest AI plan review score and top fixes.", kind: "Numbers", need: "growth" },
  { key: "market", label: "Market Intelligence", description: "Headlines and plan recommendations from your market brief.", kind: "Notes", need: "growth" },
  { key: "recommendations", label: "Recommendations and milestones", description: "Top recommendations from your report and coach, and nearest milestones.", kind: "List", need: "member" },
  { key: "coaching", label: "Coaching", description: "Sessions you can book.", kind: "List", need: "none" },
  { key: "invite", label: "Invite a founder", description: "Your invite link and rewards.", kind: "List", need: "member" },
];

export const EXTRA_KEYS = EXTRAS.map((e) => e.key);
export const MIN_EXTRAS = 3;
export const MAX_EXTRAS = 5;
export const DEFAULT_EXTRAS: ExtraKey[] = ["goalCharts", "kpiTrends", "areas"];

/** Starter sets that fill the extra slots in one tap. */
export const STARTER_SETS: { key: string; label: string; description: string; extras: ExtraKey[] }[] = [
  { key: "investor", label: "Investor", description: "What a lender or investor looks at.", extras: ["readiness", "valuation", "kpiTrends", "history", "planReview"] },
  { key: "customer", label: "Customer", description: "Winning and keeping customers.", extras: ["readiness", "market", "gaps", "areas", "recommendations"] },
  { key: "operations", label: "Operations", description: "Running the plan week to week.", extras: ["goalCharts", "risks", "recommendations", "kpiTrends", "coaching"] },
  { key: "plan", label: "Plan", description: "Your strategic plan and how it's going.", extras: ["goalCharts", "planReview", "risks", "market", "recommendations"] },
];

/** Older dashboard settings used other names. */
const LEGACY: Record<string, ExtraKey | null> = {
  goalsProgress: "goalCharts",
  progressOverview: "recommendations",
  reminders: null, // now part of the standard dashboard
};

/** A founder's chosen extras: known keys only, no repeats, in their
 * order, between MIN_EXTRAS and MAX_EXTRAS (topped up from the defaults). */
export function normalizeExtras(raw: unknown): ExtraKey[] {
  const out: ExtraKey[] = [];
  for (const v of Array.isArray(raw) ? raw : []) {
    if (typeof v !== "string") continue;
    const key = (v in LEGACY ? LEGACY[v] : v) as ExtraKey | null;
    if (key && (EXTRA_KEYS as string[]).includes(key) && !out.includes(key)) out.push(key);
  }
  for (const d of DEFAULT_EXTRAS) if (out.length < MIN_EXTRAS && !out.includes(d)) out.push(d);
  return out.slice(0, MAX_EXTRAS);
}

/** Validates a choice sent from the browser (no topping up). */
export function validExtras(raw: unknown): ExtraKey[] | null {
  if (!Array.isArray(raw) || raw.length < MIN_EXTRAS || raw.length > MAX_EXTRAS) return null;
  if (raw.some((v) => typeof v !== "string" || !(EXTRA_KEYS as string[]).includes(v))) return null;
  if (new Set(raw).size !== raw.length) return null;
  return raw as ExtraKey[];
}

export function unlocked(key: ExtraKey, access: { member: boolean; growth: boolean }): boolean {
  const need = EXTRAS.find((e) => e.key === key)?.need ?? "none";
  return need === "none" || (need === "member" ? access.member : access.growth);
}

/** Which starter set the extras match, or "custom". Stored in
 * profiles.dashboard_view. */
export function setFor(extras: ExtraKey[]): string {
  return STARTER_SETS.find((s) => s.extras.length === extras.length && s.extras.every((e, i) => extras[i] === e))?.key ?? "custom";
}
