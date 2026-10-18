import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosticResult } from "./scoring";

/** How long one report is allowed to take before we give up and tell the
 * founder to try again. A report makes up to four web searches, so it is
 * slow by nature; this is a ceiling on a stuck request, not a target.
 * Kept under the route's own limit (maxDuration in app/api/report/route.ts)
 * so the founder gets a clear message rather than a blank timeout page. */
export const REPORT_TIMEOUT_MS = 150_000;

/** Created on first use, so a missing key fails the one request that
 * needs it with a clear message instead of breaking the whole app at
 * start-up. No automatic retries: a retry would repeat the web searches
 * (which are billed) and could run past the time limit. */
let cached: Anthropic | null = null;
function getClient(): Anthropic {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error("ANTHROPIC_API_KEY is not set.");
  cached ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY, timeout: REPORT_TIMEOUT_MS, maxRetries: 0 });
  return cached;
}

export interface ReportInput {
  founderName: string;
  ventureStage: string;
  industry: string;
  geography: string;
  timeHorizon: string;
  businessType: string;
  employeeCount: string;
  yearsInBusiness: string;
  annualRevenue: string;
  /** Quick Check answers with no column of their own (assessments.extra). */
  extra?: {
    primaryGoal?: string;
    fundingNeed?: string;
    registration?: string;
    challenges?: string[];
    companyName?: string | null;
    planScore?: number;
    plan?: Record<string, number>;
    planCoverage?: string[];
  } | null;
  diagnostic: DiagnosticResult;
  blockNarratives: Record<string, { currentState: string; futureState: string; goalTarget: string }>;
  /** The founder's strategic plan from the Plan Builder, as text (lib/plan.ts planAsText). */
  planText?: string | null;
  /** The latest AI plan review, as text (lib/plan-review.ts reviewAsText). */
  planReviewText?: string | null;
  /** Recommendations from the founder's latest Market Intelligence brief. */
  marketHighlights?: string | null;
}

const orUnspecified = (v: string | null | undefined) => (v && v.trim() ? v : "not specified");
const AREA_LABELS: Record<string, string> = {
  customerSegments: "Customer Segments",
  valueProposition: "Value Proposition",
  channels: "Channels",
  customerRelationships: "Customer Relationships",
  revenueStreams: "Revenue Streams",
  keyResources: "Key Resources",
  keyActivities: "Key Activities",
  keyPartnerships: "Key Partnerships",
  costStructure: "Cost Structure",
};
const labelFor = (k: string) => AREA_LABELS[k] ?? k;

export interface ReportOptions {
  /** "summary" for Essentials; "full" for Growth, Elevate and the one-time assessment. */
  level: "summary" | "full";
  /** How far the growth and readiness plan should reach, e.g. "12 months". */
  planLength: string;
  /** Recommend a membership tier (the one-time assessment only). */
  tierRecommendation: boolean;
}

const PLAN_LABELS: Record<string, string[]> = {
  planExists: ["No plan yet", "Plan mostly in the founder's head", "Written but out of date", "Written, current and shared"],
  planGoals: ["No goals set", "General goals, no numbers or dates", "Some goals have targets and dates", "Every major goal has a target, date and owner"],
  planFinancials: ["No budget or projections", "Rough numbers only", "Budget but no projections", "Budget and 12+ months of projections"],
  planReview: ["Never reviewed", "Reviewed once a year or less", "Reviewed quarterly", "Reviewed monthly or more"],
};

/** How the plan beyond the first 90 days is broken down, by length. */
export function planPhasing(planLength: string): string {
  const months = /^(\d+)\s*months?$/i.exec(planLength.trim())?.[1];
  const m = months ? Number(months) : planLength.trim().toLowerCase() === "90 days" ? 3 : 12;
  if (m <= 3) return "The whole plan is the first 90 days, in detail.";
  if (m <= 12) return `After the first 90 days, break the rest of the ${m} months into quarterly milestones.`;
  return `After the first 90 days, use quarterly milestones up to month 12, then 6-month milestones up to month ${m}.`;
}

