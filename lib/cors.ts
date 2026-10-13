import type { NextRequest } from "next/server";

/** Lets the RENZOLO website (renzoloenterprises.com, and any extra origins
 * in WEBSITE_ORIGINS, comma-separated) post its forms to this app. */
export function corsHeaders(req: NextRequest): Record<string, string> {
  const origin = req.headers.get("origin") ?? "";
  const extra = (process.env.WEBSITE_ORIGINS ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  const allowed = /^https:\/\/([a-z0-9-]+\.)?renzoloenterprises\.(com|net)$/.test(origin) || extra.includes(origin);
  if (!allowed) return {};
  return {
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Max-Age": "86400",
    Vary: "Origin",
  };
}
