import { NextRequest, NextResponse } from "next/server";
import { getMembershipPrice, getOneOffPrice, formatPrice, perMonth, currencyForCountry, type Tier } from "@/lib/pricing";
import { ipCountryFrom, regionFor } from "@/lib/region";

/** GET /api/prices — the prices for the visitor's region, for the public
 * website (renzoloenterprises.com), which can't work out a region itself.
 * Only the visitor's own region is returned (lib/region.ts). */
export async function GET(req: NextRequest) {
  const ip = ipCountryFrom(req.headers);
  const region = regionFor(null, ip);
  const env = process.env;
  // In Africa, the local currency when its prices are set; else US dollars.
  const local = region.zone === "africa" ? currencyForCountry(ip) : null;
  const pick = <T,>(localPrice: T | null, base: T | null) => localPrice ?? base;
  const assessment = pick(local ? getOneOffPrice("assessment", false, local, env, region) : null, getOneOffPrice("assessment", false, undefined, env, region));
  const tiers = {} as Record<Tier, { quarterly: string | null; perMonth: string | null; annual: string | null }>;
  for (const t of ["essentials", "growth", "elevate"] as Tier[]) {
    const lq = local ? getMembershipPrice(t, "quarterly", local, env, region) : null;
    const la = local ? getMembershipPrice(t, "annual", local, env, region) : null;
    const q = lq && la ? lq : getMembershipPrice(t, "quarterly", undefined, env, region);
    const a = lq && la ? la : getMembershipPrice(t, "annual", undefined, env, region);
    tiers[t] = { quarterly: q ? formatPrice(q) : null, perMonth: q ? perMonth(q, "quarterly") : null, annual: a ? formatPrice(a) : null };
  }
  const res = NextResponse.json({ zone: region.zone, assessment: assessment ? formatPrice(assessment) : null, tiers });
  res.headers.set("Access-Control-Allow-Origin", "*");
  res.headers.set("Cache-Control", "private, no-store");
  res.headers.set("Vary", "x-vercel-ip-country");
  return res;
}
