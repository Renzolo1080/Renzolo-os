"use client";
import { useState } from "react";
import { QUIZ_QUESTIONS, CHALLENGE_QUESTION, URGENCY_QUESTION, type QuizAnswerValue, type ChallengeValue, type UrgencyValue } from "@/lib/quiz";

type Step = number; // 0..2 = scored questions, 3 = challenge, 4 = urgency, 5 = email capture

export default function QuizPage() {
  const [step, setStep] = useState<Step>(0);
  const [answers, setAnswers] = useState<Record<string, QuizAnswerValue>>({});
  const [challenge, setChallenge] = useState<ChallengeValue | "">("");
  const [urgency, setUrgency] = useState<UrgencyValue | "">("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{
    score: number;
    tier: string;
    headline: string;
    message: string;
    cta: { label: string; href: string };
    secondaryCta?: { label: string; href: string };
  } | null>(null);

  const totalSteps = QUIZ_QUESTIONS.length + 2; // + challenge + urgency, email capture is the submit step

  function answerScored(key: string, value: QuizAnswerValue) {
    setAnswers({ ...answers, [key]: value });
    setStep((step + 1) as Step);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || !challenge) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, fullName, answers, challenge, urgency: urgency || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      setResult(data.result);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  if (result) {
    return (
      <main className="min-h-screen flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center space-y-4">
          <p className="text-sm font-semibold text-gold uppercase tracking-wide">{result.tier}</p>
          <h1 className="text-2xl font-bold text-navy">{result.headline}</h1>
          <p className="text-ink-soft">{result.message}</p>
          <a href={result.cta.href} className="block rounded bg-navy px-5 py-3 text-white font-semibold">
            {result.cta.label}
          </a>
          {result.secondaryCta && (
            <a href={result.secondaryCta.href} className="block text-sm text-teal">
              {result.secondaryCta.label}
            </a>
          )}
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen flex items-center justify-center px-6">
      <div className="max-w-md w-full">
        <div className="mb-6 text-sm text-ink-soft text-center">
          Is Your Business Ready to Scale? · Step {Math.min(step, totalSteps) + 1} of {totalSteps + 1}
        </div>

        {step < QUIZ_QUESTIONS.length && (
          <QuestionCard
            question={QUIZ_QUESTIONS[step].question}
            options={QUIZ_QUESTIONS[step].options.map((o) => ({ value: String(o.value), label: o.label }))}
            onSelect={(v) => answerScored(QUIZ_QUESTIONS[step].key, Number(v) as QuizAnswerValue)}
          />
        )}

        {step === QUIZ_QUESTIONS.length && (
          <QuestionCard
            question={CHALLENGE_QUESTION.question}
            options={CHALLENGE_QUESTION.options.map((o) => ({ value: o.value, label: o.label }))}
            onSelect={(v) => {
              setChallenge(v as ChallengeValue);
              setStep((step + 1) as Step);
            }}
          />
        )}

        {step === QUIZ_QUESTIONS.length + 1 && (
          <QuestionCard
            question={URGENCY_QUESTION.question}
            options={URGENCY_QUESTION.options.map((o) => ({ value: o.value, label: o.label }))}
            onSelect={(v) => {
              setUrgency(v as UrgencyValue);
              setStep((step + 1) as Step);
            }}
          />
        )}

        {step === QUIZ_QUESTIONS.length + 2 && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <h2 className="text-xl font-bold text-navy text-center">Where should we send your results?</h2>
            <input
              className="w-full rounded border px-3 py-2"
              placeholder="Your name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
            <input
              type="email"
              required
              className="w-full rounded border px-3 py-2"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error && <p className="text-red-600 text-sm">{error}</p>}
            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded bg-gold px-5 py-3 text-white font-semibold disabled:opacity-50"
            >
              {submitting ? "Scoring…" : "See My Results"}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function QuestionCard({
  question,
  options,
  onSelect,
}: {
  question: string;
  options: { value: string; label: string }[];
  onSelect: (value: string) => void;
}) {
  return (
    <div className="space-y-3">
      <h2 className="text-xl font-bold text-navy text-center">{question}</h2>
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onSelect(opt.value)}
          className="w-full text-left rounded border px-4 py-3 hover:border-teal hover:bg-cream"
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
