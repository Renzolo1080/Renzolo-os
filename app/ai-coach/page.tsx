import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { dailyLimit, remainingToday, starters } from "@/lib/ai-coach";
import { loadCoachContext } from "@/lib/ai-coach-server";
import { AiCoachChat, type ChatMessage } from "@/components/coaching/AiCoachChat";
import { LorenzoAiPanel } from "@/components/coaching/LorenzoAiPanel";
import { cloneConfig, SESSION_SECONDS, sessionLimit, sessionsLeft } from "@/lib/ai-clone";

export const dynamic = "force-dynamic";

/** The AI coach: conversations and weekly check-ins. */
export default async function AiCoachPage({ searchParams }: { searchParams?: { t?: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const m = await loadMembership(supabase, user.id);
  const ent = entitlements(m.tier, m.purchases.length > 0);

  if (!ent.aiCoaching) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
        <a href="/dashboard" className="text-sm text-teal">
          ← Back to dashboard
        </a>
        <h1 className="mt-3 text-3xl font-bold text-navy">Your coaching team</h1>
        <div className="mt-6 rounded-2xl bg-navy p-6 text-white">
          <p className="text-lg font-semibold">Lorenzo · AI: coaching from Lorenzo&apos;s 20-year playbook, any time</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cream/90">
            <li>Ask about pricing, customers, money, hiring or a meeting, and get answers built on your own assessment, plan and numbers</li>
            <li>Local, national, regional, international and global insight tied to your plan, targets and goals</li>
            <li>A weekly check-in on your goals, overdue actions and the one thing that matters most</li>
            <li>Suggested actions you can add to your plan in one tap</li>
          </ul>
          <a href="/dashboard/subscribe" className="mt-5 inline-block rounded-lg bg-brand px-5 py-3 font-semibold text-on-brand">
            See Growth
          </a>
          <p className="mt-3 text-xs text-cream/70">Included with Growth, Elevate and the Launch programme.</p>
        </div>
      </main>
    );
  }

  const [{ data: threads }, { data: sent }, { data: profile }] = await Promise.all([
    supabase.from("ai_coach_threads").select("id, title, kind, updated_at").order("updated_at", { ascending: false }).limit(30),
    supabase.from("ai_coach_messages").select("created_at").eq("role", "user").gte("created_at", new Date(Date.now() - 864e5).toISOString()),
    supabase.from("profiles").select("full_name").eq("id", user.id).maybeSingle(),
  ]);
  const list = (threads ?? []) as any[];
  const current = searchParams?.t ? list.find((t) => t.id === searchParams.t) ?? null : null;
  const { data: rows } = current ? await supabase.from("ai_coach_messages").select("id, role, content, actions, sources").eq("thread_id", current.id).order("created_at", { ascending: true }) : { data: [] };
  const { gaps, goals, hasPlan } = await loadCoachContext(supabase, user.id, profile?.full_name ?? "");
  const weekAgo = Date.now() - 7 * 864e5;
  const checkinDue = !list.some((t) => t.kind === "checkin" && new Date(t.updated_at).getTime() > weekAgo);
  const remaining = remainingToday(((sent ?? []) as any[]).map((r) => r.created_at), dailyLimit(m.tier));
  const clone = cloneConfig();
  let cloneLeft = 0;
  const cloneLimit = sessionLimit(m.tier);
  if (clone.enabled) {
    const monthStart = new Date(Date.UTC(new Date().getUTCFullYear(), new Date().getUTCMonth(), 1)).toISOString();
    const { data: sessions } = await supabase.from("ai_clone_sessions").select("created_at").gte("created_at", monthStart);
    cloneLeft = sessionsLeft(((sessions ?? []) as any[]).map((r) => r.created_at), cloneLimit);
  }

  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <h1 className="mt-3 text-3xl font-bold text-navy">Your coaching team</h1>
      <p className="mt-1 max-w-2xl text-ink-soft"><strong className="text-navy">Lorenzo · AI</strong> coaches you any time from Lorenzo&apos;s 20-year playbook. It knows your assessment, plan, goals and monthly numbers, and brings local to global insight for your market. When the decision is big, <a href="/coaching" className="font-semibold text-teal underline">book a live session with Lorenzo</a>.</p>
      {clone.enabled && (
        <div className="mt-6">
          <LorenzoAiPanel left={cloneLeft} limit={cloneLimit} minutes={SESSION_SECONDS / 60} />
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[240px_1fr]">
        <nav aria-label="Conversations" className="space-y-2">
          <a href="/ai-coach" className={`block rounded-lg px-3 py-2 text-sm font-semibold ${!current ? "bg-navy text-white" : "border border-navy text-navy"}`}>
            + New conversation
          </a>
          <ul className="space-y-1">
            {list.map((t) => (
              <li key={t.id}>
                <a href={`/ai-coach?t=${t.id}`} className={`block truncate rounded-lg px-3 py-2 text-sm ${current?.id === t.id ? "bg-white font-semibold text-navy shadow-sm" : "hover:bg-white"}`}>
                  {t.kind === "checkin" ? "✓ " : t.kind === "insights" ? "◎ " : ""}
                  {t.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <AiCoachChat
          key={current?.id ?? "new"}
          threadId={current?.id ?? null}
          initialMessages={((rows ?? []) as any[]).map((r) => ({ id: r.id, role: r.role, content: r.content, actions: Array.isArray(r.actions) ? r.actions : [], sources: Array.isArray(r.sources) ? r.sources.filter((x: any) => /^https?:\/\//.test(x?.url ?? "")) : [] })) as ChatMessage[]}
          starters={starters({ gaps, goals, hasPlan })}
          remaining={remaining}
          hasPlan={hasPlan}
          checkinDue={checkinDue}
        />
      </div>
    </main>
  );
}
