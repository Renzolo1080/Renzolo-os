import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { checkUnsubscribeToken } from "@/lib/emails";

/** POST /api/unsubscribe (form or one-click from the email's
 * List-Unsubscribe header) — stops follow-up emails to that address. */
export async function POST(req: NextRequest) {
  const url = req.nextUrl;
  let email = url.searchParams.get("e") ?? "";
  let token = url.searchParams.get("t") ?? "";
  const ct = req.headers.get("content-type") ?? "";
  if (ct.includes("application/x-www-form-urlencoded") || ct.includes("multipart/form-data")) {
    const form = await req.formData().catch(() => null);
    email = String(form?.get("e") ?? email);
    token = String(form?.get("t") ?? token);
  }
  email = email.trim().toLowerCase();
  if (!checkUnsubscribeToken(email, token, process.env.EMAIL_LINK_SECRET ?? "")) {
    return NextResponse.json({ error: "That unsubscribe link isn't valid." }, { status: 400 });
  }
  await createAdminClient().from("email_unsubscribes").upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
  if (ct.includes("form")) return NextResponse.redirect(new URL("/unsubscribe?done=1", req.url), 303);
  return NextResponse.json({ ok: true });
}
