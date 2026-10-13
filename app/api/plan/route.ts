import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { sanitizePlan, planCompleteness } from "@/lib/plan";
import { loadLatestAssessment } from "@/lib/plan-server";

/** PUT /api/plan { plan }
 * Saves the founder's strategic plan from the Plan Builder. The plan is
 * cleaned (lib/plan.ts sanitizePlan) and its completeness worked out
 * against the founder's latest assessment. Any member, and founders who
 * bought the one-time Readiness Assessment. */
export async function PUT(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).planBuilder) {
    return NextResponse.json({ error: "The Plan Builder is part of membership and the one-time Readiness Assessment." }, { status: 402 });
  }

  const body = (await req.json().catch(() => null)) as { plan?: unknown } | null;
  if (!body?.plan || typeof body.plan !== "object") return NextResponse.json({ error: "Missing plan" }, { status: 400 });
  if (JSON.stringify(body.plan).length > 100_000) return NextResponse.json({ error: "That plan is too long to save." }, { status: 413 });

  const plan = sanitizePlan(body.plan);
  const latest = await loadLatestAssessment(supabase, user.id);
  const completeness = planCompleteness(plan, latest?.gapKeys ?? []);
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("strategic_plans")
    .upsert({ founder_id: user.id, data: plan, completeness, assessment_id: latest?.assessmentId ?? null, updated_at: now }, { onConflict: "founder_id" })
    .select("id, updated_at, completeness")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, plan, completeness: data.completeness, updatedAt: data.updated_at });
}
