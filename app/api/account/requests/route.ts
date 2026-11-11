import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { sendEmail } from "@/lib/email-send";
import { REQUEST_LABELS, RESPONSE_DAYS, isRequestKind } from "@/lib/privacy";

/** Records a privacy request (deletion, human review of a score, correction,
 * objection) and emails the privacy contact so it is answered within 30
 * days. Deletion is confirmed and carried out by a person, so nothing is
 * lost by a mistaken click. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  let body: { kind?: unknown; details?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    // handled below
  }
  if (!isRequestKind(body?.kind)) return NextResponse.json({ error: "Choose what you'd like us to do." }, { status: 400 });
  const kind = body.kind;
  const details = typeof body.details === "string" ? body.details.trim().slice(0, 2000) : null;
  if (kind === "deletion" && details !== "DELETE") {
    return NextResponse.json({ error: "Type DELETE to confirm." }, { status: 400 });
  }

  const { error } = await supabase.from("data_requests").insert({ founder_id: user.id, email: user.email, kind, details: kind === "deletion" ? null : details });
  if (error) {
    console.error("Couldn't save data request:", error.message);
    return NextResponse.json({ error: "Couldn't send your request. Please try again or email us." }, { status: 500 });
  }

  const to = process.env.PRIVACY_EMAIL || process.env.COACH_EMAIL;
  if (to) {
    const line = `${REQUEST_LABELS[kind]} from ${user.email} (account ${user.id}). Answer within ${RESPONSE_DAYS} days.`;
    await sendEmail({
      to,
      subject: `Privacy request: ${REQUEST_LABELS[kind]}`,
      text: `${line}\n\n${details && kind !== "deletion" ? `Details: ${details}` : ""}`,
      html: `<p>${line}</p>${details && kind !== "deletion" ? `<p>Details: ${details.replace(/</g, "&lt;")}</p>` : ""}`,
    });
  }
  return NextResponse.json({ ok: true, respondWithinDays: RESPONSE_DAYS });
}
