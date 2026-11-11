import type { SupabaseClient } from "@supabase/supabase-js";
import { BLOCK_KEYS } from "./scoring";
import { reminderStep, type StepState } from "./reminders";

/** Reads, with the service role, what lib/reminders.ts needs to know about
 * one founder: how far through the full assessment they are, when they
 * paid, and their bookable coaching sessions. */
export async function loadStepState(admin: SupabaseClient, founderId: string, now = new Date()): Promise<StepState> {
  const [{ data: latest }, { data: pay }, { data: credits }] = await Promise.all([
    admin
      .from("scores")
      .select("assessment_id, assessments!inner(founder_id)")
      .eq("assessments.founder_id", founderId)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin
      .from("payments")
      .select("fulfilled_at")
      .eq("founder_id", founderId)
      .eq("status", "successful")
      .in("product", ["subscription", "assessment"])
      .order("fulfilled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    admin.from("coaching_credits").select("quantity, used, available_from, expires_at").eq("founder_id", founderId),
  ]);
  let areasAnswered = 0;
  if (latest?.assessment_id) {
    const { data: rows } = await admin.from("block_responses").select("current_state").eq("assessment_id", latest.assessment_id);
    areasAnswered = (rows ?? []).filter((r: any) => (r.current_state ?? "").trim()).length;
  }
  const t = now.getTime();
  const usable = (credits ?? []).filter((c: any) => new Date(c.available_from).getTime() <= t && new Date(c.expires_at).getTime() > t && c.used < c.quantity);
  const coachingAvailable = usable.reduce((n: number, c: any) => n + (c.quantity - c.used), 0);
  const coachingSince = usable.map((c: any) => c.available_from as string).sort()[0] ?? null;
  return { areasAnswered, areasTotal: BLOCK_KEYS.length, coachingAvailable, paidAt: (pay?.fulfilled_at as string | undefined) ?? null, coachingSince };
}

/** Founders who paid in the last 60 days: the only ones reminders can apply to. */
export async function recentPayingFounders(admin: SupabaseClient, now = new Date(), limit = 500): Promise<string[]> {
  const since = new Date(now.getTime() - 60 * 864e5).toISOString();
  const { data } = await admin
    .from("payments")
    .select("founder_id")
    .eq("status", "successful")
    .in("product", ["subscription", "assessment"])
    .gte("fulfilled_at", since)
    .limit(limit);
  return [...new Set((data ?? []).map((r: any) => r.founder_id as string).filter(Boolean))];
}

export { reminderStep };
