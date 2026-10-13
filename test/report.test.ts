import { buildReportPrompt, planPhasing } from "../lib/anthropic";
import { extractNextSteps } from "../lib/recommendations";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

const input: any = {
  founderName: "Ama",
  ventureStage: "Acquire: winning first and repeat customers",
  industry: "Agriculture and food production",
  geography: "Kenya",
  timeHorizon: "12 months",
  businessType: "Cooperative",
  employeeCount: "2-5 employees",
  yearsInBusiness: "1-3 years",
  annualRevenue: "$10k-$50k",
  extra: { primaryGoal: "Grow revenue", challenges: ["Cash flow"], companyName: "Owusu Farms", planScore: 30, plan: { planExists: 1, planGoals: 0, planFinancials: 0, planReview: 0 }, planCoverage: ["channels"] },
  diagnostic: { ventureScore: { score: 45, tier: "Early Stage" }, subScores: { market: 40, customer: 50, investor: 30 }, healthIndex: { index: 45, confidence: "Low", evidenceCompleteness: 0 }, blockScores: {}, gaps: [{ block: "channels", label: "Channels", score: 20, weakestMeasure: "evidence" }] },
  blockNarratives: {},
};

const summary = buildReportPrompt(input, { level: "summary", planLength: "6 months", tierRecommendation: false });
const full = buildReportPrompt(input, { level: "full", planLength: "36 months", tierRecommendation: true });
assert(!summary.includes("## Market Insight") && !summary.includes("## Growth Scenarios") && !summary.includes("Investor Readiness:"), "Essentials summary: no market insight, scenarios or readiness scores");
assert(full.includes("## Market Insight") && full.includes("directional") && full.includes("Investor Readiness: 30/100"), "full report: market insight (labelled directional) and readiness scores");
for (const p of [summary, full]) {
  assert(p.includes("## Growth and Readiness Plan") && p.includes("### First 90 days") && p.includes("## Recommended Next Steps"), "both levels: plan with a detailed first 90 days and the Recommended Next Steps section the product parses");
}
assert(full.includes("## Recommended Membership") && full.includes("$39/month") && !summary.includes("## Recommended Membership"), "tier recommendation only when asked for (the one-time assessment)");
assert(full.includes("covering 36 months") && summary.includes("covering 6 months"), "the plan length the founder chose is used");
assert(full.includes("Owusu Farms") && full.includes("Strategic Plan Readiness 30/100") && full.includes("Written but out of date") === false && full.includes("mostly in the founder's head"), "company and strategic plan answers reach the prompt");
assert(planPhasing("90 days").includes("whole plan"), "90-day plan: all detail");
assert(planPhasing("12 months").includes("quarterly"), "12-month plan: quarterly milestones after 90 days");
assert(planPhasing("36 months").includes("6-month milestones up to month 36"), "36-month plan: quarterly to month 12, then 6-month milestones");
assert(extractNextSteps("## Growth and Readiness Plan\n### First 90 days\n- Month 1 thing\n## Recommended Next Steps\n- Do A\n- Do B\n## Recommended Membership\nGrowth") .join("|") === "Do A|Do B", "next steps are still parsed with the new sections around them");
console.log("\nAll report prompt tests completed.");
