"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlockPrompt } from "@/lib/blocks";
import { BlockStep, type BlockAnswer } from "@/components/BlockStep";

export interface DetailArea {
  prompt: BlockPrompt;
  initial: BlockAnswer;
}

/** One area per step; submits all of them together at the end. */
export function DetailForm({
  assessmentId,
  areas,
  planLengths = [],
  initialPlanLength = "12 months",
}: {
  assessmentId: string;
  areas: DetailArea[];
  planLengths?: string[];
  initialPlanLength?: string;
}) {
  const [planLength, setPlanLength] = useState(initialPlanLength);
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState<Record<string, BlockAnswer>>(() => Object.fromEntries(areas.map((a) => [a.prompt.key, a.initial])));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (areas.length === 0) return <p>There are no areas to describe yet. Take the Readiness Snapshot first.</p>;
  const area = areas[step];
  const current = answers[area.prompt.key];
  const filled = current.currentState.trim().length > 0 && current.futureState.trim().length > 0;
  const last = step === areas.length - 1;

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/assessment/details", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ assessmentId, blocks: answers, planLength }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      router.push("/dashboard?details=done");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div>
      <p className="text-sm text-ink-soft mb-4">
        Area {step + 1} of {areas.length}
      </p>
      <BlockStep prompt={area.prompt} answer={current} onChange={(next) => setAnswers((a) => ({ ...a, [area.prompt.key]: next }))} />
      {!filled && <p className="text-xs text-ink-soft mt-3">Please answer the first two questions to continue.</p>}
      {last && planLengths.length > 0 && (
        <label className="mt-8 block rounded-2xl border border-gold/50 bg-white p-5">
          <span className="block font-semibold text-navy">How far ahead should your growth and readiness plan go?</span>
          <span className="mt-1 block text-sm text-ink-soft">The first 90 days are planned in detail; the rest is set out in phases you'll refine each time you re-assess.</span>
          <select className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5" value={planLength} onChange={(e) => setPlanLength(e.target.value)}>
            {planLengths.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </label>
      )}
      {error && (
        <p role="alert" className="mt-4 text-red-600 text-sm">
          {error}
        </p>
      )}
      <div className="mt-8 flex justify-between">
        <button type="button" className="rounded border px-5 py-2 disabled:opacity-40" disabled={step === 0 || submitting} onClick={() => setStep((s) => s - 1)}>
          Back
        </button>
        {last ? (
          <button type="button" className="rounded bg-gold px-6 py-3 text-white font-semibold disabled:opacity-50" disabled={!filled || submitting} onClick={submit}>
            {submitting ? "Saving…" : "Save and update my score"}
          </button>
        ) : (
          <button type="button" className="rounded bg-navy px-6 py-2 text-white font-semibold disabled:opacity-40" disabled={!filled} onClick={() => setStep((s) => s + 1)}>
            Next area
          </button>
        )}
      </div>
    </div>
  );
}
