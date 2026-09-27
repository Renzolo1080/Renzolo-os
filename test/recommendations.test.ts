import { extractNextSteps } from "../lib/recommendations";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

const sampleReport = `## Overall Assessment
This venture is early-stage but promising.

## Gap-to-Target Analysis
Some detail here.

## Growth Scenarios
Base, target, stretch scenarios here.

## Recommended Next Steps
- Sign two pilot customers within 60 days
- Formalize pricing for the annual plan
- Document the onboarding process

## Closing Note
Good luck!`;

const steps = extractNextSteps(sampleReport);
assert(steps.length === 3, `extracts exactly the 3 bulleted next steps (got ${steps.length})`);
assert(steps[0] === "Sign two pilot customers within 60 days", `first step text is exact (got "${steps[0]}")`);
assert(steps[2] === "Document the onboarding process", `last step text is exact, stops before next heading (got "${steps[2]}")`);

// --- Missing heading returns an empty array, not an error ---
const noHeading = extractNextSteps("## Overall Assessment\nJust some text, no next steps heading.");
assert(noHeading.length === 0, "missing heading returns an empty array");

// --- Empty bullet list under the heading also returns empty ---
const emptySection = extractNextSteps("## Recommended Next Steps\n\n## Closing Note\nDone.");
assert(emptySection.length === 0, "heading with no bullets returns an empty array");

// --- Works with a level-2 or level-3 heading, and trailing whitespace on bullets ---
const level3 = extractNextSteps("### Recommended Next Steps  \n*   Talk to five more customers   \n- Update the pitch deck");
assert(level3.length === 2, `works with a level-3 heading and asterisk bullets (got ${level3.length})`);
assert(level3[0] === "Talk to five more customers", "trims extra whitespace from bullet text");

// --- Heading at the very end of the document with no trailing heading ---
const atEnd = extractNextSteps("## Recommended Next Steps\n- Last item only");
assert(atEnd.length === 1 && atEnd[0] === "Last item only", "works when the heading is the last section in the document");

console.log("\nAll recommendation-extraction tests completed.");
