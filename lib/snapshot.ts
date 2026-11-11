import { runDiagnostic, BLOCK_LABELS, type BlockKey } from "./scoring";
import { computeValuation } from "./valuation";
import { computeReadiness } from "./readiness";
import {
  quickCheckToScoringInput,
  applyPlanToMeasures,
  computePlanScore,
  snapshotRecommendation,
  type QuickProfile,
  type QuickCheckSubmission,
  type PlanSubmission,
} from "./quickcheck";

/** Scores a Readiness Snapshot (pure: no database). Used by the public
 * Snapshot, by a member retaking it, and when a new member's earlier
 * public Snapshot is carried into their account. */
export function scoreSnapshot(profile: QuickProfile, quick: QuickCheckSubmission, plan: PlanSubmission) {
  const base = quickCheckToScoringInput(quick);
  const measures = applyPlanToMeasures(base.measures, plan);
  const evidenceByBlock = base.evidenceByBlock;
  const diagnostic = runDiagnostic(measures, evidenceByBlock);
  const valuation = computeValuation({
    ventureTier: diagnostic.ventureScore.tier,
    annualRevenue: profile.annualRevenue,
    blockScores: diagnostic.blockScores,
  });
  const planScore = computePlanScore(plan);
  return { measures, evidenceByBlock, diagnostic, valuation, planScore };
}

export interface SnapshotOverview {
  /** Total Readiness Score (lib/readiness.ts), the same number the dashboard shows. */
  score: number;
  /** Ready, Nearly ready, Getting ready or Not yet. */
  band: string;
  planScore: number;
  strongest: string | null;
  weakest: string[];
  recommendation: string;
  /** Where to point the founder next (see snapshotNextStep). */
  nextStep: SnapshotNextStep;
}

/** The next step a Snapshot points to, from answers already asked (revenue
 * band, timeframe, funding need, goal) — no extra questions, so the Snapshot
 * stays short:
 * - "elevate": an established business (US$250k+ a year) that wants results
 *   within 6 months, needs funding, or wants investors or contracts — offered
 *   a conversation about Elevate and matching.
 * - "essentials": an early-stage business (pre-revenue or under US$10k, or
 *   still getting first customers or registering) — pointed to Essentials.
 * - "assessment": everyone else — the $60 Readiness Assessment first. */
export type SnapshotNextStep = "elevate" | "assessment" | "essentials";

const ESTABLISHED_BANDS = ["$250k-$1M", "$1M-$5M", "$5M-$10M", "$10M-$50M", "$50M-$100M+"];
const EARLY_BANDS = ["Pre-revenue", "Under $10k"];
const SOON = ["3 months", "6 months"];
const BIG_GOALS = ["Become ready for investors or loans", "Win corporate or government contracts"];
const EARLY_GOALS = ["Get my first paying customers", "Formalise and register my business"];

export function snapshotNextStep(p: Pick<QuickProfile, "annualRevenue" | "timeHorizon" | "fundingNeed" | "primaryGoal">): SnapshotNextStep {
  if (ESTABLISHED_BANDS.includes(p.annualRevenue) && (SOON.includes(p.timeHorizon) || p.fundingNeed === "Yes" || BIG_GOALS.includes(p.primaryGoal))) return "elevate";
  if (EARLY_BANDS.includes(p.annualRevenue) || EARLY_GOALS.includes(p.primaryGoal)) return "essentials";
  return "assessment";
}

/** The short overview a founder sees for free. Names areas; explains none. */
export function snapshotOverview(profile: QuickProfile, scored: ReturnType<typeof scoreSnapshot>): SnapshotOverview {
  const { diagnostic, planScore } = scored;
  const weakest = diagnostic.gaps.slice(0, 3).map((g) => g.label);
  const entries = Object.entries(diagnostic.blockScores) as [BlockKey, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  const readiness = computeReadiness({
    blockScores: diagnostic.blockScores,
    marketSubscore: diagnostic.subScores.market,
    customerSubscore: diagnostic.subScores.customer,
    investorSubscore: diagnostic.subScores.investor,
    evidenceCompleteness: diagnostic.healthIndex.evidenceCompleteness,
    planCompleteness: null,
    planReview: null,
    planReadiness: planScore,
    target: null,
  });
  return {
    score: readiness.total,
    band: readiness.band,
    planScore,
    strongest: top ? BLOCK_LABELS[top[0]] : null,
    weakest,
    recommendation: snapshotRecommendation({ planScore, weakest, primaryGoal: profile.primaryGoal, challenges: profile.challenges }),
    nextStep: snapshotNextStep(profile),
  };
}
