/** Where a founder came from: the first ad, post, partner link or
 * referral that brought them. Saved in a first-party cookie on the first
 * visit (first touch wins) and attached to their Snapshot, account and
 * payments, so RENZOLO can see which channels actually produce members.
 * Never shared with anyone; see the privacy policy. */

export const ATTRIBUTION_COOKIE = "rz_attr";
export const ATTRIBUTION_DAYS = 90;

export const ATTRIBUTION_KEYS = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "ref", "gclid", "fbclid"] as const;
export type AttributionKey = (typeof ATTRIBUTION_KEYS)[number];

export interface Attribution {
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  /** Referral code of the founder who shared the link. */
  ref?: string;
  gclid?: string;
  fbclid?: string;
  /** First page they landed on (path only) and when. */
  landing?: string;
  at?: string;
  /** The site that sent them, if any (host only). */
  referrer?: string;
}

const clean = (v: unknown, max = 120): string | undefined => {
  if (typeof v !== "string") return undefined;
  const s = v.trim().slice(0, max);
  return s && /^[\w .:@/+\-|~%]+$/.test(s) ? s : undefined;
};

/** Reads the tracking values from a URL's query string. Returns null when
 * the URL carries none (so a plain visit doesn't overwrite anything). */
export function attributionFromUrl(search: string, landing: string, referrer: string | null, now = new Date()): Attribution | null {
  const params = new URLSearchParams(search);
  const out: Attribution = {};
  for (const k of ATTRIBUTION_KEYS) {
    const v = clean(params.get(k) ?? undefined, k === "gclid" || k === "fbclid" ? 200 : 120);
    if (v) out[k] = k === "ref" ? v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16) || undefined : v;
  }
  let refHost: string | undefined;
  try {
    refHost = referrer ? new URL(referrer).host.slice(0, 120) : undefined;
  } catch {
    refHost = undefined;
  }
  const hasAny = ATTRIBUTION_KEYS.some((k) => out[k]);
  if (!hasAny && !refHost) return null;
  out.landing = clean(landing, 200);
  out.at = now.toISOString();
  if (refHost) out.referrer = refHost;
  return out;
}

export function encodeAttribution(a: Attribution): string {
  return encodeURIComponent(JSON.stringify(a));
}

/** Parses and re-validates the cookie value (it comes from the browser,
 * so it's checked again on the server). */
export function decodeAttribution(raw: string | null | undefined): Attribution | null {
  if (!raw) return null;
  try {
    const obj = JSON.parse(decodeURIComponent(raw));
    if (!obj || typeof obj !== "object") return null;
    const out: Attribution = {};
    for (const k of [...ATTRIBUTION_KEYS, "landing", "at", "referrer"] as const) {
      const v = clean((obj as any)[k], 200);
      if (v) (out as any)[k] = v;
    }
    if (out.ref) out.ref = out.ref.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 16) || undefined;
    return Object.keys(out).length ? out : null;
  } catch {
    return null;
  }
}

/** A referral code: 8 characters, no look-alike letters or digits. */
export function newReferralCode(random: () => number = Math.random): string {
  const alphabet = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 8; i++) s += alphabet[Math.floor(random() * alphabet.length)];
  return s;
}
