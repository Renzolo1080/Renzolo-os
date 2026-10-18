"use client";
import { MEASURE_CHOICES, type BlockPrompt } from "@/lib/blocks";

export type MeasureKey = "clarity" | "evidence" | "economics" | "scalability" | "defensibility" | "risk";

export interface BlockAnswer {
  currentState: string;
  futureState: string;
  goalTarget: string;
  targetDate: string;
  evidenceUploaded: boolean;
  /** Chosen answer (0-3) for each measure, or null until answered. */
  levels: Record<MeasureKey, number | null>;
}

export function answerComplete(a: BlockAnswer): boolean {
  return a.currentState.trim().length > 0 && a.futureState.trim().length > 0 && MEASURE_CHOICES.every((m) => a.levels[m.key] !== null);
}

/** One business area of the full assessment: where it is today, where it
 * needs to be, six quick multiple-choice measures, and an optional goal. */
export function BlockStep({
  prompt,
  answer,
  onChange,
  position,
}: {
  prompt: BlockPrompt;
  answer: BlockAnswer;
  onChange: (next: BlockAnswer) => void;
  position?: string;
}) {
  const set = (patch: Partial<BlockAnswer>) => onChange({ ...answer, ...patch });
  return (
    <div className="space-y-6">
      <div>
        {position && <p className="text-xs font-semibold uppercase tracking-wide text-teal">{position}</p>}
        <h2 className="text-2xl font-bold text-navy">{prompt.label}</h2>
      </div>

      <fieldset className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <legend className="sr-only">Today and where you want to be</legend>
        <label className="block">
          <span className="block font-semibold text-navy">Today</span>
          <span className="block text-sm text-ink-soft">{prompt.currentStatePrompt}</span>
          <textarea className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" rows={3} value={answer.currentState} onChange={(e) => set({ currentState: e.target.value })} />
        </label>
        <label className="block">
          <span className="block font-semibold text-navy">Where you want it to be</span>
          <span className="block text-sm text-ink-soft">{prompt.futureStatePrompt}</span>
          <textarea className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2" rows={3} value={answer.futureState} onChange={(e) => set({ futureState: e.target.value })} />
        </label>
      </fieldset>

      <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">
        <p className="font-semibold text-navy">Six quick checks on {prompt.label.toLowerCase()}</p>
        {MEASURE_CHOICES.map((m) => (
          <fieldset key={m.key}>
            <legend className="text-sm font-medium">{m.question}</legend>
            <div className="mt-2 grid gap-2 sm:grid-cols-2">
              {m.options.map((label, i) => {
                const chosen = answer.levels[m.key] === i;
                return (
                  <button
                    key={label}
                    type="button"
                    aria-pressed={chosen}
                    onClick={() => set({ levels: { ...answer.levels, [m.key]: i } })}
                    className={`rounded-lg border px-3 py-2 text-left text-sm ${chosen ? "border-navy bg-navy text-white" : "border-gray-300 bg-white hover:border-navy"}`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </fieldset>
        ))}
        <label className="flex items-start gap-2 pt-1 text-sm">
          <input type="checkbox" className="mt-1" checked={answer.evidenceUploaded} onChange={(e) => set({ evidenceUploaded: e.target.checked })} />
          <span>I have records to back this up (customer, financial, contract or market data)</span>
        </label>
      </div>

      <div className="space-y-3 rounded-2xl border border-dashed border-gray-300 p-5">
        <p className="font-semibold text-navy">
          A goal for this area <span className="text-sm font-normal text-ink-soft">(optional, carries into your plan)</span>
        </p>
        <label className="block text-sm">
          <span className="text-ink-soft">{prompt.goalPrompt}</span>
          <input className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2" value={answer.goalTarget} onChange={(e) => set({ goalTarget: e.target.value })} />
        </label>
        <label className="block text-sm">
          <span className="text-ink-soft">By when</span>
          <input type="date" className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 sm:w-56" value={answer.targetDate} onChange={(e) => set({ targetDate: e.target.value })} />
        </label>
      </div>
    </div>
  );
}
