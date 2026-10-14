import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { isCoach } from "@/lib/coaching-server";
import { coachingStats, openCommitments, riskFlags, RISK_LABELS, sanitizePrep, SESSION_KINDS, type SessionLike } from "@/lib/coaching";
import { goalProgress } from "@/lib/progress";
import { sanitizePlan } from "@/lib/plan";

export const dynamic = "force-dynamic";
const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

/** The coach's workspace: sessions to schedule and run, founders who need
 * attention, and how coaching is going. Coaches and admins only. */
export default async function CoachPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!(await isCoach(supabase, user.id))) redirect("/dashboard");

  const admin = createAdminClient();
  const { data: sessionRows } = await admin
    .from("advisor_sessions")
    .select("id, founder_id, status, kind, scheduled_at, completed_at, created_at, founder_prep, commitments, rating, paid_at, profiles!advisor_sessions_founder_id_fkey(full_name)")
    .not("paid_at", "is", null)
    .order("created_at", { ascending: false })
    .limit(500);
  const sessions = (sessionRows ?? []) as any[];
  const founderIds = [...new Set(sessions.map((s) => s.founder_id))];

  const [{ data: plans }, { data: checkins }, { data: updates }] = founderIds.length
    ? await Promise.all([
        admin.from("strategic_plans").select("founder_id, data").in("founder_id", founderIds),
        admin.from("goal_checkins").select("founder_id, goal_id, value, checked_on").in("founder_id", founderIds),
        admin.from("founder_updates").select("founder_id, period").in("founder_id", founderIds).order("period", { ascending: false }),
      ])
    : [{ data: [] }, { data: [] }, { data: [] }];

  const today = new Date().toISOString().slice(0, 10);
  const founders = founderIds.map((fid) => {
    const own = sessions.filter((s) => s.founder_id === fid) as (SessionLike & any)[];
    const plan = (plans ?? []).find((p: any) => p.founder_id === fid);
    const goals = plan ? sanitizePlan(plan.data).goals.filter((g) => g.title) : [];
    const cks = (checkins ?? []).filter((c: any) => c.founder_id === fid).map((c: any) => ({ ...c, value: Number(c.value) }));
    const behind = goals.map((g) => goalProgress(g, cks, today)).filter((p) => p.status === "behind" || p.status === "overdue").length;
    const lastUpdate = (updates ?? []).find((u: any) => u.founder_id === fid)?.period ?? null;
    return {
      id: fid,
      name: own[0]?.profiles?.full_name ?? "Founder",
      flags: riskFlags({ sessions: own, lastUpdate, goalsBehind: behind }, today),
      open: openCommitments(own).length,
      sessions: own.length,
    };
  });
  founders.sort((a, b) => b.flags.length - a.flags.length);

  const stats = coachingStats(sessions);
  const requested = sessions.filter((s) => s.status === "requested");
  const scheduled = sessions.filter((s) => s.status === "scheduled").sort((a, b) => (a.scheduled_at ?? "").localeCompare(b.scheduled_at ?? ""));
  const recent = sessions.filter((s) => s.status === "completed").slice(0, 10);

  const Row = ({ s, right }: { s: any; right: string }) => {
    const prep = sanitizePrep(s.founder_prep);
    return (
      <li>
        <a href={`/coach/${s.id}`} className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-gray-200 p-3 text-sm hover:border-navy">
          <span>
            <span className="font-semibold">{s.profiles?.full_name ?? "Founder"}</span>
            <span className="text-ink-soft"> · {prep.focusLabel || SESSION_KINDS.find((k) => k.value === s.kind)?.label}</span>
          </span>
          <span className="text-ink-soft">{right}</span>
        </a>
      </li>
    );
  };

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <h1 className="text-3xl font-bold text-navy">Coaching</h1>
      <p className="mt-1 text-ink-soft">Your sessions and founders. {process.env.COACHING_BOOKING_URL ? "" : "Set COACHING_BOOKING_URL so founders can pick a time on your calendar."}</p>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-5">
        {[
          ["Need a time", stats.awaiting],
          ["Upcoming", stats.upcoming],
          ["Completed", stats.completed],
          ["Average rating", stats.avgRating ?? "–"],
          ["Commitments kept", stats.commitmentRate === null ? "–" : `${stats.commitmentRate}%`],
        ].map(([l, v]) => (
          <div key={String(l)} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-ink-soft">{l}</p>
            <p className="mt-1 text-2xl font-bold text-navy">{v}</p>
          </div>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-navy">Requested: needs a time</h2>
          {requested.length === 0 ? <p className="mt-2 text-sm text-ink-soft">None.</p> : <ul className="mt-3 space-y-2">{requested.map((s) => <Row key={s.id} s={s} right={`requested ${fmt(s.created_at)}`} />)}</ul>}
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-navy">Upcoming</h2>
          {scheduled.length === 0 ? <p className="mt-2 text-sm text-ink-soft">None.</p> : <ul className="mt-3 space-y-2">{scheduled.map((s) => <Row key={s.id} s={s} right={s.scheduled_at ? fmt(s.scheduled_at) : ""} />)}</ul>}
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-navy">Founders</h2>
          {founders.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Founders appear here once they book a session.</p>
          ) : (
            <div className="mt-3 overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b text-ink-soft">
                    <th className="py-2 font-medium">Founder</th>
                    <th className="py-2 font-medium">Sessions</th>
                    <th className="py-2 font-medium">Open commitments</th>
                    <th className="py-2 font-medium">Needs attention</th>
                  </tr>
                </thead>
                <tbody>
                  {founders.map((f) => (
                    <tr key={f.id} className="border-b last:border-0">
                      <td className="py-2 font-medium">{f.name}</td>
                      <td className="py-2">{f.sessions}</td>
                      <td className="py-2">{f.open}</td>
                      <td className="py-2">
                        {f.flags.length === 0 ? (
                          <span className="text-teal">On track</span>
                        ) : (
                          <span className="flex flex-wrap gap-1">
                            {f.flags.map((x) => (
                              <span key={x} className={`rounded px-1.5 py-0.5 text-xs ${x === "overdue_commitments" || x === "goal_behind" ? "bg-red-100 text-red-700" : "bg-gold/20 text-navy"}`}>
                                {RISK_LABELS[x]}
                              </span>
                            ))}
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
        <section className="rounded-2xl bg-white p-5 shadow-sm lg:col-span-2">
          <h2 className="font-semibold text-navy">Recently completed</h2>
          {recent.length === 0 ? <p className="mt-2 text-sm text-ink-soft">None yet.</p> : <ul className="mt-3 space-y-2">{recent.map((s) => <Row key={s.id} s={s} right={`${s.completed_at ? fmt(s.completed_at) : ""}${s.rating ? ` · ${s.rating}★` : ""}`} />)}</ul>}
        </section>
      </div>
    </main>
  );
}
