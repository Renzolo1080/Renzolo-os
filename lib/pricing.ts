import { isAfricanCountry } from "./geo";

/** All prices live here and are read from environment settings, so a
 * price change is a settings change in Vercel (plus a redeploy), never a
 * code change.
 *
 * The defaults below are the same PLACEHOLDER numbers the app has always
 * carried — $9/month and $90/year have NOT been approved as launch
 * pricing. The $30 Africa advisor-session price is founder-approved; the
 * $49 non-Africa price is still a placeholder. */

export type BillingInterval = "monthly" | "annual";

export interface Price {
  amount: number;
  currency: string;
}

type Env = Record<string, string | undefined>;

/** Reads a positive number from settings, falling back to the default if
 * the setting is missing or not a usable price (blank, zero, negative,
 * or not a number) — a typo in a setting must never produce a free or
 * negative charge. */
function readAmount(raw: string | undefined, fallback: number): number {
  if (raw === undefined || raw.trim() === "") return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function readCurrency(raw: string | undefined): string {
  const c = (raw ?? "").trim().toUpperCase();
  return /^[A-Z]{3}$/.test(c) ? c : "USD";
}

export function getSubscriptionPrice(interval: BillingInterval, env: Env = process.env): Price {
  const currency = readCurrency(env.SUBSCRIPTION_CURRENCY);
  return interval === "monthly"
    ? { amount: readAmount(env.SUBSCRIPTION_MONTHLY_PRICE, 9), currency }
    : { amount: readAmount(env.SUBSCRIPTION_ANNUAL_PRICE, 90), currency };
}

/** Geography-based: a founder in Africa (or with no country set — see
 * lib/geo.ts for why that defaults to Africa) gets the accessible price. */
export function getAdvisorSessionPrice(country: string | null | undefined, env: Env = process.env): Price {
  const currency = readCurrency(env.ADVISOR_SESSION_CURRENCY);
  return isAfricanCountry(country)
    ? { amount: readAmount(env.ADVISOR_SESSION_PRICE_AFRICA, 30), currency }
    : { amount: readAmount(env.ADVISOR_SESSION_PRICE_OTHER, 49), currency };
}

export function isBillingInterval(value: unknown): value is BillingInterval {
  return value === "monthly" || value === "annual";
}

export function formatPrice(price: Price): string {
  const amount = Number.isInteger(price.amount) ? String(price.amount) : price.amount.toFixed(2);
  return price.currency === "USD" ? `$${amount}` : `${price.currency} ${amount}`;
}
