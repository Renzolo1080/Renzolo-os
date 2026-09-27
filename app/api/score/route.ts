import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { runDiagnostic, BLOCK_KEYS, type AllBlockScores, type BlockKey } from "@/lib/scoring";

interface BlockSubmission {
  currentState: string;
  futureState: string;
  goalTarget: string;
  evidenceUploaded: boolean;
  measures: { clarity: number; evidence: number; economics: number; scalability: number; defensibility: number; risk: number };
}

/** POST /api/score
 * Body: { ventureStage, industry, geography, timeHorizon, blocks: Record<BlockKey, BlockSubmission> }
 * Saves the full 9-block assessment and computes the Venture Score,
 * sub-scores, and Health Index in one pass — this is the "Launch MVP"
 * shortcut (self-assessment produces the six measures directly); advisor
 * interview refinement on paid tiers is a fast-follow, not this route.
 */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json();
  const blocks: Record<BlockKey, BlockSubmission> = body.blocks;

  for (const key of BLOCK_KEYS) {
    if (!blocks[key]) {
      return NextResponse.json({ error: `Missing block: ${key}` }, { status: 400 });
    }
  }

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      founder_id: user.id,
      status: "scored",
      venture_stage: body.ventureStage,
      industry: body.industry,
      geography: body.geography,
      time_horizon: body.timeHorizon,
      submitted_at: new Date().toISOString(),
      scored_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (assessmentError || !assessment) {
    return NextResponse.json({ error: assessmentError?.message ?? "Failed to create assessment" }, { status: 500 });
  }

  const blockRows = BLOCK_KEYS.map((key) => ({
    assessment_id: assessment.id,
    block_key: key,
    current_state: blocks[key].currentState,
    future_state: blocks[key].futureState,
    goal_target: blocks[key].goalTarget,
    evidence_uploaded: blocks[key].evidenceUploaded,
    measures: blocks[key].measures,
  }));

  const { error: blockError } = await supabase.from("block_responses").insert(blockRows);
  if (blockError) return NextResponse.json({ error: blockError.message }, { status: 500 });

  const all: AllBlockScores = {} as AllBlockScores;
  const evidenceByBlock = {} as Record<BlockKey, boolean>;
  for (const key of BLOCK_KEYS) {
    all[key] = blocks[key].measures;
    evidenceByBlock[key] = blocks[key].evidenceUploaded;
  }
  const diagnostic = runDiagnostic(all, evidenceByBlock);

  const { data: scoreRow, error: scoreError } = await supabase
    .from("scores")
    .insert({
      assessment_id: assessment.id,
      venture_score: diagnostic.ventureScore.score,
      venture_tier: diagnostic.ventureScore.tier,
      market_subscore: diagnostic.subScores.market,
      customer_subscore: diagnostic.subScores.customer,
      investor_subscore: diagnostic.subScores.investor,
      health_index: diagnostic.healthIndex.index,
      health_confidence: diagnostic.healthIndex.confidence,
      evidence_completeness: diagnostic.healthIndex.evidenceCompleteness,
      block_scores: diagnostic.blockScores,
      gaps: diagnostic.gaps,
    })
    .select()
    .single();

  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 });

  return NextResponse.json({ assessmentId: assessment.id, scoreId: scoreRow.id, diagnostic });
}
