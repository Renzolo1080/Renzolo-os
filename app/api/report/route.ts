import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generateDiagnosticReport } from "@/lib/anthropic";

const SLA_MIN_HOURS = Number(process.env.ADVISOR_REVIEW_SLA_MIN_HOURS ?? 24);
const SLA_MAX_HOURS = Number(process.env.ADVISOR_REVIEW_SLA_MAX_HOURS ?? 36);

/** POST /api/report { assessmentId, scoreId }
 * Gated behind an active subscription (Registered/paid entitlement — see
 * the Phase 1 spec's entitlement table). Generates the AI Diagnostic
 * Report and returns it in THIS response — delivery to the founder is
 * instant, not held for review. `review_due_by` (24-36h by default,
 * ADVISOR_REVIEW_SLA_* env vars) drives a background quality-assurance
 * pass an advisor does afterward (see /advisor), and also backs the
 * paid 1:1 Advisor Session upsell (app/api/advisor-session/checkout) —
 * it is not a gate on this response. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("founder_id", user.id)
    .maybeSingle();

  if (!subscription || subscription.status !== "active") {
    return NextResponse.json({ error: "Full report requires an active subscription." }, { status: 402 });
  }

  const { assessmentId, scoreId } = await req.json();

  const { data: assessment } = await supabase.from("assessments").select("*").eq("id", assessmentId).single();
  const { data: score } = await supabase.from("scores").select("*").eq("id", scoreId).single();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  if (!assessment || !score) return NextResponse.json({ error: "Assessment or score not found" }, { status: 404 });

  const diagnosticMarkdown = await generateDiagnosticReport({
    founderName: profile?.full_name ?? "Founder",
    ventureStage: assessment.venture_stage ?? "unspecified",
    industry: assessment.industry ?? "unspecified",
    diagnostic: {
      ventureScore: { score: score.venture_score, tier: score.venture_tier },
      subScores: { market: score.market_subscore, customer: score.customer_subscore, investor: score.investor_subscore },
      healthIndex: { index: score.health_index, confidence: score.health_confidence, evidenceCompleteness: score.evidence_completeness },
      blockScores: score.block_scores,
      gaps: score.gaps,
    },
    blockNarratives: {},
  });

  const reviewDueBy = new Date(Date.now() + SLA_MAX_HOURS * 60 * 60 * 1000).toISOString();

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      assessment_id: assessmentId,
      score_id: scoreId,
      diagnostic_markdown: diagnosticMarkdown,
      advisor_reviewed: false,
      review_due_by: reviewDueBy,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    report,
    message: `Here's your Diagnostic Report. An advisor will review it in the background within ${SLA_MIN_HOURS}-${SLA_MAX_HOURS} hours as quality assurance — you don't need to wait for that.`,
  });
}
