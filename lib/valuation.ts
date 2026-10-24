/**
 * RENZOLO OS™ — Instant Venture Valuation Estimate
 *
 * Pure, framework-independent logic (mirrors lib/scoring.ts) so it is
 * unit-testable without a database or network call. Computes a directional
 * valuation RANGE from data the founder has already provided — no extra
 * financial disclosure required — using one of two well-established,
 * low-complexity early-stage methods:
 *
 *  - "qualitative" (Berkus-style): for pre-revenue ventures. Five factors
 *    (idea/value prop, team/execution, strategic relationships, market
 *    rollout, financial soundness) each contribute up to a base cap,
 *    scaled by how strongly the founder's own BMC block scores support
 *    them.
 *  - "revenue_multiple": for revenue-generating ventures. The founder's
 *    stated annual revenue bucket times an industry-agnostic multiple
 *    range, widened or narrowed by overall Venture Score tier.
 *
 * APPROVED by the founder for launch: the methodology (qualitative for
 * pre-revenue, revenue-multiple once there's revenue) and the specific
 * base caps / multiple ranges below are signed off as the initial
 * launch rubric — a documented, deliberately conservative starting
 * point for African MSME/early-stage ventures, not a market-validated
 * model, but no longer a pending decision. Still open to revision as
 * real pilot data comes in, same as the rest of this codebase's
 * calibration practice. This is a directional estimate for the
 * founder's own planning, never a formal valuation, appraisal, or
 * investment/financial advice, and the UI must say so every time this
 * number is shown — that disclaimer requirement doesn't change with
 * approval of the underlying numbers.
 */

import { BLOCK_KEYS, type BlockKey } from "./scoring";

export type ValuationMethod = "qualitative" | "revenue_multiple";

export interface ValuationResult {
  method: ValuationMethod;
  low: number;
  high: number;
  currency: "USD";
  basis: string;
}

/** Representative midpoint (USD) for each annual-revenue bucket offered
 * in app/assessment/page.tsx. Approved for launch (see file header); a
 * deliberately rough figure, especially for the open-ended top
 * bucket, and still open to revision as real data comes in. */
const REVENUE_BUCKET_MIDPOINT: Record<string, number> = {
  "Pre-revenue": 0,
  "Under $10k": 5_000,
  "$10k-$50k": 30_000,
  "$50k-$250k": 150_000,
  "$250k-$1M": 625_000,
  "$1M-$5M": 3_000_000,
  "$5M-$10M": 7_500_000,
  "$10M-$50M": 30_000_000,
  "$50M-$100M+": 75_000_000,
  // Older answers, from before the $1M+ band was split (October 2026).
  "$1M+": 1_500_000,
};

export function revenueBucketMidpoint(bucket: string | null | undefined): number {
  if (!bucket) return 0;
  return REVENUE_BUCKET_MIDPOINT[bucket] ?? 0;
}

/** Revenue multiple range by Venture Score tier — wider and higher for
 * more "ready" ventures, narrow and conservative for earlier ones.
 * Approved for launch (see file header): a documented starting point,
 * not a benchmarked figure, still open to revision as real data comes in. */
const MULTIPLE_BY_TIER: Record<string, { low: number; high: number }> = {
  "Concept Stage": { low: 0.3, high: 0.6 },
  "Early Stage": { low: 0.5, high: 1.0 },
  Developing: { low: 0.8, high: 1.5 },
  "Growth Ready": { low: 1.2, high: 2.5 },
  "Institutional Ready": { low: 2.0, high: 4.0 },
};

/** Base cap (USD) each of the five Berkus-style factors can contribute
 * at a perfect (100/100) score. Deliberately modest and MSME-scaled
 * rather than US venture-scale ($500k/factor). Approved for launch. */
const QUALITATIVE_FACTOR_CAP = 20_000;

interface QualitativeFactor {
  label: string;
  blocks: BlockKey[];
}

const QUALITATIVE_FACTORS: QualitativeFactor[] = [
  { label: "Idea & value proposition strength", blocks: ["valueProposition"] },
  { label: "Team & execution capability", blocks: ["keyResources", "keyActivities"] },
  { label: "Strategic relationships", blocks: ["keyPartnerships"] },
  { label: "Market rollout readiness", blocks: ["channels", "customerSegments"] },
  { label: "Financial soundness", blocks: ["revenueStreams", "costStructure"] },
];

function average(nums: number[]): number {
  if (nums.length === 0) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function computeQualitativeValuation(blockScores: Record<BlockKey, number>): ValuationResult {
  let total = 0;
  const parts: string[] = [];
  for (const factor of QUALITATIVE_FACTORS) {
    const scoreAvg = average(factor.blocks.map((b) => blockScores[b] ?? 0));
    const contribution = (scoreAvg / 100) * QUALITATIVE_FACTOR_CAP;
    total += contribution;
    parts.push(`${factor.label}: $${Math.round(contribution).toLocaleString()}`);
  }
  return {
    method: "qualitative",
    low: Math.round(total * 0.7),
    high: Math.round(total * 1.3),
    currency: "USD",
    basis: `Qualitative (pre-revenue) estimate from your assessment scores — ${parts.join("; ")}.`,
  };
}

function computeRevenueMultipleValuation(annualRevenue: string, ventureTier: string): ValuationResult {
  const revenue = revenueBucketMidpoint(annualRevenue);
  const multiple = MULTIPLE_BY_TIER[ventureTier] ?? MULTIPLE_BY_TIER["Early Stage"];
  return {
    method: "revenue_multiple",
    low: Math.round(revenue * multiple.low),
    high: Math.round(revenue * multiple.high),
    currency: "USD",
    basis: `Revenue-multiple estimate: ~$${revenue.toLocaleString()}/yr (from your "${annualRevenue}" bucket) × ${multiple.low}–${multiple.high} (your "${ventureTier}" tier).`,
  };
}

export interface ValuationComputeInput {
  ventureTier: string;
  annualRevenue: string | null | undefined;
  blockScores: Record<BlockKey, number>;
}

/** Picks the qualitative or revenue-multiple method based on whether the
 * founder reported any revenue, and computes the estimate. Always
 * returns a low/high range, never a single point figure. */
export function computeValuation(input: ValuationComputeInput): ValuationResult {
  const hasRevenue = !!input.annualRevenue && input.annualRevenue !== "Pre-revenue" && input.annualRevenue !== "";
  if (hasRevenue) {
    return computeRevenueMultipleValuation(input.annualRevenue as string, input.ventureTier);
  }
  return computeQualitativeValuation(input.blockScores);
}

export { BLOCK_KEYS };
