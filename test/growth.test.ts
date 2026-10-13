import { attributionFromUrl, decodeAttribution, encodeAttribution, newReferralCode } from "../lib/attribution";
import { buildEmail, dueFollowUp, unsubscribeToken, checkUnsubscribeToken, AREA_TIPS } from "../lib/emails";
import { sendEmail } from "../lib/email-send";
import { parseCohortApplication, parseContact } from "../lib/forms";
import { BLOCK_KEYS } from "../lib/scoring";

function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

async function main() {
  // --- where founders come from ---------------------------------------------
  const now = new Date("2026-10-13T12:00:00Z");
  const a = attributionFromUrl("?utm_source=whatsapp&utm_medium=social&utm_campaign=ke_launch&ref=ab12cd34", "/ke", null, now);
  assert(!!a && a.utm_source === "whatsapp" && a.utm_campaign === "ke_launch" && a.ref === "AB12CD34" && a.landing === "/ke", "tracking tags and referral code are read from the link", a);
  assert(attributionFromUrl("", "/", null, now) === null, "a plain visit records nothing (first visit with tags wins)");
  const fromRef = attributionFromUrl("", "/", "https://www.linkedin.com/feed/", now);
  assert(fromRef?.referrer === "www.linkedin.com" && !fromRef.utm_source, "the referring site is kept (host only)");
  assert(attributionFromUrl("?utm_source=<script>", "/", null, now) === null, "junk values are dropped");
  const round = decodeAttribution(encodeAttribution(a!));
  assert(JSON.stringify(round) === JSON.stringify(a), "the cookie round-trips");
  assert(decodeAttribution("not%json") === null && decodeAttribution(encodeURIComponent('{"utm_source":"<x>","ref":"a-b"}'))?.ref === "AB", "a tampered cookie is cleaned on the server");
  const code = newReferralCode();
  assert(/^[A-HJ-NP-Z2-9]{8}$/.test(code), "referral codes: 8 characters, no look-alikes (0/O, 1/I/L)", code);

  // --- emails -------------------------------------------------------------------
  const ctx = { appUrl: "https://app.renzoloenterprises.com", firstName: "Ama", ventureScore: 48, tier: "Early Stage", planScore: 30, weakest: ["Channels", "Cost Structure", "Key Partnerships"], weakestKey: "channels", recommendation: "Your biggest lever right now is your strategic plan.", shareUrl: "https://app.renzoloenterprises.com/score/abc", unsubscribeUrl: "https://app.renzoloenterprises.com/unsubscribe?e=a&t=b", postalAddress: "123 Main St, Milwaukee, WI" };
  const r = buildEmail("results", ctx);
  assert(r.subject.includes("48/100") && r.html.includes("Channels") && r.text.includes("Strategic Plan Readiness: 30/100"), "results email: scores, weakest areas, recommendation");
  assert(r.html.includes("utm_campaign=results") && r.html.includes("Unsubscribe") && r.html.includes("Renzolo Enterprises LLC, 123 Main St"), "…links are tagged, with unsubscribe and the business address");
  const d2 = buildEmail("day2", ctx);
  assert(d2.subject.includes("Channels") && AREA_TIPS.channels.tips.every((t) => d2.text.includes(t)), "day-2 email: tips for their weakest area");
  assert(BLOCK_KEYS.every((k) => AREA_TIPS[k]?.tips.length === 3), "every business-model area has three tips");
  assert(buildEmail("day5", ctx).text.includes("$79") && buildEmail("day10", ctx).text.includes("Founder Trajectory(TM) Academy"), "day-5 (membership) and day-10 (Academy) emails");
  for (const k of ["results", "day2", "day5", "day10"] as const) {
    const e = buildEmail(k, { ...ctx, firstName: "<b>x</b>" });
    assert(!e.html.includes("<b>x</b>") && !/renzcelerator/i.test(e.text), `${k}: names are escaped in HTML; no old program name`);
  }
  const created = "2026-10-01T12:00:00Z";
  const at = (days: number) => new Date(new Date(created).getTime() + days * 864e5);
  assert(dueFollowUp(created, [], at(1)) === null && dueFollowUp(created, [], at(2.1)) === "day2", "day-2 email is due after 2 days");
  assert(dueFollowUp(created, ["day2"], at(5.5)) === "day5" && dueFollowUp(created, ["day2", "day5"], at(10)) === "day10", "then day 5, then day 10");
  assert(dueFollowUp(created, [], at(6)) === "day5", "a missed email is skipped, not sent late in a burst");
  assert(dueFollowUp(created, ["day2", "day5", "day10"], at(12)) === null && dueFollowUp(created, [], at(20)) === null, "nothing after the series, or for old leads");
  const tok = unsubscribeToken("Ama@Example.com", "s3cret");
  assert(checkUnsubscribeToken("ama@example.com", tok, "s3cret") && !checkUnsubscribeToken("other@example.com", tok, "s3cret") && !checkUnsubscribeToken("ama@example.com", tok, ""), "unsubscribe links can't be forged for another address");

  let captured: any = null;
  const fake = async (url: string, init?: RequestInit) => {
    captured = { url, init };
    return new Response("{}", { status: 200 });
  };
  const sent = await sendEmail({ to: "a@b.co", subject: "s", html: "<p>h</p>", text: "t", unsubscribeUrl: "https://x/u" }, { env: { RESEND_API_KEY: "k", EMAIL_FROM: "F <f@x.co>" }, fetchImpl: fake });
  const body = JSON.parse(captured.init.body);
  assert(sent.sent && captured.url === "https://api.resend.com/emails" && body.headers["List-Unsubscribe"] === "<https://x/u>", "emails go through Resend with a one-click unsubscribe header");
  assert(!(await sendEmail({ to: "a@b.co", subject: "s", html: "", text: "" }, { env: {}, fetchImpl: fake })).sent, "without an email key, nothing is sent (and nothing breaks)");

  // --- public forms ----------------------------------------------------------------
  assert(parseCohortApplication({ fullName: "Ama", email: "a@b.co", cohort: "elevate" }).ok, "a cohort application is accepted");
  assert(!parseCohortApplication({ fullName: "Ama", email: "a@b", cohort: "elevate" }).ok && !parseCohortApplication({ fullName: "Ama", email: "a@b.co", cohort: "gold" }).ok, "…bad email or unknown cohort refused");
  const spam = parseCohortApplication({ fullName: "Bot", email: "a@b.co", cohort: "elevate", website: "http://spam" });
  assert(!spam.ok && (spam as any).error === "spam", "the hidden field catches bots");
  assert(parseContact({ fullName: "Ama", email: "a@b.co", topic: "Partnership", message: "We run a supplier program." }).ok && !parseContact({ fullName: "Ama", email: "a@b.co", topic: "Other", message: "Hello there" }).ok, "contact form checks the topic");
  console.log("\nAll growth tests completed.");
}
main();
