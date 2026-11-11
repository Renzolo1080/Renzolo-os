import { headers } from "next/headers";
import { ipCountryFrom, regionFor, type Region } from "./region";

/** The price region for this request: the founder's profile country (if
 * signed in) and the country Vercel reports for their connection. */
export async function requestRegion(profileCountry?: string | null): Promise<Region> {
  const h = await headers();
  return regionFor(profileCountry ?? null, ipCountryFrom(h));
}
