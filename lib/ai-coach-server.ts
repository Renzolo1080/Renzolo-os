import type { SupabaseClient } from "@supabase/supabase-js";
import { loadLatestAssessment, loadPlan } from "./plan-server";
import { allActions, planAsText } from "./plan";
import { goalProgress, GOAL_STATUS_LABELS, formatAmount } from "./progress";
import { openCommitments } from "./coaching";
import { BLOCK_LABELS, type BlockKey } from "./scoring";
import type { CoachContext } from "./ai-coach";

/** Everything the AI coach knows about a founder, read through `db`
 * (the founder's own session, so row-level security applies). */
export async function loadCoachContext(db: SupabaseClient, founderId: string, founderName: string, today = new Date().toISOString().slice(0, 10)): Promise<{ context: CoachContext; gaps: string[]; goals: string[]; hasPlan: boolean }> {
  const [latest, planRow, { data: checkins }, { data: update }, { data: sessions }, { data: brief }] = await Promise.all([
    loadLatestAssessment(db, founderId),
    loadPlan(db, founderId),
    db.from("goal_checkins").select("goal_id, value, checked_on").eq("founder_id", founderId).order("checked_on"),
    db.from("founder_updates").select("*").eq("founder_id", founderId).order("period", { ascending: false }).limit(1).maybeSingle(),
    db.from("advisor_sessions").select("id, status, created_at, commitments").eq("founder_id", founderId).eq("status", "completed"),
    db.from("market_briefs").select("insights").eq("founder_id", founderId).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  const s = latest?.score;
  const progress = (planRow?.data.goals ?? [])
    .filter((g) => g.title)
    .map((g) => goalProgress(g, (checkins ?? []).map((c: any) => ({ ...c, value: Number(c.value) })), today));
  const actions = planRow ? allActions(planRow.data).filter((a) => a.status !== "done" && a.due && a.due <= addDays(today, 14)) : [];
  const recs: any[] = Array.isArray((brief as any)?.insights?.recommendations) ? (brief as any).insights.recommendations : [];
  const gapLabels = ((s?.gaps as any[]) ?? []).map((g) => g.label as string);

  const context: CoachContext = {
    founderName,
    company: latest?.assessment?.extra?.companyName ?? "",
    stage: latest?.assessment?.venture_stage ?? "",
    industry: latest?.assessment?.industry ?? "",
    country: latest?.assessment?.geography ?? "",
    scores: s ? `Venture ${Math.round(s.venture_score)} (${s.venture_tier}); Market ${Math.round(s.market_subscore)}, Customer ${Math.round(s.customer_subscore)}, Investor ${Math.round(s.investor_subscore)}` : "",
    gaps: ((s?.gaps as any[]) ?? []).map((g) => `${g.label} ${Math.round(g.score)}/100`).join(", "),
    planText: planRow ? planAsText(planRow.data) : null,
    goals: progress
      .map((p) => `- ${p.goal.title}: start ${formatAmount(p.goal.baseline, p.goal.unit)}, actual ${formatAmount(p.actual, p.goal.unit)}, target ${formatAmount(p.goal.target, p.goal.unit)} by ${p.goal.date || "no date"} (${GOAL_STATUS_LABELS[p.status]})`)
      .join("\n"),
    actionsDue: actions.map((a) => `- ${a.text} (${BLOCK_LABELS[a.area as BlockKey]}, due ${a.due}${a.due < today ? ", OVERDUE" : ""}, owner ${a.owner || "not set"})`).join("\n"),
    latestUpdate: update
      ? `${String(update.period).slice(0, 7)}: revenue ${update.revenue ?? "–"}, customers ${update.customers ?? "–"}, cash ${update.cash ?? "–"}. Wins: ${update.wins ?? "–"}. Challenges: ${update.challenges ?? "–"}. Help needed: ${update.asks ?? "–"}`
      : "",
    commitments: openCommitments((sessions ?? []) as any[])
      .map((c) => `- ${c.text}${c.due ? ` (due ${c.due}${c.due < today ? ", OVERDUE" : ""})` : ""}`)
      .join("\n"),
    marketHighlights: recs.length ? recs.slice(0, 5).map((r) => `- ${r.action} (${r.why})`).join("\n") : null,
    today,
  };
  return { context, gaps: gapLabels, goals: progress.filter((p) => p.status === "behind" || p.status === "overdue" || p.status === "at_risk").map((p) => p.goal.title), hasPlan: !!planRow };
}

function addDays(day: string, n: number) {
  return new Date(Date.parse(`${day}T00:00:00Z`) + n * 864e5).toISOString().slice(0, 10);
}
