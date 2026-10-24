import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { loadCoachContext } from "@/lib/ai-coach-server";
import { buildCloneContext, cloneConfig, CONSENT_VERSION, greeting, SESSION_SECONDS, sessionLimit, sessionsLeft } from "@/lib/ai-clone";

/** POST /api/ai-clone { consent: true }
 * Starts a "Lorenzo · AI" video session (Tavus) for a member with AI
 * coaching, after consent and within the monthly limit. Returns the
 * conversation link to embed. The Tavus key never leaves the server. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const cfg = cloneConfig();
  if (!cfg.enabled) return NextResponse.json({ error: "Lorenzo · AI isn't switched on yet." }, { status: 503 });

  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).aiCoaching) {
    return NextResponse.json({ error: "Lorenzo · AI comes with Growth, Elevate and the Launch programme." }, { status: 402 });
  }

  const body = (await req.json().catch(() => null)) as { consent?: unknown } | null;
  if (body?.consent !== true) return NextResponse.json({ error: "Please read and agree to how Lorenzo · AI works first." }, { status: 400 });

  const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
  const { data: started } = await supabase.from("ai_clone_sessions").select("created_at").gte("created_at", monthStart);
  const limit = sessionLimit(m.tier);
  if (sessionsLeft(((started ?? []) as any[]).map((r) => r.created_at), limit) <= 0) {
    return NextResponse.json({ error: `You've used this month's ${limit} video sessions. Text coaching is still available below.` }, { status: 429 });
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const name = profile?.full_name ?? "";
  const { context } = await loadCoachContext(supabase, user.id, name);

  let conversation: { conversation_id?: string; conversation_url?: string } = {};
  try {
    const res = await fetch(cfg.apiUrl, {
      method: "POST",
      headers: { "content-type": "application/json", "x-api-key": cfg.apiKey },
      body: JSON.stringify({
        pal_id: cfg.palId,
        ...(cfg.faceId ? { face_id: cfg.faceId } : {}),
        conversation_name: `RENZOLO founder ${user.id.slice(0, 8)}`,
        conversational_context: buildCloneContext(context),
        custom_greeting: greeting(name),
        properties: {
          max_call_duration: SESSION_SECONDS,
          participant_left_timeout: 30,
          participant_absent_timeout: 120,
          enable_closed_captions: true,
        },
      }),
    });
    if (!res.ok) throw new Error(`Tavus ${res.status}`);
    conversation = await res.json();
  } catch (e) {
    console.error("Lorenzo · AI session failed:", e);
    return NextResponse.json({ error: "Lorenzo · AI couldn't start just now. Please try again, or use text coaching below." }, { status: 502 });
  }
  const url = conversation.conversation_url ?? "";
  if (!/^https:\/\/[a-z0-9.-]+\.daily\.co\//i.test(url) || !conversation.conversation_id) {
    return NextResponse.json({ error: "Lorenzo · AI couldn't start just now. Please try again." }, { status: 502 });
  }

  const admin = createAdminClient();
  await admin.from("ai_clone_sessions").insert({ founder_id: user.id, conversation_id: String(conversation.conversation_id).slice(0, 120), consent_version: CONSENT_VERSION, max_seconds: SESSION_SECONDS });

  return NextResponse.json({ url, minutes: SESSION_SECONDS / 60, left: sessionsLeft([...(((started ?? []) as any[]).map((r) => r.created_at)), new Date().toISOString()], limit) });
}
