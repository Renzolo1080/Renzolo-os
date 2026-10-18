import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { parseContact } from "@/lib/quickcheck";
import { parseSnapshotBody } from "@/lib/snapshot-save";
import { scoreSnapshot, snapshotOverview } from "@/lib/snapshot";
import { readAttribution, createShareToken, publicAppUrl } from "@/lib/growth-server";
import { sendOnce } from "@/lib/email-flow";
import { getAppUrl } from "@/lib/app-url";

/** POST /api/snapshot — the free, public Readiness Snapshot (no account).
 * Body: { contact: { fullName, companyName, email }, profile,
 *         plan: { answers, coverage }, answers, evidence }
 *
 * Returns only the short overview (scores, strongest and weakest areas
 * named, one recommendation). The full answers are kept so that, when the
 * founder creates an account with the same email and confirms it, their
 * Snapshot is carried into the account (lib/snapshot-save.ts) instead of
 * asking them to answer again. */
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const contact = parseContact(body?.contact);
  if (!contact.ok) return NextResponse.json({ error: contact.error }, { status: 400 });
  const parsed = parseSnapshotBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });

  const { profile, quick, plan } = parsed.value;
  const scored = scoreSnapshot(profile, quick, plan);
  const overview = snapshotOverview(profile, scored);
  const c = contact.value;
  const marketingConsent = body?.contact?.marketingConsent === true;
  const admin = createAdminClient();

  const { data: lead, error } = await admin
    .from("snapshot_leads")
    .insert({
      email: c.email,
      full_name: c.fullName,
      company_name: c.companyName || null,
      venture_stage: profile.ventureStage,
      industry: profile.industry,
      block_ratings: scored.diagnostic.blockScores,
      preview_score: overview.score,
      preview_tier: overview.band,
      plan_score: overview.planScore,
      answers: { profile, plan, answers: quick.answers, evidence: quick.evidence },
      attribution: readAttribution(),
      marketing_consent: marketingConsent,
    })
    .select("id")
    .single();
  if (error || !lead) return NextResponse.json({ error: "We couldn't save your Snapshot. Please try again." }, { status: 500 });

  // A link they can share ("I scored 62...") — score and tier only.
  const shareToken = await createShareToken(admin, {
    score: overview.score,
    tier: overview.band,
    planScore: overview.planScore,
    referralCode: null,
    source: "snapshot",
  });
  const appUrl = publicAppUrl(getAppUrl(req.url));
  const shareUrl = shareToken ? `${appUrl}/score/${shareToken}` : null;

  // Their results by email (if email is set up). Never holds up the page.
  const weakestKey = scored.diagnostic.gaps[0]?.block;
  await sendOnce(
    admin,
    "results",
    c.email,
    {
      appUrl,
      firstName: c.fullName.split(/\s+/)[0] ?? "",
      score: overview.score,
      band: overview.band,
      planScore: overview.planScore,
      weakest: overview.weakest,
      weakestKey,
      recommendation: overview.recommendation,
      shareUrl,
    },
    lead.id
  ).catch(() => false);

  return NextResponse.json({ overview, shareUrl });
}
