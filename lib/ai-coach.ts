import { BLOCK_KEYS, BLOCK_LABELS } from "./scoring";

/** The Founder Trajectory(TM) AI coach. Pure, so it can be tested.
 *
 * It works the same way as human coaching (lib/coaching.ts): it starts
 * from the founder's own assessment, plan and numbers, asks before it
 * tells, and ends with a small number of dated actions that can go
 * straight into the plan. It stays within business coaching and points
 * to a human coach or a qualified professional when that is what's
 * needed. */

/** Messages a founder can send in a day. Each one is a paid AI call. */
export const DAILY_LIMITS = { member: 30, elevate: 60 } as const;
/** Earlier messages sent with each new one (longer threads are trimmed). */
export const HISTORY_TURNS = 12;
export const MAX_MESSAGE_CHARS = 2000;

export function dailyLimit(tier: string | null): number {
  return tier === "elevate" ? DAILY_LIMITS.elevate : DAILY_LIMITS.member;
}

/** Messages the founder has left today (by UTC day). */
export function remainingToday(sentAt: string[], limit: number, now: Date = new Date()): number {
  const day = now.toISOString().slice(0, 10);
  return Math.max(0, limit - sentAt.filter((t) => t.slice(0, 10) === day).length);
}

export interface CoachContext {
  founderName: string;
  company: string;
  stage: string;
  industry: string;
  country: string;
  scores: string;
  gaps: string;
  planText: string | null;
  goals: string;
  actionsDue: string;
  latestUpdate: string;
  commitments: string;
  marketHighlights: string | null;
  today: string;
  /** Launch cohort week, when the founder is in one (e.g. "Week 3: Channels"). */
  programmeWeek?: string | null;
}

const or = (v: string | null | undefined, empty = "not given") => (v && v.trim() ? v.trim() : empty);

/** The coach's standing instructions plus everything it knows about this founder. */
export function buildCoachSystem(c: CoachContext): string {
  const areaKeys = BLOCK_KEYS.map((k) => `${k} (${BLOCK_LABELS[k]})`).join(", ");
  return `You are "Lorenzo · AI", the Founder Trajectory(TM) AI coach built on Lorenzo Bell Jr.'s coaching methods. If asked, say you are an AI coach, not Lorenzo himself. You work with founders of early and growth stage businesses across Africa. Today is ${c.today}.

HOW YOU COACH
- Start from this founder's own situation below. Never give generic advice that could apply to anyone.
- Ask before you tell: when the founder's goal or situation is unclear, ask one or two sharp questions first.
- Use the GROW approach when helping them decide something: Goal, Reality (their real numbers), Options, Will (what they'll do, by when).
- Be direct, warm and practical. Short paragraphs, plain language, local context (their country, currency, customers, rules) where it matters.
- When the conversation reaches a decision, end with 1 to 3 concrete actions, each with a date.
- Hold them to their commitments: if actions or goals are overdue, raise it kindly.
- Stay within business coaching. For legal, tax, accounting or investment decisions, say they need a qualified professional. For personal crises, say this is beyond what you can help with and encourage them to reach out to someone they trust or local support services.
- Suggest a session with their human coach when a decision is high-stakes (raising money, a large contract, hiring a partner) or they seem stuck after several attempts.
- Never invent facts, statistics, programmes or contacts. If you are unsure whether something exists in their country, say so.

INSIGHT AT FIVE LEVELS
When the founder asks about their market, a target, a goal or a decision, ground your answer in insight at the levels that matter, using web search for current facts:
- Local: their city or region (customers, competitors, suppliers, costs).
- National: their country (demand, rules, tax, finance and government programmes).
- Regional: their trade bloc or neighbours (e.g. EAC, SADC, ECOWAS, AfCFTA markets).
- International: export markets, foreign buyers, donors and investors active in their sector.
- Global: trends, prices and technology that affect their sector.
Tie each insight to their plan, targets or goals and say what it means for them. Cite sources inline as (Source: <publisher>, <year>). Only state figures you actually found; say clearly when data is scarce or estimated.
Whenever you give market insight, figures, or programme or funding information, end with this line exactly: "Please validate and confirm this information before acting on it. Lorenzo · AI is not an advisor."
- Keep replies under about 250 words unless they ask for more.

SUGGESTING PLAN ACTIONS
When you recommend specific actions, add after your reply a JSON block in a \`\`\`json fence:
{"actions":[{"area":"<one of: ${areaKeys}>","text":"<the action, under 20 words>","due":"<YYYY-MM-DD or empty>"}]}
At most 3 actions. Only include the block when you are recommending actions.

THE FOUNDER
Name: ${or(c.founderName)} · Business: ${or(c.company)}
Stage: ${or(c.stage)} · Industry: ${or(c.industry)} · Country: ${or(c.country)}${c.programmeWeek ? `\nLaunch programme: ${c.programmeWeek}` : ""}
Scores: ${or(c.scores)}
Weakest areas: ${or(c.gaps)}

Goals, target vs actual:
${or(c.goals, "no goals set yet")}

Plan actions due or overdue:
${or(c.actionsDue, "none")}

Open commitments from coaching sessions:
${or(c.commitments, "none")}

Latest monthly update:
${or(c.latestUpdate, "none yet")}

Strategic plan:
${or(c.planText, "no plan built yet: encourage them to use the Plan Builder")}
${c.marketHighlights ? `\nFrom their latest Market Intelligence brief:\n${c.marketHighlights}` : ""}`;
}

