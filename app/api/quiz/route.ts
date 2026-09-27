import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeQuizResult, QUIZ_QUESTIONS, type QuizAnswerValue, type ChallengeValue } from "@/lib/quiz";

/** POST /api/quiz
 * Body: { email, fullName?, answers: Record<string, 0|1|2>, challenge, urgency? }
 * No auth required — this is the public, ~30-60 second marketing quiz
 * meant for social media/website traffic, one step before the free
 * Readiness Snapshot (/snapshot). See lib/quiz.ts for why this is
 * deliberately separate from and coarser than the real scoring engine.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, fullName, answers, challenge, urgency } = body as {
    email: string;
    fullName?: string;
    answers: Record<string, QuizAnswerValue>;
    challenge: ChallengeValue;
    urgency?: string;
  };

  if (!email || !answers || !challenge) {
    return NextResponse.json({ error: "email, answers, and challenge are required" }, { status: 400 });
  }
  for (const q of QUIZ_QUESTIONS) {
    if (typeof answers[q.key] !== "number") {
      return NextResponse.json({ error: `Missing answer for: ${q.key}` }, { status: 400 });
    }
  }

  const result = computeQuizResult(answers, challenge);

  const supabase = createAdminClient();
  const { error } = await supabase.from("quiz_leads").insert({
    email,
    full_name: fullName ?? null,
    answers,
    challenge,
    urgency: urgency ?? null,
    score: result.score,
    tier: result.tier,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ result });
}
