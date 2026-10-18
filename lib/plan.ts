import { BLOCK_KEYS, BLOCK_LABELS, type BlockKey } from "./scoring";
import { TIME_HORIZONS } from "./quickcheck";

/** The strategic plan a founder builds in the guided Plan Builder.
 *
 * Plans are built in the app rather than uploaded so that every plan has
 * the same shape (it can be read, reviewed and tracked), and so founders
 * plan from where their business is TODAY (their assessment) rather than
 * from an old or incomplete plan. Pure functions only, so they can be
 * tested and used on both server and browser. */

export const EXISTING_PLAN = [
  { value: "none", label: "No, this is my first plan" },
  { value: "head", label: "Mostly in my head" },
  { value: "outdated", label: "Yes, written, but out of date or incomplete" },
  { value: "current", label: "Yes, written and current" },
] as const;

export const LAST_UPDATED = [
  { value: "never", label: "Never updated since I wrote it" },
  { value: "over2y", label: "More than 2 years ago" },
  { value: "1to2y", label: "1 to 2 years ago" },
  { value: "6to12m", label: "6 to 12 months ago" },
  { value: "under6m", label: "In the last 6 months" },
] as const;

export const FUNDING_NEEDS = [
  { value: "none", label: "No outside funding needed" },
  { value: "under10k", label: "Under $10,000" },
  { value: "10to50k", label: "$10,000 to $50,000" },
  { value: "50to250k", label: "$50,000 to $250,000" },
  { value: "250kto1m", label: "$250,000 to $1 million" },
  { value: "over1m", label: "Over $1 million" },
] as const;

export const FUNDING_SOURCES = [
  "Own revenue",
  "Savings or family",
  "Bank or microfinance loan",
  "Grant or competition",
  "Angel investors",
  "Venture capital",
  "Impact or development investors",
  "Supplier or customer financing",
  "Not sure yet",
] as const;

export const ACTION_STATUSES = [
  { value: "not_started", label: "Not started" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
  { value: "blocked", label: "Blocked" },
] as const;

export const LIKELIHOOD = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
] as const;

export type ActionStatus = (typeof ACTION_STATUSES)[number]["value"];

export interface PlanAction {
  id: string;
  text: string;
  owner: string;
  due: string; // YYYY-MM-DD or ""
  status: ActionStatus;
}

export interface PlanGoal {
  id: string;
  title: string;
  /** What is counted, e.g. "Monthly revenue", "Paying customers". */
  measure: string;
  unit: string;
  /** Where it stands at the start, and the target. Numbers, so progress
   * (target vs actual) can be tracked; null until given. */
  baseline: number | null;
  target: number | null;
  /** When tracking starts (YYYY-MM-DD) and the date it's due. */
  start: string;
  date: string;
}

export const GOAL_UNITS = ["$", "%", "customers", "units", "people", "partners", "days", "other"] as const;

/** A number typed by a founder: "$12,500", "12.5k", "40%" all work. */
export function parseAmount(v: unknown): number | null {
  if (typeof v === "number") return Number.isFinite(v) ? v : null;
  if (typeof v !== "string") return null;
  const t = v.trim().toLowerCase().replace(/[,\s$%]/g, "");
  const m = /^(-?\d+(?:\.\d+)?)(k|m)?$/.exec(t);
  if (!m) return null;
  const n = Number(m[1]) * (m[2] === "k" ? 1e3 : m[2] === "m" ? 1e6 : 1);
  return Number.isFinite(n) && Math.abs(n) < 1e13 ? n : null;
}

export interface PlanArea {
  current: string;
  desired: string;
  actions: PlanAction[];
}

export interface PlanRisk {
  id: string;
  risk: string;
  likelihood: "low" | "medium" | "high";
  mitigation: string;
}

export interface StrategicPlan {
  starting: { existingPlan: string; lastUpdated: string; whatChanged: string };
  vision: { current: string; desired: string; horizon: string };
  goals: PlanGoal[];
  areas: Partial<Record<BlockKey, PlanArea>>;
  resources: { revenueNow: string; revenueTarget: string; fundingNeed: string; fundingSources: string[]; fundingUse: string; people: string };
  risks: PlanRisk[];
}

export const MAX_GOALS = 3;
export const MAX_ACTIONS = 5;
export const MAX_RISKS = 5;

