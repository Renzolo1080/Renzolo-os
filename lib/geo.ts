/**
 * RENZOLO OS™ — Africa market detection for geography-based pricing
 *
 * Pure, framework-independent (no imports) so it's unit-testable. Used
 * to apply the founder's approved $30 1:1 advisor session price to the
 * African market this product is actually launching in, while any
 * founder outside it falls back to the original, still-unapproved
 * placeholder price (see app/api/advisor-session/checkout/route.ts) —
 * that's a real, separate pricing decision to make if/when this product
 * expands beyond Africa, not something to guess at here.
 *
 * profiles.country is free text a founder typed during signup, not a
 * strict ISO code — this is a best-effort name match, not a legal or
 * geolocation-grade determination. Keep Manual: revisit if signups show
 * country values this list doesn't catch.
 */

const AFRICAN_COUNTRIES = [
  "algeria", "angola", "benin", "botswana", "burkina faso", "burundi",
  "cabo verde", "cape verde", "cameroon", "central african republic", "chad",
  "comoros", "congo", "democratic republic of the congo", "dr congo",
  "republic of the congo", "djibouti", "egypt", "equatorial guinea",
  "eritrea", "eswatini", "swaziland", "ethiopia", "gabon", "gambia",
  "ghana", "guinea", "guinea-bissau", "ivory coast", "cote d'ivoire",
  "côte d'ivoire", "kenya", "lesotho", "liberia", "libya", "madagascar",
  "malawi", "mali", "mauritania", "mauritius", "morocco", "mozambique",
  "namibia", "niger", "nigeria", "rwanda", "sao tome and principe",
  "senegal", "seychelles", "sierra leone", "somalia", "south africa",
  "south sudan", "sudan", "tanzania", "togo", "tunisia", "uganda",
  "zambia", "zimbabwe",
];

/** Case-insensitive, tolerant of extra whitespace or a trailing region
 * (e.g. "Lagos, Nigeria" still matches on "nigeria"). Missing/empty
 * input defaults to TRUE (African) rather than false — this product's
 * entire current launch is Africa-only, so a founder who simply hasn't
 * filled in their profile's country field yet is far more likely to be
 * in the target market than not, and the whole point of this discount
 * is accessibility for that market; defaulting to the non-discounted
 * price on missing data would work against that. Revisit this default
 * if/when the product expands to serve non-African founders too. */
export function isAfricanCountry(country: string | null | undefined): boolean {
  if (!country || country.trim().length === 0) return true;
  const normalized = country.trim().toLowerCase();
  return AFRICAN_COUNTRIES.some((name) => normalized === name || normalized.includes(name));
}

export { AFRICAN_COUNTRIES };
