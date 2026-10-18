/** Market Intelligence: a researched brief on the founder's industry in
 * their country, refreshed monthly. Pure, so it can be tested. */

export const MARKET_SECTIONS = [
  "Market Snapshot",
  "Trends to Watch",
  "Customers and Demand",
  "Competitors and Alternatives",
  "Pricing Benchmarks",
  "Opportunities",
  "Risks",
  "Funding Landscape",
  "Rules and Compliance",
  "Recommendations for Your Plan",
  "Target Reality Check",
] as const;

/** A new brief can be made once 30 days have passed, or straight away if
 * the founder's industry or country has changed. Never more than 3 in 30
 * days, whatever changes (each brief makes several paid web searches). */
export const REFRESH_DAYS = 30;
export const MAX_BRIEFS_PER_30_DAYS = 3;

export function briefRefresh(
  briefs: { created_at: string; industry: string; country: string }[],
  current: { industry: string; country: string },
  now: Date = new Date()
): { allowed: boolean; nextAt: string | null; reason: string | null } {
  const t = now.getTime();
  const sorted = briefs.slice().sort((a, b) => b.created_at.localeCompare(a.created_at));
  const last = sorted[0];
  const recent = sorted.filter((b) => t - new Date(b.created_at).getTime() < REFRESH_DAYS * 864e5);
  if (!last) return { allowed: true, nextAt: null, reason: null };
  const norm = (v: string) => v.trim().toLowerCase();
  const changed = norm(last.industry) !== norm(current.industry) || norm(last.country) !== norm(current.country);
  const nextAt = new Date(new Date(last.created_at).getTime() + REFRESH_DAYS * 864e5).toISOString();
  if (recent.length >= MAX_BRIEFS_PER_30_DAYS) {
    const oldest = recent[recent.length - 1];
    return { allowed: false, nextAt: new Date(new Date(oldest.created_at).getTime() + REFRESH_DAYS * 864e5).toISOString(), reason: "You've reached this month's limit for market briefs." };
  }
  if (changed) return { allowed: true, nextAt: null, reason: null };
  if (t >= new Date(nextAt).getTime()) return { allowed: true, nextAt: null, reason: null };
  return { allowed: false, nextAt, reason: "Your brief refreshes monthly." };
}

export interface MarketContext {
  companyName: string;
  industry: string;
  country: string;
  stage: string;
  businessType: string;
  revenue: string;
  primaryGoal: string;
  /** The founder's own description of who they sell to and what they offer, if given. */
  customers: string;
  offer: string;
  fundingNeed: string;
  /** The founder's strategic plan as text (lib/plan.ts planAsText), if they have one. */
  planText: string | null;
  /** Plan goals and areas, so recommendations can point at them. */
  goals: { id: string; title: string }[];
  areas: { key: string; label: string }[];
}

