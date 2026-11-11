/** All prices live here. Every price can be changed with an environment
 * setting in Vercel (plus a redeploy), never a code change.
 *
 * FOUNDER TRAJECTORY(TM) MEMBERSHIP — three tiers (Nov 1 2026). Every
 * membership includes the Readiness Assessment (valued at $40 inside a
 * membership). Billed quarterly or annually, never monthly:
 *
 *   Essentials  $60 quarterly · $200 annual   1 x 30-min basic session a quarter
 *   Growth      $147 quarterly · $490 annual  2 x 30-min sessions a quarter
 *   Elevate     $699 quarterly · $2,490 annual 1 x 60-min session a month
 *
 * ONE-TIME PURCHASES
 *   Readiness Assessment (full report, valuation, market insight, tier
 *   recommendation; no valuation)           $40 (Nov 11 2026)
 *   Extra coaching (60 min), priced by membership level:
 *     not a member (first session includes intake) $150 · $399 for three
 *     Essentials                             $75 · $199
 *     Growth                                 $105 · $279
 *     Elevate                                $120 · $319
 *
 * Settings (all optional; a missing or unusable value falls back to the
 * default above, never to free):
 *   PRICE_CURRENCY=USD
 *   PRICE_ESSENTIALS_QUARTERLY, PRICE_ESSENTIALS_ANNUAL
 *   PRICE_GROWTH_QUARTERLY, PRICE_GROWTH_ANNUAL
 *   PRICE_ELEVATE_QUARTERLY, PRICE_ELEVATE_ANNUAL
 *   PRICE_ASSESSMENT
 *   PRICE_COACHING_SINGLE, PRICE_COACHING_PACK3            (not a member)
 *   PRICE_COACHING_SINGLE_ESSENTIALS, PRICE_COACHING_PACK3_ESSENTIALS
 *   PRICE_COACHING_SINGLE_GROWTH, PRICE_COACHING_PACK3_GROWTH
 *   PRICE_COACHING_SINGLE_ELEVATE, PRICE_COACHING_PACK3_ELEVATE
 *
 * LOCAL-CURRENCY PRICES. Flutterwave decides which payment methods to show
 * from the currency of the charge: M-Pesa only appears for a Kenyan
 * shilling (KES) charge. To take mobile money, set a price in that
 * currency by adding the currency code to the setting name, e.g.
 *   PRICE_ESSENTIALS_QUARTERLY_KES=7800
 * A local currency is only offered for something when its price is set;
 * nothing is ever converted automatically, because an exchange rate is a
 * pricing decision. */

import type { Region } from "./region";

export type Tier = "essentials" | "growth" | "elevate";
export type BillingInterval = "monthly" | "quarterly" | "annual";
export type OneOffItem = "assessment" | "coaching_single" | "coaching_pack3";

export interface Price {
  amount: number;
  currency: string;
}

type Env = Record<string, string | undefined>;

export const TIERS: Tier[] = ["essentials", "growth", "elevate"];
export const TIER_NAMES: Record<Tier, string> = { essentials: "Essentials", growth: "Growth", elevate: "Elevate" };
export const TIER_RANK: Record<Tier, number> = { essentials: 1, growth: 2, elevate: 3 };

/** Which billing periods each tier can be bought for. */
export const TIER_INTERVALS: Record<Tier, BillingInterval[]> = {
  essentials: ["quarterly", "annual"],
  growth: ["quarterly", "annual"],
  elevate: ["quarterly", "annual"],
};

export const INTERVAL_MONTHS: Record<BillingInterval, number> = { monthly: 1, quarterly: 3, annual: 12 };
export const INTERVAL_NAMES: Record<BillingInterval, string> = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };

const DEFAULT_MEMBERSHIP: Record<Tier, Partial<Record<BillingInterval, number>>> = {
  essentials: { quarterly: 60, annual: 200 },
  growth: { quarterly: 147, annual: 490 },
  elevate: { quarterly: 699, annual: 2490 },
};

/** International prices (US, UK and EU), approved Nov 11 2026. Each can be
 * changed in Vercel with PRICE_INTL_<ITEM>_<CURRENCY>, e.g.
 * PRICE_INTL_ASSESSMENT_GBP=59 or PRICE_INTL_GROWTH_QUARTERLY_USD=249.
 * Coaching for international founders is priced in US dollars. */
