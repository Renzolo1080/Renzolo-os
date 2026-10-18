/** All prices live here. Every price can be changed with an environment
 * setting in Vercel (plus a redeploy), never a code change.
 *
 * FOUNDER TRAJECTORY(TM) MEMBERSHIP — three tiers (approved Oct 2026):
 *
 *   Essentials  $15 monthly · $45 quarterly · $150 annual
 *   Growth      $117 quarterly ($39/month) · $390 annual
 *   Elevate     $447 quarterly ($149/month) · $1,490 annual
 *
 * Growth and Elevate are billed quarterly or annually, never monthly, so
 * one month of Growth can't be bought to get everything in the one-time
 * Readiness Assessment for less than its price.
 *
 * ONE-TIME PURCHASES
 *   Readiness Assessment (full report, valuation, market insight, tier
 *   recommendation)                         $79
 *   Coaching has three price levels:
 *     members (any tier)                     $59 one session · $149 for three
 *     clients (bought the assessment or a
 *     cohort, or have had coaching before)   $79 · $199
 *     starting with coaching (first coaching
 *     purchase, nothing else bought; covers
 *     intake and session planning)           $99 · $249
 *
 * Settings (all optional; a missing or unusable value falls back to the
 * default above, never to free):
 *   PRICE_CURRENCY=USD
 *   PRICE_ESSENTIALS_MONTHLY, PRICE_ESSENTIALS_QUARTERLY, PRICE_ESSENTIALS_ANNUAL
 *   PRICE_GROWTH_QUARTERLY, PRICE_GROWTH_ANNUAL
 *   PRICE_ELEVATE_QUARTERLY, PRICE_ELEVATE_ANNUAL
 *   PRICE_ASSESSMENT
 *   PRICE_COACHING_SINGLE, PRICE_COACHING_SINGLE_MEMBER
 *   PRICE_COACHING_PACK3, PRICE_COACHING_PACK3_MEMBER
 *   PRICE_COACHING_SINGLE_STARTER, PRICE_COACHING_PACK3_STARTER
 *
 * LOCAL-CURRENCY PRICES. Flutterwave decides which payment methods to show
 * from the currency of the charge: M-Pesa only appears for a Kenyan
 * shilling (KES) charge. To take mobile money, set a price in that
 * currency by adding the currency code to the setting name, e.g.
 *   PRICE_ESSENTIALS_MONTHLY_KES=1950
 * A local currency is only offered for something when its price is set;
 * nothing is ever converted automatically, because an exchange rate is a
 * pricing decision. */

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
  essentials: ["monthly", "quarterly", "annual"],
  growth: ["quarterly", "annual"],
  elevate: ["quarterly", "annual"],
};

export const INTERVAL_MONTHS: Record<BillingInterval, number> = { monthly: 1, quarterly: 3, annual: 12 };
export const INTERVAL_NAMES: Record<BillingInterval, string> = { monthly: "Monthly", quarterly: "Quarterly", annual: "Annual" };

const DEFAULT_MEMBERSHIP: Record<Tier, Partial<Record<BillingInterval, number>>> = {
  essentials: { monthly: 15, quarterly: 45, annual: 150 },
  growth: { quarterly: 117, annual: 390 },
  elevate: { quarterly: 447, annual: 1490 },
};

const DEFAULT_ONE_OFF: Record<OneOffItem, { standard: number; member: number; starter: number }> = {
  assessment: { standard: 79, member: 79, starter: 79 },
  coaching_single: { standard: 79, member: 59, starter: 99 },
  coaching_pack3: { standard: 199, member: 149, starter: 249 },
};

/** Who is buying, for coaching prices: a member, a client (has bought the
 * assessment or a cohort, or coaching before), or someone starting with
 * coaching. `true`/`false` are kept for member/client. */
export type BuyerLevel = "member" | "client" | "starter";
const levelOf = (v: boolean | BuyerLevel): BuyerLevel => (v === true ? "member" : v === false ? "client" : v);

export function coachingBuyerLevel(input: { member: boolean; boughtAssessment: boolean; boughtCohort?: boolean; hadCoaching: boolean }): BuyerLevel {
  if (input.member) return "member";
  return input.boughtAssessment || input.boughtCohort || input.hadCoaching ? "client" : "starter";
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

export function currencyForCountry(country: string | null | undefined): string | null {
  const c = (country ?? "").trim().toLowerCase();
  if (!c) return null;
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
export function getMembershipPrice(tier: Tier, interval: BillingInterval, currency?: unknown, env: Env = process.env): Price | null {
  if (!tierOffersInterval(tier, interval)) return null;
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

/** The price of a one-time purchase. Coaching depends on who is buying
 * (BuyerLevel); the assessment is the same for everyone. */
export function getOneOffPrice(item: OneOffItem, who: boolean | BuyerLevel, currency?: unknown, env: Env = process.env): Price | null {
  const main = mainCurrency(env);
  const wanted = currency === undefined ? main : cleanCurrency(currency);
  if (!wanted) return null;
  const level = item === "assessment" ? "client" : levelOf(who);
  const base = `PRICE_${item.toUpperCase()}`;
  const keys = level === "member" ? [`${base}_MEMBER`, base] : level === "starter" ? [`${base}_STARTER`, base] : [base];
  for (const key of keys) {
    const amount = readAmount(env[wanted === main ? key : `${key}_${wanted}`]);
    if (amount !== null) return { amount, currency: wanted };
    // A member or starter price that isn't set in settings falls through
    // to its default, not to the standard setting.
    if (wanted === main) return { amount: DEFAULT_ONE_OFF[item][level === "client" ? "standard" : level], currency: main };
  }
  return null;
}

/** Currencies a founder in this country can pay in for membership: their
 * local currency first, but only when EVERY membership price is set in
 * it (so the tier table never mixes currencies), then the main currency. */
export function membershipCurrenciesFor(country: string | null | undefined, env: Env = process.env): string[] {
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
export function oneOffCurrenciesFor(item: OneOffItem, member: boolean | BuyerLevel, country: string | null | undefined, env: Env = process.env): string[] {
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
  return price.currency === "USD" ? `$${amount}` : `${price.currency} ${amount}`;
}

/** "$39/month" style figure for a quarterly or annual price. */
export function perMonth(price: Price, interval: BillingInterval): string {
  const raw = price.amount / INTERVAL_MONTHS[interval];
  const amount = Math.round(raw * 100) / 100;
  return formatPrice({ amount, currency: price.currency });
}
