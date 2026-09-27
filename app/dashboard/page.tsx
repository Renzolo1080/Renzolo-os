import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportPanel } from "@/components/ReportPanel";

export default async function DashboardPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

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
