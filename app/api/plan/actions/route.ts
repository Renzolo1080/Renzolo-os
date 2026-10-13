import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { ACTION_STATUSES, MAX_ACTIONS, planCompleteness, sanitizePlan, type PlanAction } from "@/lib/plan";
import { loadLatestAssessment, loadPlan, planOrStarter } from "@/lib/plan-server";
import { BLOCK_KEYS, type BlockKey } from "@/lib/scoring";

/** Small changes to plan actions without opening the Plan Builder.
 *  POST  { area, text, due? }      adds an action (e.g. from a Market
 *                                   Intelligence recommendation)
 *  PATCH { area, id, status }      updates an action's status (dashboard) */
async function guard() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) } as const;
  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).planBuilder) {
    return { error: NextResponse.json({ error: "The Plan Builder is part of membership and the one-time Readiness Assessment." }, { status: 402 }) } as const;
  }
  return { supabase, user } as const;
}

const isArea = (v: unknown): v is BlockKey => typeof v === "string" && (BLOCK_KEYS as readonly string[]).includes(v);

export async function POST(req: NextRequest) {
  const g = await guard();
  if ("error" in g) return g.error;
  const { supabase, user } = g;
  const body = (await req.json().catch(() => null)) as { area?: unknown; text?: unknown; due?: unknown } | null;
  const text = typeof body?.text === "string" ? body.text.trim().slice(0, 300) : "";
  if (!isArea(body?.area) || !text) return NextResponse.json({ error: "Choose a business area and describe the action." }, { status: 400 });

  const latest = await loadLatestAssessment(supabase, user.id);
  const { plan } = planOrStarter(await loadPlan(supabase, user.id), latest);
  const area = plan.areas[body!.area as BlockKey] ?? { current: "", desired: "", actions: [] };
  if (area.actions.some((a) => a.text.toLowerCase() === text.toLowerCase())) return NextResponse.json({ ok: true, duplicate: true });
  if (area.actions.length >= MAX_ACTIONS) return NextResponse.json({ error: `That area already has ${MAX_ACTIONS} actions. Finish or remove one in the Plan Builder first.` }, { status: 400 });
  const action: PlanAction = { id: `m${Date.now().toString(36)}`, text, owner: "", due: typeof body?.due === "string" ? body.due : "", status: "not_started" };
  area.actions.push(action);
  plan.areas[body!.area as BlockKey] = area;
  return save(supabase, user.id, plan, latest);
}

export async function PATCH(req: NextRequest) {
  const g = await guard();
  if ("error" in g) return g.error;
  const { supabase, user } = g;
  const body = (await req.json().catch(() => null)) as { area?: unknown; id?: unknown; status?: unknown } | null;
  const status = ACTION_STATUSES.find((s) => s.value === body?.status)?.value;
  if (!isArea(body?.area) || typeof body?.id !== "string" || !status) return NextResponse.json({ error: "Missing action" }, { status: 400 });
  const row = await loadPlan(supabase, user.id);
  const action = row?.data.areas[body!.area as BlockKey]?.actions.find((a) => a.id === body!.id);
  if (!row || !action) return NextResponse.json({ error: "Action not found" }, { status: 404 });
  action.status = status;
  return save(supabase, user.id, row.data, await loadLatestAssessment(supabase, user.id));
}

async function save(supabase: any, founderId: string, raw: unknown, latest: Awaited<ReturnType<typeof loadLatestAssessment>>) {
  const plan = sanitizePlan(raw);
  const completeness = planCompleteness(plan, latest?.gapKeys ?? []);
  const { error } = await supabase
    .from("strategic_plans")
    .upsert({ founder_id: founderId, data: plan, completeness, assessment_id: latest?.assessmentId ?? null, updated_at: new Date().toISOString() }, { onConflict: "founder_id" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, completeness });
}
