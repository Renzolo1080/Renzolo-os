import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { isCoach } from "@/lib/coaching-server";
import { SESSION_KINDS, sanitizeCommitments, sanitizeNotes, COMMITMENT_STATUSES, type Commitment } from "@/lib/coaching";
import { loadLatestAssessment, loadPlan } from "@/lib/plan-server";
import { MAX_ACTIONS, planCompleteness, sanitizePlan } from "@/lib/plan";
import type { BlockKey } from "@/lib/scoring";

/** PATCH /api/coaching/sessions/[id]
 *
 * Founder (their own session):
 *   { commitment: { id, status } }        tick a commitment done or dropped
 *   { rating: 1-5, feedback? }            rate a completed session
 *
 * Coach or admin:
 *   { scheduledAt?, kind?, notes?, summary?, commitments?, complete? }
 *   Completing a session adds its commitments that belong to a business
 *   area to the founder's plan as actions (once). */
export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const body = (await req.json().catch(() => null)) as Record<string, any> | null;
  if (!body) return NextResponse.json({ error: "Missing changes" }, { status: 400 });

  const admin = createAdminClient();
  const { data: session } = await admin.from("advisor_sessions").select("id, founder_id, status, commitments, paid_at, coaching_credit_id").eq("id", params.id).maybeSingle();
  if (!session || !session.paid_at) return NextResponse.json({ error: "Session not found" }, { status: 404 });

  const coach = await isCoach(supabase, user.id);
  const own = session.founder_id === user.id;

  if (!coach) {
    if (!own) return NextResponse.json({ error: "Session not found" }, { status: 404 });
    const patch: Record<string, unknown> = {};
    if (body.commitment) {
      const status = COMMITMENT_STATUSES.find((s) => s.value === body.commitment.status)?.value;
      const list = sanitizeCommitments(session.commitments);
      const c = list.find((x) => x.id === body.commitment.id);
      if (!c || !status) return NextResponse.json({ error: "Commitment not found" }, { status: 404 });
      c.status = status;
      patch.commitments = list;
    }
    if (body.rating !== undefined) {
      const rating = Number(body.rating);
      if (session.status !== "completed") return NextResponse.json({ error: "You can rate a session once it's done." }, { status: 400 });
      if (!Number.isInteger(rating) || rating < 1 || rating > 5) return NextResponse.json({ error: "Rate from 1 to 5." }, { status: 400 });
      patch.rating = rating;
      patch.feedback = typeof body.feedback === "string" ? body.feedback.trim().slice(0, 1000) || null : null;
    }
    if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
    const { error } = await admin.from("advisor_sessions").update(patch).eq("id", session.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  }

  // Coach.
  const patch: Record<string, unknown> = {};
  if (body.scheduledAt !== undefined) {
    const t = Date.parse(body.scheduledAt);
    if (!Number.isFinite(t)) return NextResponse.json({ error: "Enter the session date and time." }, { status: 400 });
    patch.scheduled_at = new Date(t).toISOString();
    if (session.status === "requested") patch.status = "scheduled";
    patch.advisor_id = user.id;
  }
  if (body.kind !== undefined) {
    if (!SESSION_KINDS.some((k) => k.value === body.kind)) return NextResponse.json({ error: "Unknown session kind" }, { status: 400 });
    patch.kind = body.kind;
  }
  if (body.notes !== undefined) patch.coach_notes = sanitizeNotes(body.notes);
  if (body.summary !== undefined) patch.summary = typeof body.summary === "string" ? body.summary.trim().slice(0, 3000) || null : null;
  let commitments: Commitment[] | null = null;
  if (body.commitments !== undefined) patch.commitments = commitments = sanitizeCommitments(body.commitments);
  if (body.cancel === true) {
    if (session.status === "completed" || session.status === "canceled") return NextResponse.json({ error: "This session can't be cancelled." }, { status: 400 });
    patch.status = "canceled";
  }
  if (body.complete === true) {
    if (session.status === "completed") return NextResponse.json({ error: "Already completed" }, { status: 400 });
    patch.status = "completed";
    patch.completed_at = new Date().toISOString();
    patch.advisor_id = user.id;
  }
  if (!Object.keys(patch).length) return NextResponse.json({ error: "Nothing to change" }, { status: 400 });
  const { error } = await admin.from("advisor_sessions").update(patch).eq("id", session.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // A session the coach cancels gives the founder their credit back.
  if (body.cancel === true && session.coaching_credit_id) {
    const { data: credit } = await admin.from("coaching_credits").select("used").eq("id", session.coaching_credit_id).maybeSingle();
    if (credit && credit.used > 0) await admin.from("coaching_credits").update({ used: credit.used - 1 }).eq("id", session.coaching_credit_id).eq("used", credit.used);
  }

  let addedToPlan = 0;
  if (body.complete === true) {
    addedToPlan = await addCommitmentsToPlan(admin, session.founder_id, commitments ?? sanitizeCommitments(session.commitments));
  }
  return NextResponse.json({ ok: true, addedToPlan });
}

/** Commitments tied to a business area become actions in the founder's plan. */
async function addCommitmentsToPlan(admin: any, founderId: string, list: Commitment[]): Promise<number> {
  const withArea = list.filter((c) => c.area && c.status === "open");
  if (!withArea.length) return 0;
  const row = await loadPlan(admin, founderId);
  if (!row) return 0;
  const plan = row.data;
  let added = 0;
  for (const c of withArea) {
    const area = plan.areas[c.area as BlockKey] ?? { current: "", desired: "", actions: [] };
    if (area.actions.length >= MAX_ACTIONS || area.actions.some((a) => a.text.toLowerCase() === c.text.toLowerCase())) continue;
    area.actions.push({ id: `k${c.id}${Date.now().toString(36)}`.slice(0, 40), text: c.text, owner: "", due: c.due, status: "not_started" });
    plan.areas[c.area as BlockKey] = area;
    added++;
  }
  if (!added) return 0;
  const clean = sanitizePlan(plan);
  const latest = await loadLatestAssessment(admin, founderId);
  await admin
    .from("strategic_plans")
    .update({ data: clean, completeness: planCompleteness(clean, latest?.gapKeys ?? []), updated_at: new Date().toISOString() })
    .eq("founder_id", founderId);
  return added;
}
