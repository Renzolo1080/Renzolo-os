import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { loadPlan } from "@/lib/plan-server";
import { parseAmount } from "@/lib/plan";

/** POST /api/goals/checkin { goalId, value, note?, date? }
 * Records the actual value of one of the founder's plan goals, so the
 * dashboard can show target vs actual. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).planBuilder) return NextResponse.json({ error: "Goal tracking is part of membership." }, { status: 402 });

  const body = (await req.json().catch(() => null)) as { goalId?: unknown; value?: unknown; note?: unknown; date?: unknown } | null;
  const value = parseAmount(body?.value);
  if (typeof body?.goalId !== "string" || value === null) return NextResponse.json({ error: "Enter a number for where this goal stands now." }, { status: 400 });
  const plan = await loadPlan(supabase, user.id);
  if (!plan?.data.goals.some((g) => g.id === body!.goalId)) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  const today = new Date().toISOString().slice(0, 10);
  const date = typeof body?.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(body.date) && body.date <= today ? body.date : today;
  const note = typeof body?.note === "string" ? body.note.trim().slice(0, 500) || null : null;
  const { error } = await supabase.from("goal_checkins").insert({ founder_id: user.id, goal_id: body!.goalId, value, note, checked_on: date });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
