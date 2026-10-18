import type { SupabaseClient } from "@supabase/supabase-js";

/** True when the signed-in user is a coach (advisor) or admin. */
export async function isCoach(db: SupabaseClient, userId: string): Promise<boolean> {
  const { data } = await db.from("profiles").select("role").eq("id", userId).maybeSingle();
  return data?.role === "advisor" || data?.role === "admin";
}

/** Columns founders may read (coach_notes and prep_brief are coach-only). */
export const FOUNDER_SESSION_COLUMNS =
  "id, status, kind, scheduled_at, completed_at, created_at, paid_at, coaching_credit_id, price, currency, founder_prep, summary, commitments, rating, feedback";
