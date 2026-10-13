import { BLOCK_KEYS, MEASURE_KEYS, type AllBlockScores, type BlockKey, type BlockMeasureScores } from "./scoring";

/** The free Quick Check: the short version of the readiness assessment
 * that every registered founder takes. One tap-to-answer question per
 * business area, plus one "where do you have real evidence?" question.
 * It is meant to take 3-5 minutes and to show a founder enough (their
 * Venture Score, tier and three weakest areas) that they want the full
 * report — which, with the detailed questions behind it, is what the
 * subscription unlocks.
 *
 * Scoring: each answer is one of four levels. The scoring engine
 * (lib/scoring.ts) expects six measures per area, so a Quick Check
 * answer sets all six measures in that area to the level's value. That
 * makes the free score coarser than the full assessment's on purpose;
 * the detailed questions a subscriber answers later refine the measures
 * for their weakest areas and produce a new, sharper score. */

/** Score given to each of the four answer levels (index 0-3). */
export const LEVEL_SCORES = [15, 40, 65, 90] as const;
export type QuickLevel = 0 | 1 | 2 | 3;

export interface QuickQuestion {
  key: BlockKey;
  area: string;
  question: string;
  /** Four answers, weakest first. */
  options: [string, string, string, string];
}

export const QUICK_QUESTIONS: QuickQuestion[] = [
  {
    key: "customerSegments",
    area: "Customers",
    question: "How well do you know who your paying customers are?",
    options: [
      "I'm still working out who they are",
      "I have a target group in mind but few or no paying customers",
      "I have paying customers and know what they have in common",
      "I have a clear, growing base of paying customers I can describe in detail",
    ],
  },
  {
    key: "valueProposition",
    area: "Your offer",
    question: "How clear is the reason customers choose you over the alternatives?",
    options: [
      "I haven't tested it with customers yet",
      "Customers say they like it, but I can't yet prove why they buy",
      "I can name the problem I solve and customers confirm it",
      "Customers choose me over competitors and tell me exactly why",
    ],
  },
  {
    key: "channels",
    area: "Reaching customers",
    question: "How do customers find you and buy from you?",
    options: [
      "Mostly word of mouth, and it's unpredictable",
      "I'm trying a few ways but none is reliable yet",
      "One way works reliably and brings steady sales",
      "Several ways work and I know what each one costs me",
    ],
  },
  {
    key: "customerRelationships",
    area: "Keeping customers",
    question: "Do customers come back and buy again?",
    options: [
      "Rarely, or I don't know",
      "Some do, but I don't follow up in a planned way",
      "Many do, and I keep in touch with them on purpose",
      "Most do, and I track it closely",
    ],
  },
  {
    key: "revenueStreams",
    area: "Revenue",
    question: "Where does your business's income stand today?",
    options: [
      "No revenue yet",
      "Some revenue, but it goes up and down a lot",
      "Steady monthly revenue",
      "Steady, growing revenue from more than one source",
    ],
  },
  {
    key: "keyResources",
    area: "People and resources",
    question: "Do you have the people, money and equipment to deliver your next stage?",
    options: [
      "Not yet, I'm missing most of what I need",
      "Some of it, with big gaps",
      "Most of it, with a few gaps",
      "Yes, I'm well resourced for what comes next",
    ],
  },
  {
    key: "keyActivities",
    area: "Day-to-day operations",
    question: "How well do your day-to-day operations run?",
    options: [
      "It all depends on me and nothing is written down",
      "Some routines exist but they break when things get busy",
      "Key processes are written down and mostly followed",
      "Operations run smoothly and could handle twice the volume",
    ],
  },
  {
    key: "keyPartnerships",
    area: "Partners and suppliers",
    question: "How strong are your partnerships and supplier relationships?",
    options: [
      "I don't have any I rely on",
      "A few informal ones",
      "Some solid partners I depend on",
      "Strong, agreed partnerships that help me grow",
    ],
  },
  {
    key: "costStructure",
    area: "Costs and margins",
    question: "Do you know what it costs to make and deliver each sale?",
    options: [
      "Not really",
      "Roughly, but not in detail",
      "Yes, and I make a profit on each sale",
      "Yes, and I track my costs and margins every month",
    ],
  },
];

