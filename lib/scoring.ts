/**
 * RENZOLO OS™ — Founder BMC Readiness Scoring Engine
 *
 * Pure, framework-independent logic (no imports) so it can be unit tested
 * without a database, a server, or any external package. This is the same
 * module the API route (app/api/score/route.ts) calls after saving a
 * founder's block responses.
 *
 * IMPORTANT — Keep Manual (per Phase 1 spec): the WEIGHTS and TIER
 * thresholds below are a documented starting point, not a finished rubric.
 * Calibrating them against real pilot data is explicitly a manual,
 * human-reviewed step — do not treat these numbers as final without
 * advisor sign-off.
 */

export const BLOCK_KEYS = [
  "customerSegments",
  "valueProposition",
  "channels",
  "customerRelationships",
  "revenueStreams",
  "keyResources",
  "keyActivities",
  "keyPartnerships",
  "costStructure",
] as const;
export type BlockKey = (typeof BLOCK_KEYS)[number];

export const BLOCK_LABELS: Record<BlockKey, string> = {
  customerSegments: "Customer Segments",
  valueProposition: "Value Proposition",
  channels: "Channels",
  customerRelationships: "Customer Relationships",
  revenueStreams: "Revenue Streams",
  keyResources: "Key Resources",
  keyActivities: "Key Activities",
  keyPartnerships: "Key Partnerships",
  costStructure: "Cost Structure",
};

export const MEASURE_KEYS = [
  "clarity",
  "evidence",
  "economics",
  "scalability",
  "defensibility",
  "risk",
] as const;
export type MeasureKey = (typeof MEASURE_KEYS)[number];

export type BlockMeasureScores = Record<MeasureKey, number>;
export type AllBlockScores = Record<BlockKey, BlockMeasureScores>;

export interface VentureScoreResult {
  score: number;
  tier: "Institutional Ready" | "Growth Ready" | "Developing" | "Early Stage" | "Concept Stage";
}

export interface SubScores {
  market: number;
  customer: number;
  investor: number;
}

export interface HealthIndexResult {
  index: number;
  confidence: "High" | "Moderate" | "Low";
  evidenceCompleteness: number;
}

export interface DiagnosticResult {
  ventureScore: VentureScoreResult;
  subScores: SubScores;
  healthIndex: HealthIndexResult;
  blockScores: Record<BlockKey, number>;
  gaps: { block: BlockKey; label: string; score: number; weakestMeasure: MeasureKey }[];
}

function clamp(n: number, lo = 0, hi = 100): number {
  return Math.max(lo, Math.min(hi, n));
}

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

export function computeBlockScore(measures: BlockMeasureScores): number {
  const values = MEASURE_KEYS.map((k) => clamp(measures[k] ?? 0));
  return Math.round(average(values) * 10) / 10;
}

export function computeAllBlockScores(all: AllBlockScores): Record<BlockKey, number> {
  const out = {} as Record<BlockKey, number>;
  for (const block of BLOCK_KEYS) {
    out[block] = computeBlockScore(all[block]);
  }
  return out;
}

export function computeVentureScore(blockScores: Record<BlockKey, number>): VentureScoreResult {
  const score = Math.round(average(Object.values(blockScores)) * 10) / 10;
  let tier: VentureScoreResult["tier"];
  if (score >= 90) tier = "Institutional Ready";
  else if (score >= 75) tier = "Growth Ready";
  else if (score >= 60) tier = "Developing";
  else if (score >= 40) tier = "Early Stage";
  else tier = "Concept Stage";
  return { score, tier };
}

/** Sub-score rubric — APPROVED by the founder for launch (unlike the
 * venture-tier thresholds and block weights elsewhere in this file,
 * which remain Keep Manual pending real pilot data). Each of the three
 * readiness dimensions weights BOTH which blocks matter (blockWeights)
 * AND which of the six measures within those blocks matter most for
 * that dimension (measureWeights) — a market case hinges on clarity/
 * scalability, a customer case on evidence/economics, and an investor
 * case on economics/risk/defensibility, rather than treating all six
 * measures as equally relevant to all three readiness types. Still open
 * to revision as real pilot data comes in, but not pending sign-off. */
interface SubScoreRubric {
  blockWeights: Partial<Record<BlockKey, number>>;
  measureWeights: Partial<Record<MeasureKey, number>>;
}

