import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { chatClaude } from "@/lib/anthropic";
import { buildCoachSystem, CHECKIN_PROMPT, INSIGHTS_PROMPT, WEB_SEARCHES, dailyLimit, historyFor, MAX_MESSAGE_CHARS, parseCoachReply, remainingToday, threadTitle } from "@/lib/ai-coach";
import { loadCoachContext } from "@/lib/ai-coach-server";

export const maxDuration = 90;

/** POST /api/ai-coach { threadId?, message?, checkin?, insights? }
 * Sends the founder's message (or a weekly check-in request) to the AI
 * coach and returns its reply. Growth and Elevate members. Limited per
 * day (lib/ai-coach.ts DAILY_LIMITS); a failed reply isn't counted. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).aiCoaching) {
    return NextResponse.json({ error: "AI coaching comes with Growth, Elevate and the Launch programme." }, { status: 402 });
  }

  const body = (await req.json().catch(() => null)) as { threadId?: unknown; message?: unknown; checkin?: unknown; insights?: unknown } | null;
  const checkin = body?.checkin === true;
  const insights = !checkin && body?.insights === true;
  const kind: "chat" | "checkin" | "insights" = checkin ? "checkin" : insights ? "insights" : "chat";
  const message = checkin ? CHECKIN_PROMPT : insights ? INSIGHTS_PROMPT : typeof body?.message === "string" ? body.message.trim() : "";
  if (!message) return NextResponse.json({ error: "Type a message first." }, { status: 400 });
  if (message.length > MAX_MESSAGE_CHARS) return NextResponse.json({ error: `Please keep messages under ${MAX_MESSAGE_CHARS} characters.` }, { status: 400 });

  const since = new Date(Date.now() - 864e5).toISOString();
  const { data: sentToday } = await supabase.from("ai_coach_messages").select("created_at").eq("role", "user").gte("created_at", since);
  const limit = dailyLimit(m.tier);
  if (remainingToday((sentToday ?? []).map((r: any) => r.created_at), limit) <= 0) {
    return NextResponse.json({ error: `You've reached today's limit of ${limit} messages. It resets at midnight (UTC).` }, { status: 429 });
  }

  // An existing thread must be the founder's own (row-level security).
  let threadId: string | null = kind === "chat" && typeof body?.threadId === "string" ? body.threadId : null;
  let history: { role: "user" | "assistant"; content: string }[] = [];
  if (threadId) {
    const { data: thread } = await supabase.from("ai_coach_threads").select("id").eq("id", threadId).maybeSingle();
    if (!thread) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    const { data: msgs } = await supabase.from("ai_coach_messages").select("role, content").eq("thread_id", threadId).order("created_at", { ascending: true });
    history = historyFor((msgs ?? []) as any[]);
  }

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle();
  const { context } = await loadCoachContext(supabase, user.id, profile?.full_name ?? "");

  let raw = "";
  let sources: { title: string; url: string }[] = [];
  try {
    const out = await chatClaude(buildCoachSystem(context), [...history, { role: "user", content: message }], insights ? 2500 : 1400, WEB_SEARCHES[kind]);
    raw = out.text;
    sources = out.sources;
  } catch (e) {
    console.error("AI coach failed:", e);
  }
  if (!raw) return NextResponse.json({ error: "Your coach couldn't reply just now. Please try again in a minute." }, { status: 502 });
  const reply = parseCoachReply(raw);

  // Written with the service role: founders read conversations but can't write them.
  const admin = createAdminClient();
  const now = new Date().toISOString();
  if (!threadId) {
    const { data: t, error } = await admin
      .from("ai_coach_threads")
      .insert({ founder_id: user.id, kind, title: checkin ? `Weekly check-in, ${now.slice(0, 10)}` : insights ? `Insight for my plan, ${now.slice(0, 10)}` : threadTitle(message) })
      .select("id")
      .single();
    if (error || !t) return NextResponse.json({ error: error?.message ?? "Couldn't save the conversation." }, { status: 500 });
    threadId = t.id;
  } else {
    await admin.from("ai_coach_threads").update({ updated_at: now }).eq("id", threadId);
  }
  const { error: msgError } = await admin.from("ai_coach_messages").insert([
    { thread_id: threadId, founder_id: user.id, role: "user", content: message, created_at: now },
    { thread_id: threadId, founder_id: user.id, role: "assistant", content: reply.text || "…", actions: reply.actions, sources, created_at: new Date(Date.now() + 1).toISOString() },
  ]);
  if (msgError) return NextResponse.json({ error: msgError.message }, { status: 500 });

  return NextResponse.json({ threadId, reply: reply.text, actions: reply.actions, sources, remaining: remainingToday([...(sentToday ?? []).map((r: any) => r.created_at), now], limit) });
}
