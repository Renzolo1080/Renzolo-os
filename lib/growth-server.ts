import { randomBytes } from "crypto";
import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";
import { ATTRIBUTION_COOKIE, decodeAttribution, newReferralCode, type Attribution } from "./attribution";

/** Where this visitor came from, from the first-party cookie (lib/attribution.ts). */
export async function readAttribution(): Promise<Attribution | null> {
  try {
    return decodeAttribution((await cookies()).get(ATTRIBUTION_COOKIE)?.value);
  } catch {
    return null;
  }
}

/** A random token for a share link (letters and digits). */
export function newToken(length = 16): string {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789";
  const bytes = randomBytes(length);
  let s = "";
  for (let i = 0; i < length; i++) s += alphabet[bytes[i] % alphabet.length];
  return s;
}

/** Saves a shareable score and returns its token. Only the score and tier
 * (and the sharer's referral code, if they have an account) are kept. */
export async function createShareToken(
  admin: SupabaseClient,
  s: { score: number; tier: string; planScore: number | null; referralCode: string | null; source: "snapshot" | "member" }
): Promise<string | null> {
  const token = newToken();
  const { error } = await admin.from("shared_scores").insert({
    token,
    venture_score: s.score,
    venture_tier: s.tier,
    plan_score: s.planScore,
    referral_code: s.referralCode,
    source: s.source,
  });
  return error ? null : token;
}

/** Once per founder: give them a referral code, and record where they came
 * from and who referred them (never themselves). Uses the service role,
 * because founders can't edit these columns. Returns their referral code. */
export async function ensureProfileExtras(
  admin: SupabaseClient,
  founderId: string,
  attribution: Attribution | null,
  marketingConsent?: boolean
): Promise<string | null> {
  const { data: p } = await admin.from("profiles").select("referral_code, referred_by, attribution, marketing_consent").eq("id", founderId).maybeSingle();
  if (!p) return null;
  const update: Record<string, unknown> = {};
  if (!p.attribution && attribution) update.attribution = attribution;
  if (!p.referred_by && attribution?.ref && attribution.ref !== p.referral_code) update.referred_by = attribution.ref;
  if (marketingConsent && !p.marketing_consent) update.marketing_consent = true;
  let code: string | null = p.referral_code ?? null;
  for (let attempt = 0; !code && attempt < 5; attempt++) {
    const candidate = newReferralCode();
    const { error } = await admin.from("profiles").update({ ...update, referral_code: candidate }).eq("id", founderId).is("referral_code", null);
    if (!error) {
      code = candidate;
      return code;
    }
  }
  if (Object.keys(update).length) await admin.from("profiles").update(update).eq("id", founderId);
  return code;
}

/** The public address of the app, for links in emails and share links. */
export function publicAppUrl(fallback?: string): string {
  const v = process.env.NEXT_PUBLIC_APP_URL;
  if (v && /^https?:\/\//.test(v)) return v.replace(/\/+$/, "");
  return (fallback ?? "https://renzolo-os.vercel.app").replace(/\/+$/, "");
}
