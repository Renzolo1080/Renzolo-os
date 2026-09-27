import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReviewButton } from "@/components/ReviewButton";
import { ScheduleButton } from "@/components/ScheduleButton";
import { QAToggle } from "@/components/QAToggle";
import { AdvisorRecommendationForm } from "@/components/AdvisorRecommendationForm";

export default async function AdvisorQueuePage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "advisor" && profile.role !== "admin")) {
    redirect("/dashboard");
  }

  const { data: pendingReports } = await supabase
    .from("reports")
    .select("*, assessments(founder_id, venture_stage, industry, profiles(full_name))")
    .eq("advisor_reviewed", false)
    .order("review_due_by", { ascending: true });

  const { data: pendingSessions } = await supabase
    .from("advisor_sessions")
    .select("*, profiles!advisor_sessions_founder_id_fkey(full_name)")
    .eq("status", "requested")
    .order("created_at", { ascending: true });

  const now = Date.now();

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-2">Advisor Review Queue</h1>
      <p className="text-sm text-ink-soft mb-6">
        Reports flagged for review are quality-assurance only — founders already have their report; this is
        not a gate. Target turnaround when flagged: 24–36 hours.
      </p>

      {profile.role === "admin" && <QAToggle />}

      {!pendingReports || pendingReports.length === 0 ? (
        <p>Nothing pending review right now.</p>
      ) : (
        <div className="space-y-4">
          {pendingReports.map((r: any) => {
            const overdue = r.review_due_by && new Date(r.review_due_by).getTime() < now;
            return (
              <div key={r.id} className={`rounded border p-4 ${overdue ? "border-red-500 bg-red-50" : ""}`}>
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-semibold">{r.assessments?.profiles?.full_name ?? "Unknown founder"}</p>
                    <p className="text-sm text-ink-soft">
                      {r.assessments?.venture_stage} · {r.assessments?.industry}
                    </p>
                    <p className={`text-xs mt-1 ${overdue ? "text-red-600 font-semibold" : "text-ink-soft"}`}>
                      Due by {r.review_due_by ? new Date(r.review_due_by).toLocaleString() : "unset"}
                      {overdue ? " — OVERDUE" : ""}
                    </p>
                  </div>
                  <ReviewButton reportId={r.id} />
                </div>
                <details className="mt-3">
                  <summary className="cursor-pointer text-sm text-teal">View draft report</summary>
                  <pre className="mt-2 whitespace-pre-wrap text-sm bg-cream p-3 rounded">{r.diagnostic_markdown}</pre>
                </details>
                <AdvisorRecommendationForm assessmentId={r.assessment_id} reportId={r.id} />
              </div>
            );
          })}
        </div>
      )}

      <h2 className="text-xl font-bold text-navy mt-12 mb-2">Paid 1:1 Advisor Sessions — Awaiting Scheduling</h2>
      <p className="text-sm text-ink-soft mb-6">
        Founders who purchased a paid 1:1 session. Coordinate the actual time by email or call, then mark it
        scheduled here — this queue does not book calendar time automatically (Keep Manual for launch).
      </p>

      {!pendingSessions || pendingSessions.length === 0 ? (
        <p>No paid sessions awaiting scheduling.</p>
      ) : (
        <div className="space-y-4">
          {pendingSessions.map((s: any) => (
            <div key={s.id} className="rounded border p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-semibold">{s.profiles?.full_name ?? "Unknown founder"}</p>
                  <p className="text-sm text-ink-soft">
                    {s.currency} {s.price} · requested {new Date(s.created_at).toLocaleString()}
                  </p>
                  {s.report_id && <p className="text-xs text-ink-soft mt-1">Linked report: {s.report_id}</p>}
                </div>
                <ScheduleButton sessionId={s.id} />
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
