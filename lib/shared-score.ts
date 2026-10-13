import { createAdminClient } from "./supabase/server";

export interface SharedScore {
  venture_score: number;
  venture_tier: string;
  plan_score: number | null;
  referral_code: string | null;
}

/** Looks up a share link (service role: the table isn't readable from the browser). */
export async function getSharedScore(token: string): Promise<SharedScore | null> {
  if (!/^[A-Za-z0-9]{10,32}$/.test(token)) return null;
  try {
    const { data } = await createAdminClient().from("shared_scores").select("venture_score, venture_tier, plan_score, referral_code").eq("token", token).maybeSingle();
    return (data as SharedScore | null) ?? null;
  } catch {
    return null;
  }
}
