import { allActions, DEFAULT_REASSESS_EVERY, type StrategicPlan } from "./plan";
import { goalProgress, type Checkin, type MonthlyUpdate } from "./progress";
import { BLOCK_LABELS, type BlockKey } from "./scoring";

/** The founder's trajectory (approved Nov 10, 2026).
 *
 * The STARTING POINT is the full assessment: its Total Readiness Score,
 * each business area's score and each goal's baseline. The CONFIRMED score
 * moves only at re-assessments, on the plan's schedule (every N days, or a
 * date the founder confirms) or earlier if the founder chooses.
 *
 * Between re-assessments a LIVE score moves with the founder's updates:
 *   finished plan actions   full credit with evidence, 60% without
 *   goal check-ins          credit for progress made since the last assessment
 *   document checks         documents that pass the lender checks
 * Safeguards: everything the live score can add before the next
 * re-assessment is capped at half the room left (and never more than 25
 * points); no one area can carry more than 40% of that cap; bad news
 * (e.g. cash falling) is flagged for the coach, never subtracted. The
 * next re-assessment confirms or corrects it. Pure, so it can be tested. */

export const LIVE_SHARE = { actions: 0.6, goals: 0.3, documents: 0.1 } as const;
export const NO_EVIDENCE_CREDIT = 0.6;
export const AREA_MAX_SHARE = 0.4;
const DAY = 864e5;
const dayNum = (d: string) => Math.floor(Date.parse(`${d.slice(0, 10)}T00:00:00Z`) / DAY);
const iso = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
const r1 = (n: number) => Math.round(n * 10) / 10;

export interface ConfirmedPoint {
  /** When the assessment or re-assessment was scored (ISO). */
  date: string;
  total: number;
}

export interface DocCheck {
  doc_type: string;
  created_at: string;
  /** True when the document passed the lender checks (no "fix" items). */
  ok: boolean;
}

export type MoveSource = "action" | "goal" | "document" | "flag";

export interface Move {
  date: string;
  points: number;
  label: string;
  source: MoveSource;
  /** How the founder reported it, e.g. "action done, with evidence". */
  detail: string;
  /** The business area it belongs to, when there is one. */
  area: string | null;
}

export interface Driver {
  key: BlockKey;
  label: string;
  /** Share of the plan's actions in this area, 0-100. */
  share: number;
  /** Share of this area's actions that are done, 0-100. */
  done: number;
  left: number;
  /** The area's score at the starting assessment, when known. */
  startScore: number | null;
}

export type TrajectoryStatus = "ahead" | "on_track" | "behind" | "no_target";

export interface Trajectory {
  start: ConfirmedPoint | null;
  confirmed: ConfirmedPoint[];
  latest: ConfirmedPoint | null;
  live: number | null;
  /** Live-score line since the latest confirmed score, oldest first. */
  liveSeries: { date: string; value: number }[];
  /** Most the live score may add before the next re-assessment. */
  cap: number;
  moves: Move[];
  flags: Move[];
  target: { score: number; date: string } | null;
  /** Where the target path says the score should be today. */
  neededToday: number | null;
  /** Where the live score is heading by the target date at the recent pace. */
  projected: number | null;
  status: TrajectoryStatus;
  nextReassessment: string | null;
  reassessDue: boolean;
  reassessEvery: number;
  goals: { percent: number | null; timeUsed: number | null; series: { date: string; value: number }[] };
  drivers: Driver[];
}

export interface TrajectoryInput {
  plan: StrategicPlan | null;
  /** Every scored assessment, any order. */
  confirmed: ConfirmedPoint[];
  checkins: Checkin[];
  documents: DocCheck[];
  updates: MonthlyUpdate[];
  /** Block scores at the starting assessment, for the drivers. */
  startBlocks: Partial<Record<BlockKey, number>> | null;
  today: string;
}

export function nextReassessment(plan: StrategicPlan | null, latest: ConfirmedPoint | null): string | null {
  const confirmedOn = plan?.tracking.reassessOn;
  if (confirmedOn && (!latest || dayNum(confirmedOn) > dayNum(latest.date))) return confirmedOn;
  if (!latest) return null;
  return iso(dayNum(latest.date) + (plan?.tracking.reassessEvery ?? DEFAULT_REASSESS_EVERY));
}

