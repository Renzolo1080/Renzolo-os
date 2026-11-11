import { createHmac, timingSafeEqual } from "crypto";

/** The emails RENZOLO sends after a free Readiness Snapshot:
 *   results   — straight away: their scores and recommendation (asked for).
 *   day2      — what their weakest area means, with practical tips.
 *   day5      — turning the Snapshot into a plan (membership / $40 assessment).
 *   day10     — cohorts and the Readiness Clinic.
 * The three follow-ups go only to founders who ticked "email me tips",
 * stop once they create an account, and always carry an unsubscribe link.
 * Pure functions, so the wording and links can be tested. */

export type EmailKind = "results" | "day2" | "day5" | "day10";
export const FOLLOW_UPS: { kind: Exclude<EmailKind, "results">; afterDays: number }[] = [
  { kind: "day2", afterDays: 2 },
  { kind: "day5", afterDays: 5 },
  { kind: "day10", afterDays: 10 },
];

/** Plain, practical tips for each business-model area. */
export const AREA_TIPS: Record<string, { name: string; tips: string[] }> = {
  customerSegments: { name: "Customer Segments", tips: ["Write down your best 10 customers and what they have in common.", "Talk to 5 of them this month: why did they buy, and what nearly stopped them?", "Pick one segment to focus your next 90 days on."] },
  valueProposition: { name: "Value Proposition", tips: ["Finish this sentence in under 15 words: we help ___ to ___ unlike ___.", "Ask recent customers what they would use if you disappeared tomorrow.", "Put proof (a result, a number, a testimonial) next to every claim you make."] },
  channels: { name: "Channels", tips: ["List every way customers found you last quarter and count each one.", "Double down on the one that brought paying customers, not just attention.", "Work out what each channel costs you per paying customer."] },
  customerRelationships: { name: "Customer Relationships", tips: ["Contact every customer within a week of buying to check they're happy.", "Track how many customers buy again; it's your cheapest growth.", "Ask happy customers for one referral each."] },
  revenueStreams: { name: "Revenue Streams", tips: ["Know your monthly revenue, and where each shilling, rand or dollar came from.", "Check your prices against two competitors and against your costs.", "Look for one repeat or subscription offer you could add."] },
  keyResources: { name: "Key Resources", tips: ["List the people, money and equipment your next stage needs.", "Mark which ones you have, can borrow, or must buy.", "Put the biggest gap into your 90-day plan with a date."] },
  keyActivities: { name: "Key Activities", tips: ["Write down the 5 things that must happen every week for the business to run.", "Note which ones only you can do today, and train someone on one of them.", "Use a simple checklist so quality holds when you're busy."] },
  keyPartnerships: { name: "Key Partnerships", tips: ["List the suppliers and partners you depend on most.", "Get your most important arrangement in writing.", "Find one partner who already serves your customers and could refer them."] },
  costStructure: { name: "Cost Structure", tips: ["Work out what it costs you to make and deliver one sale.", "Separate fixed monthly costs from costs that grow with sales.", "Review your three biggest costs every month."] },
};

export function unsubscribeToken(email: string, secret: string): string {
  return createHmac("sha256", secret).update(email.trim().toLowerCase()).digest("base64url").slice(0, 32);
}

export function checkUnsubscribeToken(email: string, token: string, secret: string): boolean {
  if (!secret || !email || !token) return false;
  const a = Buffer.from(unsubscribeToken(email, secret));
  const b = Buffer.from(token);
  return a.length === b.length && timingSafeEqual(a, b);
}

export interface EmailContext {
  appUrl: string;
  firstName: string;
  /** Total Readiness Score and its band. */
  score: number;
  band: string;
  planScore: number;
  weakest: string[];
  /** Block key of the weakest area, for the day-2 tips. */
  weakestKey?: string;
  recommendation: string;
  shareUrl?: string | null;
  unsubscribeUrl?: string | null;
  /** Business postal address, required in marketing email in the US (EMAIL_POSTAL_ADDRESS). */
  postalAddress?: string | null;
}

