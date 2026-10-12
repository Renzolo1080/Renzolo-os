"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import type { BlockKey } from "@/lib/scoring";
import {
  QUICK_QUESTIONS,
  STAGES,
  INDUSTRIES,
  COUNTRIES,
  BUSINESS_TYPES,
  YEARS_IN_BUSINESS,
  TEAM_SIZES,
  REVENUE_BANDS,
  PRIMARY_GOALS,
  TIME_HORIZONS,
  FUNDING_NEEDS,
  REGISTRATION_STATUSES,
  CHALLENGES,
  MAX_CHALLENGES,
  HEARD_FROM,
  type QuickLevel,
} from "@/lib/quickcheck";

/** The free Quick Check — about 25 taps and dropdowns, 3-5 minutes.
 * Screen 1: the business. Screen 2: goals. Screens 3-11: one question per
 * business area (tap an answer and it moves on). Screen 12: evidence,
 * challenges and how they heard about RENZOLO, then submit. */

type Profile = {
  ventureStage: string;
  industry: string;
  country: string;
  businessType: string;
  yearsInBusiness: string;
  teamSize: string;
  annualRevenue: string;
  primaryGoal: string;
  timeHorizon: string;
  fundingNeed: string;
  registration: string;
  heardFrom: string;
};

const EMPTY: Profile = {
  ventureStage: "",
  industry: "",
  country: "",
  businessType: "",
  yearsInBusiness: "",
  teamSize: "",
  annualRevenue: "",
  primaryGoal: "",
  timeHorizon: "",
  fundingNeed: "",
  registration: "",
  heardFrom: "",
};

const BUSINESS_FIELDS: [keyof Profile, string, readonly string[]][] = [
  ["ventureStage", "Stage of your business", STAGES],
  ["industry", "Industry", INDUSTRIES],
  ["country", "Country you operate in", COUNTRIES],
  ["businessType", "Business type", BUSINESS_TYPES],
  ["yearsInBusiness", "Years in business", YEARS_IN_BUSINESS],
  ["teamSize", "Team size", TEAM_SIZES],
  ["annualRevenue", "Annual revenue (US dollars)", REVENUE_BANDS],
];

const GOAL_FIELDS: [keyof Profile, string, readonly string[]][] = [
  ["primaryGoal", "Your main goal", PRIMARY_GOALS],
  ["timeHorizon", "When do you want to reach it?", TIME_HORIZONS],
  ["fundingNeed", "Are you looking for funding in the next 12 months?", FUNDING_NEEDS],
  ["registration", "Is your business registered with the government and tax authority?", REGISTRATION_STATUSES],
];

const AREA_SCREENS = QUICK_QUESTIONS.length;
const TOTAL = 2 + AREA_SCREENS + 1;

