import { statusLine, type Trajectory } from "@/lib/live-score";

/** "Target vs actual" on the founder dashboard (approved Nov 10, 2026):
 * the trajectory (score and goals over time, from the full assessment) and
 * what drives the goals. Server-rendered SVG; each mark carries a native
 * tooltip, and every chart has the same numbers in words beside it. */

const INK = "#071727";
const MUTED = "#4F5B67";
const GRID = "#EEF1F5";
const ORANGE = "#FF5A1F";
const PURPLE = "#6A2BCB";
/** Validated categorical order (brand gradient first), for the drivers. */
const DRIVER_COLORS = ["#FF5A1F", "#B8177F", "#6A2BCB", "#1E6BFF", "#0F8B7A"];
const OTHER = "#8A94A3";

const DAY = 864e5;
const dn = (d: string) => Math.floor(Date.parse(`${d.slice(0, 10)}T00:00:00Z`) / DAY);
const fmt = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
const pathOf = (pts: [number, number][]) => (pts.length ? "M" + pts.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" L") : "");

const W = 520;
const H = 250;
const L = 38;
const R = 16;
const T = 24;
const B = 30;

function monthTicks(from: number, to: number) {
  const ticks: { day: number; label: string }[] = [];
  const d = new Date(from * DAY);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + 1);
  const span = to - from;
  const every = span > 400 ? 3 : span > 200 ? 2 : 1;
  let i = 0;
  while (d.getTime() / DAY <= to) {
    if (i % every === 0) ticks.push({ day: Math.floor(d.getTime() / DAY), label: d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" }) });
    d.setUTCMonth(d.getUTCMonth() + 1);
    i++;
  }
  return ticks;
}

function Axes({ x, y, yTicks, from, to, todayDay, fmtY }: { x: (d: number) => number; y: (v: number) => number; yTicks: number[]; from: number; to: number; todayDay: number; fmtY: (v: number) => string }) {
  return (
    <g>
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={L} x2={W - R} y1={y(v)} y2={y(v)} stroke={GRID} />
          <text x={L - 8} y={y(v) + 4} textAnchor="end" fontSize="12" fill={MUTED}>
            {fmtY(v)}
          </text>
        </g>
      ))}
      {monthTicks(from, to).map((t) => (
        <text key={t.day} x={x(t.day)} y={H - 10} textAnchor="middle" fontSize="12" fill={MUTED}>
          {t.label}
        </text>
      ))}
      <line x1={x(todayDay)} x2={x(todayDay)} y1={T} y2={H - B} stroke="#C5CDD7" strokeDasharray="2 3" />
      <text x={x(todayDay) + 4} y={T - 8} fontSize="11" fill={MUTED}>
        Today
      </text>
    </g>
  );
}

