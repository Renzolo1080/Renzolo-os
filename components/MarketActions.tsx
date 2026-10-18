"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

/** Creates or refreshes the Market Intelligence brief. */
export function MarketGenerate({ label, disabledReason }: { label: string; disabledReason: string | null }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  async function run() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/market", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <div>
      <button type="button" onClick={run} disabled={busy || !!disabledReason} className="rounded-lg bg-gold px-5 py-3 font-semibold text-white disabled:opacity-50">
        {busy ? "Researching your market… (2-3 minutes)" : label}
      </button>
      {disabledReason && <p className="mt-2 text-sm text-ink-soft">{disabledReason}</p>}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}

/** Adds a recommended action to the founder's plan. */
export function AddToPlan({ area, text, alreadyInPlan }: { area: string; text: string; alreadyInPlan: boolean }) {
  const [state, setState] = useState<"idle" | "busy" | "done" | "error">(alreadyInPlan ? "done" : "idle");
  const [error, setError] = useState<string | null>(null);
  async function add() {
    setState("busy");
    const res = await fetch("/api/plan/actions", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ area, text }) });
    const data = await res.json().catch(() => ({}));
    if (res.ok) setState("done");
    else {
      setError(data.error ?? "Couldn't add it.");
      setState("error");
    }
  }
  if (state === "done") return <span className="text-xs font-semibold text-teal">✓ In your plan</span>;
  return (
    <span>
      <button type="button" onClick={add} disabled={state === "busy"} className="rounded-lg border border-navy px-3 py-1 text-xs font-semibold text-navy disabled:opacity-50">
        {state === "busy" ? "Adding…" : "Add to my plan"}
      </button>
      {error && <span className="ml-2 text-xs text-red-600">{error}</span>}
    </span>
  );
}
