"use client";
import { useState } from "react";

export function PartnerJoin({ code, partnerName, cohortName }: { code: string; partnerName: string; cohortName: string }) {
  const [consent, setConsent] = useState(false);
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [error, setError] = useState<string | null>(null);
  async function join() {
    setState("busy");
    setError(null);
    const res = await fetch("/api/partner/join", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, consent }) });
    const json = await res.json().catch(() => ({}));
    if (!res.ok) {
      setError(json.error || "Something went wrong.");
      setState("idle");
    } else setState("done");
  }
  if (state === "done")
    return (
      <div className="rounded-2xl bg-cream p-5" role="status">
        <p className="font-semibold text-navy">You've joined {cohortName}.</p>
        <p className="mt-1 text-sm text-ink-soft">{partnerName} will see your readiness progress from today. You can stop sharing at any time on this page.</p>
        <a href="/dashboard" className="mt-3 inline-block rounded-pill bg-brand px-5 py-2.5 font-semibold text-on-brand">
          Go to my dashboard
        </a>
      </div>
    );
  return (
    <div className="space-y-3">
      <label className="flex items-start gap-2 text-sm">
        <input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
        <span>I agree to share the information above with {partnerName} for this programme. I can stop sharing at any time.</span>
      </label>
      {error && <p className="text-sm text-red-700" role="alert">{error}</p>}
      <button type="button" disabled={!consent || state === "busy"} onClick={join} className="rounded-pill bg-brand px-5 py-2.5 font-semibold text-on-brand disabled:opacity-50">
        {state === "busy" ? "Joining…" : "Join and share my progress"}
      </button>
    </div>
  );
}

export function StopSharing({ cohortId }: { cohortId: string }) {
  const [gone, setGone] = useState(false);
  if (gone) return <span className="text-sm text-ink-soft">Stopped sharing.</span>;
  return (
    <button
      type="button"
      className="text-sm text-red-700 underline"
      onClick={async () => {
        const res = await fetch(`/api/partner/join?cohort=${cohortId}`, { method: "DELETE" });
        if (res.ok) setGone(true);
      }}
    >
      Stop sharing
    </button>
  );
}
