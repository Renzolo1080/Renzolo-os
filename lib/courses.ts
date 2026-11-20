/** Founder Trajectory(TM) Academy recorded courses (approved by Lorenzo,
 * Nov 19 2026).
 *
 * Courses are a separate, one-time purchase. They are NEVER included in a
 * membership; members get 20% off the course price instead (an approved
 * exception to the "no discounts at launch" rule).
 *
 *   Price zone          One course   All three (bundle)
 *   Africa              $49          $119
 *   US, UK and EU       $149         $349
 *
 * All course prices are in US dollars. Each can be changed in Vercel:
 *   PRICE_COURSE, PRICE_COURSE_BUNDLE                 (Africa)
 *   PRICE_INTL_COURSE, PRICE_INTL_COURSE_BUNDLE       (US, UK and EU)
 *   COURSE_MEMBER_DISCOUNT_PERCENT                    (default 20)
 *
 * The course content (modules and lessons) lives in this file so it is
 * reviewed like code. Only lesson video IDs live in the database
 * (course_lesson_media), set by an admin on /academy/admin. Course titles
 * are working titles until Lorenzo clears them. */

import type { Region } from "./region";
import type { Price, Tier } from "./pricing";

type Env = Record<string, string | undefined>;

export type CourseSlug = "customer-readiness" | "capital-readiness" | "investor-readiness";
export const BUNDLE_SLUG = "readiness-bundle";
export type PurchasableCourse = CourseSlug | typeof BUNDLE_SLUG;

/** Who appears in a lesson video. */
export type LessonFormat = "lorenzo" | "ai" | "slides";
export const FORMAT_LABELS: Record<LessonFormat, string> = {
  lorenzo: "Lorenzo on camera",
  ai: "Lorenzo · AI",
  slides: "Slides with voiceover",
};

/** The Founder Trajectory(TM) step a module belongs to. */
export type Step = "start" | "evaluate" | "evolve" | "execute" | "elevate";
export const STEP_LABELS: Record<Step, string> = {
  start: "Start here",
  evaluate: "Evaluate",
  evolve: "Evolve",
  execute: "Execute",
  elevate: "Elevate",
};

export interface Lesson {
  /** Stable key, e.g. "l08". Never change once a course is sold: progress is stored against it. */
  key: string;
  title: string;
  format: LessonFormat;
  /** What the founder makes or takes away from this lesson. */
  output?: string;
  /** Free to watch without buying the course. */
  preview?: boolean;
}

export interface Module {
  step: Step;
  title: string;
  lessons: Lesson[];
}

export interface Course {
  slug: CourseSlug;
  title: string;
  /** One line: the outcome. */
  tagline: string;
  outcome: string;
  /** Which readiness component the course raises. */
  score: "customer" | "capital" | "investment";
  hours: string;
  weeks: string;
  leaveWith: string[];
  modules: Module[];
}

const L = (key: string, title: string, format: LessonFormat, extra: Partial<Lesson> = {}): Lesson => ({ key, title, format, ...extra });

