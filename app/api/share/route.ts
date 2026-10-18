import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { readinessFromRows } from "@/lib/readiness";
import { createShareToken, ensureProfileExtras, readAttribution, publicAppUrl } from "@/lib/growth-server";

/** POST /api/share — a member shares their latest Total Readiness Score. The score
 * is read on the server (never taken from the browser), and the link
 * carries their referral code. */
export async function POST(req: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { data: score } = await supabase
    .from("scores")
    .select("*, assessments!inner(founder_id, extra)")
    .eq("assessments.founder_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!score) return NextResponse.json({ error: "Take the Readiness Snapshot first." }, { status: 404 });
  const admin = createAdminClient();
  const code = await ensureProfileExtras(admin, user.id, readAttribution());
  const planScore = (score as any).assessments?.extra?.planScore;
  const readiness = readinessFromRows(score, { completeness: null, review: null }, typeof planScore === "number" ? planScore : null);
  const token = await createShareToken(admin, {
    score: readiness.total,
    tier: readiness.band,
    planScore: typeof planScore === "number" ? planScore : null,
    referralCode: code,
    source: "member",
  });
  if (!token) return NextResponse.json({ error: "Could not create a link. Please try again." }, { status: 500 });
  return NextResponse.json({ url: `${publicAppUrl(new URL(req.url).origin)}/score/${token}` });
}