const SUBSCORE_RUBRICS: Record<keyof SubScores, SubScoreRubric> = {
  market: {
    blockWeights: { customerSegments: 0.35, channels: 0.35, valueProposition: 0.3 },
    measureWeights: { scalability: 0.35, clarity: 0.35, evidence: 0.075, economics: 0.075, defensibility: 0.075, risk: 0.075 },
  },
  customer: {
    blockWeights: { customerSegments: 0.3, customerRelationships: 0.4, revenueStreams: 0.3 },
    measureWeights: { evidence: 0.35, economics: 0.35, clarity: 0.075, scalability: 0.075, defensibility: 0.075, risk: 0.075 },
  },
  investor: {
    blockWeights: { revenueStreams: 0.3, costStructure: 0.25, keyResources: 0.2, keyPartnerships: 0.25 },
    measureWeights: { economics: 0.3, risk: 0.25, defensibility: 0.25, clarity: 0.0667, evidence: 0.0667, scalability: 0.0666 },
  },
};

/** A funder discounts unverified claims — a high self-reported Investor
 * Readiness score backed by little real evidence should read lower, not
 * be taken at face value. Keep Manual: a reasoned starting multiplier,
 * not a calibrated one. */
const INVESTOR_CONFIDENCE_MULTIPLIER: Record<HealthIndexResult["confidence"], number> = {
  High: 1.0,
  Moderate: 0.9,
  Low: 0.75,
};

function weightedMeasureScore(measures: BlockMeasureScores, weights: Partial<Record<MeasureKey, number>>): number {
  let total = 0;
  let weightSum = 0;
  for (const [measure, weight] of Object.entries(weights) as [MeasureKey, number][]) {
    total += clamp(measures[measure] ?? 0) * weight;
    weightSum += weight;
  }
  return weightSum > 0 ? total / weightSum : 0;
}

function weightedRubricScore(all: AllBlockScores, rubric: SubScoreRubric): number {
  let total = 0;
  let weightSum = 0;
  for (const [block, weight] of Object.entries(rubric.blockWeights) as [BlockKey, number][]) {
    total += weightedMeasureScore(all[block], rubric.measureWeights) * weight;
    weightSum += weight;
  }
  return weightSum > 0 ? Math.round((total / weightSum) * 10) / 10 : 0;
}

/** healthConfidence is optional so this stays backward-compatible for any
 * caller that only has block scores on hand, but runDiagnostic always
 * supplies it — the confidence modifier only ever applies to Investor
 * Readiness (see INVESTOR_CONFIDENCE_MULTIPLIER above), never to Market
 * or Customer Readiness. */
export function computeSubScores(all: AllBlockScores, healthConfidence?: HealthIndexResult["confidence"]): SubScores {
  const market = weightedRubricScore(all, SUBSCORE_RUBRICS.market);
  const customer = weightedRubricScore(all, SUBSCORE_RUBRICS.customer);
  let investor = weightedRubricScore(all, SUBSCORE_RUBRICS.investor);
  if (healthConfidence) {
    investor = Math.round(investor * INVESTOR_CONFIDENCE_MULTIPLIER[healthConfidence] * 10) / 10;
  }
  return { market, customer, investor };
}

export function computeHealthIndex(
  all: AllBlockScores,
  blockScores: Record<BlockKey, number>,
  evidenceUploadedByBlock: Record<BlockKey, boolean>
): HealthIndexResult {
  const index = Math.round(average(Object.values(blockScores)) * 10) / 10;
  const evidenceMeasureAvg = average(BLOCK_KEYS.map((b) => all[b]?.evidence ?? 0));
  const uploadedCount = BLOCK_KEYS.filter((b) => evidenceUploadedByBlock[b]).length;
  const evidenceCompleteness = Math.round(((uploadedCount / BLOCK_KEYS.length) * 0.5 + (evidenceMeasureAvg / 100) * 0.5) * 100) / 100;

  let confidence: HealthIndexResult["confidence"];
  if (evidenceCompleteness >= 0.7) confidence = "High";
  else if (evidenceCompleteness >= 0.4) confidence = "Moderate";
  else confidence = "Low";

  return { index, confidence, evidenceCompleteness };
}

export function computeGaps(all: AllBlockScores, blockScores: Record<BlockKey, number>, topN = 3) {
  const ranked = BLOCK_KEYS.map((block) => {
    const measures = all[block];
    const weakest = MEASURE_KEYS.reduce((worst, m) => (measures[m] < measures[worst] ? m : worst), MEASURE_KEYS[0]);
    return { block, label: BLOCK_LABELS[block], score: blockScores[block], weakestMeasure: weakest };
  });
  return ranked.sort((a, b) => a.score - b.score).slice(0, topN);
}

export function runDiagnostic(all: AllBlockScores, evidenceUploadedByBlock: Record<BlockKey, boolean>): DiagnosticResult {
  const blockScores = computeAllBlockScores(all);
  const healthIndex = computeHealthIndex(all, blockScores, evidenceUploadedByBlock);
  return {
    ventureScore: computeVentureScore(blockScores),
    subScores: computeSubScores(all, healthIndex.confidence),
    healthIndex,
    blockScores,
    gaps: computeGaps(all, blockScores),
  };
}
