import type { SupabaseClient } from "@supabase/supabase-js";
import { sanitizePlan } from "./plan";
import { readinessFromRows } from "./readiness";
import { trajectory, type Trajectory } from "./live-score";
import { weeklyDigest, type Digest } from "./accountability";

/** Reads, with the service role, one member's plan, check-ins, monthly
 * updates and scores, and works out this week's accountability digest and
 * their trajectory (for the live score in the email). Every query is
 * filtered to this founder. */
export async function loadDigest(admin: SupabaseClient, founderId: string, today: string): Promise<{ digest: Digest | null; trajectory: Trajectory }> {
  const [{ data: planRow }, { data: checkins }, { data: updates }, { data: scores }] = await Promise.all([
    admin.from("strategic_plans").select("data, completeness").eq("founder_id", founderId).maybeSingle(),
    admin.from("goal_checkins").select("goal_id, value, note, checked_on").eq("founder_id", founderId).order("checked_on", { ascending: true }).limit(500),
    admin.from("founder_updates").select("period, revenue, customers, cash").eq("founder_id", founderId).order("period", { ascending: false }).limit(13),
    admin.from("scores").select("*, assessments!inner(founder_id, extra)").eq("assessments.founder_id", founderId).order("created_at", { ascending: true }),
  ]);
  const plan = planRow ? sanitizePlan((planRow as any).data) : null;
  const rows = (scores ?? []) as any[];
  const confirmed = rows.map((r, i) => ({
    date: r.created_at as string,
    total: readinessFromRows(r, { completeness: i === rows.length - 1 ? ((planRow as any)?.completeness ?? null) : null, review: null }, typeof r.assessments?.extra?.planScore === "number" ? r.assessments.extra.planScore : null).total,
  }));
  const ck = (checkins ?? []).map((c: any) => ({ ...c, value: Number(c.value) }));
  const up = (updates ?? []).map((u: any) => ({ ...u, revenue: u.revenue === null ? null : Number(u.revenue), cash: u.cash === null ? null : Number(u.cash), customers: u.customers === null ? null : Number(u.customers) }));
  const t = trajectory({ plan, confirmed, checkins: ck, documents: [], updates: up, startBlocks: rows[0]?.block_scores ?? null, today });
  return { digest: weeklyDigest({ plan, checkins: ck, updates: up, nextReassessment: t.nextReassessment, today }), trajectory: t };
}

/** Members whose membership is active today: the weekly email is for them. */
export async function activeMembers(admin: SupabaseClient, now = new Date(), limit = 1000): Promise<string[]> {
  const { data } = await admin.from("subscriptions").select("founder_id, current_period_end").eq("status", "active").limit(limit);
  return (data ?? []).filter((r: any) => !r.current_period_end || new Date(r.current_period_end) > now).map((r: any) => r.founder_id as string);
}
