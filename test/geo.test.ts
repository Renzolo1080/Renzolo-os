import { isAfricanCountry } from "../lib/geo";

function assert(cond: boolean, msg: string) {
  if (!cond) {
    console.error("FAIL:", msg);
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

assert(isAfricanCountry("Nigeria") === true, "exact match, capitalized");
assert(isAfricanCountry("kenya") === true, "exact match, lowercase");
assert(isAfricanCountry("  Ghana  ") === true, "trims whitespace");
assert(isAfricanCountry("Lagos, Nigeria") === true, "matches a country name embedded in a fuller location string");
assert(isAfricanCountry("South Africa") === true, "multi-word country name");
assert(isAfricanCountry("Cote d'Ivoire") === true || isAfricanCountry("Côte d'Ivoire") === true, "accented/unaccented variant matches");

assert(isAfricanCountry("United States") === false, "non-African country returns false");
assert(isAfricanCountry("Germany") === false, "non-African country returns false (Europe)");
assert(isAfricanCountry("India") === false, "non-African country returns false (Asia)");

assert(isAfricanCountry(null) === true, "missing country defaults to true (African) for this Africa-only launch");
assert(isAfricanCountry(undefined) === true, "undefined country defaults to true");
assert(isAfricanCountry("") === true, "empty string defaults to true");
assert(isAfricanCountry("   ") === true, "whitespace-only string defaults to true");

assert(isAfricanCountry("Papua New Guinea") === false, "Papua New Guinea is not African (despite containing 'guinea')");
assert(isAfricanCountry("São Tomé and Príncipe") === true, "accented names still match");
assert(isAfricanCountry("Guinea") === true && isAfricanCountry("Equatorial Guinea") === true, "the Guineas still match");

console.log("\nAll geo (African-market detection) tests completed.");
