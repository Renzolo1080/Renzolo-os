"use client";

import { useState } from "react";
import { CLONE_NAME, CONSENT_POINTS } from "@/lib/ai-clone";

/** "Talk to Lorenzo · AI": a labelled AI video coach. Video starts only
 * when the founder taps; consent first; captions on; the real Lorenzo
 * one tap away; text coaching stays below as the fallback. */
export function LorenzoAiPanel({ left, limit, minutes }: { left: number; limit: number; minutes: number }) {
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [remaining, setRemaining] = useState(left);

  async function start() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/ai-clone", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ consent: true }) });
      const j = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(j.error || "Couldn't start the session.");
      setUrl(j.url);
      if (typeof j.left === "number") setRemaining(j.left);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-labelledby="lorenzo-ai" className="overflow-hidden rounded-2xl bg-navy text-white shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3 p-5">
        <div className="flex items-center gap-3">
          <span aria-hidden="true" className="relative flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-brand to-gold font-display text-lg font-extrabold text-navy">
            LB
          </span>
          <div>
            <h2 id="lorenzo-ai" className="flex items-center gap-2 text-lg font-bold">
              {CLONE_NAME}
              <span className="rounded-full border border-heritage px-2 py-0.5 text-[11px] font-bold uppercase tracking-wider text-heritage">AI · Beta</span>
            </h2>
            <p className="text-sm text-cream/80">Face-to-face coaching from Lorenzo&apos;s AI, built on your plan. Up to {minutes} minutes a session.</p>
          </div>
        </div>
        <p className="text-sm text-cream/80">
          {remaining} of {limit} video sessions left this month
        </p>
      </div>

      {url ? (
        <div className="border-t border-white/10 bg-black/20 p-3">
          <iframe
            title={`${CLONE_NAME} video session`}
            src={url}
            allow="camera; microphone; fullscreen; autoplay"
            className="h-[480px] w-full rounded-xl border-0 bg-black sm:h-[560px]"
          />
          <div className="flex flex-wrap items-center justify-between gap-3 px-2 pt-3 text-sm">
            <p className="text-cream/80">Captions are on. You&apos;re talking to an AI, not Lorenzo.</p>
            <div className="flex gap-4">
              <a href="/coaching" className="font-semibold text-gold underline underline-offset-4">Talk to a Founder Coach</a>
              <button type="button" onClick={() => setUrl(null)} className="font-semibold text-white underline underline-offset-4">
                End session
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="border-t border-white/10 p-5">
          <ul className="space-y-1.5 text-sm text-cream/90">
            {CONSENT_POINTS.map((p) => (
              <li key={p} className="flex gap-2">
                <span aria-hidden="true" className="text-heritage">•</span>
                {p}
              </li>
            ))}
          </ul>
          <label className="mt-4 flex items-start gap-3 text-sm">
            <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5 h-5 w-5 accent-brand" />
            <span>I understand and agree.</span>
          </label>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <button
              type="button"
              disabled={!agreed || busy || remaining <= 0}
              onClick={start}
              className="btn-pop rounded-full border-2 border-navy bg-brand px-5 py-2.5 font-semibold text-on-brand disabled:cursor-not-allowed disabled:opacity-50"
            >
              {busy ? "Starting…" : remaining <= 0 ? "No video sessions left this month" : "Start a video session"}
            </button>
            <a href="/coaching" className="text-sm font-semibold text-gold underline underline-offset-4">Talk to a Founder Coach instead</a>
          </div>
          <p className="mt-3 text-xs text-cream/70">Uses your camera and microphone. On a slow or costly connection, use text coaching below instead.</p>
          {error && (
            <p role="alert" className="mt-3 text-sm font-semibold text-gold">
              {error}
            </p>
          )}
        </div>
      )}
    </section>
  );
}
