import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportPanel } from "@/components/ReportPanel";
import { GoalProgressRow } from "@/components/GoalProgressRow";
import { DashboardCustomizer } from "@/components/DashboardCustomizer";
import { BLOCK_LABELS, type BlockKey } from "@/lib/scoring";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("dashboard_widgets").eq("id", user.id).single();
  const widgets: string[] = profile?.dashboard_widgets ?? ["reminders", "valuation", "goalsProgress"];
  const showReminders = widgets.includes("reminders");
  const showValuation = widgets.includes("valuation");
  const showGoalsProgress = widgets.includes("goalsProgress");

  const { data: latestScore } = await supabase
    .from("scores")
    .select("*, assessments!inner(founder_id)")
    .eq("assessments.founder_id", user.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: subscription } = await supabase
    .from("subscriptions")
    .select("status")
    .eq("founder_id", user.id)
    .maybeSingle();

  const needsBlockResponses = latestScore && (showReminders || showGoalsProgress);
  const { data: blockResponses } = needsBlockResponses
    ? await supabase
        .from("block_responses")
        .select("id, block_key, goal_target, target_date, progress_status")
        .eq("assessment_id", latestScore.assessment_id)
    : { data: null };

  const now = Date.now();
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const withDates = (blockResponses ?? []).filter((b) => b.target_date && b.progress_status !== "done");
  const overdueGoals = withDates.filter((b) => new Date(b.target_date!).getTime() < now);
  const dueSoonGoals = withDates.filter((b) => {
    const t = new Date(b.target_date!).getTime();
    return t >= now && t - now <= TWO_WEEKS_MS;
  });

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-6">Your Dashboard</h1>

      {!latestScore ? (
        <div>
          <p className="mb-4">You haven't completed a Readiness Assessment yet.</p>
          <a href="/assessment" className="rounded bg-navy px-5 py-3 text-white font-semibold inline-block">
            Start Assessment
          </a>
        </div>
      ) : (
        <div className="space-y-6">
          <DashboardCustomizer initialWidgets={widgets} />

          {showReminders && (overdueGoals.length > 0 || dueSoonGoals.length > 0) && (
            <div className="rounded border border-gold bg-cream p-4 text-sm">
              {overdueGoals.length > 0 && (
                <p className="text-red-700 font-semibold">
                  {overdueGoals.length} goal{overdueGoals.length > 1 ? "s" : ""} overdue.
                </p>
              )}
              {dueSoonGoals.length > 0 && (
                <p className="text-navy">
                  {dueSoonGoals.length} goal{dueSoonGoals.length > 1 ? "s" : ""} due in the next 14 days.
                </p>
              )}
            </div>
          )}

          {/* Standard view — always shown */}
          <div className="rounded border p-6">
            <p className="text-sm text-ink-soft">Venture Score</p>
            <p className="text-4xl font-bold text-navy">
              {latestScore.venture_score}
              <span className="text-lg font-normal text-ink-soft"> / 100</span>
            </p>
            <p className="text-gold font-semibold">{latestScore.venture_tier}</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Stat label="Market" value={latestScore.market_subscore} />
            <Stat label="Customer" value={latestScore.customer_subscore} />
            <Stat label="Investor" value={latestScore.investor_subscore} />
          </div>

          <div className="rounded border p-4">
            <p className="text-sm text-ink-soft">Health Index</p>
            <p className="text-2xl font-bold">
              {latestScore.health_index} <span className="text-sm font-normal text-ink-soft">({latestScore.health_confidence} confidence)</span>
            </p>
          </div>

          {showValuation && latestScore.valuation_low != null && latestScore.valuation_high != null && (
            <div className="rounded border p-6 bg-navy text-white">
              <p className="text-sm text-cream/80">Estimated Venture Value</p>
              <p className="text-3xl font-bold">
                ${Number(latestScore.valuation_low).toLocaleString()} – ${Number(latestScore.valuation_high).toLocaleString()}
              </p>
              <p className="text-xs text-cream/70 mt-2">{latestScore.valuation_basis}</p>
              <p className="text-xs text-cream/70 mt-2 italic">
                Directional estimate for your own planning, not a formal valuation, appraisal, or investment
                advice. Consult a qualified professional before relying on this for funding, a sale, or any
                legal purpose.
              </p>
            </div>
          )}

          {showGoalsProgress && blockResponses && blockResponses.length > 0 && (
            <div className="rounded border p-4">
              <p className="font-semibold text-navy mb-1">Goals & Progress</p>
              <p className="text-xs text-ink-soft mb-2">
                Your own targets and dates from the assessment — update status any time.
              </p>
              <div>
                {blockResponses.map((b) => (
                  <GoalProgressRow
                    key={b.id}
                    blockResponseId={b.id}
                    label={BLOCK_LABELS[b.block_key as BlockKey] ?? b.block_key}
                    goalTarget={b.goal_target ?? ""}
                    targetDate={b.target_date}
                    status={b.progress_status}
                    overdue={!!b.target_date && new Date(b.target_date).getTime() < now}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Standard view — always shown */}
          {subscription?.status === "active" ? (
            <ReportPanel assessmentId={latestScore.assessment_id} scoreId={latestScore.id} />
          ) : (
            <div className="rounded border p-6 bg-cream">
              <p className="mb-3 font-semibold">Unlock your full Diagnostic Report, Growth Navigator plan, and Readiness Passport.</p>
              <a href="/dashboard/subscribe" className="rounded bg-navy px-5 py-3 text-white font-semibold inline-block">
                Subscribe
              </a>
            </div>
          )}

          <a href="/tools" className="block text-center rounded border border-navy text-navy px-5 py-3 font-semibold">
            Open Founder Tools (calculators & milestone planner)
          </a>
        </div>
      )}
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-4 text-center">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