/** The report prompt (pure, so it can be tested without calling the AI). */
export function buildReportPrompt(input: ReportInput, options: ReportOptions): string {
  const full = options.level === "full";
  const gapDetail = input.diagnostic.gaps
    .map((g) => {
      const narrative = input.blockNarratives[g.block];
      const narrativeText = narrative
        ? `\n  Founder's current state: ${orUnspecified(narrative.currentState)}\n  Founder's desired future state: ${orUnspecified(
            narrative.futureState
          )}\n  Founder's stated goal/target and timeline: ${orUnspecified(narrative.goalTarget)}`
        : "";
      return `- ${g.label}: score ${g.score}/100, weakest measure: ${g.weakestMeasure}${narrativeText}`;
    })
    .join("\n");
  const gapKeys = new Set<string>(input.diagnostic.gaps.map((g) => g.block));
  const otherAreas = Object.entries(input.blockNarratives)
    .filter(([k, n]) => !gapKeys.has(k) && n.currentState.trim())
    .map(([k, n]) => `- ${labelFor(k)} (score ${Math.round(Number((input.diagnostic.blockScores as any)?.[k] ?? 0))}/100): today: ${n.currentState} → wants: ${orUnspecified(n.futureState)}`)
    .join("\n");
  const plan = input.extra?.plan;
  const planLines = plan
    ? Object.entries(PLAN_LABELS)
        .map(([k, labels]) => (typeof plan[k] === "number" ? `- ${labels[plan[k]] ?? "not specified"}` : null))
        .filter(Boolean)
        .join("\n") + `\n- Business-model areas the plan addresses: ${orUnspecified(input.extra?.planCoverage?.join(", "))}`
    : "- not specified";

  const sections: string[] = [];
  sections.push(`## Overall Assessment
A short overall assessment (2-3 sentences).`);
  sections.push(`## Strategic Plan Review
${input.planText ? `${full ? "4-6 sentences" : "2-3 sentences"} on the founder's actual strategic plan (given in full above${input.planReviewText ? ", with its AI review" : ""}): whether it starts from where the business is today, whether its goals are measurable and realistic, whether it tackles the weakest areas, and the most important changes to make. Build the Growth and Readiness Plan below on THEIR plan: keep its goals, owners and dates where sound, and say clearly where you change them.` : `${full ? "3-5 sentences" : "2-3 sentences"} on how solid the founder's strategic plan is (from the answers above) and what it most needs to cover. They have not built a plan in the Plan Builder yet: recommend they do.`}`);
  sections.push(`## Gap-to-Target Analysis
For each of the three weakest blocks listed above${full ? " — reference what the founder said about their current state, future state, and goal/timeline directly, and where relevant connect it to a cited market data point from your research. Cite each source inline as (Source: <title>)." : ", one short paragraph: why it is holding the venture back and what good looks like."}`);
  if (full) {
    sections.push(`## Market Insight
A short brief for this founder's industry and country: current trends, typical customer segments, how competition usually works, the main opportunities and risks, and what lenders and investors in this market tend to look for. Use your research; cite sources inline as (Source: <title>). End with one line in italics: "AI-generated and directional: check key figures before relying on them."`);
    sections.push(`## Growth Scenarios
Three growth scenarios (base, target, stretch), each with concrete actions, capability/capital gaps, and a timeframe that fits the plan length below.`);
  }
  sections.push(`## Growth and Readiness Plan
A plan covering ${options.planLength}. Start with "### First 90 days": specific actions month by month (Month 1, Month 2, Month 3), each with a clear deliverable. ${planPhasing(options.planLength)} Use "### Months 4-6" style sub-headings for each later phase, with 2-4 milestones each. Tie the plan to the founder's main goal.`);
  sections.push(`## Recommended Next Steps
A prioritized list of 3-5 bullets (most important first). Each bullet must be a single, concrete action this founder can start now. This exact section is shown on its own elsewhere in the product, so keep every bullet self-contained (don't write "as above").`);
  if (options.tierRecommendation) {
    sections.push(`## Recommended Membership
Recommend ONE Founder Trajectory membership tier and explain why in 3-4 sentences, using this founder's gaps, goals, stage and funding plans:
- Essentials ($15/month): full assessment, AI insights, growth and readiness plan, dashboard and tools. Best for founders who will work the plan themselves.
- Growth ($39/month, billed quarterly): adds valuation, market insight, advisor review, AI coaching (coming soon) and 2 one-on-one coaching sessions a quarter. Best for founders actively executing who want regular coaching.
- Elevate ($149/month, billed quarterly): adds 2 one-on-one sessions a month, pitch and investor readiness review and priority support. Best for founders preparing to raise, scale fast or win large contracts.
Be honest: recommend Essentials when that is what fits.`);
  }

  return `You are drafting a ${full ? "full" : "summary"} Readiness Report for a founder on Founder Trajectory(TM), powered by RENZOLO OS(TM).

Founder: ${input.founderName}
Company: ${orUnspecified(input.extra?.companyName ?? "")}
Venture stage: ${orUnspecified(input.ventureStage)}
Industry: ${orUnspecified(input.industry)}
Business type: ${orUnspecified(input.businessType)}
Location: ${orUnspecified(input.geography)}
Years in business: ${orUnspecified(input.yearsInBusiness)}
Team size: ${orUnspecified(input.employeeCount)}
Annual revenue: ${orUnspecified(input.annualRevenue)}
When they want to reach their goal: ${orUnspecified(input.timeHorizon)}
Main goal: ${orUnspecified(input.extra?.primaryGoal)}
Biggest challenges right now: ${orUnspecified(input.extra?.challenges?.join(", "))}
Funding plans for the next 12 months: ${orUnspecified(input.extra?.fundingNeed)}
Registration and tax status: ${orUnspecified(input.extra?.registration)}

Strategic plan${typeof input.extra?.planScore === "number" ? ` (Strategic Plan Readiness ${input.extra.planScore}/100)` : ""}:
${planLines}

Venture Score: ${input.diagnostic.ventureScore.score}/100 (${input.diagnostic.ventureScore.tier})
${full ? `Market Readiness: ${input.diagnostic.subScores.market}/100
Customer Readiness: ${input.diagnostic.subScores.customer}/100
Investor Readiness: ${input.diagnostic.subScores.investor}/100
` : ""}Health Index: ${input.diagnostic.healthIndex.index}/100 (confidence: ${input.diagnostic.healthIndex.confidence})

Weakest blocks (gap-to-target priorities), with what the founder said about each:
${gapDetail}
${otherAreas ? `\nOther business areas the founder described in the full assessment:\n${otherAreas}\n` : ""}${input.planText ? `\nTHE FOUNDER'S STRATEGIC PLAN (from the Plan Builder):\n${input.planText}\n` : ""}${input.planReviewText ? `\nLatest AI review of that plan:\n${input.planReviewText}\n` : ""}${input.marketHighlights ? `\nFrom the founder's latest Market Intelligence brief:\n${input.marketHighlights}\n` : ""}
Before writing, use web search to find ${full ? "2-4" : "1-2"} current, real, relevant data points for THIS founder specifically,
based on their industry, business type, location, size and years in business. Only cite what you actually find; do not invent statistics.

Write in plain language a founder can act on, using these EXACT section headings, in this order, so the report can be
parsed by other parts of the product:

${sections.join("\n\n")}

Make the plan and the Recommended Next Steps serve the founder's stated main goal and address their stated biggest
challenges where the evidence supports it. Keep it direct and specific to this founder's stage, industry, business type,
location and size — avoid generic advice that could apply to anyone.${full ? "" : " Keep the whole report concise."}`;
}

