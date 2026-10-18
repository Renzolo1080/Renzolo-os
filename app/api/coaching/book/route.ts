import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AGREEMENT_VERSION, bookingLink, sanitizePrep } from "@/lib/coaching";
import { emailConfigured, sendEmail } from "@/lib/email-send";
import { publicAppUrl } from "@/lib/growth-server";

/** POST /api/coaching/book { focus, focusLabel, outcome, wins, challenge }
 * Uses one of the founder's coaching credits (bought, or included in
 * Growth/Elevate) to request a session, with what they want from it.
 * Needs the coaching agreement accepted first. Returns the coach's
 * booking link so the founder can pick a time straight away, and lets
 * the coach know by email when email is set up. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: agreed } = await supabase.from("coaching_agreements").select("version").eq("founder_id", user.id).eq("version", AGREEMENT_VERSION).maybeSingle();
  if (!agreed) return NextResponse.json({ error: "Please accept the coaching agreement first." }, { status: 409 });

  const prep = sanitizePrep(await req.json().catch(() => ({})));
  if (!prep.focusLabel || !prep.outcome) return NextResponse.json({ error: "Choose a focus and say what you want from the session." }, { status: 400 });

  const admin = createAdminClient();
  const { data: sessionId, error } = await admin.rpc("use_coaching_credit", { p_founder: user.id });
  if (error) return NextResponse.json({ error: "Could not book right now. Please try again." }, { status: 500 });
  if (!sessionId) return NextResponse.json({ error: "You have no coaching sessions available to book." }, { status: 409 });
  await admin.from("advisor_sessions").update({ founder_prep: prep, notes: null }).eq("id", sessionId);

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const coachEmail = process.env.COACH_EMAIL;
  if (coachEmail && emailConfigured()) {
    const name = profile?.full_name ?? user.email ?? "A founder";
    const link = `${publicAppUrl()}/coach/${sessionId}`;
    await sendEmail({
      to: coachEmail,
      subject: `Coaching session requested: ${name}`,
      text: `${name} has requested a coaching session.\n\nFocus: ${prep.focusLabel}\nWants: ${prep.outcome}\n\nOpen: ${link}`,
      html: `<p><strong>${escapeHtml(name)}</strong> has requested a coaching session.</p><p>Focus: ${escapeHtml(prep.focusLabel)}<br>Wants: ${escapeHtml(prep.outcome)}</p><p><a href="${link}">Open the session</a></p>`,
    }).catch(() => null);
  }

  return NextResponse.json({ sessionId, bookingUrl: bookingLink(process.env, { name: profile?.full_name, email: user.email }) });
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
