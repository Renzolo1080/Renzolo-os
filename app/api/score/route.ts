import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { parseSnapshotBody, saveSnapshotForFounder } from "@/lib/snapshot-save";

/** POST /api/score — a signed-in founder takes (or retakes) the Readiness
 * Snapshot. Body: { profile, plan: { answers, coverage }, answers, evidence }.
 * Every answer is checked against the fixed lists in lib/quickcheck.ts
 * before anything is saved. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const parsed = parseSnapshotBody(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const companyName = typeof body?.companyName === "string" ? body.companyName.trim().slice(0, 160) : undefined;

  try {
    const saved = await saveSnapshotForFounder(supabase, createAdminClient(), user.id, { ...parsed.value, companyName });
    return NextResponse.json({
      assessmentId: saved.assessmentId,
      scoreId: saved.scoreId,
      ventureScore: saved.scored.diagnostic.ventureScore,
      gaps: saved.scored.diagnostic.gaps.map((g) => g.label),
    });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Something went wrong" }, { status: 500 });
  }
}