export function trajectory(i: TrajectoryInput): Trajectory {
  const confirmed = i.confirmed
    .filter((c) => Number.isFinite(c.total) && c.date)
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .map((c) => ({ date: c.date, total: r1(c.total) }));
  const start = confirmed[0] ?? null;
  const latest = confirmed[confirmed.length - 1] ?? null;
  const today = i.today.slice(0, 10);
  const plan = i.plan;
  const since = latest ? dayNum(latest.date) : dayNum(today);
  const cap = latest ? r1(Math.max(0, Math.min(25, (100 - latest.total) / 2))) : 0;

  // --- moves since the latest confirmed score --------------------------------------
  const raw: Move[] = [];
  const actions = plan ? allActions(plan) : [];
  if (actions.length && cap > 0) {
    const each = (cap * LIVE_SHARE.actions) / actions.length;
    for (const a of actions) {
      if (a.status !== "done" || !a.doneOn || dayNum(a.doneOn) < since) continue;
      const proof = !!a.evidence.trim();
      raw.push({ date: a.doneOn, points: each * (proof ? 1 : NO_EVIDENCE_CREDIT), label: a.text, source: "action", detail: proof ? "action done, with evidence" : "action done (add evidence for full credit)", area: a.area });
    }
  }
  const goals = (plan?.goals ?? []).filter((g) => g.baseline !== null && g.target !== null && g.target !== g.baseline && g.date);
  if (goals.length && cap > 0) {
    const each = (cap * LIVE_SHARE.goals) / goals.length;
    for (const g of goals) {
      const mine = i.checkins.filter((c) => c.goal_id === g.id).sort((a, b) => a.checked_on.localeCompare(b.checked_on));
      const pct = (upTo: number) => {
        const p = goalProgress(g, mine.filter((c) => dayNum(c.checked_on) <= upTo), iso(upTo)).percent;
        return p === null ? 0 : Math.max(0, Math.min(100, p));
      };
      let prev = pct(since);
      for (const c of mine) {
        const d = dayNum(c.checked_on);
        if (d < since) continue;
        const now = pct(d);
        if (now > prev) raw.push({ date: c.checked_on, points: (each * (now - prev)) / 100, label: `${g.title || g.measure || "Goal"}: ${now}% of the way`, source: "goal", detail: "goal check-in", area: null });
        prev = Math.max(prev, now);
      }
    }
  }
  if (cap > 0) {
    const passed = new Set<string>();
    for (const d of i.documents.slice().sort((a, b) => a.created_at.localeCompare(b.created_at))) {
      if (!d.ok || dayNum(d.created_at) < since || passed.has(d.doc_type)) continue;
      passed.add(d.doc_type);
      raw.push({ date: d.created_at.slice(0, 10), points: (cap * LIVE_SHARE.documents) / 4, label: DOC_LABELS[d.doc_type] ?? "Document checked", source: "document", detail: "document check", area: "costStructure" });
    }
  }

  // No one area may carry more than 40% of the cap.
  const areaMax = cap * AREA_MAX_SHARE;
  const byArea = new Map<string, number>();
  for (const m of raw) if (m.area) byArea.set(m.area, (byArea.get(m.area) ?? 0) + m.points);
  for (const m of raw) {
    const t = m.area ? byArea.get(m.area)! : 0;
    if (m.area && t > areaMax) m.points = (m.points * areaMax) / t;
  }
  const moves = raw.map((m) => ({ ...m, points: r1(m.points) })).filter((m) => m.points > 0).sort((a, b) => b.date.localeCompare(a.date));
  const gained = Math.min(cap, moves.reduce((s, m) => s + m.points, 0));
  const live = latest ? r1(latest.total + gained) : null;

  // Live line: confirmed score, then each day something moved it.
  const liveSeries: { date: string; value: number }[] = [];
  if (latest) {
    liveSeries.push({ date: latest.date.slice(0, 10), value: latest.total });
    let run = latest.total;
    const byDay = new Map<string, number>();
    for (const m of moves) byDay.set(m.date, (byDay.get(m.date) ?? 0) + m.points);
    for (const d of [...byDay.keys()].sort()) {
      run = Math.min(latest.total + cap, run + byDay.get(d)!);
      liveSeries.push({ date: d, value: r1(run) });
    }
    if (liveSeries[liveSeries.length - 1].date !== today) liveSeries.push({ date: today, value: live! });
  }

  // Bad news is flagged for the coach, never subtracted.
  const flags: Move[] = [];
  const cash = i.updates.filter((u) => u.cash !== null && u.cash !== undefined).sort((a, b) => a.period.localeCompare(b.period));
  if (cash.length >= 2) {
    const [a, b] = cash.slice(-2);
    const change = Number(a.cash) !== 0 ? ((Number(b.cash) - Number(a.cash)) / Math.abs(Number(a.cash))) * 100 : 0;
    if (change <= -5 && dayNum(b.period) >= since - 31) flags.push({ date: b.period, points: 0, label: `Cash in the bank down ${Math.round(-change)}%`, source: "flag", detail: "monthly update, flagged for your coach", area: "costStructure" });
  }

  // --- target path --------------------------------------------------------------------
  const t = plan?.tracking;
  const target = t?.targetScore && t.targetDate && start ? { score: t.targetScore, date: t.targetDate } : null;
  let neededToday: number | null = null;
  let projected: number | null = null;
  let status: TrajectoryStatus = "no_target";
  if (target && start && live !== null) {
    const s0 = dayNum(start.date);
    const s1 = dayNum(target.date);
    const frac = s1 <= s0 ? 1 : Math.max(0, Math.min(1, (dayNum(today) - s0) / (s1 - s0)));
    neededToday = r1(start.total + (target.score - start.total) * frac);
    const elapsed = dayNum(today) - s0;
    projected = elapsed > 0 ? r1(Math.min(100, start.total + ((live - start.total) / elapsed) * (s1 - s0))) : null;
    status = live >= neededToday + 2 ? "ahead" : live >= neededToday - 2 ? "on_track" : "behind";
  }

  // --- goals over time ---------------------------------------------------------------
  const goalsAll = (plan?.goals ?? []).filter((g) => g.baseline !== null && g.target !== null && g.target !== g.baseline && g.date);
  let goalPct: number | null = null;
  let timeUsed: number | null = null;
  const goalSeries: { date: string; value: number }[] = [];
  if (goalsAll.length && start) {
    const at = (d: number) => {
      const ps = goalsAll.map((g) => goalProgress(g, i.checkins.filter((c) => dayNum(c.checked_on) <= d), iso(d)).percent ?? 0);
      return Math.round(ps.reduce((a, b) => a + Math.max(0, Math.min(100, b)), 0) / ps.length);
    };
    goalSeries.push({ date: start.date.slice(0, 10), value: 0 });
    const days = [...new Set(i.checkins.map((c) => c.checked_on.slice(0, 10)))].filter((d) => dayNum(d) >= dayNum(start.date)).sort();
    for (const d of days) goalSeries.push({ date: d, value: at(dayNum(d)) });
    goalPct = at(dayNum(today));
    const end = Math.max(...goalsAll.map((g) => dayNum(g.date)));
    const s0 = dayNum(start.date);
    timeUsed = end <= s0 ? 100 : Math.max(0, Math.min(100, Math.round(((dayNum(today) - s0) / (end - s0)) * 100)));
  }

  // --- drivers ------------------------------------------------------------------------
  const drivers: Driver[] = [];
  if (actions.length) {
    const keys = [...new Set(actions.map((a) => a.area))];
    for (const k of keys) {
      const mine = actions.filter((a) => a.area === k);
      const done = mine.filter((a) => a.status === "done").length;
      const sb = i.startBlocks?.[k];
      drivers.push({ key: k, label: BLOCK_LABELS[k], share: Math.round((mine.length / actions.length) * 100), done: Math.round((done / mine.length) * 100), left: mine.length - done, startScore: typeof sb === "number" ? Math.round(sb) : null });
    }
    drivers.sort((a, b) => b.share - a.share || a.label.localeCompare(b.label));
  }

  const next = nextReassessment(plan, latest);
  return {
    start,
    confirmed,
    latest,
    live,
    liveSeries,
    cap,
    moves,
    flags,
    target,
    neededToday,
    projected,
    status,
    nextReassessment: next,
    reassessDue: !!next && dayNum(next) <= dayNum(today),
    reassessEvery: plan?.tracking.reassessEvery ?? DEFAULT_REASSESS_EVERY,
    goals: { percent: goalPct, timeUsed, series: goalSeries },
    drivers,
  };
}

