import {
  getMembershipPrice,
  getOneOffPrice,
  membershipCurrenciesFor,
  oneOffCurrenciesFor,
  isBillingInterval,
  isTier,
  tierOffersInterval,
  roundDownMoney,
  perMonth,
  paymentPlanId,
  TIERS,
  TIER_INTERVALS,
} from "../lib/pricing";
import { effectiveTier, upcomingTier, entitlements, planChange, periodDays, elevateSeatLimit } from "../lib/membership";

function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else {
    console.log("PASS:", msg);
  }
}

const usd = (amount: number) => ({ amount, currency: "USD" });
const P = (t: any, i: any, c?: string, env = {}) => getMembershipPrice(t, i, c, env);

// --- approved prices --------------------------------------------------------
assert(P("essentials", "monthly") === null && P("essentials", "quarterly")?.amount === 60 && P("essentials", "annual")?.amount === 200, "Essentials: $60 quarterly, $200 annual, no monthly");
assert(P("growth", "quarterly")?.amount === 147 && P("growth", "annual")?.amount === 490, "Growth: $147 quarterly, $490 annual");
assert(P("elevate", "quarterly")?.amount === 699 && P("elevate", "annual")?.amount === 2490, "Elevate: $699 quarterly, $2,490 annual");
assert(P("growth", "monthly") === null && P("elevate", "monthly") === null, "no tier can be bought monthly (closes the one-month gap)");
assert(perMonth(usd(147), "quarterly") === "$49" && perMonth(usd(699), "quarterly") === "$233", "quarterly prices shown per month: $49 and $233");
assert(getOneOffPrice("assessment", false, undefined, {})?.amount === 60 && getOneOffPrice("assessment", true, undefined, {})?.amount === 60, "Readiness Assessment is $60 for everyone");
assert(getOneOffPrice("coaching_single", false, undefined, {})?.amount === 150 && getOneOffPrice("coaching_single", "essentials", undefined, {})?.amount === 75 && getOneOffPrice("coaching_single", "growth", undefined, {})?.amount === 105 && getOneOffPrice("coaching_single", "elevate", undefined, {})?.amount === 120, "one coaching session: $150, or $75 / $105 / $120 by membership");
assert(getOneOffPrice("coaching_pack3", "none", undefined, {})?.amount === 399 && getOneOffPrice("coaching_pack3", "essentials", undefined, {})?.amount === 199 && getOneOffPrice("coaching_pack3", "growth", undefined, {})?.amount === 279 && getOneOffPrice("coaching_pack3", "elevate", undefined, {})?.amount === 319, "three sessions: $399, or $199 / $279 / $319 by membership");

// --- settings -----------------------------------------------------------------
assert(P("growth", "quarterly", undefined, { PRICE_GROWTH_QUARTERLY: "120" })?.amount === 120, "a price can be changed in settings");
for (const bad of ["", " ", "0", "-5", "free"]) {
  assert(P("essentials", "quarterly", undefined, { PRICE_ESSENTIALS_QUARTERLY: bad })?.amount === 60, `an unusable setting (${JSON.stringify(bad)}) falls back to the default, never free`);
}
assert(P("essentials", "quarterly", undefined, { PRICE_CURRENCY: "dollars" })?.currency === "USD", "an unusable currency setting falls back to USD");
assert(P("essentials", "quarterly", "KES", {}) === null, "no KES price set: KES not offered, nothing converted automatically");
assert(P("essentials", "quarterly", "kes", { PRICE_ESSENTIALS_QUARTERLY_KES: "1950" })?.amount === 1950, "a KES price is used when set");
assert(P("essentials", "quarterly", "K E S", {}) === null, "a malformed currency is refused");
const allKes: Record<string, string> = {};
for (const t of TIERS) for (const i of TIER_INTERVALS[t]) allKes[`PRICE_${t.toUpperCase()}_${i.toUpperCase()}_KES`] = "1000";
assert(JSON.stringify(membershipCurrenciesFor("Kenya", allKes)) === '["KES","USD"]', "a founder in Kenya is offered KES first when every membership price is set in KES");
assert(JSON.stringify(membershipCurrenciesFor("Kenya", { PRICE_ESSENTIALS_QUARTERLY_KES: "1950" })) === '["USD"]', "…and only USD when some are missing (no mixed-currency table)");
assert(JSON.stringify(membershipCurrenciesFor("Ghana", allKes)) === '["USD"]', "a founder elsewhere is never offered KES");
assert(JSON.stringify(oneOffCurrenciesFor("assessment", false, "Kenya", { PRICE_ASSESSMENT_KES: "10000" })) === '["KES","USD"]', "one-time purchases offer KES when their own KES price is set");
assert(getOneOffPrice("coaching_single", "growth", "KES", { PRICE_COACHING_SINGLE_KES: "10000" }) === null && getOneOffPrice("coaching_single", "growth", "KES", { PRICE_COACHING_SINGLE_GROWTH_KES: "13600" })?.amount === 13600, "a member's KES price is only offered when their own level's KES price is set");
assert(isTier("growth") && !isTier("gold") && isBillingInterval("quarterly") && !isBillingInterval("weekly"), "only real tiers and periods are accepted");
assert(tierOffersInterval("essentials", "quarterly") && !tierOffersInterval("essentials", "monthly") && !tierOffersInterval("growth", "monthly"), "tier/period combinations are checked");
assert(paymentPlanId("growth", "quarterly", { FLUTTERWAVE_PLAN_GROWTH_QUARTERLY: " 123 " }) === "123" && paymentPlanId("growth", "annual", {}) === null, "auto-renew plan IDs are per tier and period");
assert(roundDownMoney(10.567, "USD") === 10.56 && roundDownMoney(10.9, "KES") === 10 && roundDownMoney(-3, "USD") === 0, "credits round down (cents for USD, whole units for KES)");

