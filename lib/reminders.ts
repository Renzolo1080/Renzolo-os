import { esc, layout, p, textFooter, type EmailContext } from "./emails";
import { DETAIL_AREAS_REQUIRED } from "./quickcheck";

/** Reminders for paying founders who have an unfinished step.
 *
 * Two steps are nudged, one at a time, in this order:
 *   assessment — they paid (membership or the one-time assessment) but haven't
 *                answered enough areas of the full assessment to unlock
 *                their Readiness Report (DETAIL_AREAS_REQUIRED, as on the
 *                dashboard's next-steps card);
 *   coaching   — the assessment is done and they have coaching sessions
 *                ready to book.
 * Each step gets at most three reminders, on day 0, 3 and 5 after the step
 * became current ("since"). A late run sends only the latest one that is
 * due (never a burst), and nothing more than two days late. The email_log
 * kind carries the start date, so a new batch of coaching sessions next
 * quarter starts a fresh series. Pure, so it can be tested. */

export type ReminderStep = "assessment" | "coaching";
export const REMINDER_DAYS = [0, 3, 5] as const;
const DAY = 864e5;
const MAX_LATE_DAYS = 2;

export interface StepState {
  areasAnswered: number;
  areasTotal: number;
  coachingAvailable: number;
  /** When they paid for the membership or assessment (ISO). */
  paidAt: string | null;
  /** When their earliest unused, bookable coaching sessions arrived (ISO). */
  coachingSince: string | null;
}

/** Which step (if any) to remind about, and since when. */
export function reminderStep(s: StepState): { step: ReminderStep; since: string } | null {
  const enough = s.areasAnswered >= Math.min(DETAIL_AREAS_REQUIRED, s.areasTotal);
  if (s.paidAt && !enough) return { step: "assessment", since: s.paidAt };
  if (enough && s.coachingAvailable > 0 && s.coachingSince) return { step: "coaching", since: s.coachingSince };
  return null;
}

export const reminderKind = (step: ReminderStep, since: string, day: number) => `remind:${step}:${since.slice(0, 10)}:d${day}`;

/** The reminder to send now, or null. */
export function dueReminder(step: ReminderStep, since: string, sentKinds: string[], now = new Date()): string | null {
  const age = (now.getTime() - new Date(since).getTime()) / DAY;
  let due: string | null = null;
  for (const d of REMINDER_DAYS) {
    const kind = reminderKind(step, since, d);
    if (!sentKinds.includes(kind) && age >= d && age <= d + MAX_LATE_DAYS) due = kind;
  }
  return due;
}

/** The date of the next reminder in the series (YYYY-MM-DD), for "We'll
 * remind you on…" on the dashboard; null once the series is over. */
export function nextReminderDate(step: ReminderStep, since: string, sentKinds: string[], now = new Date()): string | null {
  const start = new Date(since).getTime();
  for (const d of REMINDER_DAYS) {
    const at = start + d * DAY;
    if (sentKinds.includes(reminderKind(step, since, d))) continue;
    if (at + MAX_LATE_DAYS * DAY < now.getTime()) continue; // missed, will be skipped
    // The daily job runs once a day, so the reminder goes out on that day
    // (or the next run if it's already today).
    return new Date(Math.max(at, now.getTime())).toISOString().slice(0, 10);
  }
  return null;
}

export interface ReminderContext extends Pick<EmailContext, "appUrl" | "firstName" | "unsubscribeUrl" | "postalAddress"> {
  areasAnswered: number;
  areasTotal: number;
  coachingAvailable: number;
}

const ctxFor = (c: ReminderContext): EmailContext => ({ ...c, score: 0, band: "", planScore: 0, weakest: [], recommendation: "" });
const linkTo = (c: ReminderContext, path: string, campaign: string) => `${c.appUrl}${path}?utm_source=email&utm_medium=email&utm_campaign=${campaign}`;

export function buildReminderEmail(kind: string, c: ReminderContext): { subject: string; html: string; text: string } {
  const [, step, , dayTag] = kind.split(":");
  const day = Number(dayTag?.slice(1) ?? 0);
  const hi = c.firstName ? `${c.firstName}, ` : "";
  const ec = ctxFor(c);
  if (step === "coaching") {
    const href = linkTo(c, "/coaching", `remind_coaching_d${day}`);
    const n = c.coachingAvailable;
    const sessions = `${n} coaching session${n === 1 ? "" : "s"}`;
    const subject = day === 0 ? `You have ${sessions} ready to book` : day === 3 ? "Your coach is ready when you are" : `Don't let your ${sessions} go unused`;
    const body =
      p(`${esc(hi)}your assessment is done. The fastest way to turn it into progress is a session with your coach: you'll leave with the two or three actions that move your score most.`) +
      p(`You have <strong>${sessions}</strong> ready to book. Sessions don't last forever, so it's worth booking one now.`);
    const text = `${hi}your assessment is done. The fastest way to turn it into progress is a session with your coach.\n\nYou have ${sessions} ready to book. Sessions don't last forever, so book one now.\n\nBook a session: ${href}${textFooter(ec)}`;
    return { subject, html: layout(day === 0 ? "Your next step: book your coaching session" : "Book your coaching session", body, ec, { label: "Book a session", href }), text };
  }
  const href = linkTo(c, "/assessment/details", `remind_assessment_d${day}`);
  const left = Math.max(0, Math.min(DETAIL_AREAS_REQUIRED, c.areasTotal) - c.areasAnswered);
  const progress = c.areasAnswered > 0 ? `You've answered ${c.areasAnswered} area${c.areasAnswered === 1 ? "" : "s"}; ${left} more unlock${left === 1 ? "s" : ""} your Readiness Report.` : `Answer your three priority areas to unlock your Readiness Report. You can stop and come back at any time.`;
  const subject = day === 0 ? "Your next step: finish your full assessment" : day === 3 ? `${left} area${left === 1 ? "" : "s"} to unlock your Readiness Report` : "Your Readiness Report is waiting on one thing";
  const body =
    p(`${esc(hi)}thank you for joining. Your full Readiness Assessment is what unlocks your Readiness Report, your growth plan and the most useful coaching.`) +
    p(esc(progress));
  const text = `${hi}thank you for joining. Your full Readiness Assessment unlocks your Readiness Report, your growth plan and the most useful coaching.\n\n${progress}\n\nContinue: ${href}${textFooter(ec)}`;
  return { subject, html: layout("Finish your full assessment", body, ec, { label: c.areasAnswered > 0 ? "Continue my assessment" : "Start my assessment", href }), text };
}
