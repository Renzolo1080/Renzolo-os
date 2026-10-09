import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateDiagnosticReport } from "@/lib/anthropic";
import { extractNextSteps } from "@/lib/recommendations";
import { isSubscriptionActive } from "@/lib/payments";

/** The longest this route may run on Vercel, in seconds. Above the
 * report's own 150-second ceiling (REPORT_TIMEOUT_MS in lib/anthropic.ts)
 * with room to save the result. */
export const maxDuration = 180;

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
    .select("status, current_period_end, auto_renew")
    .eq("founder_id", user.id)
    .maybeSingle();

  if (!isSubscriptionActive(subscription)) {
    return NextResponse.json({ error: "Full report requires an active subscription." }, { status: 402 });
  }

  const body = (await req.json().catch(() => null)) as { assessmentId?: unknown; scoreId?: unknown } | null;
  const assessmentId = typeof body?.assessmentId === "string" ? body.assessmentId : null;
  const scoreId = typeof body?.scoreId === "string" ? body.scoreId : null;
  if (!assessmentId || !scoreId) return NextResponse.json({ error: "Missing assessmentId or scoreId" }, { status: 400 });

  // One report per score. If it already exists (a double-click, a second
  // tab, a reload half-way through), hand that one back instead of paying
  // for the AI and web searches again.
  const { data: existing } = await supabase
    .from("reports")
    .select("*")
    .eq("score_id", scoreId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (existing) return NextResponse.json({ report: existing, message: "Here's your Diagnostic Report." });

  const { data: assessment } = await supabase.from("assessments").select("*").eq("id", assessmentId).single();
  const { data: score } = await supabase.from("scores").select("*").eq("id", scoreId).single();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const { data: blockRows } = await supabase
    .from("block_responses")
    .select("block_key, current_state, future_state, goal_target")
    .eq("assessment_id", assessmentId);

  if (!assessment || !score || score.assessment_id !== assessment.id) {
    return NextResponse.json({ error: "Assessment or score not found" }, { status: 404 });
  }

  const blockNarratives = Object.fromEntries(
    (blockRows ?? []).map((b) => [
      b.block_key,
      { currentState: b.current_state ?? "", futureState: b.future_state ?? "", goalTarget: b.goal_target ?? "" },
    ])
  );

  let diagnosticMarkdown: string;
  try {
    diagnosticMarkdown = await generateDiagnosticReport({
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
  } catch (e) {
    // Nothing has been saved or charged to the founder at this point, so
    // it is safe for them to simply try again.
    console.error("Report generation failed:", e);
    const timedOut = e instanceof Error && /timed? ?out|timeout/i.test(`${e.name} ${e.message}`);
    return NextResponse.json(
      {
        error: timedOut
          ? "Your report took too long to generate. Please try again in a minute."
          : "We couldn't generate your report just now. Please try again in a minute.",
      },
      { status: 502 }
    );
  }

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

  // Written with the service role for the same reason as scores: founders
  // have read-only access to reports. Ownership was checked above — the
  // assessment and score were both fetched through the founder's own
  // session, which only returns rows they own.
  const { data: report, error } = await admin
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
      nextSteps.map((title, index) => ({
        assessment_id: assessmentId,
        report_id: report.id,
        source: "ai" as const,
        title,
        priority: index,
      }))
    );
  }

  const message = requiresReview
    ? `Here's your Diagnostic Report. An advisor will review it in the background within ${SLA_MIN_HOURS}-${SLA_MAX_HOURS} hours as quality assurance — you don't need to wait for that.`
    : "Here's your Diagnostic Report.";

  return NextResponse.json({ report, message });
}
