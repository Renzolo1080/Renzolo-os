import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizePlan, planFromAssessment, type StrategicPlan } from "./plan";
import { DETAIL_AREAS_REQUIRED } from "./quickcheck";

/** Reads what the Plan Builder, plan review, Market Intelligence and the
 * dashboard need. `db` is the founder's own session, so row-level
 * security limits every read to their own rows. */

export interface LatestAssessment {
  scoreId: string;
  scoreCreatedAt: string;
  assessmentId: string;
  assessment: any;
  score: any;
  gapKeys: string[];
  blocks: { block_key: string; current_state: string | null; future_state: string | null; goal_target: string | null; target_date: string | null }[];
}

export async function loadLatestAssessment(db: SupabaseClient, founderId: string): Promise<LatestAssessment | null> {
  const { data: score } = await db
    .from("scores")
    .select("*, assessments!inner(*)")
    .eq("assessments.founder_id", founderId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!score) return null;
  const { data: blocks } = await db
    .from("block_responses")
    .select("block_key, current_state, future_state, goal_target, target_date")
    .eq("assessment_id", score.assessment_id);
  return {
    scoreId: score.id,
    scoreCreatedAt: score.created_at,
    assessmentId: score.assessment_id,
    assessment: (score as any).assessments,
    score,
    gapKeys: ((score.gaps as any[] | null) ?? []).map((g) => g.block).slice(0, DETAIL_AREAS_REQUIRED),
    blocks: (blocks ?? []) as LatestAssessment["blocks"],
  };
}

export interface PlanRow {
  id: string;
  data: StrategicPlan;
  completeness: number;
  updated_at: string;
  assessment_id: string | null;
}

/** The founder's saved plan, or null if they haven't started one. */
export async function loadPlan(db: SupabaseClient, founderId: string): Promise<PlanRow | null> {
  const { data } = await db.from("strategic_plans").select("id, data, completeness, updated_at, assessment_id").eq("founder_id", founderId).maybeSingle();
  if (!data) return null;
  return { ...(data as any), data: sanitizePlan((data as any).data) };
}

/** The saved plan, or a new one pre-filled from the assessment. */
export function planOrStarter(row: PlanRow | null, latest: LatestAssessment | null): { plan: StrategicPlan; isNew: boolean } {
  if (row) return { plan: row.data, isNew: false };
  return {
    plan: planFromAssessment({
      planLength: latest?.assessment?.extra?.planLength ?? latest?.assessment?.time_horizon ?? null,
      primaryGoal: latest?.assessment?.extra?.primaryGoal ?? null,
      blocks: latest?.blocks ?? [],
      gapKeys: latest?.gapKeys ?? [],
    }),
    isNew: true,
  };
}
