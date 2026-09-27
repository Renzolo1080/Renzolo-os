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
