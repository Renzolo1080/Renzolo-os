import { sanitizePlan, planFromAssessment, planChecks, planCompleteness, readyForReview, actionStats, planAsText, parseAmount, addNewAssessmentAreas, emptyPlan } from "../lib/plan";
import { parsePlanReview, reviewAllowed, buildPlanReviewPrompt, REVIEW_CRITERIA } from "../lib/plan-review";
import { briefRefresh, buildMarketPrompt, cleanBrief, parseInsights, briefLooksComplete, MARKET_SECTIONS } from "../lib/market";
import { normalizeExtras, validExtras, unlocked, setFor, STARTER_SETS, MIN_EXTRAS, MAX_EXTRAS } from "../lib/dashboard";
import { goalProgress, kpis, runwayMonths, periodOf, formatAmount } from "../lib/progress";
import { levelFor, areasWeakestFirst, MEASURE_CHOICES } from "../lib/blocks";
import { entitlements } from "../lib/membership";
import { extractWebSources, buildReportPrompt } from "../lib/anthropic";

let fails = 0;
function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    fails++;
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

// ---------------- Plan ----------------
const dirty = sanitizePlan({
  starting: { existingPlan: "outdated", lastUpdated: "over2y", whatChanged: "x".repeat(5000) },
  vision: { current: "  Today  ", desired: "Later", horizon: "99 years" },
  goals: [
    { id: "g1", title: "Revenue", measure: "Monthly revenue", unit: "$", baseline: "$5,000", target: "25k", start: "2026-10-01", date: "2027-06-30" },
    { id: "bad id!", title: "Two", baseline: "abc", target: 3, date: "not-a-date" },
    {},
    { title: "fourth" },
  ],
  areas: { channels: { current: "WhatsApp", desired: "Distributors", actions: [{ id: "a1", text: "Sign 2 distributors", owner: "Ama", due: "2026-11-30", status: "weird" }, { text: "" }] }, hacked: { current: "x" } },
  resources: { fundingNeed: "10to50k", fundingSources: ["Grant or competition", "Crypto"], revenueNow: "5k", revenueTarget: "25k" },
  risks: [{ risk: "Late payment", likelihood: "extreme", mitigation: "Deposits" }],
  role: "admin",
});
assert(dirty.starting.whatChanged.length === 1500, "plan text is capped");
assert(dirty.vision.current === "Today" && dirty.vision.horizon === "12 months", "text trimmed; unknown plan length falls back to 12 months");
assert(dirty.goals.length === 3, "at most 3 goals");
assert(dirty.goals[0].baseline === 5000 && dirty.goals[0].target === 25000 && dirty.goals[0].unit === "$", "goal numbers parsed from $5,000 and 25k");
assert(dirty.goals[1].id === "i1" && dirty.goals[1].baseline === null && dirty.goals[1].date === "", "bad ids, numbers and dates are dropped");
assert(!("hacked" in dirty.areas) && dirty.areas.channels!.actions.length === 1 && dirty.areas.channels!.actions[0].status === "not_started", "unknown areas and empty actions dropped; bad status defaults");
assert(dirty.resources.fundingSources.length === 1 && dirty.risks[0].likelihood === "medium", "unknown funding sources dropped; bad likelihood defaults");
assert(!("role" in (dirty as any)), "unknown top-level fields dropped");
assert(parseAmount("12.5k") === 12500 && parseAmount("1.2m") === 1200000 && parseAmount("40%") === 40 && parseAmount("ten") === null, "amounts parse");

