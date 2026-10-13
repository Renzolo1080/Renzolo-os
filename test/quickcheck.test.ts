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
  industry: "Agriculture and agribusiness",
  country: "Kenya",
  businessType: "Registered small business / LLC",
  yearsInBusiness: "1-3 years",
  teamSize: "2-5 employees",
  annualRevenue: "$10k-$50k",
  primaryGoal: "Grow revenue",
  timeHorizon: "12 months",
  fundingNeed: "Yes, $10k-$50k",
  registration: "Registered and tax compliant",
  challenges: ["Cash flow"],
  heardFrom: "WhatsApp",
};

// --- the questions themselves ---------------------------------------------
assert(QUICK_QUESTIONS.length === 9 && new Set(QUICK_QUESTIONS.map((q) => q.key)).size === 9, "one question for each of the nine business areas");
assert(BLOCK_KEYS.every((k) => QUICK_QUESTIONS.some((q) => q.key === k)), "every scoring area has a question");
assert(QUICK_QUESTIONS.every((q) => q.options.length === 4 && q.options.every((o) => o.trim().length > 0)), "every question has four non-empty answers");
const inputs = 7 + 4 + 9 + 3;
assert(inputs >= 20 && inputs <= 25, `${inputs} taps or dropdowns in total, inside the 3-5 minute budget`);

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
