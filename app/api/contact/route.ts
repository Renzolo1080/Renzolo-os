import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { parseContact } from "@/lib/forms";
import { readAttribution } from "@/lib/growth-server";
import { corsHeaders } from "@/lib/cors";

/** POST /api/contact — a message to the RENZOLO team. Public (the website's
 * Contact page posts here too). Read by staff in Supabase. */
export async function POST(req: NextRequest) {
  const headers = corsHeaders(req);
  const body = await req.json().catch(() => null);
  const parsed = parseContact(body);
  if (!parsed.ok) return NextResponse.json({ error: parsed.error === "spam" ? "Thanks!" : parsed.error }, { status: parsed.error === "spam" ? 200 : 400, headers });
  const v = parsed.value;
  const admin = createAdminClient();
  const { data: recent } = await admin
    .from("contact_messages")
    .select("id")
    .eq("email", v.email)
    .gte("created_at", new Date(Date.now() - 2 * 60 * 1000).toISOString())
    .limit(1)
    .maybeSingle();
  if (recent) return NextResponse.json({ ok: true }, { headers });
  const { error } = await admin.from("contact_messages").insert({
    full_name: v.fullName,
    email: v.email,
    company: v.company || null,
    topic: v.topic,
    message: v.message,
    attribution: readAttribution(),
  });
  if (error) return NextResponse.json({ error: "We couldn't send your message. Please try again." }, { status: 500, headers });
  return NextResponse.json({ ok: true }, { headers });
}

export function OPTIONS(req: NextRequest) {
  return new NextResponse(null, { status: 204, headers: corsHeaders(req) });
}