export const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function layout(title: string, bodyHtml: string, ctx: EmailContext, cta?: { label: string; href: string }): string {
  return `<!doctype html><html><body style="margin:0;background:#F3F5F8;font-family:'Source Sans 3',Arial,Helvetica,sans-serif;color:#071727">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F3F5F8;padding:24px 0"><tr><td align="center">
<table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E3E7ED">
<tr><td style="padding:18px 28px;border-bottom:1px solid #E3E7ED"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="padding-right:12px"><img src="${esc(ctx.appUrl)}/img/rz-logo.png" width="48" height="40" alt="RZ" style="display:block;border:0"></td><td style="font-size:19px;font-weight:bold;letter-spacing:2px;color:#071727">RENZOLO&trade;</td></tr></table></td></tr>
<tr><td style="padding:28px">
<h1 style="margin:0 0 16px;font-family:'Libre Caslon Text',Georgia,serif;font-size:24px;line-height:1.25;color:#071727">${esc(title)}</h1>
${bodyHtml}
${cta ? `<p style="margin:28px 0 8px"><a href="${esc(cta.href)}" style="background:#FF5A1F;color:#071727;text-decoration:none;padding:13px 24px;border-radius:999px;font-weight:bold;display:inline-block">${esc(cta.label)}</a></p>` : ""}
</td></tr>
<tr><td style="padding:16px 28px;font-size:11px;color:#68737D;border-top:1px solid #eeeeee">RENZOLO&trade; &middot; Founder Trajectory&trade; &middot; RENZOLO OS&trade;<br>Renzolo Enterprises LLC${ctx.postalAddress ? `, ${esc(ctx.postalAddress)}` : ""} &middot; <a href="${esc(ctx.appUrl)}/privacy" style="color:#68737D">Privacy</a>${ctx.unsubscribeUrl ? ` &middot; <a href="${esc(ctx.unsubscribeUrl)}" style="color:#68737D">Unsubscribe</a>` : ""}</td></tr>
</table></td></tr></table></body></html>`;
}

export function textFooter(ctx: EmailContext) {
  return `\n\n--\nRENZOLO(TM) · Founder Trajectory(TM) · RENZOLO OS(TM)\nRenzolo Enterprises LLC${ctx.postalAddress ? `, ${ctx.postalAddress}` : ""}\nPrivacy: ${ctx.appUrl}/privacy${ctx.unsubscribeUrl ? `\nUnsubscribe: ${ctx.unsubscribeUrl}` : ""}`;
}

export const p = (t: string) => `<p style="margin:0 0 14px;line-height:1.55;font-size:15px">${t}</p>`;
const link = (ctx: EmailContext, path: string, campaign: string) => `${ctx.appUrl}${path}${path.includes("?") ? "&" : "?"}utm_source=email&utm_medium=email&utm_campaign=${campaign}`;