/** The weekly check-in request, sent as the founder's message. */
export const INSIGHTS_PROMPT =
  "Give me local, national, regional, international and global insight for my business, based on my plan, targets and goals. Use a short heading for each level, 2-3 points each, and say what each means for my targets. Finish with the 3 most important moves, with dates.";

/** Web searches the coach may make: more for an insight request, a few for chat. */
export const WEB_SEARCHES = { chat: 2, insights: 5, checkin: 0 } as const;

/** Shown under every coach reply, whatever the model wrote. */
export const COACH_DISCLAIMER = "Lorenzo · AI is an AI coach built on Lorenzo's methods, not Lorenzo himself, and not an advisor: it does not give financial, legal, tax or investment advice. Please validate and confirm this information before acting on it.";

export const CHECKIN_PROMPT =
  "Weekly check-in. Look at my goals, overdue actions, commitments and latest numbers. In under 200 words: tell me how I'm tracking, name the one thing that matters most this week, and ask me two questions to help me plan it. Then suggest up to 3 dated actions.";

export interface SuggestedAction {
  area: string;
  text: string;
  due: string;
}

/** Splits a reply into the text shown and any suggested plan actions. */
export function parseCoachReply(raw: string): { text: string; actions: SuggestedAction[] } {
  const m = /```json\s*([\s\S]*?)```/i.exec(raw);
  const text = (m ? raw.slice(0, m.index) + raw.slice(m.index + m[0].length) : raw).trim();
  if (!m) return { text, actions: [] };
  let parsed: any;
  try {
    parsed = JSON.parse(m[1]);
  } catch {
    return { text, actions: [] };
  }
  const actions = (Array.isArray(parsed?.actions) ? parsed.actions : [])
    .map((a: any) => ({
      area: (BLOCK_KEYS as readonly string[]).includes(a?.area) ? a.area : "",
      text: typeof a?.text === "string" ? a.text.trim().slice(0, 300) : "",
      due: typeof a?.due === "string" && /^\d{4}-\d{2}-\d{2}$/.test(a.due) ? a.due : "",
    }))
    .filter((a: SuggestedAction) => a.text && a.area)
    .slice(0, 3);
  return { text, actions };
}

/** A short thread title from the founder's first message. */
export function threadTitle(first: string): string {
  const clean = first.replace(/\s+/g, " ").trim();
  if (!clean) return "Conversation";
  return clean.length <= 60 ? clean : `${clean.slice(0, 57).replace(/\s+\S*$/, "")}…`;
}

/** Earlier turns to send with a new message: the latest, starting with the founder. */
export function historyFor(messages: { role: "user" | "assistant"; content: string }[], turns = HISTORY_TURNS) {
  const recent = messages.slice(-turns);
  while (recent.length && recent[0].role !== "user") recent.shift();
  return recent;
}

/** Conversation starters built from the founder's own gaps and goals. */
export function starters(input: { gaps: string[]; goals: string[]; hasPlan: boolean }): string[] {
  const out: string[] = [];
  if (input.gaps[0]) out.push(`What should I do first to improve my ${input.gaps[0]}?`);
  if (input.goals[0]) out.push(`I'm behind on "${input.goals[0]}". Help me get back on track.`);
  out.push(input.hasPlan ? "Review my plan and tell me what's missing." : "Help me start my strategic plan.");
  out.push("How do I get ready to apply for a loan or grant?");
  out.push("Help me prepare for a meeting with a big buyer.");
  return out.slice(0, 4);
}
