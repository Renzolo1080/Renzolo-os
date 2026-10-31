/** Privacy settings shared by the privacy policy, sign-up, the PAIA manual
 * and the "Your data" page. Raising PRIVACY_VERSION records that founders
 * who sign up from then on accepted the new policy. Drafts for legal review. */

export const PRIVACY_VERSION = "2026-10-31";
export const PRIVACY_UPDATED = "31 October 2026";

/** South Africa (POPIA/PAIA) Information Officer and the person who answers
 * privacy requests everywhere. */
export const INFORMATION_OFFICER = {
  name: "Lorenzo Bell Jr.",
  role: "Founder and CEO, Renzolo Enterprises LLC",
};

export const REQUEST_KINDS = ["deletion", "score_review", "correction", "objection"] as const;
export type RequestKind = (typeof REQUEST_KINDS)[number];

export const REQUEST_LABELS: Record<RequestKind, string> = {
  deletion: "Delete my account and data",
  score_review: "Ask a person to review my readiness score",
  correction: "Correct information you hold about me",
  objection: "Object to or restrict how my information is used",
};

/** We answer every request within 30 days (the shortest deadline among our
 * launch markets' laws is one month). */
export const RESPONSE_DAYS = 30;

/** Tables exported in "Download my data", by how they link to the founder. */
export const EXPORT_BY_FOUNDER = [
  "acknowledgments",
  "advisor_sessions",
  "ai_clone_sessions",
  "ai_coach_threads",
  "ai_coach_messages",
  "assessment_purchases",
  "assessments",
  "coaching_agreements",
  "coaching_credits",
  "cohort_applications",
  "elevate_waitlist",
  "founder_updates",
  "goal_checkins",
  "market_briefs",
  "payments",
  "plan_reviews",
  "strategic_plans",
  "subscriptions",
  "data_requests",
] as const;

export const EXPORT_BY_ASSESSMENT = ["scores", "reports", "block_responses", "recommendations", "milestones"] as const;

export function isRequestKind(v: unknown): v is RequestKind {
  return typeof v === "string" && (REQUEST_KINDS as readonly string[]).includes(v);
}