// --- which tier is in force -----------------------------------------------------
const now = new Date("2026-11-01T00:00:00Z");
const future = (days: number) => new Date(now.getTime() + days * 864e5).toISOString();
assert(effectiveTier(null, now) === null && effectiveTier({ status: "active", current_period_end: future(-1) }, now) === null, "no tier without an active membership");
assert(effectiveTier({ status: "active", current_period_end: future(10) }, now) === "essentials", "a membership from before tiers counts as Essentials");
assert(effectiveTier({ status: "active", current_period_end: future(10), tier: "growth" }, now) === "growth", "the paid tier is in force");
const sched = { status: "active", current_period_end: future(80), tier: "growth", scheduled_tier: "essentials", scheduled_from: future(-1) };
assert(effectiveTier(sched, now) === "essentials", "a scheduled downgrade takes over once its date passes");
assert(effectiveTier({ ...sched, scheduled_from: future(5) }, now) === "growth" && upcomingTier({ ...sched, scheduled_from: future(5) }, now)?.tier === "essentials", "…and not before (shown as upcoming)");

// --- what each tier unlocks -------------------------------------------------------
const e = entitlements("essentials"), g = entitlements("growth"), x = entitlements("elevate"), buy = entitlements(null, true), none = entitlements(null);
assert(e.summaryReport && !e.fullReport && !e.valuation && !e.marketInsight && !e.aiCoaching && e.tools && e.includedCoaching === "1 basic 30-minute coaching session per quarter", "Essentials: summary report, tools, 1 basic session a quarter, no valuation/market insight");
assert(g.fullReport && g.valuation && g.marketInsight && g.readinessScores && g.aiCoaching && g.includedCoaching === "2 one-on-one 30-minute sessions per quarter", "Growth: full report, valuation, market insight, AI coaching, 2 sessions a quarter");
assert(x.fullReport && x.includedCoaching === "1 one-on-one 60-minute session per month", "Elevate: everything, 1 session a month");
assert(buy.fullReport && buy.valuation && buy.marketInsight && !buy.tools && !buy.member, "$60 assessment: full report, valuation, market insight; no membership tools");
assert(!none.fullReport && !none.summaryReport && !none.tools, "nothing paid: nothing unlocked");

// --- changing plan ----------------------------------------------------------------
const pc = (sub: any, last: any, tier: any, interval: any, listPrice = P(tier, interval)!, clp: any = null) => planChange({ sub, lastPayment: last }, { tier, interval, listPrice }, now, clp);
const fresh = pc(null, null, "growth", "quarterly");
assert(fresh.ok && fresh.kind === "new" && fresh.charge.amount === 147 && fresh.startsAt === now.toISOString(), "no membership: a new Growth quarter for $147, starting now");

