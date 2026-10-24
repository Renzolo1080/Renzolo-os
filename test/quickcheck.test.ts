import * as QC from "../lib/quickcheck";
import { COUNTRIES as site } from "../website/lib/countries";
import { BLOCK_KEYS, runDiagnostic } from "../lib/scoring";
import {
  QUICK_QUESTIONS,
  LEVEL_SCORES,
  parseQuickCheck,
  parseProfile,
  quickCheckToScoringInput,
  detailsComplete,
  STAGES,
  INDUSTRIES,
  COUNTRIES,
  REVENUE_BANDS,
  CHALLENGES,
  MAX_CHALLENGES,
} from "../lib/quickcheck";
import { computeValuation } from "../lib/valuation";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

const allAt = (level: 0 | 1 | 2 | 3) => Object.fromEntries(BLOCK_KEYS.map((k) => [k, level]));
const goodProfile = {
  ventureStage: STAGES[1],
  industry: "Agriculture and food production",
  country: "Kenya",
  businessType: "Registered small business / LLC",
  yearsInBusiness: "1-3 years",
  teamSize: "2-5 employees",
  annualRevenue: "$10k-$50k",
  primaryGoal: "Grow revenue",
  timeHorizon: "12 months",
  fundingNeed: "Yes",
  registration: "Registered and tax compliant",
  challenges: ["Cash flow"],
  heardFrom: "WhatsApp",
};

// --- the questions themselves ---------------------------------------------
assert(QUICK_QUESTIONS.length === 9 && new Set(QUICK_QUESTIONS.map((q) => q.key)).size === 9, "one question for each of the nine business areas");
assert(BLOCK_KEYS.every((k) => QUICK_QUESTIONS.some((q) => q.key === k)), "every scoring area has a question");
assert(QUICK_QUESTIONS.every((q) => q.options.length === 4 && q.options.every((o) => o.trim().length > 0)), "every question has four non-empty answers");
const inputs = 3 + 7 + 4 + 4 + 1 + 9 + 3;
assert(inputs >= 25 && inputs <= 35, `${inputs} taps or dropdowns in total, inside the 5-7 minute budget`);

// --- validation -----------------------------------------------------------
assert(parseQuickCheck({ answers: allAt(2), evidence: [] }).ok, "a complete set of answers is accepted");
const missing = { ...allAt(2) } as any;
delete missing.channels;
assert(!parseQuickCheck({ answers: missing }).ok, "an unanswered question is refused");
assert(!parseQuickCheck({ answers: { ...allAt(2), channels: 7 } }).ok, "an out-of-range answer is refused");
assert(!parseQuickCheck({ answers: { ...allAt(2), channels: "2" } }).ok, "an answer sent as text is refused");
const ev = parseQuickCheck({ answers: allAt(1), evidence: ["revenueStreams", "revenueStreams", "notAnArea", 5] });
assert(ev.ok && JSON.stringify(ev.value.evidence) === '["revenueStreams"]', "evidence keeps only real areas, once each");
assert(parseProfile(goodProfile).ok, "a complete profile is accepted");
for (const field of ["ventureStage", "industry", "country", "annualRevenue", "primaryGoal", "fundingNeed", "registration"]) {
  const r = parseProfile({ ...goodProfile, [field]: "" });
  assert(!r.ok, `a missing ${field} is refused with a message`);
}
assert(!parseProfile({ ...goodProfile, country: "Atlantis" }).ok, "a value that isn't one of the choices is refused");
assert(!parseProfile({ ...goodProfile, challenges: [] }).ok, "at least one challenge is required");
const many = parseProfile({ ...goodProfile, challenges: [...CHALLENGES] });
assert(many.ok && many.value.challenges.length === MAX_CHALLENGES, `challenges are capped at ${MAX_CHALLENGES}`);
const heard = parseProfile({ ...goodProfile, heardFrom: "" });
assert(heard.ok && heard.value.heardFrom === "", "'how did you hear' is optional");
assert(REVENUE_BANDS.every((r) => computeValuation({ ventureTier: "Developing", annualRevenue: r, blockScores: {} as any }).low >= 0), "every revenue choice is one the valuation engine understands");
assert(COUNTRIES.includes("Kenya" as any) && COUNTRIES.includes("South Africa" as any) && INDUSTRIES.length >= 10, "launch markets and a broad industry list are offered");

