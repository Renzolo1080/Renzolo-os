import { REVENUE_BANDS } from "../lib/quickcheck";
import { computeValuation, revenueBucketMidpoint, BLOCK_KEYS } from "../lib/valuation";
import type { BlockKey } from "../lib/scoring";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

function mapAll(v: number): Record<BlockKey, number> {
  return Object.fromEntries(BLOCK_KEYS.map((b) => [b, v])) as Record<BlockKey, number>;
}

// --- Pre-revenue venture uses the qualitative method ---
const preRevenue = computeValuation({ ventureTier: "Early Stage", annualRevenue: "Pre-revenue", blockScores: mapAll(60) });
assert(preRevenue.method === "qualitative", `pre-revenue uses qualitative method (got ${preRevenue.method})`);
assert(preRevenue.low > 0 && preRevenue.high > preRevenue.low, `pre-revenue gives a positive, ordered range (got ${preRevenue.low}-${preRevenue.high})`);

// --- No revenue bucket given at all also falls back to qualitative ---
const noRevenueGiven = computeValuation({ ventureTier: "Developing", annualRevenue: null, blockScores: mapAll(50) });
assert(noRevenueGiven.method === "qualitative", "missing annualRevenue falls back to qualitative method");

// --- A revenue-generating venture uses the revenue-multiple method ---
const revenueVenture = computeValuation({ ventureTier: "Growth Ready", annualRevenue: "$250k-$1M", blockScores: mapAll(80) });
assert(revenueVenture.method === "revenue_multiple", `revenue venture uses revenue_multiple method (got ${revenueVenture.method})`);
assert(revenueVenture.low > 0 && revenueVenture.high > revenueVenture.low, `revenue venture gives a positive, ordered range (got ${revenueVenture.low}-${revenueVenture.high})`);
assert(revenueVenture.low === Math.round(625_000 * 1.2), `low end uses the Growth Ready tier's low multiple (got ${revenueVenture.low})`);
assert(revenueVenture.high === Math.round(625_000 * 2.5), `high end uses the Growth Ready tier's high multiple (got ${revenueVenture.high})`);

// --- Higher tiers should produce a wider/higher multiple range than earlier tiers, all else equal ---
const early = computeValuation({ ventureTier: "Early Stage", annualRevenue: "$50k-$250k", blockScores: mapAll(50) });
const institutional = computeValuation({ ventureTier: "Institutional Ready", annualRevenue: "$50k-$250k", blockScores: mapAll(50) });
assert(institutional.low > early.low && institutional.high > early.high, "Institutional Ready tier values the same revenue higher than Early Stage");

// --- Qualitative valuation scales with block scores ---
const weak = computeValuation({ ventureTier: "Concept Stage", annualRevenue: "", blockScores: mapAll(10) });
const strong = computeValuation({ ventureTier: "Concept Stage", annualRevenue: "", blockScores: mapAll(90) });
assert(strong.low > weak.low && strong.high > weak.high, "stronger BMC scores produce a higher qualitative valuation range");

// --- Revenue bucket parsing sanity ---
assert(revenueBucketMidpoint("Pre-revenue") === 0, "Pre-revenue bucket midpoint is 0");
assert(revenueBucketMidpoint(undefined) === 0, "missing bucket defaults to 0");
assert(revenueBucketMidpoint("$1M+") > 0, "$1M+ bucket has a positive representative midpoint");
{
  for (const b of REVENUE_BANDS) if (b !== "Pre-revenue") assert(revenueBucketMidpoint(b) > 0, `${b} has a midpoint`);
  assert(revenueBucketMidpoint("$1M-$5M") < revenueBucketMidpoint("$5M-$10M") && revenueBucketMidpoint("$10M-$50M") < revenueBucketMidpoint("$50M-$100M+"), "midpoints rise with the band");
}

console.log("\nSample valuation (revenue venture):", JSON.stringify(revenueVenture, null, 2));
