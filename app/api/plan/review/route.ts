import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { askClaude } from "@/lib/anthropic";
import { planAsText, readyForReview } from "@/lib/plan";
import { buildPlanReviewPrompt, parsePlanReview, reviewAllowed } from "@/lib/plan-review";
import { loadLatestAssessment, loadPlan } from "@/lib/plan-server";
import { BLOCK_LABELS, type BlockKey } from "@/lib/scoring";

export const maxDuration = 120;

/** POST /api/plan/review
 * An AI review of the founder's saved strategic plan, judged against
 * their latest assessment. Growth, Elevate and the one-time Readiness
 * Assessment. Limited (lib/plan-review.ts REVIEW_LIMITS), and only run
 * once the plan has the minimum worth reviewing. A failed or unreadable
 * answer isn't saved, so it doesn't count against the limit. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).planReview) {
    return NextResponse.json({ error: "The AI plan review comes with Growth, Elevate and the one-time Readiness Assessment." }, { status: 402 });
  }

  const [row, latest, { data: previous }] = await Promise.all([
    loadPlan(supabase, user.id),
    loadLatestAssessment(supabase, user.id),
    supabase.from("plan_reviews").select("created_at, plan_updated_at").order("created_at", { ascending: false }).limit(10),
  ]);
  if (!row || !latest) return NextResponse.json({ error: "Save your plan first." }, { status: 400 });
  const ready = readyForReview(row.data, latest.gapKeys);
  if (!ready.ready) return NextResponse.json({ error: `Before the review, add: ${ready.missing.join("; ")}.` }, { status: 400 });
  if (previous?.[0] && previous[0].plan_updated_at === row.updated_at) {
    return NextResponse.json({ error: "Your plan hasn't changed since its last review. Make the fixes, save, then ask again." }, { status: 400 });
  }
  const allowed = reviewAllowed(previous ?? []);
  if (!allowed.ok) return NextResponse.json({ error: allowed.reason }, { status: 429 });

  const blockScores = (latest.score.block_scores ?? {}) as Record<string, number>;
  const prompt = buildPlanReviewPrompt({
    companyName: latest.assessment?.extra?.companyName ?? "",
    stage: latest.assessment?.venture_stage ?? "",
    industry: latest.assessment?.industry ?? "",
    country: latest.assessment?.geography ?? "",
    ventureScore: Number(latest.score.venture_score),
    gaps: ((latest.score.gaps as any[]) ?? []).map((g) => ({ label: g.label, score: Math.round(g.score) })),
    blockScores: Object.entries(blockScores).map(([k, v]) => ({ label: BLOCK_LABELS[k as BlockKey] ?? k, score: Math.round(Number(v)) })),
    planText: planAsText(row.data),
    assessmentAgeDays: Math.max(0, Math.floor((Date.now() - new Date(latest.scoreCreatedAt).getTime()) / 864e5)),
  });

  let review;
  try {
    const { text } = await askClaude(prompt, { maxTokens: 2500 });
    review = parsePlanReview(text);
  } catch (e) {
    console.error("Plan review failed:", e);
  }
  if (!review) return NextResponse.json({ error: "We couldn't complete your review just now. Please try again in a minute." }, { status: 502 });

  // Written with the service role: founders can read reviews but not write them.
  const { data, error } = await createAdminClient()
    .from("plan_reviews")
    .insert({ founder_id: user.id, plan_id: row.id, plan_updated_at: row.updated_at, overall: review.overall, result: review })
    .select("id, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, review, id: data.id, createdAt: data.created_at });
}