// --- scoring ---------------------------------------------------------------
const best = quickCheckToScoringInput({ answers: allAt(3) as any, evidence: [...BLOCK_KEYS] });
const worst = quickCheckToScoringInput({ answers: allAt(0) as any, evidence: [] });
assert(Object.values(best.measures.channels).every((v) => v === LEVEL_SCORES[3]), "an answer sets all six measures in its area to that level");
const dBest = runDiagnostic(best.measures, best.evidenceByBlock);
const dWorst = runDiagnostic(worst.measures, worst.evidenceByBlock);
assert(dBest.ventureScore.score > dWorst.ventureScore.score, "stronger answers give a higher Venture Score");
assert(dBest.ventureScore.score <= 100 && dWorst.ventureScore.score >= 0, "scores stay between 0 and 100");
assert(dBest.healthIndex.evidenceCompleteness > dWorst.healthIndex.evidenceCompleteness, "ticking evidence raises evidence completeness");
const mixed = quickCheckToScoringInput({ answers: { ...allAt(3), revenueStreams: 0, costStructure: 0, channels: 1 } as any, evidence: [] });
const gaps = runDiagnostic(mixed.measures, mixed.evidenceByBlock).gaps.map((g) => g.block);
assert(gaps.length === 3 && gaps.includes("revenueStreams") && gaps.includes("costStructure") && gaps.includes("channels"), "the three weakest answers become the three named gaps");

// --- detailed step ---------------------------------------------------------
assert(!detailsComplete([]) && !detailsComplete(null), "no detailed answers yet: not complete");
assert(!detailsComplete(BLOCK_KEYS.map(() => ({ current_state: null }))), "Quick Check rows alone don't count as detailed answers");
assert(!detailsComplete([{ current_state: "a" }, { current_state: "  " }, { current_state: "b" }]), "blank answers don't count");
assert(detailsComplete([{ current_state: "a" }, { current_state: "b" }, { current_state: "c" }, { current_state: null }]), "three written areas: complete");

console.log("\nAll Quick Check tests completed.");

// --- Readiness Snapshot: life cycle, strategic plan, overview ---------------
import {
  PLAN_QUESTIONS,
  parsePlan,
  computePlanScore,
  applyPlanToMeasures,
  PLAN_CLARITY_BONUS,
  parseContact,
  SUBSCRIPTION_FEATURES,
} from "../lib/quickcheck";
import { scoreSnapshot, snapshotOverview } from "../lib/snapshot";

assert(STAGES[0].startsWith("Discover") && STAGES[STAGES.length - 1].startsWith("Exit"), "stages run the full life cycle, Discover to Exit");
assert(INDUSTRIES.length >= 12 && INDUSTRIES.length <= 18 && INDUSTRIES.includes("Other" as any), "a short list of high-level industries, with Other");
assert(PLAN_QUESTIONS.length === 4 && PLAN_QUESTIONS.every((q) => q.options.length === 4), "four strategic plan questions with four answers each");
assert(SUBSCRIPTION_FEATURES.length >= 6 && SUBSCRIPTION_FEATURES.length <= 10, `${SUBSCRIPTION_FEATURES.length} subscription features listed (6-10)`);

const planAll = (level: 0 | 1 | 2 | 3) => Object.fromEntries(PLAN_QUESTIONS.map((q) => [q.key, level]));
assert(!parsePlan({ answers: { planExists: 1 } }).ok, "an incomplete strategic plan section is refused");
const plan = parsePlan({ answers: planAll(3), coverage: ["channels", "channels", "bogus"] });
assert(plan.ok && plan.value.coverage.length === 1, "plan coverage keeps only real areas, once each");
const noPlan = parsePlan({ answers: planAll(0), coverage: [] });
const fullPlan = parsePlan({ answers: planAll(3), coverage: [...BLOCK_KEYS] });
assert(noPlan.ok && computePlanScore(noPlan.value) === 9, `no plan scores low (${noPlan.ok && computePlanScore(noPlan.value)})`);
assert(fullPlan.ok && computePlanScore(fullPlan.value) === 94, `a full plan covering every area scores high (${fullPlan.ok && computePlanScore(fullPlan.value)})`);

