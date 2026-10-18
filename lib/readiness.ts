import { BLOCK_KEYS, type BlockKey } from "./scoring";

/** The Total Readiness Score (approved Oct 2026): ONE headline number,
 * made of five component scores founders can act on:
 *
 *   Strategic   is the plan written, measurable, funded and reviewed
 *   Growth      can the business deliver and scale
 *   Customer    is it ready to win and keep buyers
 *   Capital     is it ready for loans, credit and grants
 *   Investment  is it ready for investors and partners
 *
 * Capital and Investment are kept apart on purpose: most early-stage
 * founders seek credit or grants, not equity.
 *
 * v1 is computed from data RENZOLO OS already holds (the assessment's
 * block scores and readiness sub-scores, evidence completeness, the
 * strategic plan and its AI review). Weights are a reasoned starting
 * point (Keep Manual) to be calibrated against the 60-founder pilot. */

export const COMPONENTS = ["strategic", "growth", "customer", "capital", "investment"] as const;
export type Component = (typeof COMPONENTS)[number];

export const COMPONENT_LABELS: Record<Component, string> = {
  strategic: "Strategic",
  growth: "Growth",
  customer: "Customer",
  capital: "Capital",
  investment: "Investment",
};

export const COMPONENT_HELP: Record<Component, string> = {
  strategic: "Is your plan written, measurable, funded and reviewed?",
  growth: "Can your business deliver and scale?",
  customer: "Are you ready to win and keep buyers?",
  capital: "Are you ready for loans, credit and grants?",
  investment: "Are you ready for investors and partners?",
};

/** What the founder most wants next; it shifts the weights. */
export type TargetOutcome = "customers" | "capital" | "investors" | null;

export interface ReadinessInputs {
  /** scores row: per-block 0-100 */
  blockScores: Partial<Record<BlockKey, number>> | null;
  marketSubscore: number | null;
  customerSubscore: number | null;
  investorSubscore: number | null;
  /** 0-1 */
  evidenceCompleteness: number | null;
  /** Strategic plan completeness 0-100 (Plan Builder), when a plan exists. */
  planCompleteness: number | null;
  /** AI plan review overall 0-100, when reviewed. */
  planReview: number | null;
  /** Strategic Plan Readiness from the Snapshot/assessment, 0-100. */
  planReadiness: number | null;
  target?: TargetOutcome;
}

export interface ReadinessResult {
  total: number;
  band: Band;
  components: Record<Component, number>;
  /** Components that rest on little data, so founders know where to add evidence. */
  estimated: Component[];
  weights: Record<Component, number>;
}

export type Band = "Ready" | "Nearly ready" | "Getting ready" | "Not yet";

export function bandFor(score: number): Band {
  if (score >= 75) return "Ready";
  if (score >= 60) return "Nearly ready";
  if (score >= 40) return "Getting ready";
  return "Not yet";
}

const clamp = (n: number) => Math.max(0, Math.min(100, n));
const round1 = (n: number) => Math.round(n * 10) / 10;
const num = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v)) ? Number(v) : null);

function avg(values: (number | null | undefined)[]): number | null {
  const xs = values.map(num).filter((x): x is number => x !== null);
  return xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null;
}

/** Blend available parts by weight, ignoring missing ones. */
function blend(parts: [number | null, number][]): number | null {
  let total = 0;
  let w = 0;
  for (const [v, weight] of parts) {
    if (v === null) continue;
    total += clamp(v) * weight;
    w += weight;
  }
  return w > 0 ? total / w : null;
}

export function weightsFor(target: TargetOutcome = null): Record<Component, number> {
  const base: Record<Component, number> = { strategic: 0.2, growth: 0.2, customer: 0.2, capital: 0.2, investment: 0.2 };
  const focus: Record<Exclude<TargetOutcome, null>, Component> = { customers: "customer", capital: "capital", investors: "investment" };
  if (!target) return base;
  const k = focus[target];
  const out = {} as Record<Component, number>;
  for (const c of COMPONENTS) out[c] = c === k ? 0.32 : 0.17;
  return out;
}

export function computeReadiness(i: ReadinessInputs): ReadinessResult {
  const b = i.blockScores ?? {};
  const block = (k: BlockKey) => num(b[k]);
  const evidence = num(i.evidenceCompleteness);
  const estimated: Component[] = [];

  // Strategic: the plan itself (Plan Builder), its AI review, else the assessment's plan readiness.
  let strategic = blend([
    [num(i.planCompleteness), 0.5],
    [num(i.planReview), 0.5],
  ]);
  if (strategic === null) {
    strategic = num(i.planReadiness);
    estimated.push("strategic");
  }

  // Growth: delivery blocks plus market readiness (can it reach and serve more customers).
  const growth = blend([
    [avg([block("keyActivities"), block("keyResources"), block("keyPartnerships"), block("channels")]), 0.6],
    [num(i.marketSubscore), 0.4],
  ]);

  const customer = num(i.customerSubscore);

  // Capital: lenders and grant makers look at money in and out, and at records they can verify.
  const capital = blend([
    [avg([block("revenueStreams"), block("costStructure")]), 0.5],
    [evidence === null ? null : evidence * 100, 0.3],
    [strategic, 0.2],
  ]);
  if (evidence === null || evidence < 0.4) estimated.push("capital");

  const investment = num(i.investorSubscore);
  if (evidence !== null && evidence < 0.4) estimated.push("investment");

  const fallback = avg(BLOCK_KEYS.map((k) => block(k))) ?? 0;
  const components: Record<Component, number> = {
    strategic: round1(strategic ?? fallback),
    growth: round1(growth ?? fallback),
    customer: round1(customer ?? fallback),
    capital: round1(capital ?? fallback),
    investment: round1(investment ?? fallback),
  };
  const weights = weightsFor(i.target ?? null);
  const total = round1(COMPONENTS.reduce((s, c) => s + components[c] * weights[c], 0));
  return { total, band: bandFor(total), components, estimated, weights };
}

/** Builds the inputs from a `scores` row and plan data. */
export function readinessFromRows(score: any, plan: { completeness: number | null; review: number | null }, planReadiness: number | null, target: TargetOutcome = null): ReadinessResult {
  return computeReadiness({
    blockScores: score?.block_scores ?? null,
    marketSubscore: num(score?.market_subscore),
    customerSubscore: num(score?.customer_subscore),
    investorSubscore: num(score?.investor_subscore),
    evidenceCompleteness: num(score?.evidence_completeness),
    planCompleteness: plan.completeness,
    planReview: plan.review,
    planReadiness,
    target,
  });
}