export const COURSES: Course[] = [
  {
    slug: "customer-readiness",
    title: "Customer Readiness",
    tagline: "Win buyers with proof, not promises.",
    outcome: "Show a buyer, by proof rather than promise, that you can deliver. Then build a pipeline of qualified buyers.",
    score: "customer",
    hours: "about 2.5 hours",
    weeks: "4–6 weeks",
    leaveWith: [
      "A capability statement buyers can scan in one minute",
      "A one-page offer and pricing sheet",
      "A 50-name buyer list and outreach tracker",
      "One proof asset: a case study or testimonial",
      "Your re-scored customer readiness",
    ],
    modules: [
      { step: "start", title: "Start here", lessons: [
        L("l01", "Why buyers say no to early-stage businesses", "lorenzo", { preview: true }),
        L("l02", "How Founder Trajectory™ works", "slides"),
        L("l03", "Set your energy baseline and weekly rhythm", "ai", { output: "Rhythm commitment" }),
      ] },
      { step: "evaluate", title: "Evaluate", lessons: [
        L("l04", "The buyer's checklist: capacity, quality, compliance, price", "slides"),
        L("l05", "Score your customer evidence", "ai", { output: "Customer-evidence scorecard" }),
        L("l06", "Find your three biggest gaps", "ai", { output: "Gap list" }),
      ] },
      { step: "evolve", title: "Evolve", lessons: [
        L("l07", "Pick one buyer segment and one problem", "slides"),
        L("l08", "Package an offer a buyer can say yes to", "lorenzo", { output: "One-page offer" }),
        L("l09", "Price for margin, not hope", "ai", { output: "Pricing sheet" }),
        L("l10", "Build your capability statement", "slides", { output: "Capability statement" }),
      ] },
      { step: "execute", title: "Execute", lessons: [
        L("l11", "Build a 50-name target buyer list", "slides", { output: "Buyer list" }),
        L("l12", "Outreach scripts and the 5-touch follow-up", "ai", { output: "Outreach tracker" }),
        L("l13", "Run the discovery call", "lorenzo", { output: "Call script" }),
        L("l14", "Turn a pilot into a reference", "lorenzo"),
      ] },
      { step: "elevate", title: "Elevate", lessons: [
        L("l15", "Collect proof: case study, testimonial, numbers", "slides", { output: "Case study" }),
        L("l16", "Supplier registration and procurement portals", "ai", { output: "Registrations checklist" }),
        L("l17", "Re-score and set the next 90 days", "ai", { output: "New score" }),
        L("l18", "Your VOLT plan for the next win", "lorenzo", { output: "VOLT card" }),
      ] },
    ],
  },
  {
    slug: "capital-readiness",
    title: "Capital Readiness",
    tagline: "Get ready for loans, grants and supplier finance.",
    outcome: "Apply for credit and non-dilutive funding with clean numbers and a complete application pack.",
    score: "capital",
    hours: "about 2.5 hours",
    weeks: "4–6 weeks",
    leaveWith: [
      "A one-page financial snapshot",
      "A 12-month cash-flow forecast",
      "A use-of-funds sheet and business case",
      "One submitted loan or grant application",
      "Your re-scored capital readiness",
    ],
    modules: [
      { step: "start", title: "Start here", lessons: [
        L("l01", "Capital is not investment: know which one you need", "lorenzo", { preview: true }),
        L("l02", "How lenders and grant makers decide", "slides"),
        L("l03", "Energy and rhythm for a funding push", "ai", { output: "Rhythm commitment" }),
      ] },
      { step: "evaluate", title: "Evaluate", lessons: [
        L("l04", "Read your own numbers: revenue, margin, cash", "slides", { output: "Financial snapshot" }),
        L("l05", "Credit and compliance health check", "ai", { output: "Compliance checklist" }),
        L("l06", "Match your stage to the right capital type", "lorenzo", { output: "Capital-fit map" }),
      ] },
      { step: "evolve", title: "Evolve", lessons: [
        L("l07", "Build a simple 12-month cash-flow forecast", "slides", { output: "Cash-flow forecast" }),
        L("l08", "Use of funds that a lender believes", "lorenzo", { output: "Use-of-funds sheet" }),
        L("l09", "Fix bookkeeping and records", "ai"),
        L("l10", "Write the business case", "slides", { output: "Business case" }),
      ] },
      { step: "execute", title: "Execute", lessons: [
        L("l11", "Find loans, grants and programs in your market", "ai", { output: "Funding-source list" }),
        L("l12", "Write a winning grant or loan application", "slides", { output: "Application" }),
        L("l13", "Prepare for the lender conversation", "lorenzo"),
        L("l14", "Track applications and follow up", "ai", { output: "Application tracker" }),
      ] },
      { step: "elevate", title: "Elevate", lessons: [
        L("l15", "Manage repayments and reporting", "ai", { output: "Reporting calendar" }),
        L("l16", "Build a funder relationship for the next round", "lorenzo"),
        L("l17", "Re-score and set the next 90 days", "ai", { output: "New score" }),
        L("l18", "Your VOLT plan for funded growth", "lorenzo", { output: "VOLT card" }),
      ] },
    ],
  },
  {
    slug: "investor-readiness",
    title: "Investor Readiness",
    tagline: "Know if equity fits, then raise with a ready pack.",
    outcome: "Decide honestly whether equity investment fits. If it does, build a data room, a pitch deck and a target investor list.",
    score: "investment",
    hours: "about 3 hours",
    weeks: "6–8 weeks",
    leaveWith: [
      "A raise or don't-raise decision you can defend",
      "A funding roadmap and a 12-slide pitch deck",
      "A data-room checklist",
      "A qualified list of 30 target investors",
      "Your re-scored investment readiness",
    ],
    modules: [
      { step: "start", title: "Start here", lessons: [
        L("l01", "Should you raise at all? Equity, credit or revenue", "lorenzo", { preview: true }),
        L("l02", "What investors buy: team, traction, market, terms", "slides"),
        L("l03", "Energy and rhythm for a raise", "ai", { output: "Raise / don't-raise decision" }),
      ] },
      { step: "evaluate", title: "Evaluate", lessons: [
        L("l04", "Traction proof that counts", "ai", { output: "Traction sheet" }),
        L("l05", "Market size with TAM-SAM-SOM", "slides", { output: "Market sizing" }),
        L("l06", "Competitors and your edge", "slides", { output: "Competitor map" }),
      ] },
      { step: "evolve", title: "Evolve", lessons: [
        L("l07", "Your funding roadmap, seed to Series B", "lorenzo", { output: "Funding roadmap" }),
        L("l08", "Valuation basics and dilution", "slides", { output: "Cap table sketch" }),
        L("l09", "Build the 12-slide pitch deck", "ai", { output: "Pitch deck draft" }),
        L("l10", "Tell the founder story", "lorenzo", { output: "Story script" }),
      ] },
      { step: "execute", title: "Execute", lessons: [
        L("l11", "Build the data room", "slides", { output: "Data-room checklist" }),
        L("l12", "Find and qualify 30 target investors", "ai", { output: "Investor list" }),
        L("l13", "Warm intros and the outreach sequence", "ai", { output: "Outreach tracker" }),
        L("l14", "Run the pitch meeting and handle questions", "lorenzo", { output: "Q&A bank" }),
      ] },
      { step: "elevate", title: "Elevate", lessons: [
        L("l15", "Term sheets: what to watch", "ai", { output: "Term-sheet checklist" }),
        L("l16", "Investor updates that build trust", "slides", { output: "Update template" }),
        L("l17", "Re-score and set the next 90 days", "ai", { output: "New score" }),
        L("l18", "Your VOLT plan for the raise", "lorenzo", { output: "VOLT card" }),
      ] },
    ],
  },
];