const DOC_LABELS: Record<string, string> = {
  bank_statement: "Bank statements checked",
  financial_statements: "Financial statements checked",
  registration: "Business registration checked",
  tax_clearance: "Tax clearance checked",
};

/** "Score 2 points behind the path", "On track", … for the status pill. */
/** Goals are behind when less of the way there than the share of time used. */
export function goalsBehind(t: Trajectory): boolean {
  return t.goals.percent !== null && t.goals.timeUsed !== null && t.goals.percent < t.goals.timeUsed;
}

export function statusLine(t: Trajectory): string {
  if (t.status === "no_target" || t.live === null || t.neededToday === null) return "Set a target score to see your path";
  const d = Math.round(Math.abs(t.live - t.neededToday));
  // The badge and the "In short" sentence must agree: when the score is on
  // pace but the goals aren't, say both (approved Nov 11 2026).
  if (t.status === "ahead") return goalsBehind(t) ? `Score ahead · goals behind` : `Ahead · live score ${d} point${d === 1 ? "" : "s"} above your path`;
  if (t.status === "on_track") return goalsBehind(t) ? "Score on track · goals behind" : "On track";
  return `Behind · live score ${d} point${d === 1 ? "" : "s"} below your path`;
}

/** One plain-English sentence for the top of "Target vs actual", so a
 * founder can read where they stand and decide what to do in seconds. */
