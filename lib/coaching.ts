import { BLOCK_KEYS } from "./scoring";

/** The Founder Trajectory(TM) Coaching Cycle. Pure, so it can be tested.
 *
 * Benchmarked on what the evidence and the leading coaching standards
 * share:
 *  - frequent, practical coaching tied to the founder's own business
 *    (randomised trials in Mexico and Nigeria), not generic advice;
 *  - a clear coaching agreement and measurable goals (ICF standards);
 *  - GROW sessions: Goal, Reality, Options, Will;
 *  - a quarterly rhythm of priorities and review (Scaling Up, EOS).
 *
 * The cycle: 1 agreement and intake, 2 session (GROW, 1-3 commitments
 * that go into the plan), 3 between sessions (commitments tracked on the
 * dashboard), 4 quarterly review, 5 outcomes measured. */

export const AGREEMENT_VERSION = "2026-10";

export const AGREEMENT_POINTS = [
  "Coaching helps you think, decide and act on your own business. Your coach asks questions, shares experience and holds you to what you commit to; the decisions stay yours.",
  "What you share in sessions is confidential. We only share it with your permission, or where the law requires it.",
  "Come to each session with a goal. Each one ends with 1 to 3 commitments, added to your plan with dates.",
  "Sessions are 30 to 60 minutes, depending on your membership or programme. Reschedule at least 24 hours ahead through your booking link, or the session may count as used.",
  "Coaching is not legal, tax, accounting or investment advice. For those, we'll point you to a qualified professional.",
  "You can stop coaching at any time. Unused sessions follow your membership or purchase terms.",
];

export const SESSION_KINDS = [
  { value: "coaching", label: "Coaching session" },
  { value: "quarterly_review", label: "Quarterly review" },
] as const;
export type SessionKind = (typeof SESSION_KINDS)[number]["value"];

export const COMMITMENT_STATUSES = [
  { value: "open", label: "To do" },
  { value: "done", label: "Done" },
  { value: "dropped", label: "Dropped" },
] as const;
export type CommitmentStatus = (typeof COMMITMENT_STATUSES)[number]["value"];

export interface Commitment {
  id: string;
  text: string;
  due: string; // YYYY-MM-DD or ""
  status: CommitmentStatus;
  /** Business area it belongs to, if any (then it's also added to the plan). */
  area: string;
}

export interface FounderPrep {
  /** A plan goal id, an area key, or "other". */
  focus: string;
  focusLabel: string;
  outcome: string;
  wins: string;
  challenge: string;
}

export interface CoachNotes {
  goal: string;
  reality: string;
  options: string;
  will: string;
  private: string;
}

export const MAX_COMMITMENTS = 3;

const str = (v: unknown, max: number) => (typeof v === "string" ? v.replace(/\u0000/g, "").trim().slice(0, max) : "");
const date = (v: unknown) => (typeof v === "string" && /^\d{4}-\d{2}-\d{2}$/.test(v) && !Number.isNaN(Date.parse(v)) ? v : "");

export function sanitizePrep(raw: any): FounderPrep {
  return {
    focus: str(raw?.focus, 40),
    focusLabel: str(raw?.focusLabel, 200),
    outcome: str(raw?.outcome, 600),
    wins: str(raw?.wins, 600),
    challenge: str(raw?.challenge, 600),
  };
}

export function sanitizeNotes(raw: any): CoachNotes {
  return { goal: str(raw?.goal, 2000), reality: str(raw?.reality, 3000), options: str(raw?.options, 3000), will: str(raw?.will, 2000), private: str(raw?.private, 3000) };
}

export function sanitizeCommitments(raw: unknown): Commitment[] {
  const list = Array.isArray(raw) ? raw : [];
  return list
    .slice(0, MAX_COMMITMENTS)
    .map((c: any, i: number) => ({
      id: typeof c?.id === "string" && /^[A-Za-z0-9_-]{1,40}$/.test(c.id) ? c.id : `c${i}`,
      text: str(c?.text, 300),
      due: date(c?.due),
      status: (COMMITMENT_STATUSES.some((s) => s.value === c?.status) ? c.status : "open") as CommitmentStatus,
      area: (BLOCK_KEYS as readonly string[]).includes(c?.area) ? c.area : "",
    }))
    .filter((c) => c.text)
    .map((c, i, all) => (all.findIndex((x) => x.id === c.id) === i ? c : { ...c, id: `${c.id}-${i}` }));
}

/** The coach's booking page, set with COACHING_BOOKING_URL (e.g. a
 * Calendly or Google Calendar booking link). Name and email are passed
 * along where the booking tool supports it, so founders don't retype them. */
