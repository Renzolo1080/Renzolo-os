"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MAX_COMMITMENTS, SESSION_KINDS, type CoachNotes, type Commitment } from "@/lib/coaching";
import { ReportMarkdown } from "@/components/ReportMarkdown";

const field = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

const GROW: { key: keyof CoachNotes; label: string; hint: string }[] = [
  { key: "goal", label: "Goal", hint: "What does the founder want from this session, and from the next 90 days?" },
  { key: "reality", label: "Reality", hint: "Where things actually stand: numbers, evidence, what's been tried." },
  { key: "options", label: "Options", hint: "The realistic choices, and what each would take." },
  { key: "will", label: "Will", hint: "What they've decided to do, by when, and what might get in the way." },
  { key: "private", label: "Private notes", hint: "Only coaches see these." },
];

export function CoachSession({
  id,
  status,
  kind: initialKind,
  scheduledAt,
  initialNotes,
  initialSummary,
  initialCommitments,
  initialBrief,
  areas,
}: {
  id: string;
  status: string;
  kind: string;
  scheduledAt: string | null;
  initialNotes: CoachNotes;
  initialSummary: string;
  initialCommitments: Commitment[];
  initialBrief: string | null;
  areas: { key: string; label: string }[];
}) {
  const router = useRouter();
  const [kind, setKind] = useState(initialKind);
  const [when, setWhen] = useState(scheduledAt ? toLocalInput(scheduledAt) : "");
  const [notes, setNotes] = useState(initialNotes);
  const [summary, setSummary] = useState(initialSummary);
  const [commitments, setCommitments] = useState<Commitment[]>(initialCommitments);
  const [brief, setBrief] = useState(initialBrief);
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const done = status === "completed" || status === "canceled";

  async function run(key: string, fn: () => Promise<string | void>) {
    setBusy(key);
    setMsg(null);
    try {
      const text = await fn();
      if (text) setMsg({ ok: true, text });
      router.refresh();
    } catch (e: any) {
      setMsg({ ok: false, text: e.message });
    } finally {
      setBusy(null);
    }
  }
  const save = () => send(`/api/coaching/sessions/${id}`, "PATCH", { kind, notes, summary, commitments });

  return (
    <div className="space-y-6">
      <section className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-5 shadow-sm">
        <label className="text-sm font-medium">
          Session type
          <select className={field} value={kind} onChange={(e) => setKind(e.target.value)} disabled={done}>
            {SESSION_KINDS.map((k) => (
              <option key={k.value} value={k.value}>
                {k.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-sm font-medium">
          Date and time
          <input type="datetime-local" className={field} value={when} onChange={(e) => setWhen(e.target.value)} disabled={done} />
        </label>
        {!done && (
          <button
            type="button"
            disabled={!when || busy !== null}
            onClick={() => run("time", async () => (await send(`/api/coaching/sessions/${id}`, "PATCH", { scheduledAt: new Date(when).toISOString(), kind }), "Time saved."))}
            className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {busy === "time" ? "Saving…" : status === "requested" ? "Mark scheduled" : "Update time"}
          </button>
        )}
      </section>

      <section className="rounded-2xl bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-semibold text-navy">Prep brief</h2>
          <button
            type="button"
            disabled={busy !== null}
            onClick={() =>
              run("brief", async () => {
                const d = await send(`/api/coaching/sessions/${id}/brief`, "POST");
                setBrief(d.brief);
              })
            }
            className="rounded-lg border border-navy px-3 py-1.5 text-sm font-semibold text-navy disabled:opacity-50"
          >
            {busy === "brief" ? "Drafting… (about 30 seconds)" : brief ? "Redraft brief" : "Draft prep brief"}
          </button>
        </div>
        {brief ? <ReportMarkdown markdown={brief} /> : <p className="mt-2 text-sm text-ink-soft">An AI-drafted one-pager from the founder's report, plan, review, goals, monthly update and past sessions, with suggested GROW questions.</p>}
      </section>

      <section className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Session notes (GROW)</h2>
        {GROW.map((g) => (
          <label key={g.key} className="block text-sm font-medium">
            {g.label} <span className="font-normal text-ink-soft">· {g.hint}</span>
            <textarea className={field} rows={g.key === "private" ? 2 : 3} value={notes[g.key]} onChange={(e) => setNotes({ ...notes, [g.key]: e.target.value })} />
          </label>
        ))}
        <label className="block text-sm font-medium">
          Summary for the founder <span className="font-normal text-ink-soft">· they see this</span>
          <textarea className={field} rows={3} value={summary} onChange={(e) => setSummary(e.target.value)} />
        </label>
      </section>

      <section className="space-y-3 rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Commitments ({commitments.length} of {MAX_COMMITMENTS})</h2>
        <p className="text-xs text-ink-soft">Commitments with a business area are added to the founder's plan as actions when you complete the session.</p>
        {commitments.map((c, i) => (
          <div key={c.id} className="grid gap-2 rounded-lg border border-gray-200 p-3 sm:grid-cols-[1fr_150px_170px_24px]">
            <input className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm" aria-label="Commitment" placeholder="What they'll do" value={c.text} onChange={(e) => setCommitments(commitments.map((x, j) => (j === i ? { ...x, text: e.target.value } : x)))} />
            <input type="date" className="min-w-0 rounded-lg border border-gray-300 px-2 py-2 text-sm" aria-label="Due" value={c.due} onChange={(e) => setCommitments(commitments.map((x, j) => (j === i ? { ...x, due: e.target.value } : x)))} />
            <select className="min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm" aria-label="Business area" value={c.area} onChange={(e) => setCommitments(commitments.map((x, j) => (j === i ? { ...x, area: e.target.value } : x)))}>
              <option value="">No area (not added to plan)</option>
              {areas.map((a) => (
                <option key={a.key} value={a.key}>
                  {a.label}
                </option>
              ))}
            </select>
            <button type="button" aria-label="Remove commitment" className="text-red-600" onClick={() => setCommitments(commitments.filter((_, j) => j !== i))}>
              ✕
            </button>
          </div>
        ))}
        {commitments.length < MAX_COMMITMENTS && (
          <button type="button" className="text-sm font-semibold text-teal" onClick={() => setCommitments([...commitments, { id: `c${Date.now().toString(36)}`, text: "", due: "", status: "open", area: "" }])}>
            + Add a commitment
          </button>
        )}
      </section>

      {msg && <p className={`text-sm ${msg.ok ? "text-teal" : "text-red-600"}`}>{msg.text}</p>}
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={busy !== null} onClick={() => run("save", async () => (await save(), "Saved."))} className="rounded-lg border border-navy px-5 py-2.5 font-semibold text-navy disabled:opacity-50">
          {busy === "save" ? "Saving…" : "Save notes"}
        </button>
        {!done && (
          <button
            type="button"
            disabled={busy !== null || !summary.trim()}
            title={!summary.trim() ? "Add a summary for the founder first" : undefined}
            onClick={() =>
              run("complete", async () => {
                await save();
                const d = await send(`/api/coaching/sessions/${id}`, "PATCH", { complete: true });
                return `Session completed.${d.addedToPlan ? ` ${d.addedToPlan} commitment${d.addedToPlan > 1 ? "s" : ""} added to their plan.` : ""}`;
              })
            }
            className="rounded-lg bg-brand px-5 py-2.5 font-semibold text-on-brand disabled:opacity-50"
          >
            {busy === "complete" ? "Completing…" : "Complete session"}
          </button>
        )}
        {status === "scheduled" && (
          <button type="button" disabled={busy !== null} onClick={() => run("cancel", async () => (await send(`/api/coaching/sessions/${id}`, "PATCH", { cancel: true }), "Session cancelled."))} className="text-sm text-red-600">
            Cancel session
          </button>
        )}
      </div>
    </div>
  );
}

function toLocalInput(iso: string) {
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