const starter = planFromAssessment({
  planLength: "18 months",
  primaryGoal: "Win a supermarket contract",
  gapKeys: ["channels", "revenueStreams", "keyPartnerships"],
  blocks: [
    { block_key: "channels", current_state: "Sell by WhatsApp", future_state: "Three distributors", goal_target: "2 distributors signed", target_date: "2026-12-31" },
    { block_key: "customerSegments", current_state: "Households", future_state: "Retailers", goal_target: null, target_date: null },
  ],
});
assert(starter.vision.horizon === "18 months" && starter.goals[0].title === "Win a supermarket contract", "starter plan uses plan length and main goal");
assert(!!starter.areas.channels && starter.areas.channels.current === "Sell by WhatsApp" && starter.areas.channels.actions[0].text === "2 distributors signed", "starter areas pre-filled from the assessment, goal becomes an action");
assert(!!starter.areas.revenueStreams && !!starter.areas.customerSegments, "weakest areas and described areas are included");
const added = addNewAssessmentAreas(starter, [{ block_key: "costStructure", current_state: "High delivery cost", future_state: "" }, { block_key: "channels", current_state: "changed", future_state: "" }]);
assert(added.length === 1 && added[0] === "costStructure" && starter.areas.channels!.current === "Sell by WhatsApp", "newly described areas are added without overwriting the plan");

const gaps = ["channels", "revenueStreams", "keyPartnerships"];
const empty = emptyPlan();
assert(planCompleteness(empty, gaps) === 0, "empty plan is 0% complete");
assert(!readyForReview(empty, gaps).ready && readyForReview(empty, gaps).missing.length === 4, "empty plan can't be reviewed; four things missing");
const full = sanitizePlan({
  starting: { existingPlan: "outdated", lastUpdated: "1to2y", whatChanged: "Lost our biggest customer and added a new product line" },
  vision: { current: "40 customers in Nairobi, $5k a month", desired: "3 supermarket chains, $25k a month", horizon: "12 months" },
  goals: [{ id: "g1", title: "Revenue", measure: "Monthly revenue", unit: "$", baseline: 5000, target: 25000, start: "2026-10-01", date: "2027-09-30" }],
  areas: Object.fromEntries(gaps.map((k) => [k, { current: "now", desired: "then", actions: [{ id: `a${k}`, text: "Do it", owner: "Ama", due: "2026-12-01", status: "in_progress" }] }])),
  resources: { revenueNow: "$5k", revenueTarget: "$25k", fundingNeed: "10to50k", fundingSources: ["Grant or competition"] },
  risks: [{ risk: "Late payment", likelihood: "high", mitigation: "Deposits" }],
});
assert(planCompleteness(full, gaps) === 100, "complete plan is 100%", planChecks(full, gaps).filter((c) => !c.done));
assert(planChecks(full, gaps).some((c) => c.key === "changed"), "an out-of-date plan must say what has changed");
assert(readyForReview(full, gaps).ready, "complete plan can be reviewed");
const stats = actionStats(full, "2026-12-15");
assert(stats.total === 3 && stats.overdue === 3 && stats.inProgress === 3 && stats.next.length === 3, "action stats: overdue and next up");
const text = planAsText(full);
assert(text.includes("$5,000") && text.includes("$25,000") && text.includes("Channels: today: now") && text.includes("owner: Ama"), "plan as text for the AI");

// ---------------- Plan review ----------------
const goodReview = `Here you go:\n\`\`\`json\n${JSON.stringify({
  overall: 64,
  verdict: "A solid start that needs measurable channel targets.",
  criteria: REVIEW_CRITERIA.map((c, i) => ({ key: c.key, score: 50 + i * 5, comment: "ok" })),
  strengths: ["Clear vision"],
  fixes: [{ area: "Channels", issue: "No target", fix: "Add 2 distributors by March" }, { area: "", issue: "", fix: "" }],
  questions: ["Who owns sales?"],
})}\n\`\`\``;
const parsed = parsePlanReview(goodReview);
assert(!!parsed && parsed.overall === 64 && parsed.criteria.length === 6 && parsed.fixes.length === 1, "review parsed from fenced JSON; empty fixes dropped");
assert(parsePlanReview("no json here") === null && parsePlanReview('{"overall":50}') === null, "unusable reviews rejected (founder isn't charged)");
const over = parsePlanReview(JSON.stringify({ overall: 400, verdict: "x", criteria: REVIEW_CRITERIA.map((c) => ({ key: c.key, score: -5 })) }));
assert(!!over && over.overall === 100 && over.criteria.every((c) => c.score === 0), "review scores clamped to 0-100");
const now = new Date("2026-10-13T12:00:00Z");
assert(reviewAllowed([], now).ok, "first review allowed");
assert(!reviewAllowed([{ created_at: "2026-10-13T01:00:00Z" }], now).ok, "one review a day");
assert(!reviewAllowed(["2026-10-01", "2026-10-03", "2026-10-05", "2026-10-07"].map((d) => ({ created_at: `${d}T00:00:00Z` })), now).ok, "four reviews in 30 days");
const reviewPrompt = buildPlanReviewPrompt({ companyName: "Owusu Farms", stage: "Acquire", industry: "Agriculture", country: "Kenya", ventureScore: 45, gaps: [{ label: "Channels", score: 20 }], blockScores: [], planText: text, assessmentAgeDays: 3 });
assert(reviewPrompt.includes("older plan") && reviewPrompt.includes('"currency"') && reviewPrompt.includes("Owusu Farms"), "review prompt checks for stale plans, against the assessment");