export function emptyPlan(): StrategicPlan {
  return {
    starting: { existingPlan: "", lastUpdated: "", whatChanged: "" },
    vision: { current: "", desired: "", horizon: "12 months" },
    goals: [],
    areas: {},
    resources: { revenueNow: "", revenueTarget: "", fundingNeed: "", fundingSources: [], fundingUse: "", people: "" },
    risks: [],
  };
}

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "");
const oneOf = <T extends string>(v: unknown, allowed: readonly T[], fallback: T | "" = ""): T | "" => (typeof v === "string" && (allowed as readonly string[]).includes(v) ? (v as T) : fallback);
const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : "");
const id = (v: unknown, i: number) => (typeof v === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(v) ? v : `i${i}`);
const arr = (v: unknown): any[] => (Array.isArray(v) ? v : []);

/** Cleans a plan sent from the browser: unknown fields dropped, text
 * trimmed and capped, choices checked against their lists. Never throws. */
export function sanitizePlan(raw: unknown): StrategicPlan {
  const r: any = raw && typeof raw === "object" ? raw : {};
  const plan = emptyPlan();
  plan.starting = {
    existingPlan: oneOf(r.starting?.existingPlan, EXISTING_PLAN.map((x) => x.value)),
    lastUpdated: oneOf(r.starting?.lastUpdated, LAST_UPDATED.map((x) => x.value)),
    whatChanged: str(r.starting?.whatChanged, 1500),
  };
  plan.vision = {
    current: str(r.vision?.current, 1500),
    desired: str(r.vision?.desired, 1500),
    horizon: oneOf(r.vision?.horizon, TIME_HORIZONS as readonly string[], "12 months"),
  };
  plan.goals = arr(r.goals)
    .slice(0, MAX_GOALS)
    .map((g, i) => ({
      id: id(g?.id, i),
      title: str(g?.title, 200),
      measure: str(g?.measure, 200),
      unit: oneOf(g?.unit, GOAL_UNITS, "other") || "other",
      baseline: parseAmount(g?.baseline),
      target: parseAmount(g?.target),
      start: date(g?.start),
      date: date(g?.date),
    }));
  for (const key of BLOCK_KEYS) {
    const a = r.areas?.[key];
    if (!a || typeof a !== "object") continue;
    const area: PlanArea = {
      current: str(a.current, 1500),
      desired: str(a.desired, 1500),
      actions: arr(a.actions)
        .slice(0, MAX_ACTIONS)
        .map((x, i) => ({
          id: id(x?.id, i),
          text: str(x?.text, 300),
          owner: str(x?.owner, 80),
          due: date(x?.due),
          status: (oneOf(x?.status, ACTION_STATUSES.map((s) => s.value)) || "not_started") as ActionStatus,
        }))
        .filter((x) => x.text),
    };
    if (area.current || area.desired || area.actions.length) plan.areas[key] = area;
  }
  plan.resources = {
    revenueNow: str(r.resources?.revenueNow, 100),
    revenueTarget: str(r.resources?.revenueTarget, 100),
    fundingNeed: oneOf(r.resources?.fundingNeed, FUNDING_NEEDS.map((x) => x.value)),
    fundingSources: arr(r.resources?.fundingSources).filter((s) => (FUNDING_SOURCES as readonly string[]).includes(s)).slice(0, FUNDING_SOURCES.length),
    fundingUse: str(r.resources?.fundingUse, 1000),
    people: str(r.resources?.people, 1000),
  };
  plan.risks = arr(r.risks)
    .slice(0, MAX_RISKS)
    .map((x, i) => ({
      id: id(x?.id, i),
      risk: str(x?.risk, 300),
      likelihood: (oneOf(x?.likelihood, ["low", "medium", "high"] as const) || "medium") as PlanRisk["likelihood"],
      mitigation: str(x?.mitigation, 500),
    }))
    .filter((x) => x.risk);
  return plan;
}

/** A new plan pre-filled from the founder's assessment, so they start from
 * where the business is today. */
export function planFromAssessment(input: {
  planLength?: string | null;
  primaryGoal?: string | null;
  blocks: { block_key: string; current_state: string | null; future_state: string | null; goal_target: string | null; target_date: string | null }[];
  /** Weakest areas first; these get an area section even if not described. */
  gapKeys: string[];
}): StrategicPlan {
  const plan = emptyPlan();
  if (input.planLength && (TIME_HORIZONS as readonly string[]).includes(input.planLength)) plan.vision.horizon = input.planLength;
  const keys = new Set<string>(input.gapKeys.slice(0, 3));
  for (const b of input.blocks) if ((b.current_state ?? "").trim()) keys.add(b.block_key);
  for (const key of BLOCK_KEYS) {
    if (!keys.has(key)) continue;
    const b = input.blocks.find((x) => x.block_key === key);
    plan.areas[key] = {
      current: (b?.current_state ?? "").trim(),
      desired: (b?.future_state ?? "").trim(),
      actions: (b?.goal_target ?? "").trim() ? [{ id: `a${key}`, text: b!.goal_target!.trim().slice(0, 300), owner: "", due: b?.target_date ?? "", status: "not_started" }] : [],
    };
  }
  if (input.primaryGoal) plan.goals.push({ id: "g1", title: input.primaryGoal.slice(0, 200), measure: "", unit: "other", baseline: null, target: null, start: "", date: "" });
  return plan;
}

