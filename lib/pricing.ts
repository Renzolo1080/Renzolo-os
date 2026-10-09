import { isAfricanCountry } from "./geo";

/** All prices live here and are read from environment settings, so a
 * price change is a settings change in Vercel (plus a redeploy), never a
 * code change.
 *
 * The defaults below are the same PLACEHOLDER numbers the app has always
 * carried — $9/month and $90/year have NOT been approved as launch
 * pricing. The $30 Africa advisor-session price is founder-approved; the
 * $49 non-Africa price is still a placeholder.
 *
 * WHY THERE ARE LOCAL-CURRENCY PRICES. Flutterwave decides which payment
 * methods to show from the currency of the charge. Its documentation
 * lists M-Pesa for Kenyan shillings (KES) only, and for a US-dollar
 * charge lists card and bank account. So a founder in Kenya charged in
 * USD will not be offered M-Pesa. To take mobile money, a price has to be
 * set in that country's currency:
 *
 *   SUBSCRIPTION_MONTHLY_PRICE_KES=1200
 *   SUBSCRIPTION_ANNUAL_PRICE_KES=12000
 *   ADVISOR_SESSION_PRICE_KES=4000
 *
 * A local-currency price is only offered when it is set; nothing is ever
 * converted automatically, because an exchange rate is a pricing decision. */

export type BillingInterval = "monthly" | "annual";

export interface Price {
  amount: number;
  currency: string;
}

type Env = Record<string, string | undefined>;

/** Countries whose founders can be offered a local-currency price, and
 * the currency to offer. Matched the same forgiving way as lib/geo.ts
 * (case-insensitive, anywhere in the text: "Nairobi, Kenya" matches). */
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

/** Reads a positive number from settings; null if the setting is missing
 * or not a usable price (blank, zero, negative, or not a number) — a typo
 * in a setting must never produce a free or negative charge. */
function readAmount(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function readCurrency(raw: string | undefined): string {
  const c = (raw ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : "USD";
}

function cleanCurrency(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const c = raw.trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : null;
}

/** The subscription price in the main currency (SUBSCRIPTION_CURRENCY,
 * USD unless changed). Always available. */
export function getSubscriptionPrice(interval: BillingInterval, env: Env = process.env): Price {
  const currency = readCurrency(env.SUBSCRIPTION_CURRENCY);
  return interval === "monthly"
    ? { amount: readAmount(env.SUBSCRIPTION_MONTHLY_PRICE) ?? 9, currency }
    : { amount: readAmount(env.SUBSCRIPTION_ANNUAL_PRICE) ?? 90, currency };
}

/** The subscription price in a specific currency, or null if no price has
 * been set for it. Asking for the main currency returns the main price. */
export function getSubscriptionPriceIn(interval: BillingInterval, currency: unknown, env: Env = process.env): Price | null {
  const wanted = cleanCurrency(currency);
  if (!wanted) return null;
  const main = getSubscriptionPrice(interval, env);
  if (wanted === main.currency) return main;
  const amount = readAmount(env[`SUBSCRIPTION_${interval === "monthly" ? "MONTHLY" : "ANNUAL"}_PRICE_${wanted}`]);
  return amount === null ? null : { amount, currency: wanted };
}

/** The currencies a founder in this country can choose between on the
 * subscribe page: their local currency first (only if BOTH a monthly and
 * an annual price are set for it), then the main currency. */
export function subscriptionCurrenciesFor(country: string | null | undefined, env: Env = process.env): string[] {
  const main = getSubscriptionPrice("monthly", env).currency;
  const local = currencyForCountry(country);
  const offered: string[] = [];
  if (local && local !== main && getSubscriptionPriceIn("monthly", local, env) && getSubscriptionPriceIn("annual", local, env)) {
    offered.push(local);
  }
  offered.push(main);
  return offered;
}

/** Advisor-session price. A founder whose country has a local-currency
 * price set (ADVISOR_SESSION_PRICE_KES etc.) is charged that; otherwise
 * geography-based in the main currency: a founder in Africa (or with no
 * country set — see lib/geo.ts for why that defaults to Africa) gets the
 * accessible price. */
export function getAdvisorSessionPrice(country: string | null | undefined, env: Env = process.env): Price {
  const local = currencyForCountry(country);
  if (local) {
    const amount = readAmount(env[`ADVISOR_SESSION_PRICE_${local}`]);
    if (amount !== null) return { amount, currency: local };
  }
  const currency = readCurrency(env.ADVISOR_SESSION_CURRENCY);
  return isAfricanCountry(country)
    ? { amount: readAmount(env.ADVISOR_SESSION_PRICE_AFRICA) ?? 30, currency }
    : { amount: readAmount(env.ADVISOR_SESSION_PRICE_OTHER) ?? 49, currency };
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

export function formatPrice(price: Price): string {
  const amount = Number.isInteger(price.amount)
    ? price.amount.toLocaleString("en-US")
    : price.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return price.currency === "USD" ? `$${amount}` : `${price.currency} ${amount}`;
}
