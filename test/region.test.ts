import { regionFor, countryCode } from "../lib/region";
import { getOneOffPrice, getMembershipPrice, membershipCurrenciesFor, oneOffCurrenciesFor, formatPrice } from "../lib/pricing";

function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

assert(countryCode("Nairobi, Kenya") === "KE" && countryCode("South Africa") === "ZA" && countryCode("Nigeria") === "NG" && countryCode("ke") === "KE", "country names and codes");
assert(countryCode("United Kingdom") === "GB" && countryCode("UK") === "GB" && countryCode("Germany") === "DE" && countryCode("United States") === "??", "UK, EU and others");

const ke = regionFor("Kenya", "KE");
assert(ke.zone === "africa", "a founder in Kenya gets Africa prices", ke);
assert(regionFor("Kenya", null).zone === "africa" && regionFor(null, "ZA").zone === "africa", "one African signal and nothing else: Africa prices");
assert(regionFor("Kenya", "US").zone === "intl" && regionFor("United States", "KE").zone === "intl", "if either signal is outside Africa, the higher price wins");
assert(regionFor(null, null).zone === "intl", "unknown location: international prices");
assert(regionFor(null, "GB").intlCurrency === "GBP" && regionFor(null, "FR").intlCurrency === "EUR" && regionFor(null, "US").intlCurrency === "USD", "pounds for the UK, euros for the EU, dollars otherwise");

const env = {};
const us = regionFor(null, "US");
const uk = regionFor(null, "GB");
const eu = regionFor(null, "DE");
assert(formatPrice(getOneOffPrice("assessment", false, undefined, env, us)!) === "$79" && formatPrice(getOneOffPrice("assessment", false, undefined, env, uk)!) === "£59" && formatPrice(getOneOffPrice("assessment", false, undefined, env, eu)!) === "€69", "assessment: $79, £59, €69 outside Africa");
assert(getOneOffPrice("assessment", false, undefined, env, ke)!.amount === 40 && getOneOffPrice("assessment", false, undefined, env)!.amount === 40, "assessment: $40 in Africa");
assert(getMembershipPrice("growth", "quarterly", undefined, env, us)!.amount === 249 && getMembershipPrice("elevate", "annual", undefined, env, uk)!.amount === 3190 && getMembershipPrice("essentials", "quarterly", undefined, env, eu)!.amount === 89, "international membership prices");
assert(getMembershipPrice("growth", "quarterly", undefined, env, ke)!.amount === 147, "Africa membership prices unchanged");
assert(JSON.stringify(membershipCurrenciesFor(null, env, uk)) === '["GBP"]' && JSON.stringify(oneOffCurrenciesFor("assessment", false, null, env, us)) === '["USD"]', "international founders are offered only their own currency");
assert(getMembershipPrice("growth", "quarterly", "KES", env, us) === null && getOneOffPrice("assessment", false, "KES", env, us) === null, "an international founder can't ask for an African currency price");
assert(getMembershipPrice("growth", "quarterly", undefined, { PRICE_INTL_GROWTH_QUARTERLY_USD: "259" }, us)!.amount === 259, "international prices can be changed in settings");