export interface WebSource {
  title: string;
  url: string;
}

/** One request to the AI, optionally with live web search. Returns the
 * text and the web pages the search actually read (deduplicated). */
export async function askClaude(prompt: string, opts: { maxTokens: number; webSearches?: number }): Promise<{ text: string; sources: WebSource[] }> {
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: opts.maxTokens,
    ...(opts.webSearches ? { tools: [{ type: "web_search_20250305", name: "web_search", max_uses: opts.webSearches } as any] } : {}),
    messages: [{ role: "user", content: prompt }],
  });
  const text = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("");
  return { text, sources: extractWebSources(response.content as any[]) };
}

/** The pages a web search returned, from the response's tool results. */
export function extractWebSources(content: any[]): WebSource[] {
  const seen = new Map<string, WebSource>();
  for (const block of content ?? []) {
    if (block?.type !== "web_search_tool_result" || !Array.isArray(block.content)) continue;
    for (const r of block.content) {
      if (r?.type !== "web_search_result" || typeof r.url !== "string" || !/^https?:\/\//.test(r.url)) continue;
      if (!seen.has(r.url)) seen.set(r.url, { title: String(r.title ?? r.url).slice(0, 200), url: r.url });
    }
  }
  return [...seen.values()].slice(0, 20);
}

/** Generates the Readiness Report from a scored assessment. This is
 * AI-drafted content: it can be queued for advisor QA review (see
 * app/api/report/route.ts), but that review never gates delivery.
 *
 * Uses Anthropic's server-side web_search tool so market language is
 * grounded in current data for this founder. Each search is billed
 * (~$10 per 1,000); max_uses caps it per report. */
export async function generateDiagnosticReport(input: ReportInput, options: ReportOptions = { level: "full", planLength: "12 months", tierRecommendation: false }): Promise<string> {
  const prompt = buildReportPrompt(input, options);
  const full = options.level === "full";
  const response = await getClient().messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: full ? 4500 : 2500,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: full ? 4 : 2,
      } as any,
    ],
    messages: [{ role: "user", content: prompt }],
  });

  // With web_search enabled, the response can interleave server_tool_use /
  // web_search_tool_result blocks between multiple text blocks — collect
  // and join all of them rather than assuming a single text block.
  const text = response.content
    .filter((b: any) => b.type === "text")
    .map((b: any) => b.text)
    .join("\n\n");
  if (!text.trim()) throw new Error("The report came back empty.");
  return text;
}
