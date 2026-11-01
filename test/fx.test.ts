import { displayCurrencyFor, estimate, parseRates } from "../lib/fx";

let failed = 0;
function assert(ok: unknown, msg: string, detail?: unknown) {
  if (ok) console.log("  ✓", msg);
  else { failed++; console.error("  ✗", msg, detail ?? ""); }
}

assert(displayCurrencyFor("Lagos, Nigeria")?.currency === "NGN", "Nigeria shows naira");
assert(displayCurrencyFor("Kenya")?.currency === "KES", "Kenya shows shillings");
assert(displayCurrencyFor("Kingston, Jamaica")?.currency === "JMD", "Jamaica shows Jamaican dollars");
assert(displayCurrencyFor("Dominican Republic")?.currency === "DOP", "Dominican Republic is not matched as Dominica");
assert(displayCurrencyFor("Dominica")?.currency === "XCD", "Dominica shows East Caribbean dollars");
assert(displayCurrencyFor("United States") === null && displayCurrencyFor("Puerto Rico") === null && displayCurrencyFor("") === null, "USD places and blanks show no estimate");
assert(estimate(60, 129.37, "KES") === "KES 7,760", "large amounts round to the nearest 10", estimate(60, 129.37, "KES"));
assert(estimate(60, 2.7, "BBD") === "BBD 162", "mid amounts round to whole units", estimate(60, 2.7, "BBD"));
assert(estimate(60, undefined, "KES") === null && estimate(60, 0, "KES") === null && estimate(0, 100, "KES") === null, "no rate or no price means no estimate");
assert(parseRates({ result: "success", base_code: "USD", rates: { KES: 129 }, time_last_update_utc: "Sun, 01 Nov 2026 00:00:01 +0000" })?.rates.KES === 129, "parses a good response");
assert(parseRates({ result: "error" }) === null && parseRates(null) === null && parseRates({ result: "success", base_code: "EUR", rates: {} }) === null, "rejects bad responses");

if (failed) { console.error(`\n${failed} failed`); process.exit(1); }
console.log("\nfx: all passed");
