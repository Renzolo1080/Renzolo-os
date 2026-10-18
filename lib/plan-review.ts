import { planAsText, type StrategicPlan } from "./plan";

/** The AI plan review: what it checks, the prompt, and reading its answer.
 * Pure, so it can be tested without calling the AI. */

export const REVIEW_CRITERIA = [
  { key: "currency", label: "Up to date", description: "Built on where the business is today, not an old plan" },
  { key: "alignment", label: "Fixes your gaps", description: "Tackles the weakest areas from your assessment" },
  { key: "measurability", label: "Measurable", description: "Goals have numbers, baselines and dates" },
  { key: "feasibility", label: "Doable", description: "Realistic for your team, money and time" },
  { key: "funding", label: "Funded", description: "Says what it costs and where the money comes from" },
  { key: "coverage", label: "Whole business", description: "Covers customers, offer, sales, money and operations" },
] as const;

export type ReviewCriterion = (typeof REVIEW_CRITERIA)[number]["key"];

export interface PlanReview {
  overall: number;
  verdict: string;
  criteria: { key: ReviewCriterion; score: number; comment: string }[];
  strengths: string[];
  fixes: { area: string; issue: string; fix: string }[];
  questions: string[];
}

/** Reviews per founder: at most one a day and four in any 30 days. Each
 * review is a paid AI call; this also nudges founders to act on fixes
 * before asking again. */
export const REVIEW_LIMITS = { perDay: 1, per30Days: 4 };

export function reviewAllowed(previous: { created_at: string }[], now: Date = new Date()): { ok: true } | { ok: false; reason: string } {
  const t = now.getTime();
  const lastDay = previous.filter((p) => t - new Date(p.created_at).getTime() < 864e5).length;
  const last30 = previous.filter((p) => t - new Date(p.created_at).getTime() < 30 * 864e5).length;
  if (lastDay >= REVIEW_LIMITS.perDay) return { ok: false, reason: "You've had a review in the last 24 hours. Work through the fixes, then ask again tomorrow." };
  if (last30 >= REVIEW_LIMITS.per30Days) return { ok: false, reason: `You've had ${REVIEW_LIMITS.per30Days} reviews in the last 30 days. Book a coaching session if you'd like a person to look at it.` };
  return { ok: true };
}

export interface ReviewContext {
  companyName: string;
  stage: string;
  industry: string;
  country: string;
  ventureScore: number;
  gaps: { label: string; score: number }[];
  blockScores: { label: string; score: number }[];
  planText: string;
  /** Days since the founder's latest assessment. */
  assessmentAgeDays: number;
}

export function buildPlanReviewPrompt(ctx: ReviewContext): string {
  const criteria = REVIEW_CRITERIA.map((c) => `- "${c.key}": ${c.description}`).join("\n");
  return `You are an experienced business coach on Founder Trajectory(TM) reviewing a founder's strategic plan. Be direct, specific and kind. Judge the plan against the founder's CURRENT assessment, not against generic best practice.

Business: ${ctx.companyName || "not specified"}
Stage: ${ctx.stage || "not specified"}
Industry: ${ctx.industry || "not specified"}
Country: ${ctx.country || "not specified"}
Overall business model score: ${ctx.ventureScore}/100 (assessment taken ${ctx.assessmentAgeDays} days ago)
Weakest areas from the assessment (most urgent first): ${ctx.gaps.map((g) => `${g.label} ${g.score}/100`).join("; ") || "not available"}
All area scores: ${ctx.blockScores.map((b) => `${b.label} ${b.score}`).join("; ") || "not available"}

THE PLAN (written by the founder in the guided Plan Builder):
${ctx.planText}

Score the plan 0-100 on each of these:
${criteria}

Pay special attention to:
- Plans copied from an older plan: goals or descriptions that no longer match the assessment, dates in the past, or "today" descriptions that contradict the scores. Say so plainly under "currency".
- Gaps the plan ignores: a weak area with no actions is a serious problem.
- Goals without a number, a starting point or a date.
- Actions with no owner or date, or far more actions than a team this size can do.
- Funding: money needed with no source, or growth goals with no budget.

Reply with ONLY a JSON object, no other text, in exactly this shape:
{
  "overall": <0-100>,
  "verdict": "<2-3 sentences: how ready this plan is to guide the next 90 days, and the single most important change>",
  "criteria": [${REVIEW_CRITERIA.map((c) => `{"key":"${c.key}","score":<0-100>,"comment":"<one sentence>"}`).join(",")}],
  "strengths": ["<what is good, 2-4 items>"],
  "fixes": [{"area":"<plan section or business area>","issue":"<what is wrong>","fix":"<exactly what to change, concrete>"}],
  "questions": ["<1-3 questions the founder should answer before finalising the plan>"]
}
List fixes most important first, 3-6 of them.`;
}

const clamp = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.max(0, Math.min(100, Math.round(n))) : null;
};
const s = (v: unknown, max = 600) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Reads the AI's answer. Accepts JSON wrapped in prose or a code fence;
 * returns null if it isn't usable (the founder isn't charged a review). */
export function parsePlanReview(text: string): PlanReview | null {
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end <= start) return null;
  let raw: any;
  try {
    raw = JSON.parse(text.slice(start, end + 1));
  } catch {
    return null;
  }
  const criteria = REVIEW_CRITERIA.map((c) => {
    const found = Array.isArray(raw?.criteria) ? raw.criteria.find((x: any) => x?.key === c.key) : null;
    const score = clamp(found?.score);
    return score === null ? null : { key: c.key, score, comment: s(found?.comment, 300) };
  });
  if (criteria.some((c) => c === null)) return null;
  const crit = criteria as PlanReview["criteria"];
  const overall = clamp(raw?.overall) ?? Math.round(crit.reduce((n, c) => n + c.score, 0) / crit.length);
  const list = (v: unknown, max: number) => (Array.isArray(v) ? v.map((x) => s(x, 300)).filter(Boolean).slice(0, max) : []);
  const fixes = Array.isArray(raw?.fixes)
    ? raw.fixes
        .map((f: any) => ({ area: s(f?.area, 80), issue: s(f?.issue, 300), fix: s(f?.fix, 400) }))
        .filter((f: any) => f.issue && f.fix)
        .slice(0, 8)
    : [];
  const verdict = s(raw?.verdict, 800);
  if (!verdict) return null;
  return { overall, verdict, criteria: crit, strengths: list(raw?.strengths, 6), fixes, questions: list(raw?.questions, 4) };
}

/** The latest review as plain text, for the Readiness Report. */
export function reviewAsText(r: PlanReview): string {
  return [
    `Plan review score: ${r.overall}/100. ${r.verdict}`,
    ...r.criteria.map((c) => `- ${REVIEW_CRITERIA.find((x) => x.key === c.key)?.label}: ${c.score}/100. ${c.comment}`),
    r.fixes.length ? `Fixes recommended: ${r.fixes.map((f) => `${f.area}: ${f.fix}`).join(" | ")}` : "",
  ]
    .filter(Boolean)
    .join("\n");
}

export { planAsText };
export type { StrategicPlan };
