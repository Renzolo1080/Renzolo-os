/** Regional pricing (approved by Lorenzo, Nov 11 2026). Two price zones:
 *
 *   africa — founders in Africa: the Africa prices ($40 assessment, the
 *            Nov 1 membership prices), in their local currency where one is
 *            set, otherwise in US dollars;
 *   intl   — everyone else: the US, UK and EU prices, in US dollars,
 *            pounds or euros.
 *
 * The zone comes from two signals: the country in the founder's profile
 * and the country Vercel reports for their connection (the
 * x-vercel-ip-country header). If either says outside Africa, or neither
 * is known, the founder gets the international prices: the higher price
 * wins, so the Africa price can't be claimed from elsewhere by editing a
 * profile. Each founder is only ever shown the prices for their own zone. */

export type Zone = "africa" | "intl";

export interface Region {
  zone: Zone;
  /** The currency international prices are shown in (USD, GBP or EUR). */
  intlCurrency: "USD" | "GBP" | "EUR";
}

/** ISO 3166-1 alpha-2 codes and English names of African countries. */
const AFRICA: [string, string[]][] = [
  ["DZ", ["algeria"]], ["AO", ["angola"]], ["BJ", ["benin"]], ["BW", ["botswana"]], ["BF", ["burkina faso"]], ["BI", ["burundi"]],
  ["CV", ["cabo verde", "cape verde"]], ["CM", ["cameroon"]], ["CF", ["central african republic"]], ["TD", ["chad"]], ["KM", ["comoros"]],
  ["CD", ["democratic republic of the congo", "dr congo", "drc", "congo-kinshasa"]], ["CG", ["republic of the congo", "congo-brazzaville", "congo"]],
  ["CI", ["cote d'ivoire", "côte d'ivoire", "ivory coast"]], ["DJ", ["djibouti"]], ["EG", ["egypt"]], ["GQ", ["equatorial guinea"]], ["ER", ["eritrea"]],
  ["SZ", ["eswatini", "swaziland"]], ["ET", ["ethiopia"]], ["GA", ["gabon"]], ["GM", ["gambia"]], ["GH", ["ghana"]], ["GN", ["guinea"]],
  ["GW", ["guinea-bissau"]], ["KE", ["kenya"]], ["LS", ["lesotho"]], ["LR", ["liberia"]], ["LY", ["libya"]], ["MG", ["madagascar"]],
  ["MW", ["malawi"]], ["ML", ["mali"]], ["MR", ["mauritania"]], ["MU", ["mauritius"]], ["MA", ["morocco"]], ["MZ", ["mozambique"]],
  ["NA", ["namibia"]], ["NE", ["niger"]], ["NG", ["nigeria"]], ["RW", ["rwanda"]], ["ST", ["sao tome", "são tomé"]], ["SN", ["senegal"]],
  ["SC", ["seychelles"]], ["SL", ["sierra leone"]], ["SO", ["somalia"]], ["ZA", ["south africa"]], ["SS", ["south sudan"]], ["SD", ["sudan"]],
  ["TZ", ["tanzania"]], ["TG", ["togo"]], ["TN", ["tunisia"]], ["UG", ["uganda"]], ["ZM", ["zambia"]], ["ZW", ["zimbabwe"]],
];

/** EU member states (euro prices). */
const EU: [string, string[]][] = [
  ["AT", ["austria"]], ["BE", ["belgium"]], ["BG", ["bulgaria"]], ["HR", ["croatia"]], ["CY", ["cyprus"]], ["CZ", ["czechia", "czech republic"]],
  ["DK", ["denmark"]], ["EE", ["estonia"]], ["FI", ["finland"]], ["FR", ["france"]], ["DE", ["germany"]], ["GR", ["greece"]], ["HU", ["hungary"]],
  ["IE", ["ireland"]], ["IT", ["italy"]], ["LV", ["latvia"]], ["LT", ["lithuania"]], ["LU", ["luxembourg"]], ["MT", ["malta"]],
  ["NL", ["netherlands", "the netherlands", "holland"]], ["PL", ["poland"]], ["PT", ["portugal"]], ["RO", ["romania"]], ["SK", ["slovakia"]],
  ["SI", ["slovenia"]], ["ES", ["spain"]], ["SE", ["sweden"]],
];

const UK = ["GB", "UK"];
const UK_NAMES = ["united kingdom", "england", "scotland", "wales", "northern ireland", "great britain", "britain", "uk"];

/** The ISO code for a country given as a code ("KE") or a name ("Nairobi, Kenya"). */
export function countryCode(raw: string | null | undefined): string | null {
  const v = (raw ?? "").trim();
  if (!v) return null;
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase() === "UK" ? "GB" : v.toUpperCase();
  const t = v.toLowerCase();
  if (UK_NAMES.some((n) => t === n || t.endsWith(`, ${n}`) || t.includes(n) && n.length > 3)) return "GB";
  // Longest names first, so "South Africa" isn't read as something shorter
  // and "Democratic Republic of the Congo" wins over "Congo".
  const all = [...AFRICA, ...EU].flatMap(([code, names]) => names.map((n) => [code, n] as const)).sort((a, b) => b[1].length - a[1].length);
  const hit = all.find(([, n]) => t.includes(n));
  return hit ? hit[0] : "??";
}

export function isAfrican(code: string | null): boolean {
  return !!code && AFRICA.some(([c]) => c === code);
}

function intlCurrencyFor(code: string | null): Region["intlCurrency"] {
  if (code && UK.includes(code)) return "GBP";
  if (code && EU.some(([c]) => c === code)) return "EUR";
  return "USD";
}

/** The founder's price zone from their profile country and their
 * connection's country (either may be missing). The higher price wins. */
export function regionFor(profileCountry: string | null | undefined, ipCountry: string | null | undefined): Region {
  const p = countryCode(profileCountry);
  const ip = countryCode(ipCountry);
  const known = [p, ip].filter((c): c is string => !!c);
  const zone: Zone = known.length > 0 && known.every(isAfrican) ? "africa" : "intl";
  // Show pounds or euros by where they are now, else by their profile.
  const intlCurrency = intlCurrencyFor(ip && ip !== "??" ? ip : p);
  return { zone, intlCurrency };
}

/** Vercel's country header for the request (ISO code), if any. */
export function ipCountryFrom(headers: { get(name: string): string | null }): string | null {
  const v = headers.get("x-vercel-ip-country");
  return v && /^[A-Za-z]{2}$/.test(v) ? v.toUpperCase() : null;
}

/** The small print shown wherever prices are. */
export const REGION_NOTE = "Prices are set for each region and shown in your local currency.";
