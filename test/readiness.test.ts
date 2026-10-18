import { bandFor, computeReadiness, COMPONENTS, readinessFromRows, weightsFor } from "../lib/readiness";

let fails = 0;
function check(ok: boolean, name: string, detail?: unknown) {
  if (ok) console.log(`PASS: ${name}`);
  else {
    fails++;
    console.log(`FAIL: ${name}`, detail ?? "");
  }
}

const blocks = { customerSegments: 70, valueProposition: 72, channels: 60, customerRelationships: 65, revenueStreams: 58, keyResources: 62, keyActivities: 66, keyPartnerships: 50, costStructure: 54 };
const base = { blockScores: blocks, marketSubscore: 64, customerSubscore: 68, investorSubscore: 52, evidenceCompleteness: 0.5, planCompleteness: 80, planReview: 70, planReadiness: 55 };

const r = computeReadiness(base);
check(COMPONENTS.every((c) => typeof r.components[c] === "number"), "all five components are scored", r.components);
check(r.components.customer === 68 && r.components.investment === 52, "customer and investment come from the readiness sub-scores", r.components);
check(r.components.strategic === 75, "strategic blends plan completeness and plan review", r.components.strategic);
check(Math.abs(r.total - (r.components.strategic + r.components.growth + r.components.customer + r.components.capital + r.components.investment) / 5) < 0.11, "total is the even average with no target", r.total);
check(r.band === bandFor(r.total), "band follows the total");
check(r.components.capital !== r.components.investment, "capital and investment are scored separately");

const noPlan = computeReadiness({ ...base, planCompleteness: null, planReview: null });
check(noPlan.components.strategic === 55 && noPlan.estimated.includes("strategic"), "without a plan, strategic falls back to plan readiness and is marked estimated", noPlan);

const lowEvidence = computeReadiness({ ...base, evidenceCompleteness: 0.1 });
check(lowEvidence.estimated.includes("capital") && lowEvidence.components.capital < r.components.capital, "little evidence lowers capital and marks it estimated", lowEvidence.components.capital);

const w = weightsFor("capital");
check(w.capital > w.customer && Math.abs(Object.values(w).reduce((a, b) => a + b, 0) - 1) < 0.001, "a capital target weights capital most and weights sum to 1", w);
const forCapital = computeReadiness({ ...base, target: "capital" });
check(forCapital.total !== r.total, "the target outcome changes the total", [forCapital.total, r.total]);

const sparse = computeReadiness({ blockScores: null, marketSubscore: null, customerSubscore: null, investorSubscore: null, evidenceCompleteness: null, planCompleteness: null, planReview: null, planReadiness: null });
check(sparse.total === 0 && sparse.band === "Not yet", "no data gives 0 / Not yet without crashing", sparse);

const rows = readinessFromRows({ block_scores: blocks, market_subscore: "64", customer_subscore: "68", investor_subscore: "52", evidence_completeness: "0.5" }, { completeness: 80, review: 70 }, 55);
check(rows.total === r.total, "database rows (numeric strings) give the same result", [rows.total, r.total]);

check(bandFor(75) === "Ready" && bandFor(60) === "Nearly ready" && bandFor(40) === "Getting ready" && bandFor(39.9) === "Not yet", "bands at their edges");

if (fails) {
  console.log(`${fails} readiness tests failed`);
  process.exit(1);
}
console.log("All readiness score tests passed.");
