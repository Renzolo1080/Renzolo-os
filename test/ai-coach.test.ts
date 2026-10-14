import { INSIGHTS_PROMPT, WEB_SEARCHES, COACH_DISCLAIMER, buildCoachSystem, parseCoachReply, remainingToday, dailyLimit, threadTitle, historyFor, starters, CHECKIN_PROMPT } from "../lib/ai-coach";
import { entitlements } from "../lib/membership";

let fails = 0;
const assert = (c: boolean, m: string, d?: unknown) => {
  if (!c) {
    fails++;
    console.error("FAIL:", m, d === undefined ? "" : JSON.stringify(d));
    process.exitCode = 1;
  } else console.log("PASS:", m);
};

const sys = buildCoachSystem({
  founderName: "Ama", company: "Owusu Farms", stage: "Acquire", industry: "Agriculture", country: "Kenya", scores: "Venture 45", gaps: "Channels 20/100",
  planText: "PLAN-TEXT", goals: "- Revenue: start $5k, actual $9k, target $25k", actionsDue: "- Sign distributor (due 2026-10-01, OVERDUE)", latestUpdate: "", commitments: "", marketHighlights: "- Pitch Naivas", today: "2026-10-14", programmeWeek: "Week 3: Channels",
});
assert(sys.includes("Owusu Farms") && sys.includes("PLAN-TEXT") && sys.includes("OVERDUE") && sys.includes("Pitch Naivas") && sys.includes("Week 3: Channels"), "system prompt carries the founder's own context");
assert(sys.includes("GROW") && sys.includes("qualified professional") && sys.includes("Never invent facts") && sys.includes("human coach"), "system prompt sets coaching approach, scope and escalation");
assert(sys.includes("Latest monthly update:\nnone yet") && sys.includes("Open commitments from coaching sessions:\nnone"), "missing data is labelled, not invented");

const r = parseCoachReply('Try this.\n```json\n{"actions":[{"area":"channels","text":"Visit 3 shops","due":"2026-10-20"},{"area":"moon","text":"x"},{"area":"costStructure","text":"Cut delivery cost","due":"soon"},{"area":"channels","text":"a"},{"area":"channels","text":"b"}]}\n```\nGood luck.');
assert(r.text === "Try this.\n\nGood luck." && r.actions.length === 3 && r.actions[0].due === "2026-10-20" && r.actions[1].due === "", "reply split from actions; bad areas dropped, bad dates cleared, at most 3", r);
assert(parseCoachReply("Just text").actions.length === 0 && parseCoachReply("x ```json {bad``` ").actions.length === 0, "no or broken JSON: no actions");

const now = new Date("2026-10-14T15:00:00Z");
assert(remainingToday(["2026-10-14T01:00:00Z", "2026-10-13T23:00:00Z"], 30, now) === 29, "only today's messages count");
assert(remainingToday(Array(40).fill("2026-10-14T01:00:00Z"), 30, now) === 0, "never below zero");
assert(dailyLimit("elevate") === 60 && dailyLimit("growth") === 30, "Elevate gets a higher daily limit");
assert(threadTitle("  How do I price my juice for supermarkets when my costs keep rising every month?") .endsWith("…") && threadTitle("Pricing") === "Pricing", "thread titles from the first message");
const h = historyFor([{ role: "assistant", content: "a" }, ...Array.from({ length: 14 }, (_, i) => ({ role: (i % 2 ? "assistant" : "user") as any, content: String(i) }))]);
assert(h.length <= 12 && h[0].role === "user", "history trimmed and starts with the founder");
assert(starters({ gaps: ["Channels"], goals: ["Revenue"], hasPlan: false }).some((s) => s.includes("Channels")) && starters({ gaps: [], goals: [], hasPlan: false }).some((s) => s.includes("start my strategic plan")), "starters come from the founder's gaps, goals and plan");
assert(CHECKIN_PROMPT.includes("Weekly check-in"), "check-in prompt");
assert(entitlements("growth").aiCoaching && entitlements("elevate").aiCoaching && !entitlements("essentials").aiCoaching && !entitlements(null, true).aiCoaching, "AI coach: Growth and Elevate (Launch to come with cohorts)");

assert(["Local", "National", "Regional", "International", "Global"].every((l) => sys.includes(`- ${l}:`)) && sys.includes("Tie each insight to their plan, targets or goals"), "five levels of insight tied to the plan");
assert(sys.includes("Please validate and confirm this information before acting on it. Your AI coach is not an advisor."), "the coach must end insight with the validation statement");
assert(["local", "national", "regional", "international", "global"].every((l) => INSIGHTS_PROMPT.includes(l)) && INSIGHTS_PROMPT.includes("targets"), "insight request covers all five levels and the targets");
assert(WEB_SEARCHES.insights > WEB_SEARCHES.chat && WEB_SEARCHES.checkin === 0, "web search: more for insight, none for check-ins");
assert(COACH_DISCLAIMER.includes("validate and confirm") && COACH_DISCLAIMER.includes("not an advisor"), "statement shown under every reply");
console.log(fails ? `\n${fails} FAILED` : "\nAll AI coach tests passed.");
