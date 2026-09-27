import {
  runDiagnostic,
  computeVentureScore,
  BLOCK_KEYS,
  MEASURE_KEYS,
  type AllBlockScores,
  type BlockKey,
} from "../lib/scoring";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

const strong: AllBlockScores = {} as AllBlockScores;
for (const b of BLOCK_KEYS) {
  strong[b] = { clarity: 88, evidence: 82, economics: 85, scalability: 80, defensibility: 78, risk: 84 };
}
const strongEvidence = Object.fromEntries(BLOCK_KEYS.map((b) => [b, true])) as Record<BlockKey, boolean>;
const strongResult = runDiagnostic(strong, strongEvidence);
assert(strongResult.ventureScore.tier === "Growth Ready", `strong fixture tiers as Growth Ready (got ${strongResult.ventureScore.tier})`);
assert(strongResult.healthIndex.confidence === "High", `strong fixture has High confidence`);

const early: AllBlockScores = {} as AllBlockScores;
for (const b of BLOCK_KEYS) {
  early[b] = { clarity: 55, evidence: 15, economics: 50, scalability: 45, defensibility: 40, risk: 50 };
}
const earlyEvidence = Object.fromEntries(BLOCK_KEYS.map((b) => [b, false])) as Record<BlockKey, boolean>;
const earlyResult = runDiagnostic(early, earlyEvidence);
assert(earlyResult.ventureScore.tier === "Early Stage", `early fixture tiers as Early Stage (got ${earlyResult.ventureScore.tier})`);
assert(earlyResult.healthIndex.confidence === "Low", `early fixture has Low confidence`);
assert(earlyResult.gaps.length === 3, "gaps returns top 3 weakest blocks");

function mapAll(v: number) {
  return Object.fromEntries(BLOCK_KEYS.map((b) => [b, v])) as Record<BlockKey, number>;
}
assert(computeVentureScore(mapAll(90)).tier === "Institutional Ready", "score of 90 tiers as Institutional Ready");
assert(computeVentureScore(mapAll(89.9)).tier === "Growth Ready", "score of 89.9 tiers as Growth Ready");
assert(computeVentureScore(mapAll(39.9)).tier === "Concept Stage", "score of 39.9 tiers as Concept Stage");
assert(MEASURE_KEYS.length === 6, "six measures defined per spec");
assert(BLOCK_KEYS.length === 9, "nine BMC blocks defined per spec");

console.log("\nAll scoring engine tests completed.");

// --- Sub-score rubric refinement: measure-level weighting ---
import { computeSubScores } from "../lib/scoring";

function fixtureWithMeasures(m: { clarity: number; evidence: number; economics: number; scalability: number; defensibility: number; risk: number }): AllBlockScores {
  const out = {} as AllBlockScores;
  for (const b of BLOCK_KEYS) out[b] = { ...m };
  return out;
}

// Same block-average (50) both ways, but the first fixture concentrates
// strength in scalability/clarity (what Market Readiness should reward)
// while the second concentrates it in evidence/economics instead.
const highScalabilityClarity = fixtureWithMeasures({ clarity: 90, evidence: 10, economics: 10, scalability: 90, defensibility: 10, risk: 90 });
const highEvidenceEconomics = fixtureWithMeasures({ clarity: 10, evidence: 90, economics: 90, scalability: 10, defensibility: 10, risk: 90 });

const marketA = computeSubScores(highScalabilityClarity).market;
const marketB = computeSubScores(highEvidenceEconomics).market;
assert(marketA > marketB, `Market Readiness rewards scalability/clarity over evidence/economics at equal block average (got ${marketA} vs ${marketB})`);

const customerA = computeSubScores(highScalabilityClarity).customer;
const customerB = computeSubScores(highEvidenceEconomics).customer;
assert(customerB > customerA, `Customer Readiness rewards evidence/economics over scalability/clarity at equal block average (got ${customerB} vs ${customerA})`);

// --- Investor Readiness confidence modifier ---
const sameInputs = fixtureWithMeasures({ clarity: 70, evidence: 70, economics: 70, scalability: 70, defensibility: 70, risk: 70 });
const investorHigh = computeSubScores(sameInputs, "High").investor;
const investorModerate = computeSubScores(sameInputs, "Moderate").investor;
const investorLow = computeSubScores(sameInputs, "Low").investor;
assert(investorHigh > investorModerate && investorModerate > investorLow, `Investor Readiness drops as confidence drops, same inputs (got High=${investorHigh}, Moderate=${investorModerate}, Low=${investorLow})`);
assert(computeSubScores(sameInputs).investor === investorHigh, "omitting healthConfidence behaves the same as High (no discount) for backward compatibility");

// --- runDiagnostic wires the confidence modifier through automatically ---
assert(strongResult.subScores.investor > 0, "runDiagnostic produces a positive Investor Readiness for the strong fixture");

console.log("\nAll scoring engine tests completed (including sub-score rubric refinement).");
