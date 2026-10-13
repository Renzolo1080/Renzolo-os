import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isSubscriptionActive } from "@/lib/payments";
import { BLOCK_PROMPTS } from "@/lib/blocks";
import { DETAIL_AREAS_REQUIRED } from "@/lib/quickcheck";
import { DetailForm, type DetailArea } from "@/components/DetailForm";

export const dynamic = "force-dynamic";

/** The detailed questions a subscriber answers for their three weakest
 * areas, after the free Readiness Snapshot. Their answers sharpen the score and
 * are what the AI Diagnostic Report and goals are built from. */
export default async function DetailsPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status, current_period_end, auto_renew")
    .eq("founder_id", user.id)
    .maybeSingle();
  if (!isSubscriptionActive(subscription)) redirect("/dashboard/subscribe");

  const { data: latestScore } = await supabase
    .from("scores")
    .select("assessment_id, gaps, assessments!inner(founder_id)")
    .eq("assessments.founder_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (!latestScore) redirect("/assessment");

  const gapKeys: string[] = ((latestScore.gaps as any[] | null) ?? []).map((g) => g.block).slice(0, DETAIL_AREAS_REQUIRED);

  const { data: rows } = await supabase
    .from("block_responses")
    .select("block_key, current_state, future_state, goal_target, target_date, evidence_uploaded, measures")
    .eq("assessment_id", latestScore.assessment_id)
    .in("block_key", gapKeys);

  const areas: DetailArea[] = gapKeys.flatMap((key) => {
    const prompt = BLOCK_PROMPTS.find((b) => b.key === key);
    if (!prompt) return [];
    const row: any = (rows ?? []).find((r: any) => r.block_key === key) ?? {};
    return [
      {
        prompt,
        initial: {
          currentState: row.current_state ?? "",
          futureState: row.future_state ?? "",
          goalTarget: row.goal_target ?? "",
          targetDate: row.target_date ?? "",
          evidenceUploaded: !!row.evidence_uploaded,
          measures: {
            clarity: row.measures?.clarity ?? 50,
            evidence: row.measures?.evidence ?? 50,
            economics: row.measures?.economics ?? 50,
            scalability: row.measures?.scalability ?? 50,
            defensibility: row.measures?.defensibility ?? 50,
            risk: row.measures?.risk ?? 50,
          },
        },
      },
    ];
  });

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <h1 className="text-2xl font-bold text-navy mt-3">Your three weakest areas, in detail</h1>
      <p className="text-ink-soft mt-2 mb-8">
        Tell us where things stand and where you want them to be. About 10 minutes. Your answers sharpen your score and
        shape your Diagnostic Report and 90-day plan.
      </p>
      <DetailForm assessmentId={latestScore.assessment_id} areas={areas} />
    </main>
  );
}