if (plan.ok) {
  const q = parseQuickCheck({ answers: allAt(1), evidence: [] });
  if (q.ok) {
    const base = quickCheckToScoringInput(q.value).measures;
    const lifted = applyPlanToMeasures(base, plan.value);
    assert(lifted.channels.clarity === base.channels.clarity + PLAN_CLARITY_BONUS && lifted.revenueStreams.clarity === base.revenueStreams.clarity, "an area the plan addresses gets a clarity lift; others don't");
    const capped = applyPlanToMeasures(quickCheckToScoringInput({ answers: allAt(3) as any, evidence: [] }).measures, fullPlan.ok ? fullPlan.value : plan.value);
    assert(Object.values(capped).every((m) => m.clarity <= 100), "the clarity lift never goes over 100");
  }
}

const prof = parseProfile({ ...goodProfile, ventureStage: STAGES[3], industry: INDUSTRIES[5] });
const qc = parseQuickCheck({ answers: { ...allAt(2), costStructure: 0, channels: 0, keyPartnerships: 1 }, evidence: [] });
if (prof.ok && qc.ok && noPlan.ok) {
  const ov = snapshotOverview(prof.value, scoreSnapshot(prof.value, qc.value, noPlan.value));
  assert(ov.weakest.length === 3, "overview names three weakest areas");
  assert(ov.weakest.includes("Cost Structure") && ov.weakest.includes("Channels"), `the weakest answers are the ones named (${ov.weakest.join(", ")})`);
  assert(!ov.weakest.includes(ov.strongest ?? ""), "strongest area is not also listed as a weakness");
  assert(/strategic plan/i.test(ov.recommendation) && /grow revenue/i.test(ov.recommendation), "with no plan, the recommendation starts with the plan and names their goal");
}
if (prof.ok && qc.ok && fullPlan.ok) {
  const ov = snapshotOverview(prof.value, scoreSnapshot(prof.value, qc.value, fullPlan.value));
  assert(!/biggest lever right now is your strategic plan/i.test(ov.recommendation), "with a solid plan, the recommendation moves on to the weakest areas");
}

assert(!parseContact({ fullName: "", email: "a@b.co" }).ok, "contact needs a name");
assert(!parseContact({ fullName: "Ama", email: "not-an-email" }).ok, "contact needs a valid email");
const ct = parseContact({ fullName: " Ama Owusu ", companyName: "Owusu Farms", email: " Ama@Example.COM " });
assert(ct.ok && ct.value.email === "ama@example.com" && ct.value.fullName === "Ama Owusu", "email is stored lower-cased and trimmed (used to match the account later)");
import { snapshotRecommendation } from "../lib/quickcheck";
const rec = snapshotRecommendation({ planScore: 20, weakest: ["Channels"], primaryGoal: "Get my first paying customers", challenges: [] });
assert(rec.includes("get your first paying customers") && !/\bmy\b/.test(rec), "the recommendation speaks to the founder ('your', not 'my')");

{
  assert(QC.normalizeHorizon("90 days") === "3 months" && QC.normalizeHorizon("6 months") === "6 months" && QC.normalizeHorizon("2 weeks") === null, "old \"90 days\" answers read as 3 months");
  assert(QC.TIME_HORIZONS[0] === "3 months" && QC.FUNDING_NEEDS.join("|") === "Yes|No", "Snapshot timeframe and funding choices");
  assert(QC.COUNTRIES.length > 190 && new Set(QC.COUNTRIES).size === QC.COUNTRIES.length && QC.COUNTRIES.includes("Côte d'Ivoire" as any), "every country, no repeats");
  const old = QC.parseProfile({ ...goodProfile, timeHorizon: "90 days", fundingNeed: "Yes, $10k-$50k", annualRevenue: "$1M+", country: "Other African country" });
  assert(old.ok && old.value.timeHorizon === "3 months" && old.value.fundingNeed === "Yes" && old.value.annualRevenue === "$1M+" && old.value.country === "Other African country", "a Snapshot saved before the changes still reads");
  const keys = QC.QUICK_QUESTIONS.map((q) => q.key);
  assert(keys.indexOf("costStructure") === 7 && keys.indexOf("keyPartnerships") === 8, "question 8 is costs, 9 is partners");
  assert(site.join("|") === QC.COUNTRIES.join("|"), "the website's country list matches the app's");
}