/** Brings assessment answers into a plan for areas the founder has
 * described since the plan was started, without touching anything they
 * already wrote. Returns the keys that were added. */
export function addNewAssessmentAreas(plan: StrategicPlan, blocks: { block_key: string; current_state: string | null; future_state: string | null }[]): BlockKey[] {
  const added: BlockKey[] = [];
  for (const b of blocks) {
    const key = b.block_key as BlockKey;
    if (!(BLOCK_KEYS as readonly string[]).includes(key) || plan.areas[key]) continue;
    if (!(b.current_state ?? "").trim()) continue;
    plan.areas[key] = { current: b.current_state!.trim(), desired: (b.future_state ?? "").trim(), actions: [] };
    added.push(key);
  }
  return added;
}

export interface PlanCheck {
  key: string;
  label: string;
  done: boolean;
  /** Which builder step fixes it. */
  step: PlanStep;
}

export type PlanStep = "starting" | "vision" | "goals" | "areas" | "resources" | "risks" | "review";
export const PLAN_STEPS: { key: PlanStep; label: string }[] = [
  { key: "starting", label: "Starting point" },
  { key: "vision", label: "Where you're going" },
  { key: "goals", label: "Goals" },
  { key: "areas", label: "Business areas" },
  { key: "resources", label: "Money and people" },
  { key: "risks", label: "Risks" },
  { key: "review", label: "Check and review" },
];

const goalComplete = (g: PlanGoal) => !!(g.title && g.measure && g.baseline !== null && g.target !== null && g.date);
const areaComplete = (a: PlanArea | undefined) => !!a && !!a.current && !!a.desired && a.actions.some((x) => x.text && x.due);

/** What a complete plan has, checked item by item. `gapKeys` are the
 * founder's weakest areas from their latest score: a plan that doesn't
 * address them isn't finished, however long it is. */
export function planChecks(plan: StrategicPlan, gapKeys: string[]): PlanCheck[] {
  const weakest = gapKeys.filter((k) => (BLOCK_KEYS as readonly string[]).includes(k)).slice(0, 3) as BlockKey[];
  const checks: PlanCheck[] = [
    { key: "starting", label: "Say where your current plan stands", done: !!plan.starting.existingPlan && (plan.starting.existingPlan === "none" || plan.starting.existingPlan === "head" || !!plan.starting.lastUpdated), step: "starting" },
    { key: "visionNow", label: "Describe where the business is today", done: plan.vision.current.length >= 20, step: "vision" },
    { key: "visionThen", label: "Describe where you want it to be", done: plan.vision.desired.length >= 20, step: "vision" },
    { key: "goal", label: "At least one goal with a measure, starting point, target and date", done: plan.goals.some(goalComplete), step: "goals" },
    { key: "goalsAll", label: "Every goal has a measure, starting point, target and date", done: plan.goals.length > 0 && plan.goals.every(goalComplete), step: "goals" },
    ...weakest.map((k) => ({
      key: `area:${k}`,
      label: `${BLOCK_LABELS[k]}: today, where you want it, and a dated action`,
      done: areaComplete(plan.areas[k]),
      step: "areas" as PlanStep,
    })),
    { key: "owners", label: "Every action has an owner", done: allActions(plan).length > 0 && allActions(plan).every((a) => a.owner), step: "areas" },
    { key: "funding", label: "Say what funding you need and where it will come from", done: !!plan.resources.fundingNeed && (plan.resources.fundingNeed === "none" || plan.resources.fundingSources.length > 0), step: "resources" },
    { key: "revenue", label: "Revenue today and your target", done: !!plan.resources.revenueNow && !!plan.resources.revenueTarget, step: "resources" },
    { key: "risk", label: "At least one risk with what you'll do about it", done: plan.risks.some((r) => r.risk && r.mitigation), step: "risks" },
  ];
  if (plan.starting.existingPlan === "outdated" || plan.starting.lastUpdated === "over2y" || plan.starting.lastUpdated === "1to2y") {
    checks.splice(1, 0, { key: "changed", label: "Say what has changed since your last plan", done: plan.starting.whatChanged.length >= 20, step: "starting" });
  }
  return checks;
}

