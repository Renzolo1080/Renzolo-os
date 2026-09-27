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

const SUBSCORE_WEIGHTS: Record<keyof SubScores, Partial<Record<BlockKey, number>>> = {
  market: { customerSegments: 0.35, channels: 0.35, valueProposition: 0.3 },
  customer: { customerSegments: 0.3, customerRelationships: 0.4, revenueStreams: 0.3 },
  investor: { revenueStreams: 0.3, costStructure: 0.25, keyResources: 0.2, keyPartnerships: 0.25 },
};

function weightedBlockAverage(blockScores: Record<BlockKey, number>, weights: Partial<Record<BlockKey, number>>): number {
  let total = 0;
  let weightSum = 0;
  for (const [block, weight] of Object.entries(weights) as [BlockKey, number][]) {
    total += (blockScores[block] ?? 0) * weight;
    weightSum += weight;
  }
  return weightSum > 0 ? Math.round((total / weightSum) * 10) / 10 : 0;
}

export function computeSubScores(blockScores: Record<BlockKey, number>): SubScores {
  return {
    market: weightedBlockAverage(blockScores, SUBSCORE_WEIGHTS.market),
    customer: weightedBlockAverage(blockScores, SUBSCORE_WEIGHTS.customer),
    investor: weightedBlockAverage(blockScores, SUBSCORE_WEIGHTS.investor),
  };
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
  return {
    ventureScore: computeVentureScore(blockScores),
    subScores: computeSubScores(blockScores),
    healthIndex: computeHealthIndex(all, blockScores, evidenceUploadedByBlock),
    blockScores,
    gaps: computeGaps(all, blockScores),
  };
}
