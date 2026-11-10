import { emptyPlan, sanitizePlan, stampDoneDates, type StrategicPlan } from "../lib/plan";
import { nextReassessment, statusLine, trajectory } from "../lib/live-score";

function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

// --- plan: tracking settings, done dates and evidence ------------------------------
const clean = sanitizePlan({ tracking: { targetScore: "75", targetDate: "2027-05-10", reassessEvery: 45, reassessOn: "bad" }, areas: { channels: { current: "x", actions: [{ id: "a1", text: "Call buyers", status: "done", doneOn: "2020-01-01", evidence: " signed LOI " }] } } });
assert(clean.tracking.targetScore === 75 && clean.tracking.targetDate === "2027-05-10" && clean.tracking.reassessEvery === 90 && clean.tracking.reassessOn === "", "tracking settings are cleaned (unknown interval falls back to 90 days)", clean.tracking);
assert(clean.areas.channels!.actions[0].evidence === "signed LOI", "evidence is kept, trimmed");
assert(sanitizePlan({}).tracking.reassessEvery === 90 && sanitizePlan({ tracking: { targetScore: 400 } }).tracking.targetScore === 100, "defaults and caps");

const prev = sanitizePlan({ areas: { channels: { actions: [{ id: "a1", text: "Call buyers", status: "done", doneOn: "2026-11-20" }, { id: "a2", text: "List", status: "in_progress" }] } } });
const next = sanitizePlan({ areas: { channels: { actions: [{ id: "a1", text: "Call buyers", status: "done", doneOn: "2026-12-30" }, { id: "a2", text: "List", status: "done", doneOn: "2020-01-01" }, { id: "a3", text: "New", status: "not_started", doneOn: "2026-12-01" }] } } });
stampDoneDates(prev, next, "2026-12-05");
const [a1, a2, a3] = next.areas.channels!.actions;
assert(a1.doneOn === "2026-11-20" && a2.doneOn === "2026-12-05" && a3.doneOn === "", "done dates are stamped by the server: kept, set to today, or cleared (no back-dating)", next.areas.channels!.actions);

// --- the trajectory -------------------------------------------------------------------
function planWith(): StrategicPlan {
  const p = emptyPlan();
  p.tracking = { targetScore: 75, targetDate: "2027-05-12", reassessEvery: 90, reassessOn: "" };
  p.goals = [{ id: "g1", title: "Win contract customers", measure: "Customers", unit: "customers", baseline: 0, target: 10, start: "2026-11-12", date: "2027-05-12" }];
  p.areas = {
    channels: { current: "", desired: "", actions: [
      { id: "c1", text: "Sign 2 contract customers", owner: "", due: "", status: "done", doneOn: "2027-02-20", evidence: "contracts signed" },
      { id: "c2", text: "Build buyer list", owner: "", due: "", status: "done", doneOn: "2027-02-25", evidence: "" },
      { id: "c3", text: "Old work", owner: "", due: "", status: "done", doneOn: "2026-12-01", evidence: "x" },
    ] },
    revenueStreams: { current: "", desired: "", actions: [{ id: "r1", text: "New price list", owner: "", due: "", status: "not_started", doneOn: "", evidence: "" }] },
  };
  return p;
}
const base = {
  plan: planWith(),
  confirmed: [{ date: "2027-02-10T10:00:00Z", total: 58 }, { date: "2026-11-12T10:00:00Z", total: 45 }],
  checkins: [{ goal_id: "g1", value: 2, checked_on: "2027-01-10" }, { goal_id: "g1", value: 5, checked_on: "2027-03-01" }],
  documents: [{ doc_type: "bank_statement", created_at: "2027-02-28T00:00:00Z", ok: true }, { doc_type: "tax_clearance", created_at: "2027-02-28T00:00:00Z", ok: false }],
  updates: [{ period: "2027-02-01", revenue: null, customers: null, cash: 10000 }, { period: "2027-03-01", revenue: null, customers: null, cash: 9000 }],
  startBlocks: { channels: 42.4, revenueStreams: 40 },
  today: "2027-03-05",
};
const t = trajectory(base);
assert(t.start?.total === 45 && t.latest?.total === 58 && t.confirmed.length === 2, "starting point is the first assessment; latest confirmed is the last re-assessment", { start: t.start, latest: t.latest });
assert(t.cap === 21, "live cap is half the room left (42/2), at most 25", t.cap);
const action = t.moves.filter((m) => m.source === "action");
assert(action.length === 2 && !action.some((m) => m.label === "Old work"), "only work finished since the last re-assessment counts", action);
assert(action.find((m) => m.label.startsWith("Sign"))!.points > action.find((m) => m.label.startsWith("Build"))!.points, "evidence earns full credit, a plain tick 60%");
assert(t.moves.some((m) => m.source === "goal" && m.label.includes("50%")) && t.moves.some((m) => m.source === "document" && m.label === "Bank statements checked") && !t.moves.some((m) => m.label.includes("Tax")), "goal check-ins and passing documents add points; failing documents don't", t.moves);
const areaTotal = t.moves.filter((m) => m.area === "channels").reduce((s, m) => s + m.points, 0);
assert(areaTotal <= t.cap * 0.4 + 0.15, "no one area carries more than 40% of the cap", { areaTotal, cap: t.cap });
assert(t.live !== null && t.live > 58 && t.live <= 58 + t.cap, "live score moves up from the confirmed score, within the cap", t.live);
assert(t.liveSeries[0].value === 58 && t.liveSeries[t.liveSeries.length - 1].date === "2027-03-05" && t.liveSeries[t.liveSeries.length - 1].value === t.live, "live line runs from the confirmed score to today", t.liveSeries);
assert(t.flags.length === 1 && t.flags[0].label === "Cash in the bank down 10%" && !t.moves.some((m) => m.points < 0), "bad news is flagged, never subtracted", t.flags);
assert(t.neededToday !== null && Math.abs(t.neededToday - 63.8) < 0.2 && t.status !== "no_target", "target path from the starting point to the target", t.neededToday);
assert(statusLine(t).length > 0 && statusLine({ ...t, status: "no_target" }) === "Set a target score to see your path", "status line");
assert(t.nextReassessment === "2027-05-11" && !t.reassessDue && t.reassessEvery === 90, "next re-assessment is 90 days after the last one", t.nextReassessment);
assert(nextReassessment({ ...planWith(), tracking: { ...planWith().tracking, reassessOn: "2027-04-01" } }, t.latest) === "2027-04-01", "a confirmed date wins over the interval");
assert(t.goals.percent === 50 && t.goals.series[0].value === 0 && t.goals.timeUsed === 62, "goal progress from the starting point, against time used", t.goals);
const ch = t.drivers.find((d) => d.key === "channels")!;
assert(t.drivers[0].key === "channels" && ch.share === 75 && ch.done === 100 && ch.left === 0 && ch.startScore === 42, "drivers: share of the plan, work done, starting score", t.drivers);

const empty = trajectory({ ...base, plan: null, confirmed: [], checkins: [], documents: [], updates: [] });
assert(empty.live === null && empty.moves.length === 0 && empty.drivers.length === 0 && empty.status === "no_target", "no assessment yet: nothing breaks");
const maxed = trajectory({ ...base, confirmed: [{ date: "2027-02-10", total: 99 }] });
assert(maxed.cap === 0.5 && (maxed.live ?? 0) <= 99.5, "near the top there's little room to move", maxed.cap);