export function isQuickLevel(v: unknown): v is QuickLevel {
  return v === 0 || v === 1 || v === 2 || v === 3;
}

export interface QuickCheckSubmission {
  answers: Record<BlockKey, QuickLevel>;
  evidence: BlockKey[];
}

/** Checks a submission from the browser: every area answered with a valid
 * level, and the evidence list containing only real areas. Returns the
 * cleaned submission, or a plain-language error. */
export function parseQuickCheck(body: unknown): { ok: true; value: QuickCheckSubmission } | { ok: false; error: string } {
  const b = (body ?? {}) as { answers?: Record<string, unknown>; evidence?: unknown };
  const answers = {} as Record<BlockKey, QuickLevel>;
  for (const key of BLOCK_KEYS) {
    const v = b.answers?.[key];
    if (!isQuickLevel(v)) return { ok: false, error: "Please answer every question before submitting." };
    answers[key] = v;
  }
  const evidenceRaw = Array.isArray(b.evidence) ? b.evidence : [];
  const evidence = Array.from(new Set(evidenceRaw.filter((k): k is BlockKey => (BLOCK_KEYS as readonly string[]).includes(k as string))));
  return { ok: true, value: { answers, evidence } };
}

/** Turns Quick Check answers into the inputs the scoring engine expects. */
export function quickCheckToScoringInput(sub: QuickCheckSubmission): {
  measures: AllBlockScores;
  evidenceByBlock: Record<BlockKey, boolean>;
} {
  const measures = {} as AllBlockScores;
  const evidenceByBlock = {} as Record<BlockKey, boolean>;
  for (const key of BLOCK_KEYS) {
    const value = LEVEL_SCORES[sub.answers[key]];
    measures[key] = Object.fromEntries(MEASURE_KEYS.map((m) => [m, value])) as BlockMeasureScores;
    evidenceByBlock[key] = sub.evidence.includes(key);
  }
  return { measures, evidenceByBlock };
}

/** How many areas a subscriber must describe in detail before their full
 * report is generated: their weakest three, as named in the free result. */
export const DETAIL_AREAS_REQUIRED = 3;

/** True once the founder has answered the detailed questions for enough
 * areas (a block response with a written current-state answer). The
 * Quick Check itself never writes one, so this is always false until a
 * subscriber completes the detailed step. */
export function detailsComplete(blockRows: { current_state: string | null }[] | null | undefined): boolean {
  return (blockRows ?? []).filter((r) => (r.current_state ?? "").trim().length > 0).length >= DETAIL_AREAS_REQUIRED;
}

// ---------------------------------------------------------------------
// Profile questions: all dropdowns or tap-to-choose, so they're quick to
// answer and give consistent data RENZOLO can segment and report on.
// ---------------------------------------------------------------------

export const STAGES = [
  "Idea or pre-launch",
  "Early: first customers",
  "Growing: steady sales",
  "Established: profitable",
  "Scaling: expanding fast",
] as const;

export const INDUSTRIES = [
  "Agriculture and agribusiness",
  "Food and beverage",
  "Retail and e-commerce",
  "Manufacturing",
  "Construction and real estate",
  "Transport and logistics",
  "ICT and software",
  "Fintech and financial services",
  "Health and wellness",
  "Education and training",
  "Creative arts and media",
  "Fashion and beauty",
  "Tourism and hospitality",
  "Energy and environment",
  "Professional services",
  "Other",
] as const;

export const COUNTRIES = [
  "Kenya",
  "South Africa",
  "Nigeria",
  "Ghana",
  "Uganda",
  "Rwanda",
  "Tanzania",
  "Ethiopia",
  "Zambia",
  "Zimbabwe",
  "Botswana",
  "Egypt",
  "Morocco",
  "Senegal",
  "Côte d'Ivoire",
  "Other African country",
  "United States",
  "United Kingdom",
  "Other country",
] as const;