export function buildEmail(kind: EmailKind, ctx: EmailContext): { subject: string; html: string; text: string } {
  const hi = ctx.firstName ? `${ctx.firstName}, ` : "";
  const weakList = ctx.weakest.length ? ctx.weakest.map((w, i) => `${i + 1}. ${w}`).join("\n") : "";
  if (kind === "results") {
    const signup = link(ctx, "/register", "results");
    const subject = `Your Readiness Snapshot: ${ctx.score}/100 (${ctx.band})`;
    const html = layout(
      `${hi}here are your Readiness Snapshot results`,
      p(`<strong>Total Readiness Score:</strong> ${ctx.score}/100 &middot; ${esc(ctx.band)}<br><strong>Strategic Plan Readiness:</strong> ${ctx.planScore}/100`) +
        (ctx.weakest.length ? p(`<strong>The areas holding you back most:</strong><br>${ctx.weakest.map((w, i) => `${i + 1}. ${esc(w)}`).join("<br>")}`) : "") +
        p(`<strong>Our recommendation:</strong> ${esc(ctx.recommendation)}`) +
        p(`Create your account with this email address and your Snapshot will be waiting for you.`) +
        (ctx.shareUrl ? p(`Know another founder who should check their readiness? <a href="${esc(ctx.shareUrl)}" style="color:#C4400F">Share your score</a>.`) : ""),
      ctx,
      { label: "Continue your Founder Trajectory", href: signup }
    );
    const text = `${hi}here are your Readiness Snapshot results.\n\nTotal Readiness Score: ${ctx.score}/100 (${ctx.band})\nStrategic Plan Readiness: ${ctx.planScore}/100\n${weakList ? `\nAreas holding you back most:\n${weakList}\n` : ""}\nOur recommendation: ${ctx.recommendation}\n\nCreate your account with this email address and your Snapshot will be waiting: ${signup}${textFooter(ctx)}`;
    return { subject, html, text };
  }
  if (kind === "day2") {
    const area = (ctx.weakestKey && AREA_TIPS[ctx.weakestKey]) || null;
    const name = area?.name ?? ctx.weakest[0] ?? "your weakest area";
    const tips = area?.tips ?? ["Write down where things stand today.", "Decide what good looks like in 90 days.", "Pick one action to start this week."];
    const cta = link(ctx, "/register", "day2");
    const subject = `3 ways to strengthen your ${name}`;
    const html = layout(
      `${hi}let's start with ${name}`,
      p(`Your Snapshot showed ${esc(name)} as the area holding your business back most. Here are three things you can do this month:`) +
        `<ol style="margin:0 0 14px 18px;padding:0;line-height:1.6;font-size:15px">${tips.map((t) => `<li style="margin-bottom:6px">${esc(t)}</li>`).join("")}</ol>` +
        p(`Your full Readiness Assessment goes deeper: why this gap exists for your business, and a plan to close it.`),
      ctx,
      { label: "Start my full assessment", href: cta }
    );
    const text = `${hi}your Snapshot showed ${name} as the area holding your business back most. Three things you can do this month:\n${tips.map((t, i) => `${i + 1}. ${t}`).join("\n")}\n\nYour full Readiness Assessment goes deeper: ${cta}${textFooter(ctx)}`;
    return { subject, html, text };
  }
  if (kind === "day5") {
    const pricing = link(ctx, "/pricing", "day5");
    const subject = "Turn your Snapshot into a plan";
    const html = layout(
      `${hi}your score is a starting point`,
      p(`A Total Readiness Score of ${ctx.score} tells you where you stand. What moves it is a plan you actually carry out.`) +
        p(`With a Founder Trajectory&trade; membership you get your full Readiness Assessment and report, a growth and readiness plan of 90 days to 36 months, a dashboard with goals and reminders, and coaching to keep you on track. Memberships start at $60 a quarter, assessment, valuation range and coaching included.`) +
        p(`Prefer a one-time answer? The <strong>Readiness Assessment</strong> ($60) gives you the full readiness report, an AI market insight for your industry and country, and a recommendation of the membership that fits you.`),
      ctx,
      { label: "See membership options", href: pricing }
    );
    const text = `${hi}a Total Readiness Score of ${ctx.score} tells you where you stand. What moves it is a plan you carry out.\n\nMemberships start at $60 a quarter and include your full Readiness Assessment, a growth and readiness plan (90 days to 36 months), a dashboard and coaching sessions. Or get the one-time Readiness Assessment.\n\nSee the options: ${pricing}${textFooter(ctx)}`;
    return { subject, html, text };
  }
  const programs = link(ctx, "/programs", "day10");
  const subject = "Grow alongside other founders";
  const html = layout(
    `${hi}you don't have to do this alone`,
    p(`The Founder Trajectory&trade; Academy runs cohorts where founders work through their plan together, with coaching along the way at three development levels: Launch (8 weeks), Build (12 weeks) and Scale (6 months).`) +
      p(`Launch and Build open three times a year, and Scale once a year. Members get priority when applying.`),
    ctx,
    { label: "Learn about cohorts", href: programs }
  );
  const text = `${hi}The Founder Trajectory(TM) Academy runs cohorts where founders work through their plan together, with coaching at three development levels: Launch (8 weeks), Build (12 weeks) and Scale (6 months). Members get priority when applying.\n\nLearn more: ${programs}${textFooter(ctx)}`;
  return { subject, html, text };
}

/** Which follow-up (if any) a lead is due, given what's been sent. */
export function dueFollowUp(createdAt: string, sentKinds: string[], now = new Date()): Exclude<EmailKind, "results"> | null {
  const ageDays = (now.getTime() - new Date(createdAt).getTime()) / 864e5;
  // Latest one that's due and not more than 3 days late; earlier ones that
  // were missed are skipped, so a lead is never sent a burst of emails.
  let due: Exclude<EmailKind, "results"> | null = null;
  for (const f of FOLLOW_UPS) {
    if (!sentKinds.includes(f.kind) && ageDays >= f.afterDays && ageDays <= f.afterDays + 3) due = f.kind;
  }
  return due;
}
