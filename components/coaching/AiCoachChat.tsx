"use client";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ReportMarkdown } from "@/components/ReportMarkdown";
import { AddToPlan } from "@/components/MarketActions";
import { COACH_DISCLAIMER, type SuggestedAction } from "@/lib/ai-coach";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  actions: SuggestedAction[];
  sources?: { title: string; url: string }[];
}

const AREA: Record<string, string> = {
  customerSegments: "Customer Segments",
  valueProposition: "Value Proposition",
  channels: "Channels",
  customerRelationships: "Customer Relationships",
  revenueStreams: "Revenue Streams",
  keyResources: "Key Resources",
  keyActivities: "Key Activities",
  keyPartnerships: "Key Partnerships",
  costStructure: "Cost Structure",
};

/** The AI coach conversation: messages, suggested plan actions, starters and the weekly check-in. */
export function AiCoachChat({
  threadId: initialThread,
  initialMessages,
  starters,
  remaining: initialRemaining,
  hasPlan,
  checkinDue,
}: {
  threadId: string | null;
  initialMessages: ChatMessage[];
  starters: string[];
  remaining: number;
  hasPlan: boolean;
  checkinDue: boolean;
}) {
  const router = useRouter();
  const [threadId, setThreadId] = useState(initialThread);
  const [messages, setMessages] = useState(initialMessages);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(initialRemaining);
  const endRef = useRef<HTMLDivElement>(null);
  useEffect(() => endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" }), [messages.length, busy]);

  async function send(opts: { message?: string; checkin?: boolean; insights?: boolean }) {
    const text = (opts.message ?? "").trim();
    const special = opts.checkin || opts.insights;
    if (!special && !text) return;
    setBusy(true);
    setError(null);
    const temp: ChatMessage = { id: `tmp${Date.now()}`, role: "user", content: opts.checkin ? "Weekly check-in" : opts.insights ? "Local to global insight for my plan" : text, actions: [] };
    setMessages((m) => [...m, temp]);
    setDraft("");
    try {
      const res = await fetch("/api/ai-coach", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ threadId: special ? null : threadId, message: text, checkin: !!opts.checkin, insights: !!opts.insights }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      setMessages((m) => [...m, { id: `a${Date.now()}`, role: "assistant", content: data.reply, actions: data.actions ?? [], sources: data.sources ?? [] }]);
      setRemaining(data.remaining ?? remaining - 1);
      if (data.threadId !== threadId) {
        setThreadId(data.threadId);
        router.replace(`/ai-coach?t=${data.threadId}`, { scroll: false });
        router.refresh();
      }
    } catch (e: any) {
      setError(e.message);
      setMessages((m) => m.filter((x) => x.id !== temp.id));
      if (!special) setDraft(text);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex min-h-[60vh] flex-col rounded-2xl bg-white shadow-sm">
      <div className="flex-1 space-y-5 p-5">
        {messages.length === 0 && (
          <div>
            {checkinDue && (
              <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-navy p-4 text-white">
                <span className="text-sm">
                  <span className="font-semibold">Your weekly check-in is ready.</span> Two minutes: how you're tracking and the one thing that matters this week.
                </span>
                <button type="button" disabled={busy || remaining <= 0} onClick={() => send({ checkin: true })} className="rounded-lg bg-gold px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                  Start check-in
                </button>
              </div>
            )}
            <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gold/60 bg-cream p-4">
              <span className="text-sm">
                <span className="font-semibold text-navy">Insight for your plan:</span> local, national, regional, international and global, tied to your targets and goals. Takes about a minute.
              </span>
              <button type="button" disabled={busy || remaining <= 0} onClick={() => send({ insights: true })} className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">
                Get my insight
              </button>
            </div>
            <p className="font-semibold text-navy">Ask your coach anything about your business</p>
            <p className="mt-1 text-sm text-ink-soft">Your coach knows your assessment, plan, goals and numbers. Try one of these:</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {starters.map((s) => (
                <button key={s} type="button" disabled={busy} onClick={() => send({ message: s })} className="rounded-full border border-navy px-3 py-1.5 text-left text-sm text-navy hover:bg-navy hover:text-white disabled:opacity-50">
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m) =>
          m.role === "user" ? (
            <div key={m.id} className="ml-auto max-w-[85%] whitespace-pre-line rounded-2xl rounded-br-sm bg-navy px-4 py-2.5 text-sm text-white">
              {m.content}
            </div>
          ) : (
            <div key={m.id} className="max-w-[92%]">
              <div className="rounded-2xl rounded-bl-sm bg-cream px-4 py-1 text-sm">
                <ReportMarkdown markdown={m.content} />
              </div>
              {(m.sources ?? []).length > 0 && (
                <details className="mt-1 text-xs">
                  <summary className="cursor-pointer text-teal">Sources read ({m.sources!.length})</summary>
                  <ul className="mt-1 space-y-0.5 pl-3">
                    {m.sources!.slice(0, 8).map((s) => (
                      <li key={s.url}>
                        <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-teal underline">
                          {s.title}
                        </a>
                      </li>
                    ))}
                  </ul>
                </details>
              )}
              <p className="mt-1 text-[11px] italic text-ink-soft">{COACH_DISCLAIMER}</p>
              {m.actions.length > 0 && (
                <div className="mt-2 space-y-2 rounded-xl border border-gold/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-teal">Suggested actions</p>
                  {m.actions.map((a, i) => (
                    <div key={i} className="flex flex-wrap items-center justify-between gap-2 text-sm">
                      <span>
                        {a.text}
                        <span className="text-ink-soft">
                          {" "}
                          · {AREA[a.area] ?? a.area}
                          {a.due ? ` · by ${a.due}` : ""}
                        </span>
                      </span>
                      {hasPlan ? <AddToPlan area={a.area} text={a.text} alreadyInPlan={false} /> : <a href="/plan" className="text-xs font-semibold text-teal">Start your plan to add it</a>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )
        )}
        {busy && <p className="text-sm text-ink-soft">Your coach is thinking…</p>}
        <div ref={endRef} />
      </div>
      <form
        className="border-t p-4"
        onSubmit={(e) => {
          e.preventDefault();
          send({ message: draft });
        }}
      >
        {error && (
          <p role="alert" className="mb-2 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="flex gap-2">
          <textarea
            className="min-h-[48px] flex-1 resize-y rounded-lg border border-gray-300 px-3 py-2 text-sm"
            rows={2}
            maxLength={2000}
            placeholder={remaining > 0 ? "Ask about your plan, customers, pricing, money, a meeting…" : "You've used today's messages. Back tomorrow."}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send({ message: draft });
              }
            }}
            disabled={busy || remaining <= 0}
            aria-label="Message your coach"
          />
          <button type="submit" disabled={busy || !draft.trim() || remaining <= 0} className="self-end rounded-lg bg-gold px-5 py-3 font-semibold text-white disabled:opacity-50">
            Send
          </button>
        </div>
        <p className="mt-2 text-xs text-ink-soft">
          {remaining} message{remaining === 1 ? "" : "s"} left today. {COACH_DISCLAIMER} For big decisions, book a session with your coach.
        </p>
      </form>
    </div>
  );
}