// ---------------- Market ----------------
const day = (d: string) => new Date(`${d}T12:00:00Z`);
const kenya = { industry: "Agriculture", country: "Kenya" };
assert(briefRefresh([], kenya, now).allowed, "first brief allowed");
assert(!briefRefresh([{ created_at: "2026-10-01T00:00:00Z", ...kenya }], kenya, now).allowed, "monthly: not again within 30 days");
assert(briefRefresh([{ created_at: "2026-09-01T00:00:00Z", ...kenya }], kenya, now).allowed, "allowed after 30 days");
assert(briefRefresh([{ created_at: "2026-10-01T00:00:00Z", ...kenya }], { industry: "Retail", country: "Kenya" }, now).allowed, "allowed straight away when industry changes");
assert(
  !briefRefresh(["2026-10-01", "2026-10-05", "2026-10-09"].map((d) => ({ created_at: `${d}T00:00:00Z`, industry: d, country: "x" })), kenya, day("2026-10-13")).allowed,
  "never more than 3 briefs in 30 days"
);
const mp = buildMarketPrompt({ companyName: "Owusu", ...kenya, stage: "Acquire", businessType: "", revenue: "", primaryGoal: "Grow", customers: "", offer: "", fundingNeed: "", planText: text, goals: [{ id: "g1", title: "Revenue" }], areas: [{ key: "channels", label: "Channels" }] }, "2026-10-13");
assert(mp.includes("THE FOUNDER'S STRATEGIC PLAN") && mp.includes("## Recommendations for Your Plan") && mp.includes("## Target Reality Check") && mp.includes("g1 = Revenue"), "market prompt is built around the plan");
const mpNoPlan = buildMarketPrompt({ companyName: "", ...kenya, stage: "", businessType: "", revenue: "", primaryGoal: "", customers: "", offer: "", fundingNeed: "", planText: null, goals: [], areas: [] }, "2026-10-13");
assert(mpNoPlan.includes("has not built their strategic plan"), "market prompt without a plan");
const raw = `Sure!\n${MARKET_SECTIONS.map((s) => `## ${s}\ntext`).join("\n")}\n\`\`\`json\n{"recommendations":[{"area":"channels","goalId":"g1","action":"Approach Naivas","why":"Fastest-growing chain"},{"area":"moon","goalId":"zz","action":"Hack","why":""},{"area":"general","action":""}],"targets":[{"goalId":"g1","verdict":"stretch","comment":"Fast"},{"goalId":"g9","verdict":"realistic"},{"goalId":"g1","verdict":"maybe"}]}\n\`\`\``;
const clean = cleanBrief(raw);
assert(clean.startsWith("## Market Snapshot") && !clean.includes("```") && briefLooksComplete(clean), "brief cleaned: no preamble, no JSON");
assert(!briefLooksComplete("## Market Snapshot\nonly"), "an incomplete brief is rejected");
const ins = parseInsights(raw, { areas: ["channels"], goals: ["g1"] });
assert(ins.recommendations.length === 2 && ins.recommendations[1].area === "general" && ins.recommendations[1].goalId === "", "insights: unknown areas become general, empty actions dropped");
assert(ins.targets.length === 1 && ins.targets[0].verdict === "stretch", "insights: only known goals and verdicts");
assert(parseInsights("no json", { areas: [], goals: [] }).recommendations.length === 0, "no insights without JSON");
const srcs = extractWebSources([
  { type: "text", text: "x" },
  { type: "web_search_tool_result", content: [{ type: "web_search_result", url: "https://a.org", title: "A" }, { type: "web_search_result", url: "https://a.org", title: "A again" }, { type: "web_search_result", url: "javascript:alert(1)", title: "bad" }] },
]);
assert(srcs.length === 1 && srcs[0].url === "https://a.org", "web sources deduplicated, only http(s)");

