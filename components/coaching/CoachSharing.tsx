"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";

/** The founder's control over what their coach can see (lib/coach-access.ts). */
export function CoachSharing({ coaches, currentCoachId, since, shared, notShared }: { coaches: { id: string; name: string }[]; currentCoachId: string | null; since: string | null; shared: string[]; notShared: string[] }) {
  const router = useRouter();
  const [coachId, setCoachId] = useState(currentCoachId ?? coaches[0]?.id ?? "");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const current = coaches.find((c) => c.id === currentCoachId);

  async function call(method: "POST" | "DELETE") {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/coaching/access", { method, headers: { "content-type": "application/json" }, body: method === "POST" ? JSON.stringify({ coachId, consent: consent ? "yes" : "no" }) : undefined });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) setMsg(data.error ?? "Something went wrong. Please try again.");
      else {
        setMsg(method === "POST" ? "Shared. Your coach can now see your plan and dashboard." : "Stopped. Your coach can no longer see your plan and dashboard.");
        setConsent(false);
        router.refresh();
      }
    } finally {
      setBusy(false);
    }
  }

  if (!coaches.length) return null;
  return (
    <section id="sharing" className="scroll-mt-24 rounded-2xl bg-white p-5 shadow-sm sm:p-6">
      <h2 className="font-display text-xl font-bold text-navy">What your coach can see</h2>
      {current ? (
        <p className="mt-2 text-sm">
          <span className="rounded-full bg-[#0E8A6A1F] px-2.5 py-0.5 text-xs font-bold text-[#0B6B53]">Sharing on</span>{" "}
          <b>{current.name}</b> can see your plan, actions and dashboard{since ? ` (since ${new Date(since).toLocaleDateString("en-GB", { day: "numeric", month: "long" })})` : ""}. You can stop at any time.
        </p>
      ) : (
        <p className="mt-2 text-sm text-ink-soft">Your coach can't see your plan or dashboard unless you share them. Sharing lets your coach prepare for sessions and follow your progress between them.</p>
      )}
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div className="rounded-xl bg-surface p-4 text-sm">
          <p className="font-semibold text-navy">Shared with your coach</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {shared.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-xl bg-surface p-4 text-sm">
          <p className="font-semibold text-navy">Never shared</p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {notShared.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        </div>
      </div>
      {current ? (
        <button type="button" disabled={busy} onClick={() => call("DELETE")} className="mt-4 rounded-pill border-2 border-navy px-5 py-2.5 text-sm font-bold text-navy disabled:opacity-50">
          {busy ? "Saving…" : "Stop sharing"}
        </button>
      ) : (
        <div className="mt-4 space-y-3">
          {coaches.length > 1 && (
            <label className="block text-sm">
              <span className="font-medium">Your coach</span>
              <select id="coach-select" className="mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2" value={coachId} onChange={(e) => setCoachId(e.target.value)}>
                {coaches.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input id="coach-consent" type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            <span>
              I agree to share my plan, actions and dashboard with {coaches.find((c) => c.id === coachId)?.name ?? "my coach"}. I can stop at any time.
            </span>
          </label>
          <button type="button" disabled={busy || !consent} onClick={() => call("POST")} className="rounded-pill bg-brand px-5 py-2.5 text-sm font-bold text-on-brand disabled:opacity-50">
            {busy ? "Saving…" : "Share with my coach"}
          </button>
        </div>
      )}
      {msg && (
        <p role="status" className="mt-3 text-sm text-navy">
          {msg}
        </p>
      )}
    </section>
  );
}
