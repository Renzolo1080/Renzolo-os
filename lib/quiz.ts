/**
 * RENZOLO OS™ — 60-Second Readiness Quiz (marketing lead-gen)
 *
 * Pure, framework-independent logic (mirrors lib/scoring.ts /
 * lib/valuation.ts) so it's unit-testable. This is DELIBERATELY separate
 * from and much coarser than the real 9-block/6-measure scoring engine
 * (lib/scoring.ts) — it exists to qualify social-media/website traffic
 * in under a minute, not to diagnose a venture. The funnel is:
 *
 *   Quiz (30-60 sec, this file) → free Readiness Snapshot (/snapshot,
 *   5-10 min, still no login) → full Assessment + subscription
 *   (/assessment, the real product)
 *
 * Never conflate a quiz result with a Venture Score — they use
 * different scales and different questions on purpose.
 */

export type QuizAnswerValue = 0 | 1 | 2;

export interface QuizOption {
  value: QuizAnswerValue;
  label: string;
}

export interface QuizQuestion {
  key: string;
  question: string;
  options: QuizOption[];
}

/** The three SCORED questions — each 0 (biggest gap) to 2 (strongest). */
export const QUIZ_QUESTIONS: QuizQuestion[] = [
  {
    key: "customers",
    question: "Do you have paying customers today?",
    options: [
      { value: 0, label: "No, not yet" },
      { value: 1, label: "A few, inconsistently" },
      { value: 2, label: "Yes, a steady customer base" },
    ],
  },
  {
    key: "plan",
    question: "Do you have a documented 12-month growth plan with specific targets and dates?",
    options: [
      { value: 0, label: "No" },
      { value: 1, label: "Sort of — it's mostly in my head" },
      { value: 2, label: "Yes, it's written down" },
    ],
  },
  {
    key: "economics",
    question: "Do you know your actual cost to acquire and retain a customer?",
    options: [
      { value: 0, label: "No idea" },
      { value: 1, label: "Rough estimate" },
      { value: 2, label: "Yes, I track it" },
    ],
  },
];

/** Not scored into readiness — captures urgency/intent for messaging. */
export const URGENCY_QUESTION = {
  key: "urgency",
  question: "Are you planning to raise funding, get a loan, or apply to an accelerator/program in the next 12 months?",
  options: [
    { value: "no", label: "No" },
    { value: "maybe", label: "Maybe" },
    { value: "yes", label: "Yes" },
  ] as const,
};

/** Not scored — used to personalize the result message and the CTA. */
export const CHALLENGE_QUESTION = {
  key: "challenge",
  question: "What's your biggest challenge right now?",
  options: [
    { value: "customers", label: "Finding & keeping customers" },
    { value: "cashflow", label: "Cash flow & profitability" },
    { value: "team", label: "Team & operations" },
    { value: "capital", label: "Raising capital / funding readiness" },
    { value: "unsure", label: "Not sure — need clarity across the board" },
  ] as const,
};

export type ChallengeValue = (typeof CHALLENGE_QUESTION.options)[number]["value"];
export type UrgencyValue = (typeof URGENCY_QUESTION.options)[number]["value"];

export interface QuizResult {
  score: number; // 0-6
  tier: "Foundational Gaps" | "Partial Readiness" | "Nearly There";
  headline: string;
  message: string;
  cta: { label: string; href: string };
  secondaryCta?: { label: string; href: string };
}

const CHALLENGE_COPY: Record<ChallengeValue, string> = {
  customers: "who your real customers are and how to reach more of them",
  cashflow: "your unit economics and path to sustainable cash flow",
  team: "the resources and operating structure you need to scale",
  capital: "what an investor or lender would actually check before saying yes",
  unsure: "exactly where your strongest and weakest areas really are",
};

export function computeQuizResult(scoredAnswers: Record<string, QuizAnswerValue>, challenge: ChallengeValue): QuizResult {
  const score = QUIZ_QUESTIONS.reduce((sum, q) => sum + (scoredAnswers[q.key] ?? 0), 0);

  let tier: QuizResult["tier"];
  if (score <= 2) tier = "Foundational Gaps";
  else if (score <= 4) tier = "Partial Readiness";
  else tier = "Nearly There";

  const challengeCopy = CHALLENGE_COPY[challenge] ?? CHALLENGE_COPY.unsure;

  const headline =
    tier === "Foundational Gaps"
      ? "You have real gaps to close before you're ready to scale or raise."
      : tier === "Partial Readiness"
      ? "You've got real pieces in place — and real gaps still to close."
      : "You're close. A few specific gaps stand between you and being fully ready.";

  const message = `Based on your answers, the biggest opportunity is ${challengeCopy}. RENZOLO OS's free Readiness Snapshot takes 5-10 minutes and shows you exactly which of the 9 areas that make up a fundable, scalable business need work — with a data-backed action plan, not generic advice.`;

  // Every tier's primary CTA is the free Snapshot — it's the next step
  // in the funnel for everyone, regardless of how ready they already
  // are. A founder who scored well gets an additional option to skip
  // straight to registering for the full Assessment + subscription,
  // since they've already shown real intent and readiness signal.
  const cta = { label: "Take the Free Readiness Snapshot", href: "/snapshot" };
  const secondaryCta = tier === "Nearly There" ? { label: "Skip ahead — start your full Assessment", href: "/register" } : undefined;

  return { score, tier, headline, message, cta, secondaryCta };
}