export default function QuickCheckPage() {
  const router = useRouter();
  const [screen, setScreen] = useState(0);
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [answers, setAnswers] = useState<Partial<Record<BlockKey, QuickLevel>>>({});
  const [evidence, setEvidence] = useState<BlockKey[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fieldsDone = (fields: typeof BUSINESS_FIELDS) => fields.every(([k]) => profile[k] !== "");
  const canContinue =
    screen === 0 ? fieldsDone(BUSINESS_FIELDS) : screen === 1 ? fieldsDone(GOAL_FIELDS) : screen === TOTAL - 1 ? challenges.length > 0 : answers[QUICK_QUESTIONS[screen - 2].key] !== undefined;

  function next() {
    setError(null);
    setScreen((s) => Math.min(TOTAL - 1, s + 1));
  }

  function chooseArea(key: BlockKey, level: QuickLevel) {
    setAnswers((a) => ({ ...a, [key]: level }));
    // Move on by itself after a beat, so a founder can see their choice register.
    setTimeout(() => setScreen((s) => Math.min(TOTAL - 1, s + 1)), 250);
  }

  function toggle<T>(list: T[], item: T, max?: number): T[] {
    if (list.includes(item)) return list.filter((x) => x !== item);
    if (max && list.length >= max) return [...list.slice(1), item];
    return [...list, item];
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile: { ...profile, challenges }, answers, evidence }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      router.push("/dashboard?quickcheck=done");
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  const selectClass = "w-full rounded border px-3 py-2 bg-white";

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">Free Quick Check · about 3 to 5 minutes</p>
      <div className="mt-2 mb-8">
        <div className="flex justify-between text-sm text-ink-soft mb-1">
          <span>
            Step {screen + 1} of {TOTAL}
          </span>
        </div>
        <div className="h-2 rounded bg-cream overflow-hidden" aria-hidden="true">
          <div className="h-full bg-gold transition-all" style={{ width: `${((screen + 1) / TOTAL) * 100}%` }} />
        </div>
      </div>

      {screen === 0 && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold text-navy">About your business</h1>
          {BUSINESS_FIELDS.map(([key, label, options]) => (
            <label key={key} className="block">
              <span className="block text-sm font-medium mb-1">{label}</span>
              <select className={selectClass} value={profile[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}>
                <option value="">Choose…</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </section>
      )}

      {screen === 1 && (
        <section className="space-y-4">
          <h1 className="text-2xl font-bold text-navy">Your goals</h1>
          {GOAL_FIELDS.map(([key, label, options]) => (
            <label key={key} className="block">
              <span className="block text-sm font-medium mb-1">{label}</span>
              <select className={selectClass} value={profile[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}>
                <option value="">Choose…</option>
                {options.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          ))}
        </section>
      )}

      {screen >= 2 && screen < TOTAL - 1 && (() => {
        const q = QUICK_QUESTIONS[screen - 2];
        return (
          <section className="space-y-4">
            <p className="text-sm font-semibold text-gold">{q.area}</p>
            <h1 className="text-2xl font-bold text-navy">{q.question}</h1>
            <div className="space-y-3" role="radiogroup" aria-label={q.question}>
              {q.options.map((text, i) => {
                const selected = answers[q.key] === i;
                return (
                  <button
                    key={i}
                    type="button"
                    role="radio"
                    aria-checked={selected}
                    onClick={() => chooseArea(q.key, i as QuickLevel)}
                    className={`w-full text-left rounded border px-4 py-3 transition ${selected ? "border-navy bg-navy text-white" : "border-gray-300 hover:border-navy"}`}
                  >
                    {text}
                  </button>
                );
              })}
            </div>
          </section>
        );
      })()}

      {screen === TOTAL - 1 && (
        <section className="space-y-8">
          <div>
            <h1 className="text-2xl font-bold text-navy">Almost done</h1>
            <p className="text-sm text-ink-soft mt-1">Three last questions, then you'll see your Venture Score.</p>
          </div>

          <fieldset>
            <legend className="text-sm font-medium mb-2">
              In which areas do you have real evidence, such as sales records, contracts, customer data or accounts? Tick all that apply.
            </legend>
            <div className="flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => {
                const on = evidence.includes(q.key);
                return (
                  <button
                    key={q.key}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setEvidence((e) => toggle(e, q.key))}
                    className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-teal bg-teal text-white" : "border-gray-300"}`}
                  >
                    {q.area}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-ink-soft mt-2">None yet? That's fine: leave them all unticked.</p>
          </fieldset>

          <fieldset>
            <legend className="text-sm font-medium mb-2">What are your biggest challenges right now? Choose up to {MAX_CHALLENGES}.</legend>
            <div className="flex flex-wrap gap-2">
              {CHALLENGES.map((c) => {
                const on = challenges.includes(c);
                return (
                  <button
                    key={c}
                    type="button"
                    aria-pressed={on}
                    onClick={() => setChallenges((list) => toggle(list, c, MAX_CHALLENGES))}
                    className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-navy bg-navy text-white" : "border-gray-300"}`}
                  >
                    {c}
                  </button>
                );
              })}
            </div>
          </fieldset>

          <label className="block">
            <span className="block text-sm font-medium mb-1">How did you hear about RENZOLO? (optional)</span>
            <select className={selectClass} value={profile.heardFrom} onChange={(e) => setProfile({ ...profile, heardFrom: e.target.value })}>
              <option value="">Choose…</option>
              {HEARD_FROM.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </label>
        </section>
      )}

      {error && (
        <p role="alert" className="mt-6 text-red-600 text-sm">
          {error}
        </p>
      )}

      <div className="mt-10 flex justify-between items-center">
        <button
          type="button"
          className="rounded border px-5 py-2 disabled:opacity-40"
          disabled={screen === 0 || submitting}
          onClick={() => setScreen((s) => Math.max(0, s - 1))}
        >
          Back
        </button>
        {screen < TOTAL - 1 ? (
          <button type="button" className="rounded bg-navy px-6 py-2 text-white font-semibold disabled:opacity-40" disabled={!canContinue} onClick={next}>
            Next
          </button>
        ) : (
          <button type="button" className="rounded bg-gold px-6 py-3 text-white font-semibold disabled:opacity-50" disabled={!canContinue || submitting} onClick={submit}>
            {submitting ? "Scoring…" : "See my Venture Score"}
          </button>
        )}
      </div>
    </main>
  );
}
