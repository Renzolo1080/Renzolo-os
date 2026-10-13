/** Sends one email through Resend (https://resend.com), using its HTTP API
 * directly. Needs RESEND_API_KEY and EMAIL_FROM (an address on a domain
 * verified in Resend, e.g. "Founder Trajectory <hello@renzoloenterprises.com>").
 * Without them nothing is sent and the caller carries on: email must never
 * block a founder from seeing their results. */

type FetchLike = (url: string, init?: RequestInit) => Promise<Response>;

export function emailConfigured(env: Record<string, string | undefined> = process.env): boolean {
  return !!env.RESEND_API_KEY && !!env.EMAIL_FROM;
}

export async function sendEmail(
  msg: { to: string; subject: string; html: string; text: string; unsubscribeUrl?: string },
  opts: { env?: Record<string, string | undefined>; fetchImpl?: FetchLike } = {}
): Promise<{ sent: boolean; error?: string }> {
  const env = opts.env ?? process.env;
  if (!emailConfigured(env)) return { sent: false, error: "email not configured" };
  const headers: Record<string, string> = {};
  if (msg.unsubscribeUrl) {
    headers["List-Unsubscribe"] = `<${msg.unsubscribeUrl}>`;
    headers["List-Unsubscribe-Post"] = "List-Unsubscribe=One-Click";
  }
  try {
    const res = await (opts.fetchImpl ?? (fetch as FetchLike))("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: env.EMAIL_FROM,
        to: [msg.to],
        subject: msg.subject,
        html: msg.html,
        text: msg.text,
        reply_to: env.EMAIL_REPLY_TO || undefined,
        headers: Object.keys(headers).length ? headers : undefined,
      }),
    });
    if (!res.ok) return { sent: false, error: `Resend returned ${res.status}` };
    return { sent: true };
  } catch (e) {
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}
