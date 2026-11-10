import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { activeGrant, availableCoaches, COACH_CONSENT_VERSION } from "@/lib/coach-access";

/** The founder's permission for their coach to see their plan, actions
 * and dashboard (lib/coach-access.ts).
 *  POST   { coachId, consent: "yes" }  share with this coach (stops any
 *                                       earlier sharing first)
 *  DELETE                               stop sharing
 * Written with the founder's own session, so the database rules apply:
 * a founder can only share their own data, only with a coach, one at a
 * time, and records are never deleted. */
async function signedIn() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

export async function POST(req: NextRequest) {
  const { supabase, user } = await signedIn();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as { coachId?: unknown; consent?: unknown } | null;
  if (body?.consent !== "yes") return NextResponse.json({ error: "Tick the box to confirm you want to share." }, { status: 400 });
  const coachId = typeof body?.coachId === "string" ? body.coachId : "";
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY || !(await availableCoaches(createAdminClient())).some((c) => c.id === coachId)) {
    return NextResponse.json({ error: "Choose one of the coaches listed." }, { status: 400 });
  }
  const current = await activeGrant(supabase, user.id);
  if (current?.coach_id === coachId) return NextResponse.json({ ok: true, unchanged: true });
  if (current) {
    const { error } = await supabase.from("coach_access").update({ revoked_at: new Date().toISOString() }).eq("id", current.id);
    if (error) return NextResponse.json({ error: "Couldn't update your sharing. Please try again." }, { status: 500 });
  }
  const { error } = await supabase.from("coach_access").insert({ founder_id: user.id, coach_id: coachId, consent_version: COACH_CONSENT_VERSION });
  if (error) return NextResponse.json({ error: "Couldn't share with that coach. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}

export async function DELETE() {
  const { supabase, user } = await signedIn();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const current = await activeGrant(supabase, user.id);
  if (!current) return NextResponse.json({ ok: true, unchanged: true });
  const { error } = await supabase.from("coach_access").update({ revoked_at: new Date().toISOString() }).eq("id", current.id);
  if (error) return NextResponse.json({ error: "Couldn't stop sharing. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
