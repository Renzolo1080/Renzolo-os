/** The public address of this app, used to build the page Flutterwave
 * sends a founder back to after paying. NEXT_PUBLIC_APP_URL wins when it
 * is set (so production always uses the real domain); otherwise the
 * address the request itself came in on is used, which makes Vercel
 * preview deployments and local runs work with no extra setting. */
export function getAppUrl(requestUrl: string, env: Record<string, string | undefined> = process.env): string {
  const configured = (env.NEXT_PUBLIC_APP_URL ?? "").trim().replace(/\/+$/, "");
  if (/^https?:\/\//.test(configured)) return configured;
  return new URL(requestUrl).origin;
}
