import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { CONSENT_VERSION, normalizeCode, validCode } from "@/lib/partner";
import { currentReadiness } from "@/lib/partner-server";

/** POST /api/partner/join { code, consent: true }
 * A founder joins a partner's cohort and agrees to share their readiness
 * progress with that partner (lib/partner.ts SHARED_WITH_PARTNER). */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { code?: unknown; consent?: unknown } | null;
  if (body?.consent !== true) return NextResponse.json({ error: "Please agree to share your progress to join." }, { status: 400 });
  const code = normalizeCode(body?.code);
  if (!validCode(code)) return NextResponse.json({ error: "That code doesn't look right." }, { status: 400 });

  const admin = createAdminClient();
  const { data: cohort } = await admin.from("partner_cohorts").select("id, open").eq("join_code", code).maybeSingle();
  if (!cohort || !cohort.open) return NextResponse.json({ error: "We couldn't find an open programme with that code." }, { status: 404 });
  const r = await currentReadiness(supabase, user.id);
  const { error } = await admin
    .from("cohort_members")
    .upsert({ cohort_id: cohort.id, founder_id: user.id, consent_version: CONSENT_VERSION, baseline_score: r.score }, { onConflict: "cohort_id,founder_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "Couldn't join just now. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

/** DELETE /api/partner/join?cohort=… stops sharing with that cohort's partner. */
export async function DELETE(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const cohort = req.nextUrl.searchParams.get("cohort") ?? "";
  if (!/^[0-9a-f-]{36}$/i.test(cohort)) return NextResponse.json({ error: "Missing cohort" }, { status: 400 });
  const { error } = await supabase.from("cohort_members").delete().eq("cohort_id", cohort).eq("founder_id", user.id);
  if (error) return NextResponse.json({ error: "Couldn't stop sharing. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
