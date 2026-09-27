import { computeQuizResult, QUIZ_QUESTIONS } from "../lib/quiz";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

assert(QUIZ_QUESTIONS.length === 3, `exactly 3 scored questions (got ${QUIZ_QUESTIONS.length})`);

const allZero = computeQuizResult({ customers: 0, plan: 0, economics: 0 }, "unsure");
assert(allZero.score === 0, `all-zero answers score 0 (got ${allZero.score})`);
assert(allZero.tier === "Foundational Gaps", `all-zero answers tier as Foundational Gaps (got ${allZero.tier})`);
assert(allZero.secondaryCta === undefined, "Foundational Gaps has no secondary CTA");

const allTwo = computeQuizResult({ customers: 2, plan: 2, economics: 2 }, "capital");
assert(allTwo.score === 6, `all-max answers score 6 (got ${allTwo.score})`);
assert(allTwo.tier === "Nearly There", `all-max answers tier as Nearly There (got ${allTwo.tier})`);
assert(allTwo.secondaryCta !== undefined, "Nearly There includes a secondary CTA to skip ahead");
assert(allTwo.secondaryCta!.href === "/register", "secondary CTA points to registration");

const middle = computeQuizResult({ customers: 1, plan: 1, economics: 2 }, "cashflow");
assert(middle.score === 4, `mixed answers score correctly (got ${middle.score})`);
assert(middle.tier === "Partial Readiness", `score of 4 tiers as Partial Readiness (got ${middle.tier})`);

// --- Tier boundaries ---
assert(computeQuizResult({ customers: 1, plan: 1, economics: 0 }, "unsure").tier === "Foundational Gaps", "score of 2 tiers as Foundational Gaps");
assert(computeQuizResult({ customers: 1, plan: 1, economics: 1 }, "unsure").tier === "Partial Readiness", "score of 3 tiers as Partial Readiness");
assert(computeQuizResult({ customers: 2, plan: 1, economics: 1 }, "unsure").tier === "Partial Readiness", "score of 4 tiers as Partial Readiness");
assert(computeQuizResult({ customers: 2, plan: 2, economics: 1 }, "unsure").tier === "Nearly There", "score of 5 tiers as Nearly There");

// --- Missing answers default to 0, never throw ---
const missing = computeQuizResult({ customers: 2 }, "team");
assert(missing.score === 2, `missing answers default to 0 for that question (got ${missing.score})`);

// --- Every tier always gets the same primary CTA (the free Snapshot) ---
assert(allZero.cta.href === "/snapshot" && allTwo.cta.href === "/snapshot" && middle.cta.href === "/snapshot", "primary CTA is always the free Snapshot regardless of tier");

// --- Result message references the founder's stated biggest challenge ---
assert(computeQuizResult({ customers: 0, plan: 0, economics: 0 }, "capital").message.includes("investor or lender"), "message content reflects the 'capital' challenge selection");

console.log("\nAll quiz (marketing lead-gen) tests completed.");
