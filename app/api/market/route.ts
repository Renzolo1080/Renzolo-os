import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { askClaude } from "@/lib/anthropic";
import { planAsText } from "@/lib/plan";
import { briefLooksComplete, briefRefresh, buildMarketPrompt, cleanBrief, parseInsights } from "@/lib/market";
import { loadLatestAssessment, loadPlan } from "@/lib/plan-server";
import { BLOCK_KEYS, BLOCK_LABELS } from "@/lib/scoring";

export const maxDuration = 180;

/** POST /api/market
 * A Market Intelligence brief for the founder's industry and country,
 * researched live and written to strengthen their strategic plan. Growth,
 * Elevate and the one-time Readiness Assessment; refreshed monthly (or
 * sooner if their industry or country changes). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).marketIntel) {
    return NextResponse.json({ error: "Market Intelligence comes with Growth, Elevate and the one-time Readiness Assessment." }, { status: 402 });
  }

  const latest = await loadLatestAssessment(supabase, user.id);
  if (!latest) return NextResponse.json({ error: "Take the Readiness Snapshot first, so we know your industry and country." }, { status: 400 });
  const industry = String(latest.assessment?.industry ?? "").trim();
  const country = String(latest.assessment?.geography ?? "").trim();
  if (!industry || !country) return NextResponse.json({ error: "Your assessment is missing your industry or country." }, { status: 400 });

  const { data: briefs } = await supabase.from("market_briefs").select("created_at, industry, country").order("created_at", { ascending: false }).limit(10);
  const refresh = briefRefresh(briefs ?? [], { industry, country });
  if (!refresh.allowed) return NextResponse.json({ error: refresh.reason, nextAt: refresh.nextAt }, { status: 429 });

  const row = await loadPlan(supabase, user.id);
  const plan = row?.data ?? null;
  const areaKeys = plan ? BLOCK_KEYS.filter((k) => plan.areas[k]) : latest.gapKeys;
  const areas = (areaKeys.length ? areaKeys : BLOCK_KEYS).map((k) => ({ key: k, label: BLOCK_LABELS[k as keyof typeof BLOCK_LABELS] ?? k }));
  const goals = (plan?.goals ?? []).filter((g) => g.title).map((g) => ({ id: g.id, title: g.title }));
  const block = (k: string) => latest.blocks.find((b) => b.block_key === k);

  const prompt = buildMarketPrompt(
    {
      companyName: latest.assessment?.extra?.companyName ?? "",
      industry,
      country,
      stage: latest.assessment?.venture_stage ?? "",
      businessType: latest.assessment?.business_type ?? "",
      revenue: latest.assessment?.annual_revenue ?? "",
      primaryGoal: latest.assessment?.extra?.primaryGoal ?? "",
      customers: plan?.areas.customerSegments?.current || block("customerSegments")?.current_state || "",
      offer: plan?.areas.valueProposition?.current || block("valueProposition")?.current_state || "",
      fundingNeed: latest.assessment?.extra?.fundingNeed ?? "",
      planText: plan ? planAsText(plan) : null,
      goals,
      areas,
    },
    new Date().toISOString().slice(0, 10)
  );

  let result: { text: string; sources: { title: string; url: string }[] } | null = null;
  try {
    result = await askClaude(prompt, { maxTokens: 5000, webSearches: 6 });
  } catch (e) {
    console.error("Market brief failed:", e);
  }
  const markdown = result ? cleanBrief(result.text) : "";
  if (!result || !briefLooksComplete(markdown)) {
    return NextResponse.json({ error: "We couldn't complete your market brief just now. Please try again in a few minutes." }, { status: 502 });
  }
  const insights = parseInsights(result.text, { areas: areas.map((a) => a.key), goals: goals.map((g) => g.id) });

  const { data, error } = await createAdminClient()
    .from("market_briefs")
    .insert({ founder_id: user.id, industry, country, markdown, sources: result.sources, insights, plan_updated_at: row?.updated_at ?? null })
    .select("id, created_at")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, id: data.id });
}
