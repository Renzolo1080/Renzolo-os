import { NextRequest, NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import { createAdminClient } from "@/lib/supabase/server";
import { dueFollowUp } from "@/lib/emails";
import { sendOnce } from "@/lib/email-flow";
import { emailConfigured } from "@/lib/email-send";
import { parseSnapshotBody } from "@/lib/snapshot-save";
import { scoreSnapshot, snapshotOverview } from "@/lib/snapshot";
import { publicAppUrl } from "@/lib/growth-server";
import { getAppUrl } from "@/lib/app-url";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET /api/cron/emails — run once a day by Vercel Cron (vercel.json).
 * Sends the Snapshot follow-up emails that are due: only to founders who
 * ticked "email me tips", who haven't created an account, and who haven't
 * unsubscribed. Vercel calls it with "Authorization: Bearer <CRON_SECRET>". */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization") ?? "";
  const expected = `Bearer ${secret ?? ""}`;
  const ok = !!secret && auth.length === expected.length && timingSafeEqual(Buffer.from(auth), Buffer.from(expected));
  if (!ok) return NextResponse.json({ error: "Not allowed" }, { status: 401 });
  if (!emailConfigured() || !process.env.EMAIL_LINK_SECRET) return NextResponse.json({ sent: 0, note: "email not configured" });

  const admin = createAdminClient();
  const since = new Date(Date.now() - 14 * 864e5).toISOString();
  const { data: leads } = await admin
    .from("snapshot_leads")
    .select("id, email, full_name, answers, created_at")
    .eq("marketing_consent", true)
    .is("converted_to_user_id", null)
    .gte("created_at", since)
    .order("created_at", { ascending: true })
    .limit(300);

  const appUrl = publicAppUrl(getAppUrl(req.url));
  let sent = 0;
  const seen = new Set<string>();
  for (const lead of leads ?? []) {
    const email = String(lead.email).toLowerCase();
    if (seen.has(email)) continue; // one series per address, from their latest Snapshot
    seen.add(email);
    const { data: log } = await admin.from("email_log").select("kind").eq("email", email);
    const kind = dueFollowUp(lead.created_at, (log ?? []).map((l: any) => l.kind));
    if (!kind) continue;
    const parsed = parseSnapshotBody(lead.answers);
    if (!parsed.ok) continue;
    const scored = scoreSnapshot(parsed.value.profile, parsed.value.quick, parsed.value.plan);
    const ov = snapshotOverview(parsed.value.profile, scored);
    const did = await sendOnce(
      admin,
      kind,
      email,
      {
        appUrl,
        firstName: String(lead.full_name ?? "").split(/\s+/)[0] ?? "",
        score: ov.score,
        band: ov.band,
        planScore: ov.planScore,
        weakest: ov.weakest,
        weakestKey: scored.diagnostic.gaps[0]?.block,
        recommendation: ov.recommendation,
      },
      lead.id
    ).catch(() => false);
    if (did) sent++;
  }
  return NextResponse.json({ sent });
}