export function planCompleteness(plan: StrategicPlan, gapKeys: string[]): number {
  const checks = planChecks(plan, gapKeys);
  return checks.length ? Math.round((checks.filter((c) => c.done).length / checks.length) * 100) : 0;
}

/** The minimum for an AI review to be worth running (and paying for):
 * both sides of the vision, one complete goal and the weakest area done. */
export function readyForReview(plan: StrategicPlan, gapKeys: string[]): { ready: boolean; missing: string[] } {
  const needed = new Set(["visionNow", "visionThen", "goal", gapKeys[0] ? `area:${gapKeys[0]}` : ""]);
  const missing = planChecks(plan, gapKeys)
    .filter((c) => needed.has(c.key) && !c.done)
    .map((c) => c.label);
  return { ready: missing.length === 0, missing };
}

export function allActions(plan: StrategicPlan): (PlanAction & { area: BlockKey })[] {
  return BLOCK_KEYS.flatMap((k) => (plan.areas[k]?.actions ?? []).map((a) => ({ ...a, area: k })));
}

export interface ActionStats {
  total: number;
  done: number;
  inProgress: number;
  blocked: number;
  overdue: number;
  /** Open actions with the nearest due dates (undated last). */
  next: (PlanAction & { area: BlockKey })[];
}

export function actionStats(plan: StrategicPlan, today: string = new Date().toISOString().slice(0, 10)): ActionStats {
  const all = allActions(plan);
  const open = all.filter((a) => a.status !== "done");
  return {
    total: all.length,
    done: all.filter((a) => a.status === "done").length,
    inProgress: all.filter((a) => a.status === "in_progress").length,
    blocked: all.filter((a) => a.status === "blocked").length,
    overdue: open.filter((a) => a.due && a.due < today).length,
    next: open.slice().sort((a, b) => (a.due || "9999").localeCompare(b.due || "9999")).slice(0, 3),
  };
}

const label = (list: readonly { value: string; label: string }[], v: string) => list.find((x) => x.value === v)?.label ?? "not specified";
const or = (v: string) => (v ? v : "not specified");

/** The plan as plain text, for the AI plan review and the report. */
export function planAsText(plan: StrategicPlan): string {
  const lines: string[] = [];
  lines.push(`Existing plan before this one: ${label(EXISTING_PLAN, plan.starting.existingPlan)}; last updated: ${label(LAST_UPDATED, plan.starting.lastUpdated)}`);
  if (plan.starting.whatChanged) lines.push(`What has changed since the last plan: ${plan.starting.whatChanged}`);
  lines.push(`Plan length: ${plan.vision.horizon}`);
  lines.push(`Where the business is today: ${or(plan.vision.current)}`);
  lines.push(`Where the founder wants it to be: ${or(plan.vision.desired)}`);
  lines.push("Goals:");
  if (!plan.goals.length) lines.push("- none set");
  const amt = (n: number | null, unit: string) => (n === null ? "not specified" : unit === "$" ? `$${n.toLocaleString("en-US")}` : unit === "%" ? `${n}%` : unit === "other" ? `${n}` : `${n} ${unit}`);
  for (const g of plan.goals) lines.push(`- ${or(g.title)} | measure: ${or(g.measure)} | from: ${amt(g.baseline, g.unit)} | to: ${amt(g.target, g.unit)} | by: ${or(g.date)}`);
  lines.push("Business areas (today → desired, then actions):");
  const keys = BLOCK_KEYS.filter((k) => plan.areas[k]);
  if (!keys.length) lines.push("- none planned");
  for (const k of keys) {
    const a = plan.areas[k]!;
    lines.push(`- ${BLOCK_LABELS[k]}: today: ${or(a.current)} → desired: ${or(a.desired)}`);
    for (const x of a.actions) lines.push(`  - Action: ${x.text} | owner: ${or(x.owner)} | due: ${or(x.due)} | status: ${label(ACTION_STATUSES, x.status)}`);
  }
  lines.push(`Revenue today: ${or(plan.resources.revenueNow)}; revenue target: ${or(plan.resources.revenueTarget)}`);
  lines.push(`Outside funding needed: ${label(FUNDING_NEEDS, plan.resources.fundingNeed)}; sources: ${plan.resources.fundingSources.join(", ") || "not specified"}`);
  if (plan.resources.fundingUse) lines.push(`What the money is for: ${plan.resources.fundingUse}`);
  if (plan.resources.people) lines.push(`People and skills needed: ${plan.resources.people}`);
  lines.push("Risks:");
  if (!plan.risks.length) lines.push("- none listed");
  for (const r of plan.risks) lines.push(`- ${r.risk} (likelihood ${r.likelihood}) | response: ${or(r.mitigation)}`);
  return lines.join("\n");
}
