import type { SupabaseClient } from "@supabase/supabase-js";
import { loadLatestAssessment } from "./plan-server";
import { readinessFromRows } from "./readiness";
import { BLOCK_KEYS } from "./scoring";
import { memberRow, type MemberRow } from "./partner";

/** Server-side reads for the partner portal, with the service role. Every
 * caller must first check the signed-in user may see the partner
 * (partnersForUser). Only the fields in lib/partner.ts SHARED_WITH_PARTNER
 * leave this file. */

export async function partnersForUser(admin: SupabaseClient, userId: string): Promise<{ id: string; name: string; kind: string }[]> {
  const { data } = await admin.from("partner_users").select("partners(id, name, kind)").eq("user_id", userId);
  return (data ?? []).map((r: any) => r.partners).filter(Boolean);
}

export async function cohortsForPartner(admin: SupabaseClient, partnerId: string) {
  const { data } = await admin.from("partner_cohorts").select("id, name, join_code, open, starts_on, ends_on, created_at").eq("partner_id", partnerId).order("created_at", { ascending: false });
  return data ?? [];
}

/** A founder's current Total Readiness Score and band, or nulls. */
export async function currentReadiness(db: SupabaseClient, founderId: string): Promise<{ score: number | null; band: string | null; areasAnswered: number; planCompleteness: number | null; company: string | null }> {
  const latest = await loadLatestAssessment(db, founderId);
  const { data: plan } = await db.from("strategic_plans").select("completeness").eq("founder_id", founderId).maybeSingle();
  const planCompleteness = plan?.completeness ?? null;
  if (!latest) return { score: null, band: null, areasAnswered: 0, planCompleteness, company: null };
  const extra = (latest.assessment as any)?.extra ?? {};
  const planScore = typeof extra.planScore === "number" ? extra.planScore : null;
  const r = readinessFromRows(latest.score, { completeness: planCompleteness, review: null }, planScore);
  return {
    score: Math.round(r.total),
    band: r.band,
    areasAnswered: latest.blocks.filter((b) => (b.current_state ?? "").trim()).length,
    planCompleteness,
    company: typeof extra.companyName === "string" ? extra.companyName : null,
  };
}

export async function cohortRows(admin: SupabaseClient, cohortId: string): Promise<MemberRow[]> {
  const { data: members } = await admin.from("cohort_members").select("founder_id, baseline_score, consented_at, profiles(full_name)").eq("cohort_id", cohortId).limit(500);
  const rows: MemberRow[] = [];
  for (const m of members ?? []) {
    const r = await currentReadiness(admin, (m as any).founder_id);
    rows.push(
      memberRow({
        name: ((m as any).profiles?.full_name as string) || "Founder",
        company: r.company,
        joinedAt: (m as any).consented_at,
        baseline: (m as any).baseline_score,
        score: r.score,
        band: r.band,
        areasAnswered: r.areasAnswered,
        areasTotal: BLOCK_KEYS.length,
        planCompleteness: r.planCompleteness,
      })
    );
  }
  return rows.sort((a, b) => (b.score ?? -1) - (a.score ?? -1));
}