// ---------------- Dashboard ----------------
assert(JSON.stringify(normalizeExtras(["reminders", "valuation", "goalsProgress", "progressOverview"])) === JSON.stringify(["valuation", "goalCharts", "recommendations"]), "old dashboard settings carried across");
assert(normalizeExtras(null).length === MIN_EXTRAS && normalizeExtras(["areas", "areas", "x"]).length === MIN_EXTRAS, "tops up to at least 3 views");
assert(normalizeExtras(["areas", "gaps", "history", "health", "risks", "market", "coaching"]).length === MAX_EXTRAS, "never more than 5 views");
assert(validExtras(["areas", "gaps"]) === null && validExtras(["areas", "gaps", "gaps"]) === null && validExtras(["areas", "gaps", "nope"]) === null, "saving needs 3-5 different known views");
assert(validExtras(["areas", "gaps", "history"])?.length === 3, "a valid choice saves");
assert(!unlocked("valuation", { member: true, growth: false }) && unlocked("valuation", { member: true, growth: true }) && unlocked("areas", { member: false, growth: false }), "Growth views locked for Essentials");
assert(STARTER_SETS.every((s) => s.extras.length >= MIN_EXTRAS && s.extras.length <= MAX_EXTRAS && validExtras(s.extras)), "starter sets are valid choices");
assert(setFor(STARTER_SETS[0].extras) === STARTER_SETS[0].key && setFor(["areas", "gaps", "history"]) === "custom", "starter set recognised");

// ---------------- Progress ----------------
const goal = { id: "g1", title: "Revenue", measure: "Monthly revenue", unit: "$", baseline: 5000, target: 25000, start: "2026-01-01", date: "2026-12-31" };
const mid = "2026-07-01"; // about half way
assert(goalProgress(goal, [], mid).status === "no_data", "no check-in yet");
assert(goalProgress(goal, [{ goal_id: "g1", value: 15000, checked_on: "2026-06-30" }], mid).status === "on_track", "half way on time: on track");
assert(goalProgress(goal, [{ goal_id: "g1", value: 11000, checked_on: "2026-06-30" }], mid).status === "at_risk", "30% at half way: at risk");
assert(goalProgress(goal, [{ goal_id: "g1", value: 6000, checked_on: "2026-06-30" }], mid).status === "behind", "5% at half way: behind");
assert(goalProgress(goal, [{ goal_id: "g1", value: 26000, checked_on: "2026-06-30" }], mid).status === "achieved", "past target: achieved");
assert(goalProgress(goal, [{ goal_id: "g1", value: 20000, checked_on: "2026-12-01" }], "2027-01-05").status === "overdue", "past due and short: overdue");
const down = { ...goal, measure: "Cost per delivery", baseline: 10, target: 6 };
const dp = goalProgress(down, [{ goal_id: "g1", value: 8, checked_on: "2026-06-30" }], mid);
assert(dp.percent === 50 && dp.status === "on_track", "goals that go down work too");
assert(goalProgress({ ...goal, target: null }, [], mid).status === "not_set", "no target: needs a target");
const ups = [
  { period: "2026-08-01", revenue: 4000, customers: 30, cash: 9000 },
  { period: "2026-09-01", revenue: 5000, customers: 35, cash: 7000 },
  { period: "2026-10-01", revenue: null, customers: 40, cash: 5000 },
];
const k = kpis(ups);
assert(k[0].latest === 5000 && k[0].change === 25 && k[1].latest === 40 && k[2].series.length === 3, "key numbers: latest, change and trend", k);
assert(runwayMonths(ups) === 2.5, "runway from falling cash", runwayMonths(ups));
assert(runwayMonths([{ period: "2026-09-01", revenue: 1, customers: 1, cash: 100 }, { period: "2026-10-01", revenue: 1, customers: 1, cash: 200 }]) === null, "no runway figure when cash is growing");
assert(periodOf("2026-10-13") === "2026-10-01" && formatAmount(25000, "$") === "$25k" && formatAmount(1500000, "$") === "$1.5m" && formatAmount(null) === "–", "periods and amounts format");