const INTL_MEMBERSHIP: Record<"USD" | "GBP" | "EUR", Record<Tier, Partial<Record<BillingInterval, number>>>> = {
  USD: { essentials: { quarterly: 99, annual: 339 }, growth: { quarterly: 249, annual: 849 }, elevate: { quarterly: 1199, annual: 3990 } },
  GBP: { essentials: { quarterly: 79, annual: 269 }, growth: { quarterly: 199, annual: 679 }, elevate: { quarterly: 949, annual: 3190 } },
  EUR: { essentials: { quarterly: 89, annual: 299 }, growth: { quarterly: 229, annual: 779 }, elevate: { quarterly: 1099, annual: 3690 } },
};
const INTL_ASSESSMENT: Record<"USD" | "GBP" | "EUR", number> = { USD: 79, GBP: 59, EUR: 69 };
const isIntlCurrency = (c: string): c is "USD" | "GBP" | "EUR" => c === "USD" || c === "GBP" || c === "EUR";

/** Who is buying, for coaching prices: their membership tier, or "none"
 * for someone who isn't a member. */
export type BuyerLevel = "none" | Tier;
export const BUYER_LEVELS: BuyerLevel[] = ["none", "essentials", "growth", "elevate"];

const DEFAULT_ONE_OFF: Record<OneOffItem, Record<BuyerLevel, number>> = {
  assessment: { none: 40, essentials: 40, growth: 40, elevate: 40 },
  coaching_single: { none: 150, essentials: 75, growth: 105, elevate: 120 },
  coaching_pack3: { none: 399, essentials: 199, growth: 279, elevate: 319 },
};

/** `false` (or null) means not a member. */
const levelOf = (v: boolean | BuyerLevel | null | undefined): BuyerLevel => (typeof v === "string" ? v : "none");

export function coachingBuyerLevel(input: { tier: Tier | null | undefined }): BuyerLevel {
  return input.tier ?? "none";
}

/** Coaching sessions bought in each one-off coaching item. */
export const COACHING_QUANTITY: Record<Exclude<OneOffItem, "assessment">, number> = { coaching_single: 1, coaching_pack3: 3 };

export function isTier(v: unknown): v is Tier {
  return v === "essentials" || v === "growth" || v === "elevate";
}

export function isBillingInterval(v: unknown): v is BillingInterval {
  return v === "monthly" || v === "quarterly" || v === "annual";
}

export function isOneOffItem(v: unknown): v is OneOffItem {
  return v === "assessment" || v === "coaching_single" || v === "coaching_pack3";
}

export function tierOffersInterval(tier: Tier, interval: BillingInterval): boolean {
  return TIER_INTERVALS[tier].includes(interval);
}

/** Countries whose founders can be offered a local-currency price, and
 * the currency to offer. Matched case-insensitively anywhere in the text
 * ("Nairobi, Kenya" matches). */
const LOCAL_CURRENCIES: { match: string[]; currency: string }[] = [
  { match: ["kenya"], currency: "KES" },
  { match: ["south africa"], currency: "ZAR" },
  { match: ["nigeria"], currency: "NGN" },
  { match: ["ghana"], currency: "GHS" },
  { match: ["uganda"], currency: "UGX" },
  { match: ["rwanda"], currency: "RWF" },
  { match: ["tanzania"], currency: "TZS" },
];

const LOCAL_BY_CODE: Record<string, string> = { KE: "KES", ZA: "ZAR", NG: "NGN", GH: "GHS", UG: "UGX", RW: "RWF", TZ: "TZS" };

export function currencyForCountry(country: string | null | undefined): string | null {
  const c = (country ?? "").trim().toLowerCase();
  if (!c) return null;
  if (/^[a-z]{2}$/.test(c)) return LOCAL_BY_CODE[c.toUpperCase()] ?? null;
  return LOCAL_CURRENCIES.find((l) => l.match.some((m) => c.includes(m)))?.currency ?? null;
}

/** A positive number from settings, or null if missing or unusable — a
 * typo must never produce a free or negative charge. */
