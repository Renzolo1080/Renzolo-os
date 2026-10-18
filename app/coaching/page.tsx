import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { AGREEMENT_VERSION, bookingLink, sanitizeCommitments, sanitizePrep, SESSION_KINDS } from "@/lib/coaching";
import { FOUNDER_SESSION_COLUMNS } from "@/lib/coaching-server";
import { loadLatestAssessment, loadPlan } from "@/lib/plan-server";
import { BLOCK_KEYS, BLOCK_LABELS } from "@/lib/scoring";
import { AgreementCard, CommitmentRow, RateSession, RequestSession, type FocusOption } from "@/components/coaching/FounderCoaching";

export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Date(iso).toLocaleString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
const STEPS = [
  ["Agree", "Accept the coaching agreement once."],
  ["Prepare", "Say what you want from the session; your coach reads your report, plan and progress."],
  ["Meet", "30-60 minutes on one goal: where you are, the options, and what you'll do."],
  ["Act", "1-3 commitments go into your plan and dashboard."],
  ["Review", "Every quarter: re-assess, refresh the plan, set new priorities."],
];

/** The founder's coaching page: agreement, booking, sessions and commitments. */
export default async function CoachingPage() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const m = await loadMembership(supabase, user.id);
  const ent = entitlements(m.tier, m.purchases.length > 0);
  const [{ data: agreement }, { data: sessions }, latest, planRow] = await Promise.all([
    supabase.from("coaching_agreements").select("version").eq("founder_id", user.id).eq("version", AGREEMENT_VERSION).maybeSingle(),
    supabase.from("advisor_sessions").select(FOUNDER_SESSION_COLUMNS).eq("founder_id", user.id).not("paid_at", "is", null).order("created_at", { ascending: false }),
    loadLatestAssessment(supabase, user.id),
    loadPlan(supabase, user.id),
  ]);

  const options: FocusOption[] = [
    ...(planRow?.data.goals ?? []).filter((g) => g.title).map((g) => ({ value: `goal:${g.id}`, label: g.title, group: "Your plan goals" })),
    ...(latest?.gapKeys ?? []).map((k) => ({ value: `area:${k}`, label: BLOCK_LABELS[k as keyof typeof BLOCK_LABELS] ?? k, group: "Your weakest areas" })),
    ...BLOCK_KEYS.filter((k) => !(latest?.gapKeys ?? []).includes(k)).map((k) => ({ value: `area:${k}`, label: BLOCK_LABELS[k], group: "Other business areas" })),
    { value: "other:customers", label: "Winning more customers", group: "Outcomes" },
    { value: "other:capital", label: "Applying for a loan, credit or grant", group: "Outcomes" },
    { value: "other:investors", label: "Attracting investors or partners", group: "Outcomes" },
    { value: "other:other", label: "Something else", group: "Outcomes" },
  ];
  const list = (sessions ?? []) as any[];
  const upcoming = list.filter((s) => s.status === "requested" || s.status === "scheduled");
  const past = list.filter((s) => s.status === "completed");
  const link = bookingLink(process.env, { name: null, email: user.email });

  return (
    <main className="mx-auto min-h-screen max-w-4xl px-4 py-10 sm:px-6">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <h1 className="mt-3 text-3xl font-bold text-navy">Coaching</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        One-on-one coaching with a Founder Trajectory™ coach, built around your plan. Each session ends with commitments you'll see on your dashboard.
        {ent.aiCoaching && (
          <>
            {" "}
            Between sessions,{" "}
            <a href="/ai-coach" className="font-semibold text-teal underline">
              Lorenzo · AI
            </a>{" "}
            is there any time.
          </>
        )}
      </p>

      <ol className="mt-6 grid gap-2 sm:grid-cols-5">
        {STEPS.map(([t, d], i) => (
          <li key={t} className="rounded-xl bg-white p-3 text-sm shadow-sm">
            <p className="font-semibold text-navy">
              {i + 1}. {t}
            </p>
            <p className="mt-1 text-xs text-ink-soft">{d}</p>
          </li>
        ))}
      </ol>

      <div className="mt-8 space-y-6">
        {!latest && (
          <p className="rounded-lg border border-gold/60 bg-cream p-4 text-sm">
            Starting with coaching? Take the free{" "}
            <a href="/assessment" className="font-semibold text-teal underline">
              Readiness Snapshot
            </a>{" "}
            first (5 to 7 minutes). Your coach uses it to prepare, so your first session goes straight to what matters.
          </p>
        )}
        {!agreement ? (
          <AgreementCard />
        ) : m.coachingAvailable > 0 ? (
          <RequestSession options={options} available={m.coachingAvailable} />
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy p-6 text-white">
            <div>
              <p className="text-lg font-semibold">No sessions to book right now</p>
              <p className="mt-1 text-sm text-cream/80">
                {m.nextCoachingFrom
                  ? `Your next included sessions arrive on ${new Date(m.nextCoachingFrom).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}.`
                  : ent.includedCoaching
                  ? `Your membership includes ${ent.includedCoaching}.`
                  : "Growth includes 2 sessions a quarter and Elevate 2 a month. You can also buy single sessions."}
              </p>
            </div>
            <a href="/dashboard/subscribe#one-time" className="rounded-lg bg-brand px-5 py-3 font-semibold text-on-brand">
              Buy sessions
            </a>
          </div>
        )}

        {upcoming.length > 0 && (
          <section className="rounded-2xl bg-white p-6 shadow-sm">
            <h2 className="text-xl font-bold text-navy">Upcoming</h2>
            <ul className="mt-3 space-y-3">
              {upcoming.map((s) => {
                const prep = sanitizePrep(s.founder_prep);
                return (
                  <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gray-200 p-4 text-sm">
                    <div>
                      <p className="font-semibold">{prep.focusLabel || SESSION_KINDS.find((k) => k.value === s.kind)?.label}</p>
                      <p className="text-ink-soft">{s.status === "scheduled" && s.scheduled_at ? fmt(s.scheduled_at) : "Waiting for a time"}</p>
                    </div>
                    {s.status === "requested" && link && (
                      <a href={link} target="_blank" rel="noopener noreferrer" className="rounded-lg bg-brand px-4 py-2 font-semibold text-on-brand">
                        Pick a time
                      </a>
                    )}
                  </li>
                );
              })}
            </ul>
          </section>
        )}

        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="text-xl font-bold text-navy">Past sessions and commitments</h2>
          {past.length === 0 ? (
            <p className="mt-2 text-sm text-ink-soft">Your session summaries and commitments will appear here.</p>
          ) : (
            <ul className="mt-4 space-y-6">
              {past.map((s) => {
                const prep = sanitizePrep(s.founder_prep);
                const commitments = sanitizeCommitments(s.commitments);
                return (
                  <li key={s.id} className="border-l-4 border-gold pl-4">
                    <p className="text-xs uppercase tracking-wide text-teal">
                      {SESSION_KINDS.find((k) => k.value === s.kind)?.label} · {s.completed_at ? fmt(s.completed_at) : ""}
                    </p>
                    <p className="font-semibold text-navy">{prep.focusLabel || "Coaching session"}</p>
                    {s.summary && <p className="mt-1 whitespace-pre-line text-sm">{s.summary}</p>}
                    {commitments.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {commitments.map((c) => (
                          <CommitmentRow key={c.id} sessionId={s.id} c={c} canEdit />
                        ))}
                      </ul>
                    )}
                    {s.rating ? <p className="mt-2 text-xs text-ink-soft">You rated this {s.rating}/5. Thank you.</p> : <RateSession sessionId={s.id} />}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </main>
  );
}
