import { buildCloneContext, cloneConfig, CONSENT_POINTS, greeting, PAL_SYSTEM_PROMPT, sessionLimit, sessionsLeft, SESSION_SECONDS } from "../lib/ai-clone";

let fails = 0;
const check = (ok: boolean, name: string, d?: unknown) => (ok ? console.log(`PASS: ${name}`) : (fails++, console.log(`FAIL: ${name}`, d ?? "")));

check(!cloneConfig({}).enabled, "off without a Tavus key and PAL");
check(!cloneConfig({ TAVUS_API_KEY: "k" }).enabled, "off with a key but no PAL");
const on = cloneConfig({ TAVUS_API_KEY: " k ", TAVUS_PAL_ID: "p1" });
check(on.enabled && on.apiKey === "k" && on.faceId === null && on.apiUrl === "https://tavusapi.com/v2/conversations", "on with key and PAL; official endpoint", on);
check(cloneConfig({ TAVUS_API_KEY: "k", TAVUS_PAL_ID: "p", TAVUS_API_URL: "https://evil.example/v2" }).apiUrl === "https://tavusapi.com/v2/conversations", "endpoint override only for local tests");
check(cloneConfig({ TAVUS_API_KEY: "k", TAVUS_PAL_ID: "p", TAVUS_API_URL: "http://127.0.0.1:54399/v2/conversations" }).apiUrl.startsWith("http://127.0.0.1"), "local test endpoint accepted");

check(sessionLimit("elevate") === 12 && sessionLimit("growth") === 3, "monthly sessions: Elevate 12, others 3");
const now = new Date("2026-10-20T12:00:00Z");
check(sessionsLeft(["2026-10-01T10:00:00Z", "2026-09-30T23:00:00Z"], 3, now) === 2, "only this month's sessions count");
check(sessionsLeft(["2026-10-01", "2026-10-02", "2026-10-03", "2026-10-04"], 3, now) === 0, "never below zero");
check(SESSION_SECONDS === 600, "sessions are capped at 10 minutes");

const ctx = { founderName: "Ama Owusu", company: "Owusu Farms", stage: "Early revenue", industry: "Agri-food", country: "Kenya", scores: "Readiness 62", gaps: "Channels", planText: "x".repeat(9000), goals: "Revenue $25k", actionsDue: "Cost the juice line", latestUpdate: "Signed a distributor", commitments: "none", marketHighlights: null, today: "2026-10-20" };
const c = buildCloneContext(ctx);
check(c.includes("Ama Owusu") && c.includes("Owusu Farms") && c.includes("Kenya"), "context names the founder, business and country");
check(c.length <= 6000, "context stays within the size limit", c.length);
check(greeting("Ama Owusu").startsWith("Hi Ama,") && greeting("Ama Owusu").includes("AI coach"), "greeting uses the first name and says it's an AI");
check(/not Lorenzo himself/.test(PAL_SYSTEM_PROMPT) && /No financial, legal, tax or investment advice/.test(PAL_SYSTEM_PROMPT) && /real Lorenzo/.test(PAL_SYSTEM_PROMPT), "PAL prompt: says it's AI, no regulated advice, hands off to the real Lorenzo");
check(CONSENT_POINTS.some((p) => /Tavus/.test(p)) && CONSENT_POINTS.some((p) => /not Lorenzo/.test(p)), "consent names the video provider and that it's not Lorenzo");

if (fails) { console.log(`${fails} AI clone tests failed`); process.exit(1); }
console.log("All Lorenzo · AI tests passed.");