export const COURSE_SLUGS: CourseSlug[] = COURSES.map((c) => c.slug);

export function isCourseSlug(v: unknown): v is CourseSlug {
  return typeof v === "string" && (COURSE_SLUGS as string[]).includes(v);
}

export function isPurchasableCourse(v: unknown): v is PurchasableCourse {
  return v === BUNDLE_SLUG || isCourseSlug(v);
}

export function getCourse(slug: unknown): Course | null {
  return COURSES.find((c) => c.slug === slug) ?? null;
}

export function allLessons(course: Course): (Lesson & { module: Module; index: number })[] {
  const out: (Lesson & { module: Module; index: number })[] = [];
  for (const m of course.modules) for (const l of m.lessons) out.push({ ...l, module: m, index: out.length });
  return out;
}

export function lessonCount(course: Course): number {
  return course.modules.reduce((n, m) => n + m.lessons.length, 0);
}

export function findLesson(course: Course, key: unknown) {
  return allLessons(course).find((l) => l.key === key) ?? null;
}

/** The courses a purchase gives access to. */
export function coursesInPurchase(item: PurchasableCourse): CourseSlug[] {
  return item === BUNDLE_SLUG ? [...COURSE_SLUGS] : [item];
}

/** Name shown at checkout and on receipts. */
export function purchaseTitle(item: PurchasableCourse): string {
  return item === BUNDLE_SLUG ? "All three readiness courses" : `${getCourse(item)!.title} course`;
}

// ---------- Prices ----------

const DEFAULTS = { africa: { course: 49, bundle: 119 }, intl: { course: 149, bundle: 349 } };