export function bookingLink(env: Record<string, string | undefined> = process.env, who?: { name?: string | null; email?: string | null }): string | null {
  const raw = (env.COACHING_BOOKING_URL ?? "").trim();
  if (!/^https:\/\//.test(raw)) return null;
  try {
    const u = new URL(raw);
    if (who?.name) u.searchParams.set("name", who.name);
    if (who?.email) u.searchParams.set("email", who.email);
    return u.toString();
  } catch {
    return null;
  }
}

export interface SessionLike {
  id: string;
  status: string;
  kind?: string | null;
  scheduled_at?: string | null;
  completed_at?: string | null;
  created_at: string;
  commitments?: unknown;
  rating?: number | null;
}

export function openCommitments(sessions: SessionLike[]): (Commitment & { sessionId: string })[] {
  return sessions.flatMap((s) => sanitizeCommitments(s.commitments).filter((c) => c.status === "open").map((c) => ({ ...c, sessionId: s.id })));
}

export type RiskFlag = "overdue_commitments" | "no_update" | "goal_behind" | "no_session" | "awaiting_time";
export const RISK_LABELS: Record<RiskFlag, string> = {
  overdue_commitments: "Overdue commitments",
  no_update: "No monthly update in 45 days",
  goal_behind: "A goal is behind or overdue",
  no_session: "No session in 60 days",
  awaiting_time: "Session requested, no time yet",
};

/** Why a founder needs the coach's attention. */
export function riskFlags(
  input: { sessions: SessionLike[]; lastUpdate: string | null; goalsBehind: number },
  today: string = new Date().toISOString().slice(0, 10)
): RiskFlag[] {
  const flags: RiskFlag[] = [];
  const t = Date.parse(`${today}T00:00:00Z`);
  if (openCommitments(input.sessions).some((c) => c.due && c.due < today)) flags.push("overdue_commitments");
  if (input.goalsBehind > 0) flags.push("goal_behind");
  if (!input.lastUpdate || t - Date.parse(input.lastUpdate) > 45 * 864e5) flags.push("no_update");
  const last = input.sessions
    .map((s) => s.completed_at ?? s.scheduled_at)
    .filter(Boolean)
    .sort()
    .pop();
  if (!last || t - Date.parse(last!) > 60 * 864e5) flags.push("no_session");
  if (input.sessions.some((s) => s.status === "requested")) flags.push("awaiting_time");
  return flags;
}

/** Headline numbers for the coach: how coaching is going overall. */
export function coachingStats(sessions: SessionLike[]) {
  const done = sessions.filter((s) => s.status === "completed");
  const ratings = done.map((s) => s.rating).filter((r): r is number => typeof r === "number");
  const commitments = done.flatMap((s) => sanitizeCommitments(s.commitments));
  const closed = commitments.filter((c) => c.status !== "open");
  return {
    completed: done.length,
    upcoming: sessions.filter((s) => s.status === "scheduled").length,
    awaiting: sessions.filter((s) => s.status === "requested").length,
    avgRating: ratings.length ? Math.round((ratings.reduce((a, b) => a + b, 0) / ratings.length) * 10) / 10 : null,
    commitmentRate: closed.length ? Math.round((commitments.filter((c) => c.status === "done").length / closed.length) * 100) : null,
  };
}

export interface BriefContext {
  founderName: string;
  company: string;
  stage: string;
  industry: string;
  country: string;
  tier: string;
  score: string;
  gaps: string;
  planText: string | null;
  reviewText: string | null;
  goals: string;
  latestUpdate: string;
  previous: string;
  prep: FounderPrep;
  kind: SessionKind;
}

/** Prompt for the coach's one-page prep brief. */
export function buildPrepBriefPrompt(c: BriefContext): string {
  const or = (v: string | null | undefined) => (v && v.trim() ? v.trim() : "not given");
  return `You are preparing a Founder Trajectory(TM) coach for a ${c.kind === "quarterly_review" ? "QUARTERLY REVIEW" : "coaching session"} with a founder. Write a one-page prep brief the coach can read in two minutes. Plain, specific, no generic advice.

Founder: ${or(c.founderName)} · ${or(c.company)}
Stage: ${or(c.stage)} · Industry: ${or(c.industry)} · Country: ${or(c.country)} · Membership: ${or(c.tier)}
Scores: ${or(c.score)}
Weakest areas: ${or(c.gaps)}

What the founder wants from this session:
- Focus: ${or(c.prep.focusLabel)}
- Outcome they want: ${or(c.prep.outcome)}
- Wins since last time: ${or(c.prep.wins)}
- Biggest challenge: ${or(c.prep.challenge)}

Goals, target vs actual:
${or(c.goals)}

Latest monthly update:
${or(c.latestUpdate)}

Previous sessions and their commitments:
${or(c.previous)}

Strategic plan:
${or(c.planText)}

Latest AI plan review:
${or(c.reviewText)}

Use these headings exactly:
## In one line
## What's changed
## Commitments to follow up
## Watch-outs
## Suggested GROW questions
(2 questions each for Goal, Reality, Options and Will, specific to this founder${c.kind === "quarterly_review" ? "; for a quarterly review, also suggest the 3 priorities for next quarter" : ""})
## A useful resource or connection
(one concrete idea, e.g. a type of lender, programme, buyer or specialist; say if you are unsure it exists locally)`;
}
