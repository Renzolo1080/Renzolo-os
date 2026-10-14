import { createClient, createAdminClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { isCoach } from "@/lib/coaching-server";
import { sanitizeCommitments, sanitizeNotes, sanitizePrep } from "@/lib/coaching";
import { loadLatestAssessment, loadPlan } from "@/lib/plan-server";
import { goalProgress, GOAL_STATUS_LABELS, formatAmount } from "@/lib/progress";
import { actionStats } from "@/lib/plan";
import { BLOCK_KEYS, BLOCK_LABELS } from "@/lib/scoring";
import { CoachSession } from "@/components/coaching/CoachSession";

export const dynamic = "force-dynamic";

/** One coaching session: the founder's prep and context, the AI prep
 * brief, GROW notes, summary and commitments. Coaches and admins only. */
export default async function CoachSessionPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isCoach(supabase, user.id))) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: s } = await admin.from("advisor_sessions").select("*, profiles!advisor_sessions_founder_id_fkey(full_name)").eq("id", params.id).maybeSingle();
  if (!s || !s.paid_at) notFound();
  const fid = s.founder_id;
  const [latest, planRow, { data: checkins }, { data: update }, { data: history }] = await Promise.all([
    loadLatestAssessment(admin, fid),
    loadPlan(admin, fid),
    admin.from("goal_checkins").select("goal_id, value, checked_on").eq("founder_id", fid),
    admin.from("founder_updates").select("*").eq("founder_id", fid).order("period", { ascending: false }).limit(1).maybeSingle(),
    admin.from("advisor_sessions").select("id, completed_at, summary, commitments").eq("founder_id", fid).eq("status", "completed").neq("id", s.id).order("completed_at", { ascending: false }).limit(5),
  ]);
  const prep = sanitizePrep(s.founder_prep);
  const today = new Date().toISOString().slice(0, 10);
  const goals = (planRow?.data.goals ?? []).filter((g) => g.title).map((g) => goalProgress(g, (checkins ?? []).map((c: any) => ({ ...c, value: Number(c.value) })), today));
  const stats = planRow ? actionStats(planRow.data, today) : null;
  const sc = latest?.score;

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <a href="/coach" className="text-sm text-teal">
        ← All sessions
      </a>
      <h1 className="mt-3 text-3xl font-bold text-navy">{s.profiles?.full_name ?? "Founder"}</h1>
      <p className="text-ink-soft">
        {latest?.assessment?.extra?.companyName ?? ""} {latest?.assessment?.industry ? `· ${latest.assessment.industry}` : ""} {latest?.assessment?.geography ? `· ${latest.assessment.geography}` : ""}
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <CoachSession
          id={s.id}
          status={s.status}
          kind={s.kind ?? "coaching"}
          scheduledAt={s.scheduled_at}
          initialNotes={sanitizeNotes(s.coach_notes)}
          initialSummary={s.summary ?? ""}
          initialCommitments={sanitizeCommitments(s.commitments)}
          initialBrief={s.prep_brief ?? null}
          areas={BLOCK_KEYS.map((k) => ({ key: k, label: BLOCK_LABELS[k] }))}
        />
        <aside className="space-y-4 text-sm">
          <div className="rounded-2xl bg-navy p-4 text-white">
            <p className="text-xs uppercase tracking-wide text-gold">The founder wants</p>
            <p className="mt-1 font-semibold">{prep.focusLabel || "Not given"}</p>
            <p className="mt-1 text-cream/90">{prep.outcome}</p>
            {prep.wins && <p className="mt-2 text-xs text-cream/80">Wins: {prep.wins}</p>}
            {prep.challenge && <p className="mt-1 text-xs text-cream/80">Challenge: {prep.challenge}</p>}
          </div>
          {sc && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-semibold text-navy">Scores</p>
              <p className="mt-1">
                Venture {Math.round(sc.venture_score)} · {sc.venture_tier}
              </p>
              <p className="text-ink-soft">
                Market {Math.round(sc.market_subscore)} · Customer {Math.round(sc.customer_subscore)} · Investor {Math.round(sc.investor_subscore)}
              </p>
              <p className="mt-1 text-ink-soft">Weakest: {((sc.gaps as any[]) ?? []).map((g) => g.label).join(", ")}</p>
            </div>
          )}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-semibold text-navy">Goals</p>
            {goals.length === 0 ? (
              <p className="mt-1 text-ink-soft">No plan goals yet.</p>
            ) : (
              <ul className="mt-1 space-y-1">
                {goals.map((g) => (
                  <li key={g.goal.id}>
                    {g.goal.title}: {formatAmount(g.actual, g.goal.unit)} of {formatAmount(g.goal.target, g.goal.unit)} <span className="text-ink-soft">({GOAL_STATUS_LABELS[g.status]})</span>
                  </li>
                ))}
              </ul>
            )}
            {stats && <p className="mt-2 text-ink-soft">Plan actions: {stats.done}/{stats.total} done, {stats.overdue} overdue</p>}
          </div>
          {update && (
            <div className="rounded-2xl bg-white p-4 shadow-sm">
              <p className="font-semibold text-navy">Monthly update · {String(update.period).slice(0, 7)}</p>
              <p className="mt-1 text-ink-soft">
                Revenue {formatAmount(update.revenue === null ? null : Number(update.revenue), "$")} · Customers {update.customers ?? "–"} · Cash {formatAmount(update.cash === null ? null : Number(update.cash), "$")}
              </p>
              {update.asks && <p className="mt-1">Help needed: {update.asks}</p>}
            </div>
          )}
          <div className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="font-semibold text-navy">Earlier sessions</p>
            {(history ?? []).length === 0 ? (
              <p className="mt-1 text-ink-soft">First session.</p>
            ) : (
              <ul className="mt-1 space-y-2">
                {(history ?? []).map((h: any) => (
                  <li key={h.id}>
                    <p className="text-xs text-ink-soft">{String(h.completed_at).slice(0, 10)}</p>
                    <p>{h.summary ?? "No summary"}</p>
                    {sanitizeCommitments(h.commitments).map((c) => (
                      <p key={c.id} className="text-xs text-ink-soft">
                        {c.status === "done" ? "✓" : c.status === "dropped" ? "–" : "○"} {c.text}
                      </p>
                    ))}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