export function buildMarketPrompt(ctx: MarketContext, today: string): string {
  const or = (v: string) => (v && v.trim() ? v.trim() : "not specified");
  const sections = MARKET_SECTIONS.map((s) => `## ${s}`).join("\n");
  return `You are a market research analyst for Founder Trajectory(TM). Today is ${today}. Write a Market Intelligence brief for this founder, using live web research.

Business: ${or(ctx.companyName)}
Industry: ${or(ctx.industry)}
Country: ${or(ctx.country)}
Stage: ${or(ctx.stage)}
Business type: ${or(ctx.businessType)}
Annual revenue: ${or(ctx.revenue)}
Main goal: ${or(ctx.primaryGoal)}
Who they sell to (their words): ${or(ctx.customers)}
What they offer (their words): ${or(ctx.offer)}
Funding plans: ${or(ctx.fundingNeed)}

${ctx.planText ? `THE FOUNDER'S STRATEGIC PLAN (their goals, actions and targets):
${ctx.planText}

The brief exists to strengthen this plan. Research what bears on its goals, actions and targets, and say plainly where the market supports or contradicts them.
` : `The founder has not built their strategic plan yet: make the recommendations general moves for the next 90 days.
`}
Research the industry IN THIS COUNTRY first, then the wider region where national data is thin (say so when you do). Prefer recent sources (the last 2 years), official statistics, industry bodies, development banks and reputable news. Only state figures you actually found; never invent statistics. Cite every figure inline as (Source: <publisher>, <year>).

Use these EXACT headings, in this order:
${sections}

Guidance:
- Market Snapshot: size, growth and structure in 3-5 bullets.
- Trends to Watch: 3-5 trends, each with why it matters for a business like this.
- Customers and Demand: the main buyer groups, what they value and how they buy.
- Competitors and Alternatives: the kinds of competitors (name notable ones you found) and what customers use instead.
- Pricing Benchmarks: typical prices, margins or terms you found; say clearly when data is scarce.
- Opportunities and Risks: 3-4 each, specific to this business's stage and size.
- Funding Landscape: who funds businesses like this here (banks, grants, programmes, investors) and what they look for.
- Rules and Compliance: registrations, licences, standards or tax points that commonly apply; tell them to confirm with a local professional.
- Recommendations for Your Plan: 4-6 concrete changes or additions${ctx.planText ? " to the plan, each naming the goal or business area it belongs to" : ""}, each with the evidence behind it.
- Target Reality Check: ${ctx.goals.length ? "for each goal, whether the target looks realistic, a stretch or unrealistic in this market, and why." : "what realistic growth looks like for a business like this here."}

Write in plain language for a busy founder. Keep it to roughly 1000-1400 words. End the brief with one line in italics: "AI-researched and directional: check key figures before relying on them."

After the brief, add a JSON block (in a \`\`\`json fence) repeating the recommendations and target checks in this shape:
{"recommendations":[{"area":"<one of: ${[...ctx.areas.map((a) => a.key), "general"].join(", ")}>","goalId":"<one of: ${ctx.goals.map((g) => g.id).join(", ") || "none"}, or empty>","action":"<one concrete action, under 25 words>","why":"<the evidence, one sentence>"}],
 "targets":[{"goalId":"<goal id>","verdict":"realistic|stretch|unrealistic","comment":"<one sentence>"}]}
Area keys mean: ${[...ctx.areas.map((a) => `${a.key} = ${a.label}`), "general = anything else"].join("; ")}.${ctx.goals.length ? ` Goal ids: ${ctx.goals.map((g) => `${g.id} = ${g.title}`).join("; ")}.` : ""}`;
}

/** Keeps only the brief: drops any preamble before the first heading
 * and the JSON block after it. */
export function cleanBrief(text: string): string {
  const i = text.indexOf("## ");
  let body = i >= 0 ? text.slice(i) : text;
  const fence = body.search(/```json/i);
  if (fence >= 0) body = body.slice(0, fence);
  return body.trim();
}

export interface MarketInsights {
  recommendations: { area: string; goalId: string; action: string; why: string }[];
  targets: { goalId: string; verdict: "realistic" | "stretch" | "unrealistic"; comment: string }[];
}

/** The structured recommendations and target checks after the brief.
 * Anything unrecognised is dropped; never throws. */
export function parseInsights(text: string, allowed: { areas: string[]; goals: string[] }): MarketInsights {
  const empty: MarketInsights = { recommendations: [], targets: [] };
  const m = /```json\s*([\s\S]*?)```/i.exec(text);
  if (!m) return empty;
  let raw: any;
  try {
    raw = JSON.parse(m[1]);
  } catch {
    return empty;
  }
  const s = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");
  const recommendations = (Array.isArray(raw?.recommendations) ? raw.recommendations : [])
    .map((r: any) => ({
      area: allowed.areas.includes(r?.area) ? r.area : "general",
      goalId: allowed.goals.includes(r?.goalId) ? r.goalId : "",
      action: s(r?.action, 300),
      why: s(r?.why, 400),
    }))
    .filter((r: any) => r.action)
    .slice(0, 8);
  const targets = (Array.isArray(raw?.targets) ? raw.targets : [])
    .filter((t: any) => allowed.goals.includes(t?.goalId) && ["realistic", "stretch", "unrealistic"].includes(t?.verdict))
    .map((t: any) => ({ goalId: t.goalId, verdict: t.verdict, comment: s(t?.comment, 400) }))
    .slice(0, 5);
  return { recommendations, targets };
}

/** A usable brief has most of the expected sections. */
export function briefLooksComplete(markdown: string): boolean {
  const found = MARKET_SECTIONS.filter((s) => markdown.includes(`## ${s}`)).length;
  return found >= MARKET_SECTIONS.length - 2;
}
