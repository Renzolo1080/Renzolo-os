"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { BlockPrompt } from "@/lib/blocks";
import { BlockStep, answerComplete, type BlockAnswer } from "@/components/BlockStep";

export interface DetailArea {
  prompt: BlockPrompt;
  initial: BlockAnswer;
  /** Score from the latest assessment, 0-100. */
  score: number;
  /** One of the three weakest areas. */
  priority: boolean;
}

/** The full Readiness Assessment: all nine business areas, weakest first.
 * Each area is saved as the founder goes, so they can stop and come back.
 * Their score (and report) is updated once at least `required` areas are
 * done; every extra area makes them sharper. */
export function DetailForm({
  assessmentId,
  areas,
  required,
  planLengths = [],
  initialPlanLength = "12 months",
  planHref,
}: {
  assessmentId: string;
  areas: DetailArea[];
  required: number;
  planLengths?: string[];
  initialPlanLength?: string;
  /** Where the Plan Builder is, or null if the founder can't use it. */
  planHref: string | null;
}) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<string, BlockAnswer>>(() => Object.fromEntries(areas.map((a) => [a.prompt.key, a.initial])));
  const [saved, setSaved] = useState<Record<string, boolean>>(() => Object.fromEntries(areas.map((a) => [a.prompt.key, answerComplete(a.initial)])));
  const firstOpen = Math.max(0, areas.findIndex((a) => !answerComplete(a.initial)));
  const [step, setStep] = useState<number>(areas.every((a) => answerComplete(a.initial)) ? areas.length : firstOpen);
  const [planLength, setPlanLength] = useState(initialPlanLength);
  const [busy, setBusy] = useState<null | "save" | "finish">(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const doneCount = useMemo(() => Object.values(saved).filter(Boolean).length, [saved]);
  if (areas.length === 0) return <p>There are no areas to describe yet. Take the Readiness Snapshot first.</p>;
  const onSummary = step >= areas.length;
  const area = onSummary ? null : areas[step];
  const current = area ? answers[area.prompt.key] : null;

  async function post(body: Record<string, unknown>) {
    const res = await fetch("/api/assessment/details", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ assessmentId, ...body }) });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
    return data;
  }

  async function saveArea(next: number | "stay") {
    if (!area || !current) return;
    setBusy("save");
    setError(null);
    setNotice(null);
    try {
      await post({ blocks: { [area.prompt.key]: current }, planLength });
      setSaved((s) => ({ ...s, [area.prompt.key]: true }));
      if (next === "stay") setNotice("Saved. You can come back to the rest any time.");
      else setStep(next);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
    } finally {
      setBusy(null);
    }
  }

  async function finish() {
    setBusy("finish");
    setError(null);
    try {
      await post({ blocks: {}, planLength, finish: true });
      router.push("/dashboard?details=done");
      router.refresh();
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      setBusy(null);
    }
  }

  const pct = Math.round((doneCount / areas.length) * 100);
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
      <nav aria-label="Assessment areas" className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl bg-navy p-4 text-white">
          <p className="text-sm text-cream/80">Progress</p>
          <p className="text-2xl font-bold">
            {doneCount} of {areas.length} areas
          </p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-panel" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Areas done">
            <div className="h-2 bg-teal" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-cream/70">{doneCount >= required ? "Enough for your report. Each extra area sharpens it." : `${required - doneCount} more for your report.`}</p>
        </div>
        <ol className="mt-3 space-y-1">
          {areas.map((a, i) => (
            <li key={a.prompt.key}>
              <button
                type="button"
                onClick={() => setStep(i)}
                aria-current={i === step ? "step" : undefined}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${i === step ? "bg-white font-semibold text-navy shadow-sm" : "text-ink hover:bg-white"}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${saved[a.prompt.key] ? "bg-teal text-white" : "border border-gray-300 text-ink-soft"}`}>
                  {saved[a.prompt.key] ? "✓" : i + 1}
                </span>
                <span className="flex-1">{a.prompt.label}</span>
                {a.priority && <span className="rounded bg-gold/20 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-navy">Priority</span>}
              </button>
            </li>
          ))}
          <li>
            <button
              type="button"
              onClick={() => setStep(areas.length)}
              className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${onSummary ? "bg-white font-semibold text-navy shadow-sm" : "text-ink hover:bg-white"}`}
            >
              <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-brand-text text-xs text-brand-text">★</span>
              <span>Finish and your plan</span>
            </button>
          </li>
        </ol>
      </nav>

      <div>
        {area && current ? (
          <>
            <BlockStep
              prompt={area.prompt}
              position={`Area ${step + 1} of ${areas.length}${area.priority ? " · one of your three weakest" : ""} · current score ${area.score}/100`}
              answer={current}
              onChange={(next) => {
                setAnswers((a) => ({ ...a, [area.prompt.key]: next }));
                setNotice(null);
              }}
            />
            {!answerComplete(current) && <p className="mt-4 text-sm text-ink-soft">Answer "Today", "Where you want it to be" and the six checks to save this area.</p>}
            {error && (
              <p role="alert" className="mt-4 text-sm text-red-600">
                {error}
              </p>
            )}
            {notice && <p className="mt-4 text-sm text-teal">{notice}</p>}
            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button type="button" className="rounded-lg border border-gray-300 px-5 py-2.5 disabled:opacity-40" disabled={step === 0 || busy !== null} onClick={() => setStep((s) => s - 1)}>
                Back
              </button>
              <div className="flex flex-wrap gap-3">
                <button type="button" className="rounded-lg border border-navy px-5 py-2.5 font-semibold text-navy disabled:opacity-40" disabled={!answerComplete(current) || busy !== null} onClick={() => saveArea("stay")}>
                  Save, finish later
                </button>
                <button type="button" className="rounded-lg bg-navy px-6 py-2.5 font-semibold text-white disabled:opacity-40" disabled={!answerComplete(current) || busy !== null} onClick={() => saveArea(step + 1)}>
                  {busy === "save" ? "Saving…" : step === areas.length - 1 ? "Save and finish" : "Save and next area"}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-navy">Update your score</h2>
              <p className="mt-2 text-ink-soft">
                {doneCount >= required
                  ? `You've completed ${doneCount} of ${areas.length} areas. Update your score now; your Readiness Report will be built from everything you've answered.`
                  : `Complete at least ${required} areas (you've done ${doneCount}) to update your score and create your Readiness Report.`}
              </p>
              {planLengths.length > 0 && (
                <label className="mt-5 block">
                  <span className="block font-semibold text-navy">How far ahead should your growth and readiness plan go?</span>
                  <span className="mt-1 block text-sm text-ink-soft">The first 90 days are planned in detail; the rest is set out in phases you'll refine each time you re-assess.</span>
                  <select className="mt-3 w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 sm:w-64" value={planLength} onChange={(e) => setPlanLength(e.target.value)}>
                    {planLengths.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              {error && (
                <p role="alert" className="mt-4 text-sm text-red-600">
                  {error}
                </p>
              )}
              <button type="button" className="mt-5 rounded-lg bg-brand px-6 py-3 font-semibold text-on-brand disabled:opacity-50" disabled={doneCount < required || busy !== null} onClick={finish}>
                {busy === "finish" ? "Updating your score…" : "Update my score"}
              </button>
            </div>
            {planHref && (
              <div className="rounded-2xl border border-gold/60 bg-cream p-6">
                <p className="text-xs font-semibold uppercase tracking-wide text-teal">Part two</p>
                <h3 className="mt-1 text-xl font-bold text-navy">Build your strategic plan</h3>
                <p className="mt-2 text-sm text-ink-soft">
                  A guided plan that starts from where your business is today, using the answers you've just given, and sets goals, actions and owners to get
                  where you want to be. It also feeds your Readiness Report.
                </p>
                <a href={planHref} className="mt-4 inline-block rounded-lg bg-navy px-5 py-3 font-semibold text-white">
                  Open the Plan Builder
                </a>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
