import Anthropic from "@anthropic-ai/sdk";
import type { DiagnosticResult } from "./scoring";
import { BLOCK_PROMPTS } from "./blocks";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export interface ReportInput {
  founderName: string;
  ventureStage: string;
  industry: string;
  diagnostic: DiagnosticResult;
  blockNarratives: Record<string, { currentState: string; futureState: string; goalTarget: string }>;
}

/** Generates the Venture Diagnostic Report + 90-day plan from a scored
 * assessment. This is AI-drafted content — per the Phase 1 spec it goes
 * through advisor review (Keep Manual) before a paid-tier founder sees it,
 * so the caller is responsible for setting reports.advisor_reviewed and
 * the 24–36 hour review SLA, not this function. */
export async function generateDiagnosticReport(input: ReportInput): Promise<string> {
  const gapSummary = input.diagnostic.gaps
    .map((g) => `- ${g.label}: score ${g.score}/100, weakest measure: ${g.weakestMeasure}`)
    .join("\n");

  const prompt = `You are drafting a Venture Diagnostic Report for a founder using the RENZOLO OS Founder BMC Readiness Assessment.

Founder: ${input.founderName}
Venture stage: ${input.ventureStage}
Industry: ${input.industry}

Venture Score: ${input.diagnostic.ventureScore.score}/100 (${input.diagnostic.ventureScore.tier})
Market Readiness: ${input.diagnostic.subScores.market}/100
Customer Readiness: ${input.diagnostic.subScores.customer}/100
Investor Readiness: ${input.diagnostic.subScores.investor}/100
Health Index: ${input.diagnostic.healthIndex.index}/100 (confidence: ${input.diagnostic.healthIndex.confidence})

Weakest blocks (gap-to-target priorities):
${gapSummary}

Write, in plain language a founder can act on:
1. A short overall assessment (2-3 sentences).
2. Gap-to-target analysis for each of the three weakest blocks listed above, referencing what the founder said about their current state vs. future state where relevant.
3. Three growth scenarios (base, target, stretch), each with concrete actions, capability/capital gaps, and rough timeframe.
4. A prioritized 90-day action plan (bullet list, most important first).

Keep it direct and specific to this founder's stage and industry — avoid generic startup advice.`;

  const response = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 2000,
    messages: [{ role: "user", content: prompt }],
  });

  const text = response.content.find((b) => b.type === "text");
  return text && text.type === "text" ? text.text : "";
}
