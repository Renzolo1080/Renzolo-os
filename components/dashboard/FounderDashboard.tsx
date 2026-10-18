import { EXTRAS, unlocked, type ExtraKey } from "@/lib/dashboard";
import { actionStats, allActions, LIKELIHOOD, type StrategicPlan } from "@/lib/plan";
import { formatAmount, goalProgress, GOAL_STATUS_LABELS, kpis, runwayMonths, periodOf, type Checkin, type GoalStatus, type MonthlyUpdate } from "@/lib/progress";
import { REVIEW_CRITERIA, type PlanReview } from "@/lib/plan-review";
import type { MarketInsights } from "@/lib/market";
import { BLOCK_LABELS, type BlockKey } from "@/lib/scoring";
import { Bars, GoalChart, LineChart, Sparkline } from "./Charts";
import { CheckinForm, CommitmentDone, DashboardCustomizer, MarkDone, MonthlyUpdateForm } from "./Interactive";
import { ScoreRing } from "@/components/brand/Visuals";

export interface DashboardData {
  access: { member: boolean; growth: boolean };
  extras: ExtraKey[];
  score: any;
  plan: StrategicPlan | null;
  planCompleteness: number | null;
  checkins: Checkin[];
  updates: MonthlyUpdate[];
  review: { review: PlanReview; createdAt: string } | null;
  market: { createdAt: string; insights: MarketInsights } | null;
  areasAnswered: number;
  areasTotal: number;
  report: { exists: boolean; current: boolean };
  scoreHistory: { date: string; score: number }[];
  recommendations: { id: string; source: string; title: string }[];
  milestones: { id: string; title: string; target_date: string | null }[];
  coaching: { available: number; nextFrom: string | null; included: string | null };
  /** Open commitments from coaching sessions. */
  commitments: { id: string; sessionId: string; text: string; due: string }[];
  invite: React.ReactNode;
  today: string;
}

