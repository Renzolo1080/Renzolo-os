import type { SupabaseClient } from "@supabase/supabase-js";
import { BLOCK_KEYS } from "./scoring";
import { parseProfile, parseQuickCheck, parsePlan, type QuickProfile, type QuickCheckSubmission, type PlanSubmission } from "./quickcheck";
import { scoreSnapshot } from "./snapshot";

export interface SnapshotPayload {
  profile: QuickProfile;
  quick: QuickCheckSubmission;
  plan: PlanSubmission;
  companyName?: string;
}

/** Validates a Snapshot body ({ profile, answers, evidence, plan }). */
export function parseSnapshotBody(body: any): { ok: true; value: Omit<SnapshotPayload, "companyName"> } | { ok: false; error: string } {
  const profile = parseProfile(body?.profile);
  if (!profile.ok) return profile;
  const plan = parsePlan(body?.plan);
  if (!plan.ok) return plan;
  const quick = parseQuickCheck({ answers: body?.answers, evidence: body?.evidence });
  if (!quick.ok) return quick;
  return { ok: true, value: { profile: profile.value, quick: quick.value, plan: plan.value } };
}

/** Saves a Snapshot to a founder's account: the assessment, one block
 * response per area, and the score.
 *
 * `db` writes the assessment and block responses. For a founder taking it
 * signed in, that is their own session (so row-level security confirms
 * ownership). When an earlier public Snapshot is carried into a new
 * account, it is the service role, because the founder has already been
 * matched by their confirmed email. Scores are always written with the
 * service role (`admin`): founders can't write scores themselves. */
export async function saveSnapshotForFounder(db: SupabaseClient, admin: SupabaseClient, founderId: string, payload: SnapshotPayload) {
  const { profile: p, quick, plan, companyName } = payload;
  const scored = scoreSnapshot(p, quick, plan);
  const { diagnostic, valuation, planScore, measures, evidenceByBlock } = scored;
  const now = new Date().toISOString();

  const { data: assessment, error: assessmentError } = await db
    .from("assessments")
    .insert({
      founder_id: founderId,
      status: "scored",
      venture_stage: p.ventureStage,
      industry: p.industry,
      geography: p.country,
      time_horizon: p.timeHorizon,
      business_type: p.businessType || null,
      employee_count: p.teamSize || null,
      years_in_business: p.yearsInBusiness || null,
      annual_revenue: p.annualRevenue,
      extra: {
        companyName: companyName || null,
        primaryGoal: p.primaryGoal,
        fundingNeed: p.fundingNeed,
        registration: p.registration || null,
        challenges: p.challenges,
        heardFrom: p.heardFrom,
        plan: plan.answers,
        planCoverage: plan.coverage,
        planScore,
        source: "readiness_snapshot",
      },
      submitted_at: now,
      scored_at: now,
    })
    .select()
    .single();
  if (assessmentError || !assessment) throw new Error(assessmentError?.message ?? "Failed to save your answers");

  const { error: blockError } = await db.from("block_responses").insert(
    BLOCK_KEYS.map((key) => ({
      assessment_id: assessment.id,
      block_key: key,
      evidence_uploaded: evidenceByBlock[key],
      measures: measures[key],
    }))
  );
  if (blockError) throw new Error(blockError.message);

  // Remember country, stage and industry on the profile if no country is
  // set yet: country decides pricing and local currency (lib/pricing.ts).
  await db.from("profiles").update({ country: p.country, venture_stage: p.ventureStage, industry: p.industry }).eq("id", founderId).is("country", null);

  const { data: scoreRow, error: scoreError } = await admin
    .from("scores")
    .insert({
      assessment_id: assessment.id,
      venture_score: diagnostic.ventureScore.score,
      venture_tier: diagnostic.ventureScore.tier,
      market_subscore: diagnostic.subScores.market,
      customer_subscore: diagnostic.subScores.customer,
      investor_subscore: diagnostic.subScores.investor,
      health_index: diagnostic.healthIndex.index,
      health_confidence: diagnostic.healthIndex.confidence,
      evidence_completeness: diagnostic.healthIndex.evidenceCompleteness,
      block_scores: diagnostic.blockScores,
      gaps: diagnostic.gaps,
      valuation_low: valuation.low,
      valuation_high: valuation.high,
      valuation_method: valuation.method,
      valuation_basis: valuation.basis,
    })
    .select()
    .single();
  if (scoreError || !scoreRow) throw new Error(scoreError?.message ?? "Failed to save your score");

  return { assessmentId: assessment.id as string, scoreId: scoreRow.id as string, scored };
}

/** How long a public Snapshot waits to be carried into a new account. */
export const SNAPSHOT_CLAIM_DAYS = 60;

/** If a founder with no score yet took the public Snapshot with the same
 * (confirmed) email, carry it into their account so they don't have to
 * answer again. Returns the new assessment's id, or null if nothing was carried over. */
export async function claimSnapshotLead(admin: SupabaseClient, user: { id: string; email?: string | null; email_confirmed_at?: string | null }): Promise<string | null> {
  const email = (user.email ?? "").trim().toLowerCase();
  if (!email || !user.email_confirmed_at) return null;
  const since = new Date(Date.now() - SNAPSHOT_CLAIM_DAYS * 864e5).toISOString();
  const { data: lead } = await admin
    .from("snapshot_leads")
    .select("id, answers, company_name")
    .eq("email", email) // stored lower-cased by /api/snapshot
    .is("converted_to_user_id", null)
    .not("answers", "is", null)
    .gte("created_at", since)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!lead) return null;
  const parsed = parseSnapshotBody(lead.answers);
  if (!parsed.ok) return null;
  // Mark it first, so two dashboard loads at once can't both carry it over.
  const { data: marked } = await admin
    .from("snapshot_leads")
    .update({ converted_to_user_id: user.id })
    .eq("id", lead.id)
    .is("converted_to_user_id", null)
    .select("id");
  if (!marked || marked.length === 0) return null;
  const saved = await saveSnapshotForFounder(admin, admin, user.id, { ...parsed.value, companyName: lead.company_name ?? undefined });
  return saved.assessmentId;
}
