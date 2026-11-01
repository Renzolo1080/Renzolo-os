/** RENZOLO OS™ — approximate local-currency amounts shown at checkout.
 *
 * Founders are charged in USD (or in a local currency only where a price
 * has been set for it — see lib/pricing.ts). So that a founder in Lagos,
 * Nairobi or Kingston can see roughly what a USD price means for them,
 * checkout shows an ESTIMATE in their currency at today's rate. It is
 * never used to charge: the bank, card issuer or mobile-money provider
 * sets the final rate.
 *
 * Rates come from ExchangeRate-API's open endpoint (no key, updated daily,
 * attribution required), cached for 12 hours. If it can't be reached, the
 * estimate is simply not shown. No founder data is sent. */

export type Rates = { rates: Record<string, number>; updated: string | null };

/** Countries at launch (Africa and the Caribbean) and the currency shown.
 * Matched case-insensitively anywhere in the profile's country text. */
const DISPLAY_CURRENCIES: { match: string[]; currency: string; name: string }[] = [
  { match: ["nigeria"], currency: "NGN", name: "Nigerian naira" },
  { match: ["kenya"], currency: "KES", name: "Kenyan shilling" },
  { match: ["south africa"], currency: "ZAR", name: "South African rand" },
  { match: ["ghana"], currency: "GHS", name: "Ghanaian cedi" },
  { match: ["uganda"], currency: "UGX", name: "Ugandan shilling" },
  { match: ["rwanda"], currency: "RWF", name: "Rwandan franc" },
  { match: ["tanzania"], currency: "TZS", name: "Tanzanian shilling" },
  { match: ["ethiopia"], currency: "ETB", name: "Ethiopian birr" },
  { match: ["egypt"], currency: "EGP", name: "Egyptian pound" },
  { match: ["morocco"], currency: "MAD", name: "Moroccan dirham" },
  { match: ["zambia"], currency: "ZMW", name: "Zambian kwacha" },
  { match: ["botswana"], currency: "BWP", name: "Botswana pula" },
  { match: ["namibia"], currency: "NAD", name: "Namibian dollar" },
  { match: ["senegal", "ivory coast", "cote d'ivoire", "côte d'ivoire", "benin", "togo", "mali", "burkina faso", "niger"], currency: "XOF", name: "West African CFA franc" },
  { match: ["cameroon", "gabon", "chad", "congo-brazzaville", "republic of the congo", "central african republic", "equatorial guinea"], currency: "XAF", name: "Central African CFA franc" },
  { match: ["jamaica"], currency: "JMD", name: "Jamaican dollar" },
  { match: ["trinidad"], currency: "TTD", name: "Trinidad and Tobago dollar" },
  { match: ["barbados"], currency: "BBD", name: "Barbadian dollar" },
  { match: ["bahamas"], currency: "BSD", name: "Bahamian dollar" },
  { match: ["guyana"], currency: "GYD", name: "Guyanese dollar" },
  { match: ["dominican republic"], currency: "DOP", name: "Dominican peso" },
  { match: ["haiti"], currency: "HTG", name: "Haitian gourde" },
  { match: ["belize"], currency: "BZD", name: "Belize dollar" },
  { match: ["suriname"], currency: "SRD", name: "Surinamese dollar" },
  { match: ["cayman"], currency: "KYD", name: "Cayman Islands dollar" },
  { match: ["antigua", "st kitts", "saint kitts", "st lucia", "saint lucia", "grenada", "st vincent", "saint vincent", "anguilla", "montserrat", "dominica"], currency: "XCD", name: "East Caribbean dollar" },
];

/** The currency to estimate in for a founder's country, or null (USD
 * countries such as the US and Puerto Rico need no estimate). "Dominican
 * Republic" is checked before "Dominica". */
export function displayCurrencyFor(country: string | null | undefined): { currency: string; name: string } | null {
  const c = (country ?? "").trim().toLowerCase();
  if (!c) return null;
  const hit = DISPLAY_CURRENCIES.find((d) => d.match.some((m) => c.includes(m)));
  return hit ? { currency: hit.currency, name: hit.name } : null;
}

/** Whole units for currencies that aren't used with cents; rounded to the
 * nearest 10 above 1,000 so an estimate never looks more exact than it is. */
export function estimate(usd: number, rate: number | undefined, currency: string): string | null {
  if (!rate || !Number.isFinite(rate) || rate <= 0 || !Number.isFinite(usd) || usd <= 0) return null;
  const raw = usd * rate;
  const rounded = raw >= 1000 ? Math.round(raw / 10) * 10 : raw >= 100 ? Math.round(raw) : Math.round(raw * 100) / 100;
  return `${currency} ${rounded.toLocaleString("en-US")}`;
}

/** Parse ExchangeRate-API's response; null if it isn't usable. */
export function parseRates(json: unknown): Rates | null {
  const j = json as { result?: string; base_code?: string; rates?: Record<string, number>; time_last_update_utc?: string } | null;
  if (!j || j.result !== "success" || j.base_code !== "USD" || !j.rates || typeof j.rates !== "object") return null;
  return { rates: j.rates, updated: j.time_last_update_utc ?? null };
}

/** Today's USD rates, cached 12 hours; null if unavailable. */
export async function fetchUsdRates(): Promise<Rates | null> {
  try {
    const res = await fetch("https://open.er-api.com/v6/latest/USD", { next: { revalidate: 43200 } });
    if (!res.ok) return null;
    return parseRates(await res.json());
  } catch {
    return null;
  }
}
