import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isCoach } from "@/lib/coaching-server";
import { askClaude } from "@/lib/anthropic";
import { buildPrepBriefPrompt, sanitizeCommitments, sanitizePrep, type SessionKind } from "@/lib/coaching";
import { loadLatestAssessment, loadPlan } from "@/lib/plan-server";
import { planAsText } from "@/lib/plan";
import { parsePlanReview, reviewAsText } from "@/lib/plan-review";
import { goalProgress, GOAL_STATUS_LABELS, formatAmount } from "@/lib/progress";
import { loadMembership } from "@/lib/membership-server";
import { TIER_NAMES } from "@/lib/pricing";

export const maxDuration = 90;

/** POST /api/coaching/sessions/[id]/brief — coach only. Drafts a one-page
 * prep brief from the founder's assessment, plan, review, goal progress,
 * monthly update and earlier sessions, and saves it on the session. */
export async function POST(_req: Request, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  if (!(await isCoach(supabase, user.id))) return NextResponse.json({ error: "Coach or admin role required" }, { status: 403 });

  const admin = createAdminClient();
  const { data: session } = await admin.from("advisor_sessions").select("id, founder_id, kind, founder_prep, created_at").eq("id", params.id).maybeSingle();
  if (!session) return NextResponse.json({ error: "Session not found" }, { status: 404 });
  const fid = session.founder_id;

  const [latest, planRow, { data: profile }, { data: review }, { data: checkins }, { data: update }, { data: previous }, membership] = await Promise.all([
    loadLatestAssessment(admin, fid),
    loadPlan(admin, fid),
    admin.from("profiles").select("full_name").eq("id", fid).maybeSingle(),
    admin.from("plan_reviews").select("result").eq("founder_id", fid).order("created_at", { ascending: false }).limit(1).maybeSingle(),
    admin.from("goal_checkins").select("goal_id, value, checked_on").eq("founder_id", fid).order("checked_on"),
    admin.from("founder_updates").select("*").eq("founder_id", fid).order("period", { ascending: false }).limit(1).maybeSingle(),
    admin.from("advisor_sessions").select("completed_at, summary, commitments").eq("founder_id", fid).eq("status", "completed").order("completed_at", { ascending: false }).limit(3),
    loadMembership(admin, fid),
  ]);

  const today = new Date().toISOString().slice(0, 10);
  const goals = (planRow?.data.goals ?? [])
    .filter((g) => g.title)
    .map((g) => {
      const p = goalProgress(g, (checkins ?? []).map((c: any) => ({ ...c, value: Number(c.value) })), today);
      return `- ${g.title}: start ${formatAmount(g.baseline, g.unit)}, actual ${formatAmount(p.actual, g.unit)}, target ${formatAmount(g.target, g.unit)} by ${g.date || "no date"} (${GOAL_STATUS_LABELS[p.status]})`;
    })
    .join("\n");
  const r = review ? parsePlanReview(JSON.stringify(review.result)) : null;
  const s = latest?.score;

  const prompt = buildPrepBriefPrompt({
    founderName: profile?.full_name ?? "",
    company: latest?.assessment?.extra?.companyName ?? "",
    stage: latest?.assessment?.venture_stage ?? "",
    industry: latest?.assessment?.industry ?? "",
    country: latest?.assessment?.geography ?? "",
    tier: membership.tier ? TIER_NAMES[membership.tier] : membership.purchases.length ? "One-time assessment" : "No membership",
    score: s ? `Venture ${Math.round(s.venture_score)} (${s.venture_tier}); Market ${Math.round(s.market_subscore)}, Customer ${Math.round(s.customer_subscore)}, Investor ${Math.round(s.investor_subscore)}` : "",
    gaps: ((s?.gaps as any[]) ?? []).map((g) => `${g.label} ${Math.round(g.score)}`).join(", "),
    planText: planRow ? planAsText(planRow.data) : null,
    reviewText: r ? reviewAsText(r) : null,
    goals,
    latestUpdate: update
      ? `${update.period}: revenue ${update.revenue ?? "–"}, customers ${update.customers ?? "–"}, cash ${update.cash ?? "–"}. Wins: ${update.wins ?? "–"}. Challenges: ${update.challenges ?? "–"}. Help needed: ${update.asks ?? "–"}`
      : "",
    previous: (previous ?? [])
      .map((p: any) => `- ${String(p.completed_at).slice(0, 10)}: ${p.summary ?? "no summary"}. Commitments: ${sanitizeCommitments(p.commitments).map((c) => `${c.text} [${c.status}${c.due ? `, due ${c.due}` : ""}]`).join("; ") || "none"}`)
      .join("\n"),
    prep: sanitizePrep(session.founder_prep),
    kind: (session.kind as SessionKind) ?? "coaching",
  });

  let text = "";
  try {
    text = (await askClaude(prompt, { maxTokens: 1800 })).text.trim();
  } catch (e) {
    console.error("Prep brief failed:", e);
  }
  if (!text) return NextResponse.json({ error: "Couldn't draft the brief just now. Try again in a minute." }, { status: 502 });
  const brief = text.slice(text.indexOf("## ") >= 0 ? text.indexOf("## ") : 0);
  await admin.from("advisor_sessions").update({ prep_brief: brief }).eq("id", session.id);
  return NextResponse.json({ ok: true, brief });
}