const essMonthly = { status: "active", current_period_end: future(20), tier: "essentials", billing_interval: "monthly" };
const up = pc(essMonthly, { amount: 15, currency: "USD", interval: "monthly" }, "growth", "quarterly");
const expectCredit = Math.floor(((15 * 20) / periodDays("monthly")) * 100) / 100;
assert(up.ok && up.kind === "upgrade" && up.credit === expectCredit && up.charge.amount === Math.round((147 - expectCredit) * 100) / 100 && up.startsAt === now.toISOString(), `upgrade Essentials (20 days left) to Growth: $${expectCredit} credit, starts now`, up);

const essAnnual = { status: "active", current_period_end: future(300), tier: "essentials", billing_interval: "annual" };
const big = pc(essAnnual, { amount: 200, currency: "USD", interval: "annual" }, "growth", "quarterly");
assert(big.ok && big.kind === "upgrade" && big.charge.amount === 1 && big.credit === 146 && big.extraDays > 0, "credit bigger than the new price: at least $1 charged, the rest becomes extra days", big);

const kesUp = pc(essMonthly, { amount: 1950, currency: "KES", interval: "monthly" }, "growth", "quarterly", { amount: 15000, currency: "KES" });
assert(kesUp.ok && kesUp.kind === "upgrade" && kesUp.credit === Math.floor((1950 * 20) / periodDays("monthly")), "credit in KES when paid in KES (whole shillings)", kesUp);
const mixed = pc(essMonthly, { amount: 1950, currency: "KES", interval: "monthly" }, "growth", "quarterly");
assert(mixed.ok && mixed.credit === 0, "paid in KES, upgrading in USD with no USD list price given: no credit invented");
const mixed2 = pc(essMonthly, { amount: 1950, currency: "KES", interval: "monthly" }, "growth", "quarterly", P("growth", "quarterly")!, usd(15));
assert(mixed2.ok && mixed2.credit === expectCredit, "…with the current tier's USD price, credit is worked out from that");

const growthQ = { status: "active", current_period_end: future(40), tier: "growth", billing_interval: "quarterly" };
const renew = pc(growthQ, { amount: 117, currency: "USD", interval: "quarterly" }, "growth", "annual");
assert(renew.ok && renew.kind === "renewal" && renew.charge.amount === 490 && renew.startsAt === future(40), "same tier: renewal added after the current period");
const down = pc(growthQ, { amount: 117, currency: "USD", interval: "quarterly" }, "essentials", "quarterly");
assert(down.ok && down.kind === "downgrade" && down.charge.amount === 60 && down.startsAt === future(40), "lower tier: starts when the current period ends");
const manual = pc({ status: "active", current_period_end: null, tier: "growth" }, null, "elevate", "quarterly");
assert(!manual.ok, "a membership set up by hand can't be changed by paying");
const auto = pc({ ...growthQ, auto_renew: true }, null, "elevate", "quarterly");
assert(!auto.ok && /automatic/.test((auto as any).reason), "auto-renewing card memberships must turn auto-renew off before changing plan");
const lapsed = pc({ status: "active", current_period_end: future(-2), tier: "elevate" }, null, "essentials", "quarterly");
assert(lapsed.ok && lapsed.kind === "new" && lapsed.startsAt === now.toISOString(), "lapsed membership: any tier starts fresh now");

assert(elevateSeatLimit({}) === 50 && elevateSeatLimit({ ELEVATE_SEAT_LIMIT: "40" }) === 40 && elevateSeatLimit({ ELEVATE_SEAT_LIMIT: "lots" }) === 50, "Elevate seat limit: 50 by default, settable");

console.log("\nAll membership and pricing tests completed.");

// Coaching price levels.
{
  const { coachingBuyerLevel } = require("../lib/pricing");
  assert(getOneOffPrice("coaching_single", "elevate", undefined, { PRICE_COACHING_SINGLE_ELEVATE: "130" })?.amount === 130, "a level's coaching price can be changed in settings");
  assert(getOneOffPrice("coaching_single", "essentials", undefined, { PRICE_COACHING_SINGLE: "200" })?.amount === 75, "a level falls back to its own default, not the non-member setting");
  assert(getOneOffPrice("assessment", "elevate", undefined, {})?.amount === 60, "the assessment price doesn't change by level");
  assert(coachingBuyerLevel({ tier: "growth" }) === "growth" && coachingBuyerLevel({ tier: null }) === "none", "coaching is priced by membership tier, or non-member");
}