const STATUS_STYLE: Record<GoalStatus, string> = {
  achieved: "bg-teal text-white",
  on_track: "bg-teal/15 text-teal",
  at_risk: "bg-gold/20 text-navy",
  behind: "bg-red-100 text-red-700",
  overdue: "bg-red-600 text-white",
  no_data: "bg-gray-100 text-ink-soft",
  not_set: "bg-gray-100 text-ink-soft",
};
const fmtDate = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const monthName = (p: string) => new Date(`${p}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" });

function Panel({ title, action, children, className = "" }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
  return (
    <section className={`rounded-2xl bg-white p-5 shadow-sm ${className}`}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 className="font-semibold text-navy">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

/** The standard founder dashboard plus the founder's 3-5 extra views. */
export function FounderDashboard(d: DashboardData) {
  const k = kpis(d.updates);
  const runway = runwayMonths(d.updates);
  const stats = d.plan ? actionStats(d.plan, d.today) : null;
  const goals = (d.plan?.goals ?? []).filter((g) => g.title).map((g) => goalProgress(g, d.checkins, d.today));
  const thisMonth = periodOf(d.today);
  const latestUpdate = d.updates.slice().sort((a, b) => b.period.localeCompare(a.period))[0] ?? null;
  const thisUpdate = d.updates.find((u) => u.period === thisMonth) ?? null;

  // Coming up: open plan actions and goals, by date.
  const due: { key: string; date: string; title: string; kind: string; area?: string; id?: string; sessionId?: string }[] = [];
  for (const c of d.commitments) if (c.due) due.push({ key: `c${c.sessionId}${c.id}`, date: c.due, title: c.text, kind: "Coaching commitment", id: c.id, sessionId: c.sessionId });
  if (d.plan) {
    for (const a of allActions(d.plan)) if (a.status !== "done" && a.due) due.push({ key: `a${a.id}${a.area}`, date: a.due, title: a.text, kind: BLOCK_LABELS[a.area], area: a.area, id: a.id });
    for (const g of goals) if (g.goal.date && g.status !== "achieved") due.push({ key: `g${g.goal.id}`, date: g.goal.date, title: g.goal.title, kind: "Goal" });
  }
  due.sort((a, b) => a.date.localeCompare(b.date));

  const steps = [
    { label: "Full assessment", value: `${d.areasAnswered} of ${d.areasTotal} areas`, done: d.areasAnswered >= d.areasTotal, ok: d.areasAnswered >= 3, href: "/assessment/details", locked: false },
    { label: "Strategic plan", value: d.planCompleteness === null ? "Not started" : `${d.planCompleteness}% complete`, done: (d.planCompleteness ?? 0) >= 100, ok: (d.planCompleteness ?? 0) >= 60, href: "/plan", locked: !d.access.member },
    { label: "Plan review", value: d.review ? `${d.review.review.overall}/100` : "Not yet", done: !!d.review && d.review.review.overall >= 75, ok: !!d.review, href: "/plan", locked: !d.access.growth },
    { label: "Market Intelligence", value: d.market ? fmtDate(d.market.createdAt) : "Not yet", done: !!d.market, ok: !!d.market, href: "/market", locked: !d.access.growth },
    { label: "Readiness Report", value: d.report.exists ? (d.report.current ? "Up to date" : "Update available") : "Not yet", done: d.report.exists && d.report.current, ok: d.report.exists, href: "#report", locked: false },
  ];
  const next = steps.find((s) => !s.ok && !s.locked) ?? steps.find((s) => !s.done && !s.locked);

  return (
    <div className="space-y-6">
      {/* 1. Key numbers */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {k.map((x) => (
          <div key={x.key} className="rounded-2xl bg-white p-4 shadow-sm">
            <p className="text-xs text-ink-soft">{x.label}</p>
            <p className="mt-1 text-2xl font-bold text-navy">{formatAmount(x.latest, x.key === "customers" ? "" : "$")}</p>
            <div className="mt-1 flex items-end justify-between gap-2">
              <span className={`text-xs font-semibold ${x.change === null ? "text-ink-soft" : x.change >= 0 ? "text-teal" : "text-red-600"}`}>
                {x.change === null ? (x.latest === null ? "Add in your update" : "First month") : `${x.change >= 0 ? "▲" : "▼"} ${Math.abs(x.change)}% vs last month`}
              </span>
              <Sparkline values={x.series.map((s) => s.value)} label={`${x.label} trend`} />
            </div>
            {x.key === "cash" && runway !== null && <p className="mt-1 text-xs text-ink-soft">~{runway} months of runway at the recent rate</p>}
          </div>
        ))}
        <div className="relative flex items-center gap-3 overflow-hidden rounded-2xl bg-navy p-4 text-white shadow-sm">
          <div aria-hidden="true" className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal/30 blur-2xl" />
          <ScoreRing value={Math.round(d.score.venture_score)} size={56} label={`Venture Score ${Math.round(d.score.venture_score)} out of 100`} />
          <div className="relative">
            <p className="text-xs text-cream/80">Venture Score</p>
            <p className="text-xs font-semibold text-gold">{d.score.venture_tier}</p>
          </div>
        </div>
        <div className="rounded-2xl bg-white p-4 shadow-sm">
          <p className="text-xs text-ink-soft">Plan actions done</p>
          <p className="mt-1 text-2xl font-bold text-navy">{stats ? `${stats.done}/${stats.total}` : "–"}</p>
          <p className={`text-xs font-semibold ${stats?.overdue ? "text-red-600" : "text-ink-soft"}`}>{stats ? (stats.overdue ? `${stats.overdue} overdue` : stats.total ? "Nothing overdue" : "Add actions to your plan") : "Build your plan"}</p>
        </div>
      </div>

      {/* Next steps */}
      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-navy">Your next steps</h2>
          {next && (
            <a href={next.href} className="rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand">
              Next: {next.label}
            </a>
          )}
        </div>
        <ol className="mt-4 grid gap-2 sm:grid-cols-5">
          {steps.map((s, i) => (
            <li key={s.label}>
              <a href={s.locked ? "/dashboard/subscribe" : s.href} className={`block h-full rounded-xl border p-3 text-sm ${s === next ? "border-gold bg-cream" : "border-gray-200"} hover:border-navy`}>
                <span className="flex items-center gap-2">
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${s.done ? "bg-teal text-white" : s.ok ? "bg-teal/20 text-teal" : "border border-gray-300 text-ink-soft"}`}>{s.done ? "✓" : i + 1}</span>
                  <span className="font-semibold text-navy">{s.label}</span>
                </span>
                <span className="mt-1 block text-xs text-ink-soft">{s.locked ? "With Growth" : s.value}</span>
              </a>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        {/* 2. Goals: target vs actual */}
        <Panel title="Goals: target vs actual" action={<a href="/plan" className="text-sm text-teal">Edit goals</a>}>
          {goals.length === 0 ? (
            <p className="text-sm text-ink-soft">
              No goals yet. <a href="/plan" className="font-semibold text-teal underline">Set up to 3 goals</a> with a starting point, target and date, then log
              progress here.
            </p>
          ) : (
            <ul className="space-y-5">
              {goals.map((g) => {
                const pct = g.percent === null ? 0 : Math.max(0, Math.min(100, g.percent));
                return (
                  <li key={g.goal.id}>
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <p className="font-medium">{g.goal.title}</p>
                        <p className="text-xs text-ink-soft">
                          {g.goal.measure || "Measure not set"}
                          {g.goal.date ? ` · due ${fmtDate(g.goal.date)}` : ""}
                          {g.daysLeft !== null && g.daysLeft >= 0 && g.status !== "achieved" ? ` · ${g.daysLeft} days left` : ""}
                        </p>
                      </div>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_STYLE[g.status]}`}>{GOAL_STATUS_LABELS[g.status]}</span>
                    </div>
                    <div className="mt-2 grid grid-cols-3 gap-2 text-center text-xs">
                      <div className="rounded-lg bg-cream p-2">
                        <p className="text-ink-soft">Start</p>
                        <p className="font-semibold">{formatAmount(g.goal.baseline, g.goal.unit)}</p>
                      </div>
                      <div className="rounded-lg bg-cream p-2">
                        <p className="text-ink-soft">Actual{g.actualOn ? ` (${fmtDate(g.actualOn)})` : ""}</p>
                        <p className="font-semibold text-navy">{formatAmount(g.actual, g.goal.unit)}</p>
                      </div>
                      <div className="rounded-lg bg-cream p-2">
                        <p className="text-ink-soft">Target</p>
                        <p className="font-semibold">{formatAmount(g.goal.target, g.goal.unit)}</p>
                      </div>
                    </div>
                    <div className="relative mt-2 h-2.5 rounded-full bg-gray-100" aria-label={`${pct}% of the way to target`}>
                      <div className={`h-2.5 rounded-full ${g.status === "behind" || g.status === "overdue" ? "bg-red-500" : g.status === "at_risk" ? "bg-gold" : "bg-teal"}`} style={{ width: `${pct}%` }} />
                      {g.expected !== null && <span className="absolute -top-1 w-0.5 bg-navy" style={{ left: `${g.expected}%`, height: "18px" }} title={`Where it should be by now: ${g.expected}%`} />}
                    </div>
                    <div className="mt-1 flex justify-between text-[11px] text-ink-soft">
                      <span>{g.percent === null ? "No check-in yet" : `${g.percent}% of the way`}</span>
                      <span>{g.expected !== null ? `Should be ~${g.expected}% by now` : ""}</span>
                    </div>
                    <div className="mt-1">
                      <CheckinForm goalId={g.goal.id} unit={g.goal.unit} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </Panel>

        <div className="space-y-6">
          {/* 3. Coming up */}
          <Panel title="Coming up">
            {due.length === 0 ? (
              <p className="text-sm text-ink-soft">Nothing dated yet. Give your plan's actions an owner and a due date.</p>
            ) : (
              <ul className="space-y-2">
                {due.slice(0, 7).map((x) => {
                  const overdue = x.date < d.today;
                  return (
                    <li key={x.key} className="flex items-center gap-3 text-sm">
                      <span className={`w-16 shrink-0 text-xs font-semibold ${overdue ? "text-red-600" : "text-ink-soft"}`}>{overdue ? "Overdue" : fmtDate(x.date).replace(/ \d{4}$/, "")}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{x.title}</span>
                        <span className="text-xs text-ink-soft">{x.kind}</span>
                      </span>
                      {x.area && x.id && <MarkDone area={x.area} id={x.id} />}
                      {x.sessionId && x.id && <CommitmentDone sessionId={x.sessionId} id={x.id} />}
                    </li>
                  );
                })}
              </ul>
            )}
          </Panel>

          {/* 4. Monthly update */}
          <Panel title={`Monthly update${latestUpdate ? ` · ${monthName(latestUpdate.period)}` : ""}`}>
            {latestUpdate && (latestUpdate.wins || latestUpdate.challenges || latestUpdate.asks) ? (
              <dl className="mb-3 space-y-2 text-sm">
                {latestUpdate.wins && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-teal">Wins</dt>
                    <dd>{latestUpdate.wins}</dd>
                  </div>
                )}
                {latestUpdate.challenges && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-brand-text">Challenges</dt>
                    <dd>{latestUpdate.challenges}</dd>
                  </div>
                )}
                {latestUpdate.asks && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-navy">Help needed</dt>
                    <dd>{latestUpdate.asks}</dd>
                  </div>
                )}
              </dl>
            ) : (
              <p className="mb-3 text-sm text-ink-soft">Each month, log revenue, customers and cash, plus your wins, challenges and where you need help. It powers your key numbers and trends.</p>
            )}
            <MonthlyUpdateForm
              monthLabel={monthName(thisMonth)}
              startOpen={!thisUpdate && !latestUpdate}
              initial={{
                period: thisMonth,
                revenue: thisUpdate?.revenue?.toString() ?? "",
                customers: thisUpdate?.customers?.toString() ?? "",
                cash: thisUpdate?.cash?.toString() ?? "",
                wins: thisUpdate?.wins ?? "",
                challenges: thisUpdate?.challenges ?? "",
                asks: thisUpdate?.asks ?? "",
              }}
            />
          </Panel>
        </div>
      </div>

      {/* Extra views */}
      <div className="space-y-3">
        <DashboardCustomizer initial={d.extras} locked={EXTRAS.filter((e) => !unlocked(e.key, d.access)).map((e) => e.key)} />
        <div className="grid items-start gap-6 md:grid-cols-2">
          {d.extras.map((key) => (
            <Extra key={key} k={key} d={d} goals={goals} kpiList={k} runway={runway} />
          ))}
        </div>
      </div>
    </div>
  );
}

function Extra({ k, d, goals, kpiList, runway }: { k: ExtraKey; d: DashboardData; goals: ReturnType<typeof goalProgress>[]; kpiList: ReturnType<typeof kpis>; runway: number | null }) {
  const def = EXTRAS.find((e) => e.key === k)!;
  if (!unlocked(k, d.access)) {
    return (
      <Panel title={def.label}>
        <p className="text-sm text-ink-soft">{def.description}</p>
        <a href="/dashboard/subscribe" className="mt-3 inline-block rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand">
          Included with Growth
        </a>
      </Panel>
    );
  }
  const s = d.score;
  switch (k) {
    case "goalCharts": {
      const charted = goals.filter((g) => g.goal.baseline !== null && g.goal.target !== null && g.goal.date);
      return (
        <Panel title={def.label}>
          {charted.length === 0 ? (
            <p className="text-sm text-ink-soft">Goals with a starting point, target and date appear here.</p>
          ) : (
            <div className="space-y-4">
              {charted.map((g) => (
                <div key={g.goal.id}>
                  <p className="text-sm font-medium">{g.goal.title}</p>
                  <GoalChart title={g.goal.title} baseline={g.goal.baseline!} target={g.goal.target!} start={g.goal.start} due={g.goal.date} points={g.points} />
                </div>
              ))}
              <p className="text-xs text-ink-soft">
                <span className="font-semibold text-brand-text">- - -</span> expected path · <span className="font-semibold text-teal">—</span> actual
              </p>
            </div>
          )}
        </Panel>
      );
    }
    case "kpiTrends":
      return (
        <Panel title={def.label}>
          <div className="space-y-4">
            {kpiList.map((x) => (
              <div key={x.key}>
                <p className="text-xs font-semibold text-ink-soft">{x.label}</p>
                <LineChart label={x.label} points={x.series.map((p) => ({ label: monthName(p.period).slice(0, 3), value: p.value }))} format={(n) => formatAmount(n, x.key === "customers" ? "" : "$")} height={80} />
              </div>
            ))}
            {runway !== null && <p className="text-sm">Cash runway: about {runway} months at the recent rate.</p>}
          </div>
        </Panel>
      );
    case "readiness":
      return (
        <Panel title={def.label}>
          <Bars
            rows={[
              { label: "Market readiness", value: Number(s.market_subscore) },
              { label: "Customer readiness", value: Number(s.customer_subscore) },
              { label: "Investor readiness", value: Number(s.investor_subscore) },
            ]}
          />
        </Panel>
      );
    case "valuation":
      return (
        <Panel title={def.label}>
          {s.valuation_low != null && s.valuation_high != null ? (
            <>
              <p className="text-3xl font-bold text-navy">
                ${Number(s.valuation_low).toLocaleString()} – ${Number(s.valuation_high).toLocaleString()}
              </p>
              <p className="mt-2 text-xs text-ink-soft">{s.valuation_basis}</p>
              <p className="mt-2 text-xs italic text-ink-soft">A directional estimate for your own planning, not a formal valuation or investment advice.</p>
            </>
          ) : (
            <p className="text-sm text-ink-soft">Add your annual revenue in the assessment for a range.</p>
          )}
        </Panel>
      );
    case "areas": {
      const bs = (s.block_scores ?? {}) as Record<string, number>;
      const gaps = new Set(((s.gaps as any[]) ?? []).map((g) => g.block));
      const rows = Object.entries(bs)
        .map(([key, v]) => ({ label: BLOCK_LABELS[key as BlockKey] ?? key, value: Number(v), highlight: gaps.has(key) }))
        .sort((a, b) => a.value - b.value);
      return (
        <Panel title={def.label} action={<a href="/assessment/details" className="text-sm text-teal">Improve</a>}>
          <Bars rows={rows} />
        </Panel>
      );
    }
    case "gaps":
      return (
        <Panel title={def.label}>
          <ol className="space-y-2">
            {((s.gaps as any[]) ?? []).map((g, i) => (
              <li key={g.block} className="flex items-center gap-3 text-sm">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-navy text-xs font-bold text-white">{i + 1}</span>
                <span className="flex-1">{g.label}</span>
                <span className="font-semibold">{Math.round(g.score)}</span>
              </li>
            ))}
          </ol>
        </Panel>
      );
    case "history":
      return (
        <Panel title={def.label}>
          {d.scoreHistory.length < 2 ? (
            <p className="text-sm text-ink-soft">Re-assess after working your plan to see your score move.</p>
          ) : (
            <LineChart label="Venture Score over time" points={d.scoreHistory.map((h) => ({ label: fmtDate(h.date).replace(/^\d+ /, ""), value: Math.round(h.score) }))} />
          )}
        </Panel>
      );
    case "health":
      return (
        <Panel title={def.label}>
          <p className="text-3xl font-bold text-navy">{Math.round(s.health_index)}</p>
          <p className="text-sm text-ink-soft">{s.health_confidence} confidence · evidence {Math.round(Number(s.evidence_completeness) * 100)}% complete</p>
        </Panel>
      );
    case "risks":
      return (
        <Panel title={def.label} action={<a href="/plan" className="text-sm text-teal">Edit</a>}>
          {(d.plan?.risks ?? []).length === 0 ? (
            <p className="text-sm text-ink-soft">No risks listed in your plan yet.</p>
          ) : (
            <ul className="space-y-3">
              {d.plan!.risks.map((r) => (
                <li key={r.id} className="text-sm">
                  <span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-semibold ${r.likelihood === "high" ? "bg-red-100 text-red-700" : r.likelihood === "medium" ? "bg-gold/20 text-navy" : "bg-teal/15 text-teal"}`}>
                    {LIKELIHOOD.find((l) => l.value === r.likelihood)?.label}
                  </span>
                  <span className="font-medium">{r.risk}</span>
                  <p className="mt-0.5 text-xs text-ink-soft">{r.mitigation || "No response planned yet"}</p>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      );
    case "planReview":
      return (
        <Panel title={def.label} action={<a href="/plan" className="text-sm text-teal">Open</a>}>
          {!d.review ? (
            <p className="text-sm text-ink-soft">Review your plan to get it scored, with specific fixes.</p>
          ) : (
            <>
              <p className="text-3xl font-bold text-navy">
                {d.review.review.overall}
                <span className="text-sm font-normal text-ink-soft"> / 100</span>
              </p>
              <div className="mt-3">
                <Bars rows={d.review.review.criteria.map((c) => ({ label: REVIEW_CRITERIA.find((x) => x.key === c.key)?.label ?? c.key, value: c.score }))} />
              </div>
              {d.review.review.fixes[0] && <p className="mt-3 text-sm">Top fix: {d.review.review.fixes[0].fix}</p>}
            </>
          )}
        </Panel>
      );
    case "market":
      return (
        <Panel title={def.label} action={<a href="/market" className="text-sm text-teal">Open brief</a>}>
          {!d.market ? (
            <p className="text-sm text-ink-soft">Create your market brief: live research on your market, with recommendations for your plan.</p>
          ) : (
            <>
              <ul className="space-y-2 text-sm">
                {d.market.insights.recommendations.slice(0, 3).map((r, i) => (
                  <li key={i}>
                    <span className="font-medium">{r.action}</span>
                    <span className="block text-xs text-ink-soft">{r.why}</span>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-ink-soft">Researched {fmtDate(d.market.createdAt)}</p>
            </>
          )}
        </Panel>
      );
    case "recommendations":
      return (
        <Panel title={def.label} action={<a href="/tools" className="text-sm text-teal">See all</a>}>
          {d.recommendations.length === 0 && d.milestones.length === 0 ? (
            <p className="text-sm text-ink-soft">Your report's recommended next steps and your coach's suggestions appear here.</p>
          ) : (
            <>
              <ul className="space-y-1.5 text-sm">
                {d.recommendations.map((r) => (
                  <li key={r.id} className="flex gap-2">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-xs font-semibold ${r.source === "ai" ? "bg-teal/10 text-teal" : "bg-gold/20 text-navy"}`}>{r.source === "ai" ? "AI" : "Coach"}</span>
                    <span>{r.title}</span>
                  </li>
                ))}
              </ul>
              {d.milestones.length > 0 && (
                <ul className="mt-3 space-y-1 border-t pt-3 text-sm">
                  {d.milestones.map((m) => (
                    <li key={m.id} className="flex justify-between gap-2">
                      <span>{m.title}</span>
                      <span className="shrink-0 text-ink-soft">{m.target_date ? fmtDate(m.target_date) : "No date"}</span>
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </Panel>
      );
    case "coaching":
      return (
        <Panel title={def.label}>
          <p className="text-sm text-ink-soft">
            {d.coaching.available > 0
              ? `You have ${d.coaching.available} session${d.coaching.available > 1 ? "s" : ""} to book.`
              : d.coaching.nextFrom
              ? `Your next included sessions arrive on ${fmtDate(d.coaching.nextFrom)}.`
              : d.coaching.included
              ? `Your membership includes ${d.coaching.included}.`
              : "Work through your plan with a Founder Trajectory™ coach."}
          </p>
          <a href="/coaching" className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
            {d.coaching.available > 0 ? "Book a session" : "Coaching"}
          </a>
        </Panel>
      );
    case "invite":
      return <div>{d.invite ?? <Panel title={def.label}><p className="text-sm text-ink-soft">Your invite link will appear here.</p></Panel>}</div>;
  }
}
