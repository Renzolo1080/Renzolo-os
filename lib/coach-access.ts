import type { SupabaseClient } from "@supabase/supabase-js";

/** Coach access with the founder's permission (approved Nov 10, 2026).
 * A founder shares their plan, actions and dashboard with one assigned
 * coach at a time and can stop whenever they like (table coach_access).
 * The coach pages load a founder's plan, goals, updates and trajectory
 * only while that permission is active. */

export const COACH_CONSENT_VERSION = "1.0";

/** Shown to the founder before they share. */
export const SHARED_WITH_COACH = [
  "Your strategic plan: goals, business areas, actions and their status",
  "Your dashboard: Total Readiness Score (confirmed and live), goal check-ins and monthly updates",
  "Your trajectory: what moved your live score and what drives your goals",
];
export const NOT_SHARED_WITH_COACH = ["Your documents and uploaded files", "Your AI coach conversations", "Your payment details"];

export interface CoachGrant {
  id: string;
  coach_id: string;
  granted_at: string;
}

/** The founder's active grant, if any. Missing table (migration not yet
 * applied) reads as no grant. */
export async function activeGrant(db: SupabaseClient, founderId: string): Promise<CoachGrant | null> {
  const { data, error } = await db.from("coach_access").select("id, coach_id, granted_at").eq("founder_id", founderId).is("revoked_at", null).maybeSingle();
  if (error) return null;
  return (data as CoachGrant | null) ?? null;
}

/** Founders who currently share with this coach. */
export async function foundersSharingWith(admin: SupabaseClient, coachId: string): Promise<Set<string>> {
  const { data, error } = await admin.from("coach_access").select("founder_id").eq("coach_id", coachId).is("revoked_at", null);
  if (error) return new Set();
  return new Set((data ?? []).map((r: any) => r.founder_id as string));
}

export async function sharesWith(admin: SupabaseClient, coachId: string, founderId: string): Promise<boolean> {
  const { data, error } = await admin.from("coach_access").select("id").eq("coach_id", coachId).eq("founder_id", founderId).is("revoked_at", null).maybeSingle();
  return !error && !!data;
}

/** Coaches a founder can choose from (names only). */
export async function availableCoaches(admin: SupabaseClient): Promise<{ id: string; name: string }[]> {
  const { data } = await admin.from("profiles").select("id, full_name, role").in("role", ["advisor", "admin"]).limit(50);
  return (data ?? []).map((p: any) => ({ id: p.id as string, name: (p.full_name as string | null)?.trim() || "Founder Trajectory™ coach" }));
}
