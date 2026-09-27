import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReviewButton } from "@/components/ReviewButton";

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

  const now = Date.now();

  return (
    <main className="min-h-screen px-6 py-10 max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-2">Advisor Review Queue</h1>
      <p className="text-sm text-ink-soft mb-6">
        Reports awaiting review before release to the founder. Target turnaround: 24–36 hours.
      </p>

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
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