export function inShort(t: Trajectory): string {
  if (!t.start || t.live === null || !t.latest) return "";
  const live = Math.round(t.live);
  const up = Math.round(t.live - t.start.total);
  const lead = up > 0 ? `Your score is ${live}, up ${up} from where you started.` : `Your score is ${live}, the same as where you started.`;
  const path =
    t.status === "no_target"
      ? " Set a target score in your plan to see whether you're on pace."
      : t.status === "behind"
        ? ` You're behind the pace you set for ${t.target!.score} by ${fmtLong(t.target!.date)}.`
        : ` You're on pace for ${t.target!.score} by ${fmtLong(t.target!.date)}.`;
  const goals =
    t.goals.percent !== null && t.goals.timeUsed !== null
      ? t.goals.percent >= t.goals.timeUsed
        ? ` Your goals are ${t.goals.percent}% of the way there, ahead of the ${t.goals.timeUsed}% of time used.`
        : ` Your goals are ${t.goals.percent}% of the way there with ${t.goals.timeUsed}% of the time used, so they need a push.`
      : "";
  return lead + path + goals;
}

const fmtLong = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" });

export interface NextMove {
  text: string;
  href: string;
}

/** Three or four next moves, most useful first, from the founder's own
 * plan and progress. Each links to where it gets done. */
export function nextMoves(t: Trajectory, plan: StrategicPlan | null, today: string): NextMove[] {
  const out: NextMove[] = [];
  const day = dayNum(today);
  if (t.reassessDue && t.nextReassessment) out.push({ text: "Re-assess now to confirm your live score and reset your starting point.", href: "/assessment/details" });
  const open = plan ? allActions(plan).filter((a) => a.status !== "done") : [];
  const overdue = open.filter((a) => a.due && dayNum(a.due) < day).sort((a, b) => a.due.localeCompare(b.due));
  if (overdue.length) out.push({ text: `Finish "${overdue[0].text}" first: it's overdue${overdue.length > 1 ? `, with ${overdue.length - 1} more behind it` : ""}.`, href: "/dashboard#coming-up" });
  const weakest = t.drivers.filter((d) => d.left > 0).sort((a, b) => a.done - b.done || b.share - a.share)[0];
  if (weakest) {
    const nextAction = open.find((a) => a.area === weakest.key && !(overdue[0] && a.id === overdue[0].id));
    out.push({ text: nextAction ? `Move ${weakest.label} forward: "${nextAction.text}". It's ${weakest.share}% of your plan and only ${weakest.done}% done.` : `Add an action for ${weakest.label}: it's ${weakest.share}% of your plan and only ${weakest.done}% done.`, href: "/plan" });
  }
  const noProof = plan ? allActions(plan).filter((a) => a.status === "done" && !a.evidence.trim() && a.doneOn && t.latest && dayNum(a.doneOn) >= dayNum(t.latest.date)) : [];
  if (noProof.length) out.push({ text: `Add evidence to ${noProof.length} finished action${noProof.length === 1 ? "" : "s"} for full credit on your live score.`, href: "/plan" });
  if (t.goals.percent !== null && t.goals.timeUsed !== null && t.goals.percent < t.goals.timeUsed) out.push({ text: "Log a goal check-in this week, even a small win: it keeps your progress chart honest.", href: "/dashboard#goals" });
  if (t.status === "no_target") out.push({ text: "Set a target score and date in your plan so you can see whether you're on pace.", href: "/plan" });
  if (t.flags.length) out.push({ text: `${t.flags[0].label}: talk it through with your coach before it affects your plan.`, href: "/coaching" });
  if (out.length < 3 && plan && !plan.goals.length) out.push({ text: "Add up to three goals with a starting number, a target and a date.", href: "/plan" });
  return out.slice(0, 4);
}
