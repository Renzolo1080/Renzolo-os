import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { BLOCK_PROMPTS, MEASURE_CHOICES, areasWeakestFirst, levelFor } from "@/lib/blocks";
import { DETAIL_AREAS_REQUIRED, TIME_HORIZONS } from "@/lib/quickcheck";
import { DetailForm, type DetailArea } from "@/components/DetailForm";
import type { MeasureKey } from "@/components/BlockStep";

export const dynamic = "force-dynamic";

/** The full Readiness Assessment: all nine business areas, weakest first,
 * saved as the founder goes. Follows the free Readiness Snapshot; the
 * answers sharpen the score and shape the Readiness Report and plan.
 * Members, and founders who bought the one-time Readiness Assessment. */
export default async function DetailsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m = await loadMembership(supabase, user.id);
  if (!m.tier && m.purchases.length === 0) redirect("/dashboard/subscribe");
  const ent = entitlements(m.tier, m.purchases.length > 0);

  const { data: latestScore } = await supabase
    .from("scores")
    .select("assessment_id, gaps, block_scores, assessments!inner(founder_id, extra, time_horizon)")
    .eq("assessments.founder_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latestScore) redirect("/assessment");

  const gapKeys: string[] = ((latestScore.gaps as any[] | null) ?? []).map((g) => g.block).slice(0, DETAIL_AREAS_REQUIRED);
  const blockScores = (latestScore.block_scores as Record<string, number> | null) ?? {};
  // The three weakest areas from the Snapshot always come first, then the rest by score.
  const ordered = [...gapKeys, ...areasWeakestFirst(blockScores).filter((k) => !gapKeys.includes(k))];

  const { data: rows } = await supabase
    .from("block_responses")
    .select("block_key, current_state, future_state, goal_target, target_date, evidence_uploaded, measures")
    .eq("assessment_id", latestScore.assessment_id);

  const areas: DetailArea[] = ordered.flatMap((key) => {
    const prompt = BLOCK_PROMPTS.find((b) => b.key === key);
    if (!prompt) return [];
    const row: any = (rows ?? []).find((r: any) => r.block_key === key) ?? {};
    // Snapshot answers set every measure to the same level; only show
    // measure answers once the founder has answered this area themselves.
    const described = typeof row.current_state === "string" && row.current_state.trim().length > 0;
    const levels = Object.fromEntries(MEASURE_CHOICES.map((mc) => [mc.key, described ? levelFor(row.measures?.[mc.key]) : null])) as Record<MeasureKey, number | null>;
    return [
      {
        prompt,
        score: Math.round(Number(blockScores[key] ?? 0)),
        priority: gapKeys.includes(key),
        initial: {
          currentState: row.current_state ?? "",
          futureState: row.future_state ?? "",
          goalTarget: row.goal_target ?? "",
          targetDate: row.target_date ?? "",
          evidenceUploaded: !!row.evidence_uploaded,
          levels,
        },
      },
    ];
  });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <h1 className="mt-3 text-3xl font-bold text-navy">Full Readiness Assessment</h1>
      <p className="mb-8 mt-2 max-w-2xl text-ink-soft">
        All nine areas of your business, weakest first. About 5 minutes an area, saved as you go, so you can stop and come back. Your report needs your
        three weakest areas; every extra area makes your score, report and plan sharper.
      </p>
      <DetailForm
        assessmentId={latestScore.assessment_id}
        areas={areas}
        required={DETAIL_AREAS_REQUIRED}
        planLengths={[...TIME_HORIZONS]}
        initialPlanLength={initialPlanLength((latestScore as any).assessments)}
        planHref={ent.planBuilder ? "/plan" : null}
      />
    </main>
  );
}

function initialPlanLength(a: any): string {
  const list = TIME_HORIZONS as readonly string[];
  if (typeof a?.extra?.planLength === "string" && list.includes(a.extra.planLength)) return a.extra.planLength;
  if (typeof a?.time_horizon === "string" && list.includes(a.time_horizon)) return a.time_horizon;
  return "12 months";
}
