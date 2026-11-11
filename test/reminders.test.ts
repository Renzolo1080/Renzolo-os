import { buildReminderEmail, dueReminder, nextReminderDate, reminderKind, reminderStep } from "../lib/reminders";
import { founderSteps, reminderNote, stepProgress } from "../lib/next-steps";

function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

const paid = "2026-11-16T10:00:00Z";
const at = (days: number) => new Date(new Date(paid).getTime() + days * 864e5);

// --- which step is reminded --------------------------------------------------
const base = { areasAnswered: 2, areasTotal: 9, coachingAvailable: 1, paidAt: paid, coachingSince: "2026-11-20T00:00:00Z" };
assert(reminderStep(base)?.step === "assessment", "an unfinished assessment comes first");
assert(reminderStep({ ...base, areasAnswered: 3 })?.step === "coaching" && reminderStep({ ...base, areasAnswered: 3 })?.since === "2026-11-20T00:00:00Z", "then coaching once the report is unlocked (3 areas, as on the dashboard card)");
assert(reminderStep({ ...base, areasAnswered: 9, coachingAvailable: 0 }) === null, "nothing to remind when all is done");
assert(reminderStep({ ...base, paidAt: null }) === null, "never remind someone who hasn't paid");

// --- day 0, 3, 5 ----------------------------------------------------------------
assert(dueReminder("assessment", paid, [], at(0.2)) === reminderKind("assessment", paid, 0), "day 0 goes out on the day they pay");
assert(dueReminder("assessment", paid, [reminderKind("assessment", paid, 0)], at(1)) === null, "nothing on day 1");
assert(dueReminder("assessment", paid, [reminderKind("assessment", paid, 0)], at(3.1)) === reminderKind("assessment", paid, 3), "day 3");
assert(dueReminder("assessment", paid, [], at(5.5)) === reminderKind("assessment", paid, 5), "a late run sends only the latest due, never a burst");
assert(dueReminder("assessment", paid, [], at(9)) === null, "stops once the series is over");
const k0 = reminderKind("coaching", "2026-11-20T00:00:00Z", 0);
assert(k0 === "remind:coaching:2026-11-20:d0" && k0 !== reminderKind("coaching", "2027-02-20T00:00:00Z", 0), "a new batch of sessions starts a fresh series");

// --- next reminder date ------------------------------------------------------------
const sent0 = [reminderKind("assessment", paid, 0)];
assert(nextReminderDate("assessment", paid, sent0, at(1)) === "2026-11-19", "next reminder after day 0 is day 3", nextReminderDate("assessment", paid, sent0, at(1)));
assert(nextReminderDate("assessment", paid, [...sent0, reminderKind("assessment", paid, 3), reminderKind("assessment", paid, 5)], at(6)) === null, "no note once all three are sent");

// --- the emails -----------------------------------------------------------------
const ctx = { appUrl: "https://app.renzoloenterprises.com", firstName: "Ama", areasAnswered: 1, areasTotal: 9, coachingAvailable: 2, unsubscribeUrl: "https://x/unsub", postalAddress: "Milwaukee, WI" };
const a3 = buildReminderEmail(reminderKind("assessment", paid, 3), ctx);
assert(a3.subject === "2 areas to unlock your Readiness Report" && a3.html.includes("/assessment/details?utm_source=email") && a3.text.includes("answered 1 area; 2 more unlock"), "assessment reminder shows progress and links to the assessment", a3.text);
assert(a3.html.includes("Unsubscribe") && a3.text.includes("Milwaukee, WI"), "reminders carry unsubscribe and the postal address");
const c0 = buildReminderEmail(reminderKind("coaching", "2026-11-20T00:00:00Z", 0), ctx);
assert(c0.subject === "You have 2 coaching sessions ready to book" && c0.html.includes("/coaching?"), "coaching reminder", c0.subject);
assert(!buildReminderEmail(reminderKind("assessment", paid, 0), { ...ctx, firstName: "<b>" }).html.includes("<b>,"), "names are escaped");

// --- next-steps card --------------------------------------------------------------
const steps = founderSteps({ areasAnswered: 9, areasTotal: 9, planCompleteness: 40, review: null, marketDate: null, report: { exists: false, current: false }, access: { member: true, growth: false } });
const prog = stepProgress(steps);
assert(prog.total === 3 && prog.next?.key === "plan" && prog.position === 2 && prog.doneCount === 1 && prog.percent === 33, "Step 2 of 3: locked steps don't count", prog);
assert(steps.find((s) => s.key === "plan")!.unlock === "With a membership" && steps.find((s) => s.key === "review")!.unlock === "With Growth", "locked steps say what unlocks them");
const allDone = stepProgress(founderSteps({ areasAnswered: 9, areasTotal: 9, planCompleteness: 100, review: { overall: 80 }, marketDate: "1 Nov 2026", report: { exists: true, current: true }, access: { member: true, growth: true } }));
assert(allDone.next === null && allDone.percent === 100 && allDone.position === 5, "all done", allDone);
assert(reminderNote("2026-11-19", "2026-11-17") === "We'll remind you on Thursday.", "reminder note uses the weekday", reminderNote("2026-11-19", "2026-11-17"));
assert(reminderNote("2026-11-18", "2026-11-17") === "We'll remind you tomorrow." && reminderNote(null, "2026-11-17") === null, "tomorrow, or nothing");

// --- free loan readiness check -------------------------------------------------
import("../lib/free-tools").then(({ loanCheck, monthlyRepayment }) => {
  const pay = monthlyRepayment(10000, 12, 12);
  assert(Math.abs(pay - 888.49) < 0.01, "amortised repayment (10,000 over 12 months at 12%)", pay);
  assert(monthlyRepayment(1200, 12, 0) === 100, "0% interest repays evenly");
  const strong = loanCheck({ monthlyRevenue: 50000, monthlyCosts: 30000, loanAmount: 100000, termMonths: 24, annualRatePct: 18, monthsTrading: 36, bankStatements6m: true, registered: true, taxUpToDate: true });
  assert(strong.band === "Ready to apply" && strong.score === 100 && strong.fixes.length === 0, "a strong business is ready to apply", strong);
  const weak = loanCheck({ monthlyRevenue: 5000, monthlyCosts: 4800, loanAmount: 50000, termMonths: 12, annualRatePct: 20, monthsTrading: 4, bankStatements6m: false, registered: false, taxUpToDate: true });
  assert(weak.band === "Not ready yet" && weak.fixes.length === 3 && weak.fixes[0].startsWith("Your cash after costs doesn't cover"), "a weak case gets the three biggest fixes, repayment first", weak.fixes);
  const junk = loanCheck({ monthlyRevenue: NaN, monthlyCosts: -5, loanAmount: 0, termMonths: 0, annualRatePct: -1, monthsTrading: NaN, bankStatements6m: false, registered: false, taxUpToDate: false });
  assert(junk.coverage === null && junk.monthlyRepayment === 0 && junk.score === 0, "bad input doesn't break it", junk);
});