function readAmount(raw: string | undefined): number | null {
  if (raw === undefined || raw.trim() === "") return null;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** Course sales are paused until Lorenzo approves course pricing (Nov 19,
 * 2026). Pages, previews and owned courses still work; prices, the member
 * discount and the buy buttons only appear when COURSE_SALES_ENABLED=true. */
export function courseSalesEnabled(env: Env = process.env): boolean {
  return (env.COURSE_SALES_ENABLED ?? "").trim().toLowerCase() === "true";
}

/** Member discount on courses, as a percentage (default 20). A setting
 * outside 0–90 is ignored, so a typo can never make a course free. */
export function memberDiscountPercent(env: Env = process.env): number {
  const raw = env.COURSE_MEMBER_DISCOUNT_PERCENT;
  if (raw === undefined || raw.trim() === "") return 20;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 && n <= 90 ? n : 20;
}

/** The list price of a course or the bundle for a price zone, in US dollars. */
export function courseListPrice(item: PurchasableCourse, region: Region | null | undefined, env: Env = process.env): Price {
  const zone = region?.zone === "africa" ? "africa" : "intl";
  const kind = item === BUNDLE_SLUG ? "bundle" : "course";
  const key = `PRICE_${zone === "intl" ? "INTL_" : ""}COURSE${kind === "bundle" ? "_BUNDLE" : ""}`;
  return { amount: readAmount(env[key]) ?? DEFAULTS[zone][kind], currency: "USD" };
}

export interface CourseQuote {
  list: Price;
  /** Amount taken off for members (0 for non-members). */
  discount: number;
  /** What the founder pays. */
  charge: Price;
  percent: number;
}

/** The price this founder pays: list price, less the member discount if
 * they have an active membership of any tier. Rounded down to the cent. */
export function courseQuote(item: PurchasableCourse, tier: Tier | null | undefined, region: Region | null | undefined, env: Env = process.env): CourseQuote {
  const list = courseListPrice(item, region, env);
  const percent = tier ? memberDiscountPercent(env) : 0;
  const charge = Math.floor(list.amount * (100 - percent) + 1e-6) / 100;
  const discount = Math.round((list.amount - charge) * 100) / 100;
  return { list, discount, charge: { amount: charge, currency: list.currency }, percent };
}

/** What still needs buying from a bundle or course, given what the
 * founder already owns. Owning every course in it means nothing to buy. */
export function alreadyOwnsAll(item: PurchasableCourse, owned: string[]): boolean {
  return coursesInPurchase(item).every((s) => owned.includes(s));
}

// ---------- VOLT card ----------

/** The VOLT method of Founder Trajectory(TM): Vision, Opportunity and
 * Obstacle, Lever, Thrust. "VOLT" is a teaching acronym, not a cleared
 * mark: no (TM) on it until a trademark attorney clears it. */
export const VOLT_FIELDS = [
  { key: "vision", letter: "V", label: "Vision", hint: "Picture the outcome in detail. What does it look like?" },
  { key: "opportunity", letter: "O", label: "Opportunity and Obstacle", hint: "The opening in front of you, and the inner block that could stop you." },
  { key: "lever", letter: "L", label: "Lever", hint: "If [the obstacle shows up], then I will [one move]." },
  { key: "thrust", letter: "T", label: "Thrust", hint: "Your rhythm this week: when, how often, and the proof you'll log." },
] as const;

export type VoltCard = Partial<Record<(typeof VOLT_FIELDS)[number]["key"], string>>;

const VOLT_MAX = 600;

/** Keeps only the four VOLT fields, trimmed and capped. */
export function sanitizeVolt(input: unknown): VoltCard {
  const out: VoltCard = {};
  if (!input || typeof input !== "object") return out;
  for (const f of VOLT_FIELDS) {
    const v = (input as Record<string, unknown>)[f.key];
    if (typeof v === "string" && v.trim()) out[f.key] = v.trim().slice(0, VOLT_MAX);
  }
  return out;
}

/** An energy rating of 1–10, or null. */
export function sanitizeEnergy(v: unknown): number | null {
  const n = typeof v === "string" ? Number(v) : v;
  return typeof n === "number" && Number.isInteger(n) && n >= 1 && n <= 10 ? n : null;
}
