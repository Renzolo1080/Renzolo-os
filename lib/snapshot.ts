import { runDiagnostic, BLOCK_LABELS, type BlockKey } from "./scoring";
import { computeValuation } from "./valuation";
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
  ventureScore: number;
  tier: string;
  planScore: number;
  strongest: string | null;
  weakest: string[];
  recommendation: string;
}

/** The short overview a founder sees for free. Names areas; explains none. */
export function snapshotOverview(profile: QuickProfile, scored: ReturnType<typeof scoreSnapshot>): SnapshotOverview {
  const { diagnostic, planScore } = scored;
  const weakest = diagnostic.gaps.slice(0, 3).map((g) => g.label);
  const entries = Object.entries(diagnostic.blockScores) as [BlockKey, number][];
  const top = entries.sort((a, b) => b[1] - a[1])[0];
  return {
    ventureScore: diagnostic.ventureScore.score,
    tier: diagnostic.ventureScore.tier,
    planScore,
    strongest: top ? BLOCK_LABELS[top[0]] : null,
    weakest,
    recommendation: snapshotRecommendation({ planScore, weakest, primaryGoal: profile.primaryGoal, challenges: profile.challenges }),
  };
}
