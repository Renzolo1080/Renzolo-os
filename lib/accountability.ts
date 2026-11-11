import { esc, layout, p, textFooter, type EmailContext } from "./emails";
import { allActions, type StrategicPlan } from "./plan";
import { goalProgress, periodOf, type Checkin, type MonthlyUpdate } from "./progress";
import { BLOCK_LABELS } from "./scoring";

/** The weekly accountability email (approved Nov 10, 2026): keeps members
 * on their plan between coaching sessions. One email a week at most, sent
 * Monday (a late daily run can still send it up to Wednesday), and only
 * when there is something to act on:
 *   actions overdue, and actions due in the next 7 days
 *   goals with no check-in for 14 days (and not yet achieved)
 *   the monthly update, when last month's is missing
 *   the re-assessment, when due within 7 days or overdue
 * email_log kind "account:week:YYYY-MM-DD" (that week's Monday) makes it
 * once a week. Pure, so it can be tested. */

const DAY = 864e5;
const dn = (d: string) => Math.floor(Date.parse(`${d.slice(0, 10)}T00:00:00Z`) / DAY);
const iso = (n: number) => new Date(n * DAY).toISOString().slice(0, 10);
const fmt = (d: string) => new Date(`${d}T00:00:00Z`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" });

export interface DigestItem {
  kind: "overdue" | "due" | "checkin" | "update" | "reassess";
  text: string;
  href: string;
}

export interface Digest {
  items: DigestItem[];
  counts: { overdue: number; due: number; checkin: number };
}

export interface DigestInput {
  plan: StrategicPlan | null;
  checkins: Checkin[];
  updates: MonthlyUpdate[];
  nextReassessment: string | null;
  today: string;
}

/** Monday of the week a date falls in (YYYY-MM-DD). */
export function weekOf(today: string): string {
  const d = new Date(`${today.slice(0, 10)}T00:00:00Z`);
  const back = (d.getUTCDay() + 6) % 7;
  return iso(dn(today) - back);
}

export const digestKind = (today: string) => `account:week:${weekOf(today)}`;

/** Whether today is a sending day for this week's email (Mon–Wed). */
export function digestDay(today: string): boolean {
  return dn(today) - dn(weekOf(today)) <= 2;
}

export function weeklyDigest(i: DigestInput): Digest | null {
  const today = i.today.slice(0, 10);
  const t = dn(today);
  const items: DigestItem[] = [];
  const actions = i.plan ? allActions(i.plan) : [];
  const open = actions.filter((a) => a.status !== "done" && a.due);
  const overdue = open.filter((a) => dn(a.due) < t).sort((a, b) => a.due.localeCompare(b.due));
  const due = open.filter((a) => dn(a.due) >= t && dn(a.due) <= t + 7).sort((a, b) => a.due.localeCompare(b.due));
  for (const a of overdue.slice(0, 5)) items.push({ kind: "overdue", text: `${a.text} (${BLOCK_LABELS[a.area]}) was due ${fmt(a.due)}`, href: "/dashboard#coming-up" });
  for (const a of due.slice(0, 5)) items.push({ kind: "due", text: `${a.text} (${BLOCK_LABELS[a.area]}) is due ${fmt(a.due)}`, href: "/dashboard#coming-up" });

  const goals = (i.plan?.goals ?? []).filter((g) => g.baseline !== null && g.target !== null && g.target !== g.baseline && g.date);
  let checkin = 0;
  for (const g of goals) {
    const prog = goalProgress(g, i.checkins, today);
    if (prog.status === "achieved") continue;
    const last = prog.actualOn ?? g.start;
    if (last && t - dn(last) < 14) continue;
    checkin++;
    items.push({ kind: "checkin", text: `Log progress on "${g.title || g.measure}": ${prog.actualOn ? `last check-in ${fmt(prog.actualOn)}` : "no check-in yet"}`, href: "/dashboard#goals" });
  }

  const lastMonth = periodOf(iso(dn(periodOf(today)) - 1));
  if (i.plan && !i.updates.some((u) => u.period.slice(0, 10) === lastMonth) && !i.updates.some((u) => u.period.slice(0, 10) === periodOf(today))) {
    items.push({ kind: "update", text: `Your monthly update for ${new Date(`${lastMonth}T00:00:00Z`).toLocaleDateString("en-GB", { month: "long", timeZone: "UTC" })}: revenue, customers and cash, 2 minutes`, href: "/dashboard#update" });
  }

  if (i.nextReassessment && dn(i.nextReassessment) <= t + 7) {
    items.push({ kind: "reassess", text: dn(i.nextReassessment) < t ? `Your re-assessment was due ${fmt(i.nextReassessment)}: it confirms your live score` : `Your re-assessment is due ${fmt(i.nextReassessment)}: it confirms your live score`, href: "/assessment/details" });
  }

  if (!items.length) return null;
  return { items, counts: { overdue: overdue.length, due: due.length, checkin } };
}

export interface DigestContext extends Pick<EmailContext, "appUrl" | "firstName" | "unsubscribeUrl" | "postalAddress"> {
  live: number | null;
  confirmed: number | null;
}

const link = (c: DigestContext, path: string) => {
  const [base, hash] = path.split("#");
  return `${c.appUrl}${base}?utm_source=email&utm_medium=email&utm_campaign=weekly_plan${hash ? `#${hash}` : ""}`;
};

export function buildDigestEmail(d: Digest, c: DigestContext): { subject: string; html: string; text: string } {
  const ec: EmailContext = { ...c, score: 0, band: "", planScore: 0, weakest: [], recommendation: "" };
  const hi = c.firstName ? `${c.firstName}, ` : "";
  const parts: string[] = [];
  if (d.counts.overdue) parts.push(`${d.counts.overdue} overdue`);
  if (d.counts.due) parts.push(`${d.counts.due} due this week`);
  const subject = parts.length ? `Your plan this week: ${parts.join(", ")}` : d.items.some((x) => x.kind === "reassess") ? "Time to re-assess your readiness" : "Your plan this week: a quick check-in";
  const score = c.live !== null && c.confirmed !== null ? `Your live Total Readiness Score is <strong>${Math.round(c.live)}</strong> (confirmed ${Math.round(c.confirmed)}). Each finished action and check-in moves it.` : "";
  const list = `<ul style="margin:0 0 16px;padding-left:20px;line-height:1.6;font-size:15px">${d.items.map((x) => `<li style="margin:0 0 6px"><a href="${esc(link(c, x.href))}" style="color:#071727">${esc(x.text)}</a></li>`).join("")}</ul>`;
  const body = p(`${esc(hi)}here's what's on your Founder Trajectory™ plan this week.`) + list + (score ? p(score) : "");
  const text = `${hi}here's what's on your Founder Trajectory(TM) plan this week.\n\n${d.items.map((x) => `- ${x.text}: ${link(c, x.href)}`).join("\n")}${c.live !== null && c.confirmed !== null ? `\n\nYour live Total Readiness Score is ${Math.round(c.live)} (confirmed ${Math.round(c.confirmed)}).` : ""}${textFooter(ec)}`;
  return { subject, html: layout("Your plan this week", body, ec, { label: "Open my dashboard", href: link(c, "/dashboard") }), text };
}
