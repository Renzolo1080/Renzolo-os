"use client";
import { useState } from "react";
import { BLOCK_PROMPTS } from "@/lib/blocks";
import type { BlockKey } from "@/lib/scoring";

const initialRatings = Object.fromEntries(BLOCK_PROMPTS.map((b) => [b.key, 50])) as Record<BlockKey, number>;

export default function SnapshotPage() {
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [ventureStage, setVentureStage] = useState("");
  const [industry, setIndustry] = useState("");
  const [ratings, setRatings] = useState<Record<BlockKey, number>>(initialRatings);
  const [result, setResult] = useState<{ previewScore: number; previewTier: string } | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/snapshot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, ventureStage, industry, ratings }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md text-center space-y-4">
          <p className="text-sm text-ink-soft">Your Readiness Snapshot</p>
          <p className="text-5xl font-bold text-navy">{result.previewScore}<span className="text-lg text-ink-soft font-normal">/100</span></p>
          <p className="text-gold font-semibold text-lg">{result.previewTier}</p>
          <p className="text-sm text-ink-soft">
            This is a quick preview based on nine one-tap ratings. Register for the full 9-block
            assessment to get your complete Venture Score, Market/Customer/Investor readiness
            breakdown, gap analysis, and AI-drafted 90-day plan.
          </p>
          <a href="/register" className="inline-block rounded bg-navy px-6 py-3 text-white font-semibold">
            Register for the Full Assessment
          </a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-2">Free Readiness Snapshot</h1>
      <p className="text-sm text-ink-soft mb-6">
        Nine quick ratings, one minute, an instant preview score. No account needed.
      </p>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input className="w-full rounded border px-3 py-2" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input className="w-full rounded border px-3 py-2" placeholder="Full name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Venture stage (e.g. pre-seed, seed)" value={ventureStage} onChange={(e) => setVentureStage(e.target.value)} />
        <input className="w-full rounded border px-3 py-2" placeholder="Industry" value={industry} onChange={(e) => setIndustry(e.target.value)} />

        <div className="space-y-3 pt-2">
          {BLOCK_PROMPTS.map((b) => (
            <div key={b.key}>
              <label className="block text-sm font-medium">
                {b.label}: <span className="text-ink-soft">{ratings[b.key]}/100</span>
              </label>
              <input
                type="range"
                min={0}
                max={100}
                value={ratings[b.key]}
                onChange={(e) => setRatings({ ...ratings, [b.key]: Number(e.target.value) })}
                className="w-full"
              />
            </div>
          ))}
        </div>

        {error && <p className="text-red-600 text-sm">{error}</p>}
        <button type="submit" disabled={submitting} className="w-full rounded bg-gold px-6 py-3 text-white font-semibold disabled:opacity-50">
          {submitting ? "Scoring…" : "Get My Snapshot Score"}
        </button>
      </form>
    </main>
  );
}
