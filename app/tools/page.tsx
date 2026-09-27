import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { BLOCK_KEYS, BLOCK_LABELS } from "@/lib/scoring";
import { FinancialCalculators } from "@/components/FinancialCalculators";
import { MilestonePlanner, type BlockOption, type Milestone } from "@/components/MilestonePlanner";
import { RecommendationsPanel, type Recommendation } from "@/components/RecommendationsPanel";

export default async function ToolsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: latestScore } = await supabase
    .from("scores")
    .select("id, assessment_id, gaps, assessments!inner(founder_id)")
    .eq("assessments.founder_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const priorityBlocks = new Set((latestScore?.gaps as any[] | null)?.map((g) => g.block) ?? []);

  const blockOptions: BlockOption[] = BLOCK_KEYS.map((key) => ({
    key,
    label: BLOCK_LABELS[key],
    priority: priorityBlocks.has(key),
  }));

  const { data: milestones } = latestScore
    ? await supabase
        .from("milestones")
        .select("id, block_key, title, target_date, completed")
        .eq("assessment_id", latestScore.assessment_id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const { data: recommendationRows } = latestScore
    ? await supabase
        .from("recommendations")
        .select("id, source, block_key, title, detail, created_at, profiles(full_name)")
        .eq("assessment_id", latestScore.assessment_id)
        .order("created_at", { ascending: false })
    : { data: [] };

  const recommendations: Recommendation[] = (recommendationRows ?? []).map((r: any) => ({
    id: r.id,
    source: r.source,
    block_key: r.block_key,
    title: r.title,
    detail: r.detail,
    created_at: r.created_at,
    advisor_name: r.profiles?.full_name ?? null,
  }));

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-2">Founder Tools</h1>
      <p className="text-sm text-ink-soft mb-8">
        Quick calculators and a milestone planner to turn your assessment goals into concrete next steps.
      </p>

      <h2 className="text-xl font-bold text-navy mb-4">Calculators</h2>
      <FinancialCalculators />

      <h2 className="text-xl font-bold text-navy mt-10 mb-2">Recommendations</h2>
      <p className="text-sm text-ink-soft mb-4">
        Targets, goals, and next steps from your AI Diagnostic Report and from any human advisor/coach you've
        worked with — one combined list.
      </p>
      {latestScore && <RecommendationsPanel assessmentId={latestScore.assessment_id} recommendations={recommendations} />}

      <h2 className="text-xl font-bold text-navy mt-10 mb-2">Milestone Planner</h2>
      {!latestScore ? (
        <p className="text-sm text-ink-soft">
          Complete a Readiness Assessment first — milestones are tied to your assessment and its gap-to-target
          priorities (marked ⚠ below once you have one).
        </p>
      ) : (
        <MilestonePlanner
          assessmentId={latestScore.assessment_id}
          blockOptions={blockOptions}
          initialMilestones={(milestones ?? []) as Milestone[]}
        />
      )}
    </main>
  );
}
