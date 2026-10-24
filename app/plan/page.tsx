import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { loadLatestAssessment, loadPlan, planOrStarter } from "@/lib/plan-server";
import { addNewAssessmentAreas } from "@/lib/plan";
import { TIME_HORIZONS } from "@/lib/quickcheck";
import { BLOCK_KEYS } from "@/lib/scoring";
import { PlanBuilder, type AreaContext } from "@/components/PlanBuilder";
import { parsePlanReview } from "@/lib/plan-review";

export const dynamic = "force-dynamic";

/** The guided Plan Builder and AI plan review. */
export default async function PlanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m = await loadMembership(supabase, user.id);
  const ent = entitlements(m.tier, m.purchases.length > 0);
  if (!ent.planBuilder) redirect("/dashboard/subscribe");

  const latest = await loadLatestAssessment(supabase, user.id);
  if (!latest) redirect("/assessment");
  const row = await loadPlan(supabase, user.id);
  const { plan, isNew } = planOrStarter(row, latest);
  // Areas the founder has described in the assessment since starting the plan.
  const added = row ? addNewAssessmentAreas(plan, latest.blocks) : [];

  const { data: reviewRow } = await supabase.from("plan_reviews").select("result, created_at, plan_updated_at").order("created_at", { ascending: false }).limit(1).maybeSingle();
  const review = reviewRow ? parsePlanReview(JSON.stringify(reviewRow.result)) : null;

  const blockScores = (latest.score.block_scores ?? {}) as Record<string, number>;
  const areaContext: AreaContext[] = BLOCK_KEYS.map((k) => {
    const b = latest.blocks.find((x) => x.block_key === k);
    return { key: k, score: blockScores[k] !== undefined ? Math.round(Number(blockScores[k])) : null, assessmentToday: (b?.current_state ?? "").trim(), assessmentDesired: (b?.future_state ?? "").trim() };
  });

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <h1 className="mt-3 text-3xl font-bold text-navy">Your strategic plan</h1>
      <p className="mb-8 mt-2 max-w-2xl text-ink-soft">
        A guided plan that starts from where your business is today and sets out where you're going, how you'll measure it, and who does what by when. It
        feeds your dashboard, your Readiness Report and your coaching.
      </p>
      {added.length > 0 && (
        <p className="mb-6 rounded-lg border border-teal/40 bg-white p-3 text-sm">
          We've added {added.length} area{added.length > 1 ? "s" : ""} you've since described in your assessment. Check them under Business areas, then save.
        </p>
      )}
      <PlanBuilder
        initialPlan={plan}
        isNew={isNew}
        gapKeys={latest.gapKeys}
        areaContext={areaContext}
        horizons={[...TIME_HORIZONS]}
        canReview={ent.planReview}
        initialReview={review && reviewRow ? { review, createdAt: reviewRow.created_at, planUpdatedAt: reviewRow.plan_updated_at } : null}
        initialUpdatedAt={row?.updated_at ?? null}
        startDirty={added.length > 0}
      />
    </main>
  );
}
