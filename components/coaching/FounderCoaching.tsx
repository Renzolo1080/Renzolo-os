"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { AGREEMENT_POINTS, COMMITMENT_STATUSES, type Commitment } from "@/lib/coaching";

const field = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm";

async function send(url: string, method: string, body?: unknown) {
  const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
  return data;
}

export function AgreementCard() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [checked, setChecked] = useState(false);
  const [error, setError] = useState<string | null>(null);
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm">
      <h2 className="text-xl font-bold text-navy">Your coaching agreement</h2>
      <p className="mt-1 text-sm text-ink-soft">Once, before your first session.</p>
      <ul className="mt-4 space-y-2 text-sm">
        {AGREEMENT_POINTS.map((p) => (
          <li key={p} className="flex gap-2">
            <span className="font-bold text-gold">✓</span>
            <span>{p}</span>
          </li>
        ))}
      </ul>
      <label className="mt-4 flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={checked} onChange={(e) => setChecked(e.target.checked)} />
        <span>I agree to these terms for coaching.</span>
      </label>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <button
        type="button"
        disabled={!checked || busy}
        onClick={async () => {
          setBusy(true);
          setError(null);
          try {
            await send("/api/coaching/agreement", "POST");
            router.refresh();
          } catch (e: any) {
            setError(e.message);
            setBusy(false);
          }
        }}
        className="mt-4 rounded-lg bg-navy px-5 py-2.5 font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Saving…" : "Accept and continue"}
      </button>
    </div>
  );
}

export interface FocusOption {
  value: string;
  label: string;
  group: string;
}

/** Request a session: say what it's for, then pick a time on the coach's calendar. */
export function RequestSession({ options, available }: { options: FocusOption[]; available: number }) {
  const router = useRouter();
  const [focus, setFocus] = useState("");
  const [outcome, setOutcome] = useState("");
  const [wins, setWins] = useState("");
  const [challenge, setChallenge] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState<{ url: string | null } | null>(null);

  if (booked)
    return (
      <div className="rounded-2xl border border-teal bg-white p-6">
        <p className="text-lg font-semibold text-navy">Session requested</p>
        {booked.url ? (
          <>
            <p className="mt-1 text-sm text-ink-soft">Now pick a time that suits you. Your coach will have your notes before the session.</p>
            <a href={booked.url} target="_blank" rel="noopener noreferrer" className="mt-4 inline-block rounded-lg bg-gold px-5 py-3 font-semibold text-white">
              Pick a time
            </a>
          </>
        ) : (
          <p className="mt-1 text-sm text-ink-soft">We'll email you within one working day to arrange a time.</p>
        )}
        <button type="button" onClick={() => router.refresh()} className="ml-3 mt-4 text-sm text-teal">
          Done
        </button>
      </div>
    );

  const chosen = options.find((o) => o.value === focus);
  const groups = [...new Set(options.map((o) => o.group))];
  return (
    <form
      className="space-y-4 rounded-2xl bg-white p-6 shadow-sm"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setError(null);
        try {
          const data = await send("/api/coaching/book", "POST", { focus, focusLabel: chosen?.label ?? "", outcome, wins, challenge });
          setBooked({ url: data.bookingUrl ?? null });
        } catch (err: any) {
          setError(err.message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <div>
        <h2 className="text-xl font-bold text-navy">Book a session</h2>
        <p className="text-sm text-ink-soft">
          You have {available} session{available === 1 ? "" : "s"} to book. Two minutes of prep makes the session count.
        </p>
      </div>
      <label className="block text-sm font-medium">
        What should we focus on?
        <select className={field} value={focus} onChange={(e) => setFocus(e.target.value)} required>
          <option value="">Choose…</option>
          {groups.map((g) => (
            <optgroup key={g} label={g}>
              {options
                .filter((o) => o.group === g)
                .map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>
      <label className="block text-sm font-medium">
        What do you want to walk away with?
        <input className={field} value={outcome} onChange={(e) => setOutcome(e.target.value)} placeholder="e.g. A pricing decision for our supermarket pitch" required maxLength={600} />
      </label>
      <label className="block text-sm font-medium">
        Wins since your last session or update <span className="font-normal text-ink-soft">(optional)</span>
        <textarea className={field} rows={2} value={wins} onChange={(e) => setWins(e.target.value)} maxLength={600} />
      </label>
      <label className="block text-sm font-medium">
        Your biggest challenge right now <span className="font-normal text-ink-soft">(optional)</span>
        <textarea className={field} rows={2} value={challenge} onChange={(e) => setChallenge(e.target.value)} maxLength={600} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={busy || !focus || !outcome.trim()} className="rounded-lg bg-gold px-5 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "Booking…" : "Request session and pick a time"}
      </button>
    </form>
  );
}

export function CommitmentRow({ sessionId, c, canEdit }: { sessionId: string; c: Commitment; canEdit: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const overdue = c.status === "open" && c.due && c.due < new Date().toISOString().slice(0, 10);
  return (
    <li className="flex flex-wrap items-center gap-3 text-sm">
      <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${c.status === "done" ? "bg-teal text-white" : c.status === "dropped" ? "bg-gray-200 text-ink-soft" : overdue ? "bg-red-100 text-red-700" : "bg-gold/20 text-navy"}`}>
        {overdue ? "Overdue" : COMMITMENT_STATUSES.find((s) => s.value === c.status)?.label}
      </span>
      <span className={`flex-1 ${c.status !== "open" ? "text-ink-soft line-through" : ""}`}>{c.text}</span>
      {c.due && <span className="text-xs text-ink-soft">by {c.due}</span>}
      {canEdit && c.status === "open" && (
        <button
          type="button"
          disabled={busy}
          className="rounded-lg border border-teal px-2 py-1 text-xs font-semibold text-teal disabled:opacity-50"
          onClick={async () => {
            setBusy(true);
            try {
              await send(`/api/coaching/sessions/${sessionId}`, "PATCH", { commitment: { id: c.id, status: "done" } });
              router.refresh();
            } finally {
              setBusy(false);
            }
          }}
        >
          Mark done
        </button>
      )}
    </li>
  );
}

export function RateSession({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="mt-3 rounded-lg bg-cream p-3">
      <p className="text-sm font-semibold text-navy">How useful was this session?</p>
      <div className="mt-1 flex gap-1" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} type="button" role="radio" aria-checked={rating === n} aria-label={`${n} out of 5`} onClick={() => setRating(n)} className={`text-2xl ${n <= rating ? "text-gold" : "text-gray-300"}`}>
            ★
          </button>
        ))}
      </div>
      <input className={field} placeholder="Anything we could do better? (optional)" value={feedback} onChange={(e) => setFeedback(e.target.value)} maxLength={1000} />
      <button
        type="button"
        disabled={!rating || busy}
        className="mt-2 rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        onClick={async () => {
          setBusy(true);
          try {
            await send(`/api/coaching/sessions/${sessionId}`, "PATCH", { rating, feedback });
            router.refresh();
          } finally {
            setBusy(false);
          }
        }}
      >
        Send
      </button>
    </div>
  );
}
