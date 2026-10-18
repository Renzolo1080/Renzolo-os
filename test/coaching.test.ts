import { sanitizeCommitments, sanitizePrep, sanitizeNotes, bookingLink, riskFlags, coachingStats, openCommitments, buildPrepBriefPrompt, MAX_COMMITMENTS, AGREEMENT_POINTS } from "../lib/coaching";

let fails = 0;
const assert = (c: boolean, m: string, d?: unknown) => {
  if (!c) {
    fails++;
    console.error("FAIL:", m, d === undefined ? "" : JSON.stringify(d));
    process.exitCode = 1;
  } else console.log("PASS:", m);
};

const cs = sanitizeCommitments([
  { id: "c1", text: "Call 5 shops", due: "2026-11-01", status: "open", area: "channels" },
  { id: "bad id!", text: "Fix prices", due: "soon", status: "weird", area: "moon" },
  { text: "" },
  { text: "fourth" },
  { text: "fifth" },
]);
assert(cs.length === MAX_COMMITMENTS - 0 || cs.length <= MAX_COMMITMENTS, "at most 3 commitments", cs);
assert(cs[0].area === "channels" && cs[1].id !== "c1" && cs[1].due === "" && cs[1].status === "open" && cs[1].area === "", "bad ids, dates, statuses and areas cleaned", cs);
assert(!cs.some((c) => !c.text), "empty commitments dropped");
assert(sanitizePrep({ focusLabel: "x".repeat(900), outcome: " y " }).focusLabel.length === 200 && sanitizePrep({ outcome: " y " }).outcome === "y", "prep trimmed and capped");
assert(sanitizeNotes({ goal: "g", hack: 1 } as any).goal === "g" && !("hack" in sanitizeNotes({ hack: 1 })), "notes keep only GROW fields");

assert(bookingLink({}) === null && bookingLink({ COACHING_BOOKING_URL: "http://insecure.example" }) === null, "booking link must be https");
const bl = bookingLink({ COACHING_BOOKING_URL: "https://calendly.com/renzolo/coaching" }, { name: "Ama Owusu", email: "ama@x.co" });
assert(!!bl && bl.includes("name=Ama+Owusu") && bl.includes("email=ama%40x.co"), "booking link pre-fills name and email", bl);

const today = "2026-10-13";
const sessions = [
  { id: "s1", status: "completed", created_at: "2026-09-01", completed_at: "2026-09-02", rating: 5, commitments: [{ id: "a", text: "A", due: "2026-10-01", status: "open" }, { id: "b", text: "B", status: "done" }] },
  { id: "s2", status: "completed", created_at: "2026-09-20", completed_at: "2026-09-21", rating: 4, commitments: [{ id: "c", text: "C", status: "dropped" }] },
  { id: "s3", status: "requested", created_at: "2026-10-10" },
];
const flags = riskFlags({ sessions, lastUpdate: "2026-10-01", goalsBehind: 1 }, today);
assert(flags.includes("overdue_commitments") && flags.includes("goal_behind") && flags.includes("awaiting_time") && !flags.includes("no_update") && !flags.includes("no_session"), "risk flags", flags);
const quiet = riskFlags({ sessions: [], lastUpdate: null, goalsBehind: 0 }, today);
assert(quiet.includes("no_update") && quiet.includes("no_session"), "a founder with nothing logged needs attention");
const st = coachingStats(sessions);
assert(st.completed === 2 && st.awaiting === 1 && st.avgRating === 4.5 && st.commitmentRate === 50, "coaching stats: ratings and commitments kept", st);
assert(openCommitments(sessions).length === 1 && openCommitments(sessions)[0].sessionId === "s1", "open commitments carry their session");

const p = buildPrepBriefPrompt({ founderName: "Ama", company: "Owusu Farms", stage: "Acquire", industry: "Agri", country: "Kenya", tier: "Growth", score: "Venture 45", gaps: "Channels 20", planText: "PLAN", reviewText: null, goals: "- Revenue", latestUpdate: "", previous: "", prep: sanitizePrep({ focusLabel: "Channels", outcome: "A distributor plan" }), kind: "quarterly_review" });
assert(p.includes("QUARTERLY REVIEW") && p.includes("A distributor plan") && p.includes("## Suggested GROW questions") && p.includes("3 priorities for next quarter"), "prep brief prompt");
assert(AGREEMENT_POINTS.some((x) => x.includes("confidential")) && AGREEMENT_POINTS.some((x) => x.includes("not legal, tax")), "agreement covers confidentiality and scope");

console.log(fails ? `\n${fails} FAILED` : "\nAll coaching tests passed.");
