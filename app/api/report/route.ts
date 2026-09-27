import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateDiagnosticReport } from "@/lib/anthropic";
import { extractNextSteps } from "@/lib/recommendations";

const SLA_MIN_HOURS = Number(process.env.ADVISOR_REVIEW_SLA_MIN_HOURS ?? 24);
const SLA_MAX_HOURS = Number(process.env.ADVISOR_REVIEW_SLA_MAX_HOURS ?? 36);

/** POST /api/report { assessmentId, scoreId }
 * Gated behind an active subscription (Registered/paid entitlement — see
 * the Phase 1 spec's entitlement table). Generates the AI Diagnostic
 * Report and returns it in THIS response — delivery to the founder is
 * instant, not held for review.
 *
 * Whether the report is additionally queued for a human advisor to read
 * (review_due_by set, advisor_reviewed false) depends on
 * app_settings.qa_review_enabled (an admin-flippable, no-redeploy
 * setting — see /advisor and app/api/admin/qa-setting) OR on this
 * specific report's confidence: a Low-confidence report (thin
 * self-reported evidence) is always queued for review regardless of the
 * global setting, since that is exactly the case where an AI-drafted
 * report is most likely to need a human sanity check before anyone
 * downstream relies on it. Either way, this never gates what the
 * founder already received above. */
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
  const { data: blockRows } = await supabase
    .from("block_responses")
    .select("block_key, current_state, future_state, goal_target")
    .eq("assessment_id", assessmentId);

  if (!assessment || !score) return NextResponse.json({ error: "Assessment or score not found" }, { status: 404 });

  const blockNarratives = Object.fromEntries(
    (blockRows ?? []).map((b) => [
      b.block_key,
      { currentState: b.current_state ?? "", futureState: b.future_state ?? "", goalTarget: b.goal_target ?? "" },
    ])
  );

  const diagnosticMarkdown = await generateDiagnosticReport({
    founderName: profile?.full_name ?? "Founder",
    ventureStage: assessment.venture_stage ?? "",
    industry: assessment.industry ?? "",
    geography: assessment.geography ?? "",
    timeHorizon: assessment.time_horizon ?? "",
    businessType: assessment.business_type ?? "",
    employeeCount: assessment.employee_count ?? "",
    yearsInBusiness: assessment.years_in_business ?? "",
    annualRevenue: assessment.annual_revenue ?? "",
    diagnostic: {
      ventureScore: { score: score.venture_score, tier: score.venture_tier },
      subScores: { market: score.market_subscore, customer: score.customer_subscore, investor: score.investor_subscore },
      healthIndex: { index: score.health_index, confidence: score.health_confidence, evidenceCompleteness: score.evidence_completeness },
      blockScores: score.block_scores,
      gaps: score.gaps,
    },
    blockNarratives,
  });

  // app_settings is read via the admin (service-role) client so this
  // works regardless of the founder's own RLS grants — only admins can
  // change the value (see app/api/admin/qa-setting), founders never
  // need direct access to it.
  const admin = createAdminClient();
  const { data: settings } = await admin.from("app_settings").select("qa_review_enabled").eq("id", true).single();
  const qaEnabled = settings?.qa_review_enabled ?? true;
  const lowConfidence = score.health_confidence === "Low";
  const requiresReview = qaEnabled || lowConfidence;

  const reviewDueBy = requiresReview ? new Date(Date.now() + SLA_MAX_HOURS * 60 * 60 * 1000).toISOString() : null;

  const { data: report, error } = await supabase
    .from("reports")
    .insert({
      assessment_id: assessmentId,
      score_id: scoreId,
      diagnostic_markdown: diagnosticMarkdown,
      advisor_reviewed: !requiresReview,
      review_due_by: reviewDueBy,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Pull the AI's own "Recommended Next Steps" bullets out as structured
  // rows (source: 'ai') so the founder's Recommendations tool (/tools)
  // can show them as data, alongside anything a human advisor/coach adds
  // (source: 'advisor', see app/api/recommendations). Best-effort: if
  // the model didn't include the heading for some reason, this is just
  // an empty array and never blocks report delivery above.
  const nextSteps = extractNextSteps(diagnosticMarkdown);
  if (nextSteps.length > 0) {
    await supabase.from("recommendations").insert(
      nextSteps.map((title) => ({
        assessment_id: assessmentId,
        report_id: report.id,
        source: "ai" as const,
        title,
      }))
    );
  }

  const message = requiresReview
    ? `Here's your Diagnostic Report. An advisor will review it in the background within ${SLA_MIN_HOURS}-${SLA_MAX_HOURS} hours as quality assurance — you don't need to wait for that.`
    : "Here's your Diagnostic Report.";

  return NextResponse.json({ report, message });
}
