import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { GUIDE_VERSION, parseGuideRequest } from "@/lib/forms";
import { readAttribution } from "@/lib/growth-server";
import { corsHeaders } from "@/lib/cors";

/** POST /api/guide — the free Founder Trajectory(TM) Method guide.
 * Public (the website posts here). Saves the founder to the lead list
 * with their consent, then the page shows the download. */
export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  const parsed = parseGuideRequest(await req.json().catch(() => null));
  if (!parsed.ok) return NextResponse.json({ error: parsed.error === "spam" ? "Thanks!" : parsed.error }, { status: parsed.error === "spam" ? 200 : 400, headers });
  const v = parsed.value;
  const admin = createAdminClient();
  // One row per email: asking again just refreshes the date.
  const { error } = await admin.from("guide_leads").upsert(
    { email: v.email, full_name: v.fullName, country: v.country || null, source: v.source, guide_version: GUIDE_VERSION, consented_at: new Date().toISOString(), attribution: await readAttribution() },
    { onConflict: "email" }
  );
  if (error) return NextResponse.json({ error: "We couldn't send the guide just now. Please try again." }, { status: 500, headers });
  return NextResponse.json({ ok: true }, { headers });
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}
