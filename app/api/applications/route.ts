import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { parseCohortApplication } from "@/lib/forms";
import { readAttribution } from "@/lib/growth-server";
import { corsHeaders } from "@/lib/cors";

/** POST /api/applications — register interest in a Founder Trajectory(TM)
 * Academy cohort. Public (the website's Programs page posts here too). */
export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  const body = await req.json().catch(() => null);
  const parsed = parseCohortApplication(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error === "spam" ? "Thanks!" : parsed.error }, { status: parsed.error === "spam" ? 200 : 400, headers });
  const v = parsed.value;
  const admin = createAdminClient();
  // One application per email per cohort every 10 minutes (stops double-clicks and floods).
  const { data: recent } = await admin
    .from("cohort_applications")
    .select("id")
    .eq("email", v.email)
    .eq("cohort", v.cohort)
    .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle();
  if (recent) return NextResponse.json({ ok: true }, { headers });
  let founderId: string | null = null;
  try {
    const { data } = await (await createClient()).auth.getUser();
    founderId = data.user?.id ?? null;
  } catch {}
  const { error } = await admin.from("cohort_applications").insert({
    founder_id: founderId,
    full_name: v.fullName,
    email: v.email,
    company: v.company || null,
    country: v.country || null,
    venture_stage: v.ventureStage || null,
    cohort: v.cohort,
    message: v.message || null,
    attribution: await readAttribution(),
  });
  if (error) return NextResponse.json({ error: "We couldn't save your application. Please try again." }, { status: 500, headers });
  return NextResponse.json({ ok: true }, { headers });
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}
