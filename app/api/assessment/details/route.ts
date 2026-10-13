import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { runDiagnostic, BLOCK_KEYS, MEASURE_KEYS, type AllBlockScores, type BlockKey, type BlockMeasureScores } from "@/lib/scoring";
import { computeValuation } from "@/lib/valuation";
import { loadMembership } from "@/lib/membership-server";
import { TIME_HORIZONS, DETAIL_AREAS_REQUIRED } from "@/lib/quickcheck";
import { MEASURE_LEVELS } from "@/lib/blocks";

const clampScore = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
};
const text = (v: unknown, max = 2000) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** POST /api/assessment/details { assessmentId, blocks, planLength?, finish? }
 * The full Readiness Assessment. Saves the founder's answers for any
 * areas sent (each area is saved as they go, so they can stop and come
 * back). With finish: true, and once at least DETAIL_AREAS_REQUIRED areas
 * are answered, re-scores the whole assessment (Snapshot answers for
 * areas not yet described, full answers for the rest) and saves the new
 * score. The dashboard always shows the newest score, and the report is
 * built from it. Members and founders who bought the one-time assessment.
 *
 * Each area's six measures arrive as `levels` (0-3, the multiple-choice
 * answers) and are stored as 0-100 scores; older clients sent `measures`
 * (0-100) directly, which is still accepted. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const m = await loadMembership(supabase, user.id);
  if (!m.tier && m.purchases.length === 0) {
    return NextResponse.json({ error: "The detailed questions are part of membership and the one-time Readiness Assessment." }, { status: 402 });
  }

  const body = (await req.json().catch(() => null)) as { assessmentId?: unknown; blocks?: Record<string, any>; planLength?: unknown; finish?: unknown } | null;
  const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId : null;
  if (!assessmentId || !body?.blocks || typeof body.blocks !== "object") return NextResponse.json({ error: "Missing answers" }, { status: 400 });

  // Read through the founder's own session: row-level security only
  // returns an assessment they own, so this is also the ownership check.
  const { data: assessment } = await supabase.from("assessments").select("id, annual_revenue, extra").eq("id", assessmentId).maybeSingle();
  if (!assessment) return NextResponse.json({ error: "Assessment not found" }, { status: 404 });

  // How far ahead the growth and readiness plan should go (90 days to 36 months).
  if (typeof body.planLength === "string" && (TIME_HORIZONS as readonly string[]).includes(body.planLength)) {
    const extra = { ...((assessment as any).extra ?? {}), planLength: body.planLength };
    await supabase.from("assessments").update({ extra }).eq("id", assessment.id);
  }

  const finish = body.finish === true;
  const keys = Object.keys(body.blocks).filter((k): k is BlockKey => (BLOCK_KEYS as readonly string[]).includes(k));
  if (keys.length === 0 && !finish) return NextResponse.json({ error: "Missing answers" }, { status: 400 });

  for (const key of keys) {
    const a = body.blocks[key] ?? {};
    const currentState = text(a.currentState);
    const futureState = text(a.futureState);
    if (!currentState || !futureState) return NextResponse.json({ error: "Please answer the first two questions for every area." }, { status: 400 });
    const measures = measuresFrom(a);
    if (!measures) return NextResponse.json({ error: "Please answer all six checks for every area." }, { status: 400 });
    const targetDate = typeof a.targetDate === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.targetDate) ? a.targetDate : null;
    const { error } = await supabase
      .from("block_responses")
      .update({
        current_state: currentState,
        future_state: futureState,
        goal_target: text(a.goalTarget, 500) || null,
        target_date: targetDate,
        evidence_uploaded: !!a.evidenceUploaded,
        measures,
        updated_at: new Date().toISOString(),
      })
      .eq("assessment_id", assessment.id)
      .eq("block_key", key);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const { data: rows, error: rowsError } = await supabase.from("block_responses").select("block_key, measures, evidence_uploaded, current_state").eq("assessment_id", assessment.id);
  if (rowsError || !rows || rows.length < BLOCK_KEYS.length) return NextResponse.json({ error: rowsError?.message ?? "Assessment is incomplete" }, { status: 500 });
  const answered = rows.filter((r: any) => (r.current_state ?? "").trim().length > 0).length;
  if (!finish) return NextResponse.json({ ok: true, saved: keys, answered });
  if (answered < DETAIL_AREAS_REQUIRED) {
    return NextResponse.json({ error: `Please complete at least ${DETAIL_AREAS_REQUIRED} areas first (you've done ${answered}).` }, { status: 400 });
  }

  const all = {} as AllBlockScores;
  const evidence = {} as Record<BlockKey, boolean>;
  for (const key of BLOCK_KEYS) {
    const r: any = rows.find((x: any) => x.block_key === key);
    all[key] = Object.fromEntries(MEASURE_KEYS.map((m) => [m, clampScore(r?.measures?.[m]) ?? 50])) as BlockMeasureScores;
    evidence[key] = !!r?.evidence_uploaded;
  }
  const diagnostic = runDiagnostic(all, evidence);
  const valuation = computeValuation({ ventureTier: diagnostic.ventureScore.tier, annualRevenue: assessment.annual_revenue ?? "", blockScores: diagnostic.blockScores });

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
    .select("id")
    .single();
  if (scoreError) return NextResponse.json({ error: scoreError.message }, { status: 500 });

  return NextResponse.json({ ok: true, scoreId: scoreRow.id, ventureScore: diagnostic.ventureScore, answered });
}

/** The six 0-100 measures from an area's answers, or null if any is missing. */
function measuresFrom(a: any): BlockMeasureScores | null {
  if (a?.levels && typeof a.levels === "object") {
    const out: Partial<BlockMeasureScores> = {};
    for (const m of MEASURE_KEYS) {
      const level = Number(a.levels[m]);
      if (a.levels[m] === null || !Number.isInteger(level) || level < 0 || level >= MEASURE_LEVELS.length) return null;
      out[m] = MEASURE_LEVELS[level];
    }
    return out as BlockMeasureScores;
  }
  return Object.fromEntries(MEASURE_KEYS.map((m) => [m, clampScore(a?.measures?.[m]) ?? 50])) as BlockMeasureScores;
}