function ScoreChart({ t, today }: { t: Trajectory; today: string }) {
  if (!t.start || t.live === null) return null;
  const from = dn(t.start.date);
  const todayDay = dn(today);
  const to = Math.max(todayDay + 30, t.target ? dn(t.target.date) : 0, t.nextReassessment ? dn(t.nextReassessment) : 0);
  const values = [t.start.total, t.live, ...t.confirmed.map((c) => c.total), ...(t.target ? [t.target.score] : [])];
  const lo = Math.max(0, Math.floor((Math.min(...values) - 8) / 10) * 10);
  const hi = Math.min(100, Math.ceil((Math.max(...values) + 6) / 10) * 10);
  const x = (d: number) => L + ((W - L - R) * (d - from)) / Math.max(1, to - from);
  const y = (v: number) => T + (H - T - B) * (1 - (v - lo) / Math.max(1, hi - lo));
  const yTicks = Array.from({ length: Math.floor((hi - lo) / 10) + 1 }, (_, i) => lo + i * 10).filter((v, i, a) => a.length <= 6 || i % 2 === 0);
  const conf = t.confirmed.map((c) => [x(dn(c.date)), y(c.total)] as [number, number]);
  const live = t.liveSeries.map((p) => [x(dn(p.date)), y(p.value)] as [number, number]);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Total Readiness Score: started at ${t.start.total}, confirmed ${t.latest?.total} at the last re-assessment, live ${t.live} today${t.target ? `, target ${t.target.score} by ${fmt(t.target.date)}` : ""}`}>
      <Axes x={x} y={y} yTicks={yTicks} from={from} to={to} todayDay={todayDay} fmtY={String} />
      {t.nextReassessment && dn(t.nextReassessment) > todayDay && (
        <g>
          <line x1={x(dn(t.nextReassessment))} x2={x(dn(t.nextReassessment))} y1={T} y2={H - B} stroke="#C5CDD7" strokeDasharray="2 3" />
          <text x={Math.min(W - R, x(dn(t.nextReassessment)) + 4)} y={H - B - 6} textAnchor={x(dn(t.nextReassessment)) > W - 140 ? "end" : "start"} fontSize="11" fill={MUTED}>
            Next re-assessment {fmt(t.nextReassessment)}
          </text>
        </g>
      )}
      {t.target && <path d={pathOf([[x(from), y(t.start.total)], [x(dn(t.target.date)), y(t.target.score)]])} fill="none" stroke={MUTED} strokeWidth="2" strokeDasharray="6 5" />}
      {t.target && t.projected !== null && <path d={pathOf([[x(todayDay), y(t.live)], [x(dn(t.target.date)), y(t.projected)]])} fill="none" stroke={ORANGE} strokeWidth="2" strokeDasharray="2 4" />}
      {live.length > 1 && <path d={pathOf(live)} fill="none" stroke={ORANGE} strokeWidth="2" opacity="0.55" />}
      {t.liveSeries.slice(1).map((p) => (
        <circle key={p.date} cx={x(dn(p.date))} cy={y(p.value)} r="3" fill={ORANGE} opacity="0.75">
          <title>{`Live score ${p.value} on ${fmt(p.date)}`}</title>
        </circle>
      ))}
      {conf.length > 1 && <path d={pathOf(conf)} fill="none" stroke={ORANGE} strokeWidth="2.5" />}
      {t.confirmed.map((c, i) =>
        i === 0 ? (
          <rect key={c.date} x={x(dn(c.date)) - 7} y={y(c.total) - 7} width="14" height="14" rx="3" fill={INK} stroke="#fff" strokeWidth="2">
            <title>{`Starting point, full assessment ${fmt(c.date)}: ${c.total}`}</title>
          </rect>
        ) : (
          <circle key={c.date} cx={x(dn(c.date))} cy={y(c.total)} r="6" fill={isEarly(t, i) ? "#fff" : ORANGE} stroke={ORANGE} strokeWidth="2.5">
            <title>{`${isEarly(t, i) ? "Re-assessed early" : "Re-assessment"} ${fmt(c.date)}: confirmed ${c.total}`}</title>
          </circle>
        ),
      )}
      <circle cx={x(todayDay)} cy={y(t.live)} r="6" fill="#fff" stroke={ORANGE} strokeWidth="3">
        <title>{`Live score today: ${t.live}`}</title>
      </circle>
      <text x={x(from) + 10} y={y(t.start.total) + 20} fontSize="12" fontWeight="700" fill={INK}>
        Start {Math.round(t.start.total)}
      </text>
      <text x={x(todayDay) - 10} y={y(t.live) - 12} textAnchor="end" fontSize="12" fontWeight="700" fill={INK}>
        Live {Math.round(t.live)}
      </text>
      {t.target && (
        <g>
          <circle cx={x(dn(t.target.date))} cy={y(t.target.score)} r="6" fill="#fff" stroke={INK} strokeWidth="2" />
          <text x={x(dn(t.target.date)) - 10} y={y(t.target.score) - 12} textAnchor="end" fontSize="12" fontWeight="700" fill={INK}>
            Target {t.target.score}
          </text>
        </g>
      )}
    </svg>
  );
}

/** A re-assessment taken well before the scheduled interval was up. */
function isEarly(t: Trajectory, i: number) {
  const gap = dn(t.confirmed[i].date) - dn(t.confirmed[i - 1].date);
  return gap < t.reassessEvery - 7;
}

function GoalsChart({ t, today }: { t: Trajectory; today: string }) {
  if (!t.start || t.goals.percent === null) return null;
  const from = dn(t.start.date);
  const todayDay = dn(today);
  const used = t.goals.timeUsed ?? 0;
  const end = used > 0 && used < 100 ? from + Math.round((todayDay - from) / (used / 100)) : todayDay + 60;
  const to = Math.max(end, todayDay + 14);
  const x = (d: number) => L + ((W - L - R) * (d - from)) / Math.max(1, to - from);
  const y = (v: number) => T + (H - T - B) * (1 - v / 100);
  const pts = [...t.goals.series, { date: today, value: t.goals.percent }].map((p) => [x(dn(p.date)), y(Math.max(0, Math.min(100, p.value)))] as [number, number]);
  const area = pts.length > 1 ? `${pathOf(pts)} L${pts[pts.length - 1][0].toFixed(1)},${y(0).toFixed(1)} L${pts[0][0].toFixed(1)},${y(0).toFixed(1)} Z` : "";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={`Goal progress: ${t.goals.percent}% of the way from the starting point, with ${used}% of the time used`}>
      <Axes x={x} y={y} yTicks={[0, 25, 50, 75, 100]} from={from} to={to} todayDay={todayDay} fmtY={(v) => `${v}%`} />
      <path d={pathOf([[x(from), y(0)], [x(end), y(100)]])} fill="none" stroke={MUTED} strokeWidth="2" strokeDasharray="6 5" />
      {area && <path d={area} fill={PURPLE} opacity="0.1" />}
      {pts.length > 1 && <path d={pathOf(pts)} fill="none" stroke={PURPLE} strokeWidth="2.5" />}
      {t.goals.series.slice(1).map((p) => (
        <circle key={p.date} cx={x(dn(p.date))} cy={y(Math.max(0, Math.min(100, p.value)))} r="5" fill={PURPLE} stroke="#fff" strokeWidth="2">
          <title>{`Check-in ${fmt(p.date)}: ${p.value}% of the way`}</title>
        </circle>
      ))}
      <rect x={x(from) - 7} y={y(0) - 7} width="14" height="14" rx="3" fill={INK} stroke="#fff" strokeWidth="2">
        <title>Starting point from your assessment</title>
      </rect>
      <text x={x(todayDay) - 10} y={y(Math.max(0, Math.min(100, t.goals.percent))) - 10} textAnchor="end" fontSize="12" fontWeight="700" fill={INK}>
        {t.goals.percent}% of the way
      </text>
    </svg>
  );
}

function arc(cx: number, cy: number, a0: number, a1: number, ri: number, ro: number) {
  const p = (a: number, r: number) => [cx + r * Math.sin(a), cy - r * Math.cos(a)];
  const large = a1 - a0 > Math.PI ? 1 : 0;
  const [x0, y0] = p(a0, ro);
  const [x1, y1] = p(a1, ro);
  const [x2, y2] = p(a1, ri);
  const [x3, y3] = p(a0, ri);
  return `M${x0.toFixed(1)},${y0.toFixed(1)} A${ro},${ro} 0 ${large} 1 ${x1.toFixed(1)},${y1.toFixed(1)} L${x2.toFixed(1)},${y2.toFixed(1)} A${ri},${ri} 0 ${large} 0 ${x3.toFixed(1)},${y3.toFixed(1)} Z`;
}

function Drivers({ t }: { t: Trajectory }) {
  if (!t.drivers.length) return <p className="text-sm text-ink-soft">Add actions to your plan's business areas to see what drives your goals.</p>;
  // Up to five drivers, then "Other", so colours stay distinct.
  const top = t.drivers.slice(0, 5).map((d, i) => ({ ...d, color: DRIVER_COLORS[i] }));
  const rest = t.drivers.slice(5);
  const rows = rest.length
    ? [...top, { key: "other", label: "Other areas", share: rest.reduce((s, d) => s + d.share, 0), done: Math.round(rest.reduce((s, d) => s + d.done * d.share, 0) / Math.max(1, rest.reduce((s, d) => s + d.share, 0))), left: rest.reduce((s, d) => s + d.left, 0), startScore: null, color: OTHER }]
    : top;
  const totalShare = rows.reduce((s, d) => s + d.share, 0) || 1;
  const overall = Math.round(rows.reduce((s, d) => s + d.share * d.done, 0) / totalShare);
  let a = 0;
  const gap = 0.035;
  const behind = rows.filter((d) => d.left > 0).sort((p, q) => p.done - q.done)[0];
  return (
    <div className="grid items-center gap-6 md:grid-cols-[220px_minmax(0,1fr)]">
      <svg viewBox="0 0 220 220" width="220" height="220" className="mx-auto" role="img" aria-label={`What drives your goals: ${overall}% of the work done overall`}>
        {rows.map((d) => {
          const span = (2 * Math.PI * d.share) / totalShare;
          const a0 = a + gap / 2;
          const a1 = a + span - gap / 2;
          a += span;
          if (a1 <= a0) return null;
          const split = a0 + ((a1 - a0) * d.done) / 100;
          return (
            <g key={d.key}>
              <path d={arc(110, 110, a0, a1, 66, 100)} fill={d.color} opacity="0.22">
                <title>{`${d.label}: ${d.share}% of your plan, ${d.done}% done`}</title>
              </path>
              {split > a0 && (
                <path d={arc(110, 110, a0, split, 66, 100)} fill={d.color}>
                  <title>{`${d.label}: ${d.done}% done`}</title>
                </path>
              )}
            </g>
          );
        })}
        <text x="110" y="108" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="700" fontSize="30" fill={INK}>
          {overall}%
        </text>
        <text x="110" y="130" textAnchor="middle" fontSize="12" fill={MUTED}>
          of the work done
        </text>
      </svg>
      <div className="min-w-0">
        <ul className="divide-y divide-line">
          {rows.map((d) => (
            <li key={d.key} className="grid grid-cols-[12px_minmax(0,1fr)] gap-3 py-2.5">
              <span aria-hidden="true" className="mt-1.5 h-3 w-3 rounded-sm" style={{ background: d.color }} />
              <div className="min-w-0">
                <div className="flex flex-wrap justify-between gap-x-3 text-sm">
                  <b className="text-navy">{d.label}</b>
                  <span className="text-ink-soft">
                    {d.startScore !== null ? `Started at ${d.startScore} · ` : ""}
                    {d.share}% of your plan
                  </span>
                </div>
                <div className="my-1.5 h-2 overflow-hidden rounded-full bg-line">
                  <div className="h-full rounded-full" style={{ width: `${d.done}%`, background: d.color }} />
                </div>
                <div className="flex justify-between text-xs text-ink-soft">
                  <span>{d.done}% done</span>
                  <span>
                    {d.left} action{d.left === 1 ? "" : "s"} left
                  </span>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-ink-soft">
          Ring size is each area's share of your plan's actions; solid colour is the work done.
          {behind ? ` ${behind.label} is furthest behind: ${behind.left} action${behind.left === 1 ? "" : "s"} left.` : ""}
        </p>
      </div>
    </div>
  );
}

const STATUS_PILL: Record<Trajectory["status"], string> = {
  ahead: "bg-[#0E8A6A1F] text-[#0B6B53]",
  on_track: "bg-[#0E8A6A1F] text-[#0B6B53]",
  behind: "bg-[#E0A1001F] text-[#8A6200]",
  no_target: "bg-surface text-navy",
};

function Key({ items }: { items: { label: string; style: React.CSSProperties; square?: boolean }[] }) {
  return (
    <div className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
      {items.map((k) => (
        <span key={k.label} className="inline-flex items-center gap-1.5">
          <span aria-hidden="true" className={k.square ? "inline-block h-2.5 w-2.5 rounded-sm" : "inline-block w-4 border-t-[2.5px]"} style={k.style} />
          {k.label}
        </span>
      ))}
    </div>
  );
}

export function TrajectorySection({ t, today, canReassess }: { t: Trajectory; today: string; canReassess: boolean }) {
  if (!t.start || t.live === null || !t.latest) return null;
  const month = t.moves.filter((m) => dn(m.date) >= dn(today) - 30);
  const shown = [...month.slice(0, 6), ...t.flags];
  const gainedMonth = Math.round(month.reduce((s, m) => s + m.points, 0) * 10) / 10;
  return (
    <section aria-labelledby="trajectory-title" className="space-y-5 rounded-[28px] bg-surface p-4 sm:p-6">
      <h2 id="trajectory-title" className="font-display text-2xl font-bold text-navy">
        Target vs actual
      </h2>

      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="font-display text-xl font-bold text-navy">Your trajectory</h3>
            <p className="mt-1 text-sm text-ink-soft">Where you are against the path you set, measured from your full assessment.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${STATUS_PILL[t.status]}`}>{statusLine(t)}</span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-surface px-3 py-1 font-semibold text-navy">
            Starting point: full assessment, {fmt(t.start.date)} · score {Math.round(t.start.total)}
          </span>
          {t.nextReassessment && (
            <span className={`rounded-full px-3 py-1 font-semibold ${t.reassessDue ? "bg-brand text-on-brand" : "bg-surface text-navy"}`}>
              {t.reassessDue ? `Re-assessment due (${fmt(t.nextReassessment)})` : `Re-assess every ${t.reassessEvery} days · next ${fmt(t.nextReassessment)}`}
            </span>
          )}
          {canReassess && (
            <a href="/assessment/details" className="font-bold text-brand-text hover:underline">
              Re-assess now
            </a>
          )}
          {!t.target && (
            <a href="/plan" className="font-bold text-brand-text hover:underline">
              Set your target score
            </a>
          )}
        </div>

        <div className="mt-5 grid gap-6 lg:grid-cols-2">
          <div className="min-w-0">
            <p className="font-semibold text-navy">Total Readiness Score</p>
            <p className="mb-2 mt-0.5 text-sm text-ink-soft">
              <b className="font-display text-2xl text-navy">{Math.round(t.live)}</b> live · confirmed {Math.round(t.latest.total)} at your last {t.confirmed.length > 1 ? "re-assessment" : "assessment"}
              {t.neededToday !== null ? ` · ${Math.round(t.neededToday)} needed by today` : ""}
              {t.target ? ` · target ${t.target.score}` : ""}
            </p>
            <ScoreChart t={t} today={today} />
            <Key
              items={[
                { label: "Starting point", style: { background: INK }, square: true },
                { label: "Confirmed by re-assessment", style: { borderColor: ORANGE } },
                { label: "Live score from your updates", style: { borderColor: ORANGE, opacity: 0.55 } },
                ...(t.target ? [{ label: "Target path", style: { borderColor: MUTED, borderTopStyle: "dashed" as const } }, { label: "Projected", style: { borderColor: ORANGE, borderTopStyle: "dotted" as const } }] : []),
              ]}
            />
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-navy">Progress on your goals</p>
            {t.goals.percent === null ? (
              <p className="mt-2 text-sm text-ink-soft">
                Give your goals a starting number, a target and a date in your <a href="/plan" className="font-semibold text-brand-text underline">plan</a>, then log check-ins to see this chart.
              </p>
            ) : (
              <>
                <p className="mb-2 mt-0.5 text-sm text-ink-soft">
                  <b className="font-display text-2xl text-navy">{t.goals.percent}%</b> of the way from your starting point{t.goals.timeUsed !== null ? ` · ${t.goals.timeUsed}% of your time used` : ""}
                </p>
                <GoalsChart t={t} today={today} />
                <Key
                  items={[
                    { label: "Starting point", style: { background: INK }, square: true },
                    { label: "Progress (all goals, from check-ins)", style: { borderColor: PURPLE } },
                    { label: "Where you planned to be", style: { borderColor: MUTED, borderTopStyle: "dashed" } },
                  ]}
                />
              </>
            )}
          </div>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h3 className="font-display text-xl font-bold text-navy">What moved your live score this month</h3>
        <p className="mt-1 text-sm text-ink-soft">
          {gainedMonth > 0 ? `+${gainedMonth} points from finished actions, goal check-ins and documents.` : "Finish plan actions, log goal check-ins or check a document to move your live score."} Your next re-assessment confirms them.
        </p>
        {shown.length > 0 && (
          <ul className="mt-3 divide-y divide-line border-t border-line">
            {shown.map((m, i) => (
              <li key={`${m.date}-${i}`} className="flex flex-wrap justify-between gap-x-4 gap-y-1 py-2.5 text-sm">
                <span className="min-w-0">
                  <b className="tabular-nums text-navy">{m.source === "flag" ? "±0" : `+${m.points}`}</b>
                  <span className="ml-2">{m.label}</span>
                  <span className="text-ink-soft"> · {m.detail}</span>
                </span>
                <span className="text-ink-soft">{fmt(m.date)}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="rounded-2xl bg-white p-5 shadow-sm sm:p-6">
        <h3 className="font-display text-xl font-bold text-navy">What drives your goals</h3>
        <p className="mb-4 mt-1 text-sm text-ink-soft">The parts of your business your plan relies on: how much of the plan each one carries, and how much of its work is done.</p>
        <Drivers t={t} />
      </div>
    </section>
  );
}
