"use client";
import { BlockPrompt } from "@/lib/blocks";

export interface BlockAnswer {
  currentState: string;
  futureState: string;
  goalTarget: string;
  targetDate: string;
  evidenceUploaded: boolean;
  measures: { clarity: number; evidence: number; economics: number; scalability: number; defensibility: number; risk: number };
}

const MEASURE_LABELS: [keyof BlockAnswer["measures"], string][] = [
  ["clarity", "Clarity"],
  ["evidence", "Evidence"],
  ["economics", "Economics"],
  ["scalability", "Scalability"],
  ["defensibility", "Defensibility"],
  ["risk", "Risk (100 = low risk)"],
];

export function BlockStep({
  prompt,
  answer,
  onChange,
}: {
  prompt: BlockPrompt;
  answer: BlockAnswer;
  onChange: (next: BlockAnswer) => void;
}) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-bold text-navy">{prompt.label}</h2>

      <label className="block text-sm font-medium">{prompt.currentStatePrompt}</label>
      <textarea
        className="w-full rounded border px-3 py-2"
        rows={3}
        value={answer.currentState}
        onChange={(e) => onChange({ ...answer, currentState: e.target.value })}
      />

      <label className="block text-sm font-medium">{prompt.futureStatePrompt}</label>
      <textarea
        className="w-full rounded border px-3 py-2"
        rows={3}
        value={answer.futureState}
        onChange={(e) => onChange({ ...answer, futureState: e.target.value })}
      />

      <label className="block text-sm font-medium">{prompt.goalPrompt}</label>
      <input
        className="w-full rounded border px-3 py-2"
        value={answer.goalTarget}
        onChange={(e) => onChange({ ...answer, goalTarget: e.target.value })}
      />

      <label className="block text-sm font-medium">Target date for this goal</label>
      <input
        type="date"
        className="w-full rounded border px-3 py-2"
        value={answer.targetDate}
        onChange={(e) => onChange({ ...answer, targetDate: e.target.value })}
      />
      <p className="text-xs text-ink-soft -mt-2">
        Powers your dashboard's progress reminders — it won't be shared or scored.
      </p>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={answer.evidenceUploaded}
          onChange={(e) => onChange({ ...answer, evidenceUploaded: e.target.checked })}
        />
        I have supporting evidence for this block (customer, financial, contract, or market data)
      </label>

      <div className="grid grid-cols-2 gap-4 pt-2">
        {MEASURE_LABELS.map(([key, label]) => (
          <div key={key}>
            <label className="block text-xs font-medium text-ink-soft">
              {label}: {answer.measures[key]}
            </label>
            <input
              type="range"
              min={0}
              max={100}
              value={answer.measures[key]}
              onChange={(e) => onChange({ ...answer, measures: { ...answer.measures, [key]: Number(e.target.value) } })}
              className="w-full"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
