import type { SupabaseClient } from "@supabase/supabase-js";
import { buildEmail, unsubscribeToken, type EmailKind, type EmailContext } from "./emails";
import { sendEmail, emailConfigured } from "./email-send";

/** Unsubscribe links need EMAIL_LINK_SECRET; without it, follow-up
 * (marketing) emails are not sent at all. */
export function unsubscribeUrl(appUrl: string, email: string): string | null {
  const secret = process.env.EMAIL_LINK_SECRET;
  if (!secret) return null;
  return `${appUrl}/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubscribeToken(email, secret)}`;
}

/** Sends one email of a kind to an address at most once (email_log), and
 * never to an address that has unsubscribed — except the results email,
 * which the founder asked for on the spot. Returns whether it was sent. */
export async function sendOnce(admin: SupabaseClient, kind: EmailKind, to: string, ctx: Omit<EmailContext, "unsubscribeUrl">, leadId: string | null): Promise<boolean> {
  if (!emailConfigured()) return false;
  const email = to.trim().toLowerCase();
  const unsub = unsubscribeUrl(ctx.appUrl, email);
  if (kind !== "results") {
    if (!unsub) return false;
    const { data: blocked } = await admin.from("email_unsubscribes").select("email").eq("email", email).maybeSingle();
    if (blocked) return false;
  }
  // Claim the slot first, so two runs can't send the same email twice.
  const { error: claimError } = await admin.from("email_log").insert({ email, kind, lead_id: leadId });
  if (claimError) return false;
  const msg = buildEmail(kind, { ...ctx, unsubscribeUrl: unsub, postalAddress: process.env.EMAIL_POSTAL_ADDRESS || null });
  const res = await sendEmail({ to: email, ...msg, unsubscribeUrl: unsub ?? undefined });
  if (!res.sent) {
    await admin.from("email_log").delete().eq("email", email).eq("kind", kind);
    return false;
  }
  return true;
}