// ---------------- Assessment helpers and access ----------------
assert(levelFor(15) === 0 && levelFor(90) === 3 && levelFor(50) === 1 && levelFor(null) === null, "stored scores map back to answers");
assert(areasWeakestFirst({ channels: 20, revenueStreams: 10 })[0] === "revenueStreams", "areas ordered weakest first");
assert(MEASURE_CHOICES.length === 6 && MEASURE_CHOICES.every((m) => m.options.length === 4), "six multiple-choice measures, four answers each");
const ess = entitlements("essentials");
const grow = entitlements("growth");
const buyer = entitlements(null, true);
const none = entitlements(null);
assert(ess.planBuilder && !ess.planReview && !ess.marketIntel, "Essentials: Plan Builder, no AI review or market intel");
assert(grow.planBuilder && grow.planReview && grow.marketIntel, "Growth: all three");
assert(buyer.planBuilder && buyer.planReview && buyer.marketIntel, "one-time assessment: all three");
assert(!none.planBuilder && !none.planReview && !none.marketIntel, "no access without membership or purchase");

// ---------------- Report uses the plan ----------------
const reportInput: any = {
  founderName: "Ama", ventureStage: "Acquire", industry: "Agriculture", geography: "Kenya", timeHorizon: "12 months", businessType: "", employeeCount: "", yearsInBusiness: "", annualRevenue: "",
  extra: {},
  diagnostic: { ventureScore: { score: 45, tier: "Early Stage" }, subScores: { market: 40, customer: 50, investor: 30 }, healthIndex: { index: 45, confidence: "Low", evidenceCompleteness: 0 }, blockScores: { channels: 20, customerSegments: 60 }, gaps: [{ block: "channels", label: "Channels", score: 20, weakestMeasure: "evidence" }] },
  blockNarratives: { channels: { currentState: "WhatsApp", futureState: "Distributors", goalTarget: "" }, customerSegments: { currentState: "Households", futureState: "Retailers", goalTarget: "" } },
  planText: text,
  planReviewText: "Plan review score: 64/100.",
  marketHighlights: "- Approach Naivas (fast-growing)",
};
const rp = buildReportPrompt(reportInput, { level: "full", planLength: "12 months", tierRecommendation: false });
assert(rp.includes("THE FOUNDER'S STRATEGIC PLAN") && rp.includes("Plan review score: 64/100") && rp.includes("Approach Naivas"), "report uses the plan, its review and market recommendations");
assert(rp.includes("Other business areas") && rp.includes("Customer Segments (score 60/100)"), "report covers every described area, not just the weakest three");
assert(rp.includes("Build the Growth and Readiness Plan below on THEIR plan"), "report builds on the founder's own plan");
const rpNoPlan = buildReportPrompt({ ...reportInput, planText: null, planReviewText: null, marketHighlights: null }, { level: "summary", planLength: "6 months", tierRecommendation: false });
assert(rpNoPlan.includes("have not built a plan in the Plan Builder") && !rpNoPlan.includes("THE FOUNDER'S STRATEGIC PLAN"), "report without a plan recommends building one");

console.log(fails ? `\n${fails} FAILED` : "\nAll plan, review, market, dashboard and progress tests passed.");
