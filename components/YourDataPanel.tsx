"use client";

import { useState } from "react";
import { REQUEST_LABELS, type RequestKind } from "@/lib/privacy";

type Req = { id: string; kind: string; status: string; created_at: string };

const STATUS: Record<string, string> = { open: "Received", in_progress: "In progress", done: "Done", declined: "Declined" };

export function YourDataPanel({ email, requests }: { email: string; requests: Req[] }) {
  const [kind, setKind] = useState<Exclude<RequestKind, "deletion">>("score_review");
  const [details, setDetails] = useState("");
  const [confirm, setConfirm] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(k: RequestKind, d: string) {
    setBusy(true);
    setMsg(null);
    try {
      const res = await fetch("/api/account/requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: k, details: d }),
      });
      const j = await res.json();
      if (!res.ok) setMsg({ ok: false, text: j.error ?? "Something went wrong." });
      else {
        setMsg({ ok: true, text: `Request received. We'll reply to ${email} within ${j.respondWithinDays} days.` });
        setDetails("");
        setConfirm("");
      }
    } catch {
      setMsg({ ok: false, text: "Couldn't reach us. Please try again." });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      <section className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-navy">Download my data</h2>
        <p className="mt-1 text-sm text-ink-soft">One file with your account, Snapshot and assessment answers, scores, reports, plans, coaching records and payments.</p>
        <a href="/api/account/export" className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
          Download (JSON)
        </a>
      </section>

      <section id="review" className="rounded-2xl bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-navy">Ask for a review, a correction or a change</h2>
        <label className="mt-3 block text-sm font-medium" htmlFor="req-kind">
          What would you like?
        </label>
        <select
          id="req-kind"
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={kind}
          onChange={(e) => setKind(e.target.value as Exclude<RequestKind, "deletion">)}
        >
          {(["score_review", "correction", "objection"] as const).map((k) => (
            <option key={k} value={k}>
              {REQUEST_LABELS[k]}
            </option>
          ))}
        </select>
        <label className="mt-3 block text-sm font-medium" htmlFor="req-details">
          Tell us more (optional)
        </label>
        <textarea
          id="req-details"
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={details}
          onChange={(e) => setDetails(e.target.value)}
          placeholder={kind === "score_review" ? "Which score looks wrong, and why?" : ""}
        />
        <button disabled={busy} onClick={() => send(kind, details)} className="mt-3 rounded-lg bg-brand px-4 py-2 text-sm font-semibold text-on-brand disabled:opacity-50">
          Send request
        </button>
      </section>

      <section className="rounded-2xl border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="font-semibold text-navy">Delete my account</h2>
        <p className="mt-1 text-sm text-ink-soft">
          We delete your account and personal information, except payment records we must keep for tax law. Active memberships end without a refund
          for the current period. Type DELETE to confirm.
        </p>
        <input
          aria-label="Type DELETE to confirm"
          className="mt-3 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder="DELETE"
        />
        <button
          disabled={busy || confirm !== "DELETE"}
          onClick={() => send("deletion", confirm)}
          className="mt-3 rounded-lg border border-red-600 px-4 py-2 text-sm font-semibold text-red-700 disabled:opacity-40"
        >
          Request deletion
        </button>
      </section>

      {msg && <p className={`text-sm ${msg.ok ? "text-teal" : "text-red-600"}`}>{msg.text}</p>}

      {requests.length > 0 && (
        <section className="rounded-2xl bg-white p-6 shadow-sm">
          <h2 className="font-semibold text-navy">Your requests</h2>
          <ul className="mt-2 space-y-1 text-sm">
            {requests.map((r) => (
              <li key={r.id} className="flex justify-between gap-3">
                <span>{REQUEST_LABELS[r.kind as RequestKind] ?? r.kind}</span>
                <span className="text-ink-soft">
                  {STATUS[r.status] ?? r.status} · {new Date(r.created_at).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
