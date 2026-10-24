import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { generateDiagnosticReport } from "@/lib/anthropic";
import { extractNextSteps } from "@/lib/recommendations";
import { entitlements } from "@/lib/membership";
import { loadMembership } from "@/lib/membership-server";
import { TIME_HORIZONS } from "@/lib/quickcheck";
import { loadPlan } from "@/lib/plan-server";
import { planAsText } from "@/lib/plan";
import { parsePlanReview, reviewAsText } from "@/lib/plan-review";

/** One-time assessment buyers can update their report as they finish more
 * of the assessment and build their plan: up to this many versions. */
const REPORTS_PER_PURCHASE = 3;
/** Any founder: at most this many new reports in 24 hours. */
const REPORTS_PER_DAY = 3;

/** The longest this route may run on Vercel, in seconds. Above the
 * report's own 150-second ceiling (REPORT_TIMEOUT_MS in lib/anthropic.ts)
 * with room to save the result. */
export const maxDuration = 180;

const SLA_MIN_HOURS = Number(process.env.ADVISOR_REVIEW_SLA_MIN_HOURS ?? 24);
const SLA_MAX_HOURS = Number(process.env.ADVISOR_REVIEW_SLA_MAX_HOURS ?? 36);

/** POST /api/report { assessmentId, scoreId }
 * Needs a membership (Essentials: summary report; Growth/Elevate: full)
 * or an unused one-time Readiness Assessment (full). Generates the AI
 * Readiness Report and returns it in THIS response — delivery to the founder is
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
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  // Who may have a report, and which kind (lib/membership.ts):
  //  - Growth and Elevate members: the full report;
  //  - Essentials members: the summary report;
  //  - anyone with an unused one-time Readiness Assessment ($79): one full
  //    report, which stays readable without a membership.
  const m = await loadMembership(supabase, user.id);
  const ent = entitlements(m.tier);
  const { data: usedRows } = await supabase.from("reports").select("assessment_purchase_id").not("assessment_purchase_id", "is", null);
  const uses = new Map<string, number>();
  for (const r of usedRows ?? []) uses.set((r as any).assessment_purchase_id, (uses.get((r as any).assessment_purchase_id) ?? 0) + 1);
  // A purchase not yet used, or else the newest one with versions left.
  const unusedPurchase = m.purchases.find((p) => !uses.has(p.id)) ?? m.purchases.find((p) => (uses.get(p.id) ?? 0) < REPORTS_PER_PURCHASE) ?? null;
  const usePurchase = !ent.fullReport && !!unusedPurchase;
  const level: "summary" | "full" | null = ent.fullReport || usePurchase ? "full" : ent.summaryReport ? "summary" : null;
  if (!level && m.purchases.length > 0) {
    return NextResponse.json({ error: `Your Readiness Assessment includes ${REPORTS_PER_PURCHASE} report versions, and you've used them. Join a membership to keep updating your report.` }, { status: 402 });
  }
  if (!level) {
    return NextResponse.json({ error: "Your Readiness Report needs a membership or the one-time Readiness Assessment." }, { status: 402 });
  }

  const body = (await req.json().catch(() => null)) as { assessmentId?: unknown; scoreId?: unknown; refresh?: unknown } | null;
  const refresh = body?.refresh === true;
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
  // A summary report is replaced by a full one once the founder is
  // entitled to it (e.g. after upgrading); otherwise reuse what exists.
  const [planRow, { data: reviewRow }, { data: briefRow }] = await Promise.all([
    loadPlan(supabase, user.id),
    supabase.from("plan_reviews").select("result, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    supabase.from("market_briefs").select("insights, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  // A refresh is only worth paying for when something has changed since
  // this score's report: the plan, its review or the market brief.
  const changedSince = (iso: string) =>
    [planRow?.updated_at, reviewRow?.created_at, briefRow?.created_at].some((t) => t && new Date(t).getTime() > new Date(iso).getTime());
  if (existing && !(existing.level === "summary" && level === "full") && !(refresh && changedSince(existing.created_at))) {
    return NextResponse.json({ report: existing, message: "Here's your Readiness Report." });
  }
  const { count: recent } = await supabase.from("reports").select("id", { count: "exact", head: true }).gte("created_at", new Date(Date.now() - 864e5).toISOString());
  if ((recent ?? 0) >= REPORTS_PER_DAY) {
    return NextResponse.json({ error: "You've created several reports today. Please try again tomorrow." }, { status: 429 });
  }

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
      extra: (assessment as any).extra ?? null,
      diagnostic: {
        ventureScore: { score: score.venture_score, tier: score.venture_tier },
        subScores: { market: score.market_subscore, customer: score.customer_subscore, investor: score.investor_subscore },
        healthIndex: { index: score.health_index, confidence: score.health_confidence, evidenceCompleteness: score.evidence_completeness },
        blockScores: score.block_scores,
        gaps: score.gaps,
      },
      blockNarratives,
      planText: planRow ? planAsText(planRow.data) : null,
      planReviewText: reviewText(reviewRow?.result),
      marketHighlights: marketText(briefRow?.insights),
    }, {
      level,
      planLength: planLengthFor(assessment),
      tierRecommendation: usePurchase && !m.tier,
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
      level,
      assessment_purchase_id: usePurchase ? unusedPurchase!.id : null,
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
    // A newer report replaces the AI's earlier next steps (a coach's stay).
    await supabase.from("recommendations").delete().eq("assessment_id", assessmentId).eq("source", "ai");
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
    ? `Here's your Readiness Report. An advisor will review it in the background within ${SLA_MIN_HOURS}-${SLA_MAX_HOURS} hours as quality assurance — you don't need to wait for that.`
    : "Here's your Readiness Report.";

  return NextResponse.json({ report, message });
}

function reviewText(result: unknown): string | null {
  const r = result ? parsePlanReview(JSON.stringify(result)) : null;
  return r ? reviewAsText(r) : null;
}

function marketText(insights: any): string | null {
  const recs = Array.isArray(insights?.recommendations) ? insights.recommendations : [];
  if (!recs.length) return null;
  return recs.slice(0, 6).map((r: any) => `- ${r.action} (${r.why})`).join("\n");
}

/** The plan length the founder chose (assessments.extra.planLength), or
 * their goal timeframe from the Snapshot, or 12 months. */
function planLengthFor(assessment: any): string {
  const chosen = assessment?.extra?.planLength;
  if (typeof chosen === "string" && (TIME_HORIZONS as readonly string[]).includes(chosen)) return chosen;
  if (typeof assessment?.time_horizon === "string" && (TIME_HORIZONS as readonly string[]).includes(assessment.time_horizon)) return assessment.time_horizon;
  return "12 months";
}
