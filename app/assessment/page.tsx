"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { BLOCK_PROMPTS } from "@/lib/blocks";
import { BlockStep, type BlockAnswer } from "@/components/BlockStep";
import type { BlockKey } from "@/lib/scoring";

const emptyAnswer = (): BlockAnswer => ({
  currentState: "",
  futureState: "",
  goalTarget: "",
  targetDate: "",
  evidenceUploaded: false,
  measures: { clarity: 50, evidence: 50, economics: 50, scalability: 50, defensibility: 50, risk: 50 },
});

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0); // 0 = context, 1..9 = blocks
  const [context, setContext] = useState({
    ventureStage: "",
    industry: "",
    geography: "",
    timeHorizon: "",
    businessType: "",
    employeeCount: "",
    yearsInBusiness: "",
    annualRevenue: "",
  });
  const [answers, setAnswers] = useState<Record<BlockKey, BlockAnswer>>(
    () => Object.fromEntries(BLOCK_PROMPTS.map((b) => [b.key, emptyAnswer()])) as Record<BlockKey, BlockAnswer>
  );
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = BLOCK_PROMPTS.length + 1;

  async function handleSubmit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...context, blocks: answers }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      router.push(`/dashboard?assessment=${data.assessmentId}`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <div className="mb-6 text-sm text-ink-soft">
        Step {step + 1} of {totalSteps}
      </div>

      {step === 0 ? (
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-navy">A bit of context first</h2>
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Venture stage (e.g. pre-seed, seed, growth)"
            value={context.ventureStage}
            onChange={(e) => setContext({ ...context, ventureStage: e.target.value })}
          />
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Industry"
            value={context.industry}
            onChange={(e) => setContext({ ...context, industry: e.target.value })}
          />
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Geography (country/region)"
            value={context.geography}
            onChange={(e) => setContext({ ...context, geography: e.target.value })}
          />
          <input
            className="w-full rounded border px-3 py-2"
            placeholder="Time horizon (e.g. 12 months)"
            value={context.timeHorizon}
            onChange={(e) => setContext({ ...context, timeHorizon: e.target.value })}
          />

          <p className="text-sm text-ink-soft pt-2">
            A few more details so your report — and any market comparisons in it — reflect a business like
            yours, not a generic one.
          </p>

          <select
            className="w-full rounded border px-3 py-2"
            value={context.businessType}
            onChange={(e) => setContext({ ...context, businessType: e.target.value })}
          >
            <option value="">Business type</option>
            <option value="Sole proprietorship / informal">Sole proprietorship / informal</option>
            <option value="Registered small business / LLC">Registered small business / LLC</option>
            <option value="Cooperative">Cooperative</option>
            <option value="Corporation">Corporation</option>
            <option value="Nonprofit / social enterprise">Nonprofit / social enterprise</option>
          </select>

          <select
            className="w-full rounded border px-3 py-2"
            value={context.yearsInBusiness}
            onChange={(e) => setContext({ ...context, yearsInBusiness: e.target.value })}
          >
            <option value="">Years in business</option>
            <option value="Pre-launch / idea stage">Pre-launch / idea stage</option>
            <option value="Less than 1 year">Less than 1 year</option>
            <option value="1-3 years">1-3 years</option>
            <option value="3-5 years">3-5 years</option>
            <option value="5+ years">5+ years</option>
          </select>

          <select
            className="w-full rounded border px-3 py-2"
            value={context.employeeCount}
            onChange={(e) => setContext({ ...context, employeeCount: e.target.value })}
          >
            <option value="">Team size</option>
            <option value="Just me">Just me</option>
            <option value="2-5 employees">2-5 employees</option>
            <option value="6-20 employees">6-20 employees</option>
            <option value="21-50 employees">21-50 employees</option>
            <option value="50+ employees">50+ employees</option>
          </select>

          <select
            className="w-full rounded border px-3 py-2"
            value={context.annualRevenue}
            onChange={(e) => setContext({ ...context, annualRevenue: e.target.value })}
          >
            <option value="">Annual revenue</option>
            <option value="Pre-revenue">Pre-revenue</option>
            <option value="Under $10k">Under $10k</option>
            <option value="$10k-$50k">$10k-$50k</option>
            <option value="$50k-$250k">$50k-$250k</option>
            <option value="$250k-$1M">$250k-$1M</option>
            <option value="$1M+">$1M+</option>
          </select>
        </div>
      ) : (
        <BlockStep
          prompt={BLOCK_PROMPTS[step - 1]}
          answer={answers[BLOCK_PROMPTS[step - 1].key]}
          onChange={(next) => setAnswers({ ...answers, [BLOCK_PROMPTS[step - 1].key]: next })}
        />
      )}

      {error && <p className="mt-4 text-red-600 text-sm">{error}</p>}

      <div className="mt-8 flex justify-between">
        <button
          className="rounded border px-5 py-2"
          disabled={step === 0}
          onClick={() => setStep((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        {step < totalSteps - 1 ? (
          <button className="rounded bg-navy px-5 py-2 text-white" onClick={() => setStep((s) => s + 1)}>
            Next
          </button>
        ) : (
          <button
            className="rounded bg-gold px-5 py-2 text-white disabled:opacity-50"
            disabled={submitting}
            onClick={handleSubmit}
          >
            {submitting ? "Scoring…" : "Submit & Get My Score"}
          </button>
        )}
      </div>
    </main>
  );
}