export const BUSINESS_TYPES = [
  "Sole proprietorship / informal",
  "Registered small business / LLC",
  "Cooperative",
  "Corporation",
  "Nonprofit / social enterprise",
] as const;

export const YEARS_IN_BUSINESS = ["Pre-launch / idea stage", "Less than 1 year", "1-3 years", "3-5 years", "5+ years"] as const;

export const TEAM_SIZES = ["Just me", "2-5 employees", "6-20 employees", "21-50 employees", "50+ employees"] as const;

/** Same buckets the valuation engine (lib/valuation.ts) reads. */
export const REVENUE_BANDS = ["Pre-revenue", "Under $10k", "$10k-$50k", "$50k-$250k", "$250k-$1M", "$1M+"] as const;

export const PRIMARY_GOALS = [
  "Get my first paying customers",
  "Grow revenue",
  "Become ready for investors or loans",
  "Win corporate or government contracts",
  "Expand into new markets",
  "Formalise and register my business",
] as const;

export const TIME_HORIZONS = ["3 months", "6 months", "12 months", "2-3 years"] as const;

export const FUNDING_NEEDS = [
  "Not looking for funding",
  "Yes, under $10k",
  "Yes, $10k-$50k",
  "Yes, $50k-$250k",
  "Yes, over $250k",
] as const;

export const REGISTRATION_STATUSES = [
  "Registered and tax compliant",
  "Registered, tax compliance in progress",
  "Registration in progress",
  "Not registered yet",
] as const;

export const CHALLENGES = [
  "Finding customers",
  "Cash flow",
  "Access to funding",
  "Pricing and margins",
  "Hiring and team",
  "Operations and systems",
  "Compliance and registration",
  "Going digital",
] as const;
export const MAX_CHALLENGES = 2;

export const HEARD_FROM = ["WhatsApp", "LinkedIn", "Facebook or Instagram", "Partner organisation", "Event or webinar", "Friend or colleague", "Search engine", "Other"] as const;

export interface QuickProfile {
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
  challenges: string[];
  heardFrom: string;
}

const pick = <T extends readonly string[]>(list: T, v: unknown): T[number] | null =>
  typeof v === "string" && (list as readonly string[]).includes(v) ? (v as T[number]) : null;

/** Checks the profile answers: each must be one of the listed choices, so
 * nothing free-typed (or tampered with) reaches the database or the
 * report prompt. Returns which field is missing when one is. */
export function parseProfile(body: unknown): { ok: true; value: QuickProfile } | { ok: false; error: string } {
  const b = (body ?? {}) as Record<string, unknown>;
  const required: [keyof QuickProfile, readonly string[], string][] = [
    ["ventureStage", STAGES, "your stage"],
    ["industry", INDUSTRIES, "your industry"],
    ["country", COUNTRIES, "your country"],
    ["businessType", BUSINESS_TYPES, "your business type"],
    ["yearsInBusiness", YEARS_IN_BUSINESS, "years in business"],
    ["teamSize", TEAM_SIZES, "your team size"],
    ["annualRevenue", REVENUE_BANDS, "your annual revenue"],
    ["primaryGoal", PRIMARY_GOALS, "your main goal"],
    ["timeHorizon", TIME_HORIZONS, "your timeframe"],
    ["fundingNeed", FUNDING_NEEDS, "your funding plans"],
    ["registration", REGISTRATION_STATUSES, "your registration status"],
  ];
  const out: Partial<QuickProfile> = {};
  for (const [key, list, label] of required) {
    const v = pick(list, b[key]);
    if (!v) return { ok: false, error: `Please choose ${label}.` };
    (out as Record<string, unknown>)[key] = v;
  }
  const challengesRaw = Array.isArray(b.challenges) ? b.challenges : [];
  const challenges = Array.from(new Set(challengesRaw.filter((c): c is string => pick(CHALLENGES, c) !== null))).slice(0, MAX_CHALLENGES);
  if (challenges.length === 0) return { ok: false, error: "Please choose your biggest challenge." };
  out.challenges = challenges;
  out.heardFrom = pick(HEARD_FROM, b.heardFrom) ?? "";
  return { ok: true, value: out as QuickProfile };
}