function readAmount(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function cleanCurrency(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : null;
}

/** The main currency (PRICE_CURRENCY, USD unless changed). */
export function mainCurrency(env: Env = process.env): string {
  return cleanCurrency(env.PRICE_CURRENCY) ?? "USD";
}

/** The price of a tier for a billing period, in the main currency or in
 * another currency if a price has been set for it. Null if the tier isn't
 * sold for that period, or no price is set in that currency. */
export function getMembershipPrice(tier: Tier, interval: BillingInterval, currency?: unknown, env: Env = process.env, region?: Region | null): Price | null {
  if (!tierOffersInterval(tier, interval)) return null;
  if (region?.zone === "intl") {
    const c = currency === undefined ? region.intlCurrency : cleanCurrency(currency);
    if (!c || !isIntlCurrency(c)) return null;
    const amount = readAmount(env[`PRICE_INTL_${tier.toUpperCase()}_${interval.toUpperCase()}_${c}`]) ?? INTL_MEMBERSHIP[c][tier][interval] ?? null;
    return amount === null ? null : { amount, currency: c };
  }
  const main = mainCurrency(env);
  const wanted = currency === undefined ? main : cleanCurrency(currency);
  if (!wanted) return null;
  const key = `PRICE_${tier.toUpperCase()}_${interval.toUpperCase()}`;
  if (wanted === main) {
    return { amount: readAmount(env[key]) ?? (DEFAULT_MEMBERSHIP[tier][interval] as number), currency: main };
  }
  const amount = readAmount(env[`${key}_${wanted}`]);
  return amount === null ? null : { amount, currency: wanted };
}

/** The price of a one-time purchase. Coaching depends on the buyer's
 * membership level; the assessment is the same for everyone. */
export function getOneOffPrice(item: OneOffItem, who: boolean | BuyerLevel | null, currency?: unknown, env: Env = process.env, region?: Region | null): Price | null {
  if (region?.zone === "intl" && item === "assessment") {
    const c = currency === undefined ? region.intlCurrency : cleanCurrency(currency);
    if (!c || !isIntlCurrency(c)) return null;
    return { amount: readAmount(env[`PRICE_INTL_ASSESSMENT_${c}`]) ?? INTL_ASSESSMENT[c], currency: c };
  }
  const main = mainCurrency(env);
  const wanted = currency === undefined ? main : cleanCurrency(currency);
  if (!wanted) return null;
  const level = item === "assessment" ? "none" : levelOf(who);
  const key = `PRICE_${item.toUpperCase()}${level === "none" ? "" : `_${level.toUpperCase()}`}`;
  const amount = readAmount(env[wanted === main ? key : `${key}_${wanted}`]);
  if (amount !== null) return { amount, currency: wanted };
  // A level price that isn't set falls back to its default (main currency
  // only), never to another level's setting.
  return wanted === main ? { amount: DEFAULT_ONE_OFF[item][level], currency: main } : null;
}

/** Currencies a founder in this country can pay in for membership: their
 * local currency first, but only when EVERY membership price is set in
 * it (so the tier table never mixes currencies), then the main currency. */
export function membershipCurrenciesFor(country: string | null | undefined, env: Env = process.env, region?: Region | null): string[] {
  if (region?.zone === "intl") return [region.intlCurrency];
  const main = mainCurrency(env);
  const local = currencyForCountry(country);
  const offered: string[] = [];
  if (local && local !== main) {
    const all = TIERS.every((t) => TIER_INTERVALS[t].every((i) => getMembershipPrice(t, i, local, env)));
    if (all) offered.push(local);
  }
  offered.push(main);
  return offered;
}

/** Currencies a founder can pay in for a one-time purchase. */
export function oneOffCurrenciesFor(item: OneOffItem, member: boolean | BuyerLevel | null, country: string | null | undefined, env: Env = process.env, region?: Region | null): string[] {
  if (region?.zone === "intl") return item === "assessment" ? [region.intlCurrency] : [mainCurrency(env)];
  const main = mainCurrency(env);
  const local = currencyForCountry(country);
  const offered: string[] = [];
  if (local && local !== main && getOneOffPrice(item, member, local, env)) offered.push(local);
  offered.push(main);
  return offered;
}

/** Flutterwave Payment Plan for automatic card renewal of a tier, if one
 * has been set up (FLUTTERWAVE_PLAN_GROWTH_QUARTERLY etc.). Plans are
 * created in the main currency only. */
export function paymentPlanId(tier: Tier, interval: BillingInterval, env: Env = process.env): string | null {
  const id = env[`FLUTTERWAVE_PLAN_${tier.toUpperCase()}_${interval.toUpperCase()}`];
  return id && id.trim() ? id.trim() : null;
}

/** Whole currency units for currencies that don't use cents in practice;
 * two decimals otherwise. Always rounds DOWN, so a credit is never more
 * than it should be. */
export function roundDownMoney(amount: number, currency: string): number {
  if (!Number.isFinite(amount) || amount <= 0) return 0;
  const whole = ["KES", "UGX", "RWF", "TZS", "NGN"].includes(currency.toUpperCase());
  return whole ? Math.floor(amount) : Math.floor(amount * 100 + 1e-9) / 100;
}

export function formatPrice(price: Price): string {
  const amount = Number.isInteger(price.amount)
    ? price.amount.toLocaleString("en-US")
    : price.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price.currency === "USD") return `$${amount}`;
  if (price.currency === "GBP") return `£${amount}`;
  if (price.currency === "EUR") return `€${amount}`;
  return `${price.currency} ${amount}`;
}

/** "$39/month" style figure for a quarterly or annual price. */
export function perMonth(price: Price, interval: BillingInterval): string {
  const raw = price.amount / INTERVAL_MONTHS[interval];
  const amount = Math.round(raw * 100) / 100;
  return formatPrice({ amount, currency: price.currency });
}
