import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { runDiagnostic, BLOCK_KEYS } from "@/lib/scoring";
import { computeValuation } from "@/lib/valuation";
import { parseProfile, parseQuickCheck, quickCheckToScoringInput } from "@/lib/quickcheck";

/** POST /api/score — submits the free Quick Check.
 * Body: { profile: QuickProfile, answers: Record<BlockKey, 0-3>, evidence: BlockKey[] }
 *
 * Every answer is checked against the fixed list of choices
 * (lib/quickcheck.ts) before anything is saved. Saves the assessment and
 * one block response per business area, then computes and saves the
 * Venture Score, sub-scores, Health Index, gaps and valuation.
 *
 * The detailed written questions (current state, future state, goal,
 * target date) are NOT part of this. A subscriber answers them later for
 * their weakest areas (app/api/assessment/details), which refines the
 * score and feeds the AI report. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { profile?: unknown; answers?: unknown; evidence?: unknown } | null;
  const profile = parseProfile(body?.profile);
  if (!profile.ok) return NextResponse.json({ error: profile.error }, { status: 400 });
  const quick = parseQuickCheck({ answers: body?.answers, evidence: body?.evidence });
  if (!quick.ok) return NextResponse.json({ error: quick.error }, { status: 400 });
  const p = profile.value;

  const now = new Date().toISOString();
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      founder_id: user.id,
      status: "scored",
      venture_stage: p.ventureStage,
      industry: p.industry,
      geography: p.country,
      time_horizon: p.timeHorizon,
      business_type: p.businessType,
      employee_count: p.teamSize,
      years_in_business: p.yearsInBusiness,
      annual_revenue: p.annualRevenue,
      extra: {
        primaryGoal: p.primaryGoal,
        fundingNeed: p.fundingNeed,
        registration: p.registration,
        challenges: p.challenges,
        heardFrom: p.heardFrom,
        source: "quick_check",
      },
      submitted_at: now,
      scored_at: now,
    })
    .select()
    .single();

  if (assessmentError || !assessment) {
    return NextResponse.json({ error: assessmentError?.message ?? "Failed to save your answers" }, { status: 500 });
  }

  const { measures, evidenceByBlock } = quickCheckToScoringInput(quick.value);

  const { error: blockError } = await supabase.from("block_responses").insert(
    BLOCK_KEYS.map((key) => ({
      assessment_id: assessment.id,
      block_key: key,
      evidence_uploaded: evidenceByBlock[key],
      measures: measures[key],
    }))
  );
  if (blockError) return NextResponse.json({ error: blockError.message }, { status: 500 });

  // Remember the founder's country on their profile if they haven't set
  // one: it decides advisor-session pricing and which local currency they
  // are offered (lib/pricing.ts). Never overwrites a country already set.
  await supabase.from("profiles").update({ country: p.country, venture_stage: p.ventureStage, industry: p.industry }).eq("id", user.id).is("country", null);

  const diagnostic = runDiagnostic(measures, evidenceByBlock);
  const valuation = computeValuation({
    ventureTier: diagnostic.ventureScore.tier,
    annualRevenue: p.annualRevenue,
    blockScores: diagnostic.blockScores,
  });

  // Scores are written with the service role, not the founder's own
  // session: founders have read-only access to scores (see
  // supabase/schema.sql) so a Venture Score can't be fabricated from the
  // browser. Ownership is already established here — the assessment row
  // above was just created under this founder's own session.
  const { data: scoreRow, error: scoreError } = await createAdminClient()
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
      valuation_low: valuation.low,
      valuation_high: valuation.high,
      valuation_method: valuation.method,
      valuation_basis: valuation.basis,
    })
    .select()
    .single();

  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 });

  return NextResponse.json({
    assessmentId: assessment.id,
    scoreId: scoreRow.id,
    ventureScore: diagnostic.ventureScore,
    gaps: diagnostic.gaps.map((g) => g.label),
  });
}
