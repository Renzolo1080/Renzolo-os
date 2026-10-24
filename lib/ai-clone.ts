import type { CoachContext } from "./ai-coach";

/** "Lorenzo · AI": a talking video clone of Lorenzo Bell Jr., run on Tavus's
 * Conversational Video Interface (a PAL with Lorenzo's trained face and
 * voice). Pure helpers, so they can be tested; the API route calls Tavus.
 *
 * Rules from the brand book (Futuristic layer, visual AI agents):
 * always labelled AI, never claims to be the real person, coaches only
 * (no prices, guarantees, financial/legal/tax/investment advice or
 * promised introductions), human handoff one tap away, captions on,
 * video starts only when the founder taps, a text fallback, consent
 * first. */

export const CLONE_NAME = "Lorenzo · AI";
/** Longest single video session, in seconds (cost and attention). */
export const SESSION_SECONDS = 600;
/** Video sessions a founder can start per calendar month (UTC). */
export const SESSIONS_PER_MONTH = { member: 3, elevate: 12 } as const;
export const CONSENT_VERSION = "2026-10";

export function sessionLimit(tier: string | null): number {
  return tier === "elevate" ? SESSIONS_PER_MONTH.elevate : SESSIONS_PER_MONTH.member;
}

/** Sessions left this month, counting sessions started in the same UTC month. */
export function sessionsLeft(startedAt: string[], limit: number, now: Date = new Date()): number {
  const month = now.toISOString().slice(0, 7);
  return Math.max(0, limit - startedAt.filter((t) => t.slice(0, 7) === month).length);
}

export interface CloneConfig {
  enabled: boolean;
  apiKey: string;
  palId: string;
  faceId: string | null;
  /** Tavus conversations endpoint (overridable for local tests only). */
  apiUrl: string;
}

const TAVUS_CONVERSATIONS = "https://tavusapi.com/v2/conversations";

/** On only when the Tavus key and Lorenzo's PAL are configured. */
export function cloneConfig(env: Record<string, string | undefined> = process.env): CloneConfig {
  const apiKey = (env.TAVUS_API_KEY ?? "").trim();
  const palId = (env.TAVUS_PAL_ID ?? "").trim();
  const faceId = (env.TAVUS_FACE_ID ?? "").trim() || null;
  const override = (env.TAVUS_API_URL ?? "").trim();
  const apiUrl = /^http:\/\/127\.0\.0\.1:\d+\//.test(override) ? override : TAVUS_CONVERSATIONS;
  return { enabled: Boolean(apiKey && palId), apiKey, palId, faceId, apiUrl };
}

/** What the founder agrees to before the first video session. */
export const CONSENT_POINTS = [
  "Lorenzo · AI is an AI version of Lorenzo Bell Jr. It is not Lorenzo, and no person is watching live.",
  "It coaches and explains. It does not give financial, legal, tax or investment advice, set prices, or promise introductions or results.",
  "Your video and voice in the session are processed by our video provider, Tavus, to run the conversation. Your plan details are shared with it for the session.",
  "Please check anything important with a qualified professional or with the real Lorenzo before acting on it.",
];

const MAX_CONTEXT = 6000;
const or = (v: string | null | undefined, empty: string) => (v && v.trim() ? v.trim() : empty);

/** Per-conversation context for the PAL: who the founder is and where
 * their business stands. Spoken replies, so short and plain. */
export function buildCloneContext(c: CoachContext): string {
  const text = `You are speaking with ${or(c.founderName, "a founder")} of ${or(c.company, "their business")} (${or(c.stage, "stage not given")}, ${or(c.industry, "industry not given")}, ${or(c.country, "country not given")}). Today is ${c.today}.

Their readiness: ${or(c.scores, "not assessed yet")}. Weakest areas: ${or(c.gaps, "not known yet")}.
Goals, target against actual: ${or(c.goals, "no goals set yet")}.
Actions due or overdue: ${or(c.actionsDue, "none")}.
Open coaching commitments: ${or(c.commitments, "none")}.
Latest monthly update: ${or(c.latestUpdate, "none yet")}.
${c.marketHighlights ? `Market highlights: ${c.marketHighlights}\n` : ""}
Their strategic plan, in brief:
${or(c.planText, "No plan yet: encourage them to build it in the Plan Builder.").slice(0, 2500)}`;
  return text.length > MAX_CONTEXT ? `${text.slice(0, MAX_CONTEXT - 1)}…` : text;
}

export function greeting(founderName: string): string {
  const first = founderName.trim().split(/\s+/)[0];
  return `Hi${first ? ` ${first}` : ""}, I'm Lorenzo's AI coach. I've looked at your plan and your numbers. What would you like to work on today?`;
}

/** The standing instructions to paste into Lorenzo's PAL in Tavus. Kept
 * here, versioned with the code, so the clone's behaviour is owned by
 * RENZOLO (Workstream 8). */
export const PAL_SYSTEM_PROMPT = `You are "Lorenzo · AI", the AI coach version of Lorenzo Bell Jr., founder of RENZOLO and creator of the Founder Trajectory Method (Evaluate, Evolve, Execute, Elevate). You coach early and growth stage founders across Africa to become ready for customers, capital (loans, credit, grants) and investors.

Who you are
- You are an AI. If asked, say plainly that you are Lorenzo's AI coach, not Lorenzo himself, and that no person is watching live. Never claim to be the real Lorenzo or to remember meeting the founder.
- You speak like Lorenzo: warm, direct, practical, encouraging, with the experience of 20+ years developing suppliers for large buyers.

How you coach
- Start from the founder's own situation, given in the conversation context. Never give generic advice.
- Ask one sharp question before giving advice when the goal is unclear. Use Goal, Reality, Options, Will.
- Keep each spoken reply short: two to four sentences. End decisions with one or two concrete actions and a date.
- Hold them kindly to overdue actions and commitments.

Limits
- No financial, legal, tax or investment advice. For those, say they need a qualified professional.
- Never quote or change prices, offer discounts, grant guarantees, promise introductions, funding or results, or speak for Lorenzo on new topics. For any of these, suggest booking a session with a Founder Coach from the Coaching page.
- If the founder is in personal crisis, say this is beyond what you can help with and encourage them to reach out to someone they trust or local support services.
- Do not invent facts, statistics, programmes or contacts.
- When you share market information or figures, remind them to check it before acting on it.`;
