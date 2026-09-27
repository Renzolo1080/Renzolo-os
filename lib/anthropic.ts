import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosticResult } from "./scoring";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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
  diagnostic: DiagnosticResult;
  blockNarratives: Record<string, { currentState: string; futureState: string; goalTarget: string }>;
}

const orUnspecified = (v: string | null | undefined) => (v && v.trim() ? v : "not specified");

/** Generates the Venture Diagnostic Report + 90-day plan from a scored
 * assessment. This is AI-drafted content — per the Phase 1 spec it can
 * be queued for advisor QA review (see app/api/report/route.ts for the
 * requiresReview logic and app_settings.qa_review_enabled), but that
 * review happens in the background and never gates this function's
 * output from reaching the founder.
 *
 * Uses Anthropic's server-side web_search tool so the report can ground
 * its market-comparison language in real, current data for this
 * founder's specific industry, business type, location, and stage,
 * rather than relying only on the model's training data. Each search is
 * billed separately by Anthropic (~$10 per 1,000 searches, on top of
 * normal token costs) — worth watching as report volume grows; max_uses
 * below caps it per report. */
export async function generateDiagnosticReport(input: ReportInput): Promise<string> {
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

  const prompt = `You are drafting a Venture Diagnostic Report for a founder using the RENZOLO OS Founder BMC Readiness Assessment.

Founder: ${input.founderName}
Venture stage: ${orUnspecified(input.ventureStage)}
Industry: ${orUnspecified(input.industry)}
Business type: ${orUnspecified(input.businessType)}
Location: ${orUnspecified(input.geography)}
Years in business: ${orUnspecified(input.yearsInBusiness)}
Team size: ${orUnspecified(input.employeeCount)}
Annual revenue: ${orUnspecified(input.annualRevenue)}
Target time horizon for goals: ${orUnspecified(input.timeHorizon)}

Venture Score: ${input.diagnostic.ventureScore.score}/100 (${input.diagnostic.ventureScore.tier})
Market Readiness: ${input.diagnostic.subScores.market}/100
Customer Readiness: ${input.diagnostic.subScores.customer}/100
Investor Readiness: ${input.diagnostic.subScores.investor}/100
Health Index: ${input.diagnostic.healthIndex.index}/100 (confidence: ${input.diagnostic.healthIndex.confidence})

Weakest blocks (gap-to-target priorities), with what the founder said about each:
${gapDetail}

Before writing, use web search to find 2-4 current, real, relevant data points for THIS founder specifically —
based on their industry, business type, location, size, and years in business — such as typical CAC/LTV or
margin benchmarks, comparable market size or growth rates in their region, or how similar-stage ventures in
their industry are typically funded or priced. Only cite what you actually find; do not invent statistics.

Write, in plain language a founder can act on, using these EXACT section headings so the report can be
parsed by other parts of the product:
## Overall Assessment
A short overall assessment (2-3 sentences).

## Gap-to-Target Analysis
For each of the three weakest blocks listed above — reference what the founder said about their current
state, future state, and goal/timeline directly, and where relevant connect it to a cited market data point
from your research so the target feels grounded in this founder's actual market, not generic advice. Cite
each source inline as (Source: <title>).

## Growth Scenarios
Three growth scenarios (base, target, stretch), each with concrete actions, capability/capital gaps, and a
timeframe consistent with the founder's stated time horizon.

## Recommended Next Steps
A prioritized action plan for that time horizon, as a bullet list (most important first), 3-5 items. Each
bullet must be a single, concrete, specific action this founder can start now — this exact section is shown
to the founder as a standalone Recommendations list elsewhere in the product, so keep every bullet
self-contained (don't write "as above" or refer back to other sections).

Keep it direct and specific to this founder's stage, industry, business type, location, and size — avoid
generic startup advice that could apply to anyone.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 3000,
    tools: [
      {
        type: "web_search_20250305",
        name: "web_search",
        max_uses: 4,
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
  return text;
}
