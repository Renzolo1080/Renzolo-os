import { decideAcknowledgment, MATCHING_STATEMENT_VERSION, FULL_STATEMENT, CONCEPT_PARAGRAPHS } from "../lib/matching-statement";

function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

const now = new Date("2026-10-16T12:00:00Z");
const V = MATCHING_STATEMENT_VERSION;

let d = decideAcknowledgment([V], {}, now);
assert(d.kind === "acknowledged", "a saved row for the current version lets the founder in", d);

d = decideAcknowledgment([], {}, now);
assert(d.kind === "ask", "no row and nothing from sign-up: ask", d);

d = decideAcknowledgment(["0.9"], { matching_ack_version: "0.9", matching_ack_at: "2026-10-01T00:00:00Z" }, now);
assert(d.kind === "ask", "a row or sign-up for an older version: ask again", d);

d = decideAcknowledgment([], { matching_ack_version: V, matching_ack_at: "2026-10-15T09:30:00Z" }, now);
assert(d.kind === "record-registration" && d.acknowledgedAt === "2026-10-15T09:30:00.000Z", "ticked at sign-up: record it with the sign-up time", d);

d = decideAcknowledgment([], { matching_ack_version: V, matching_ack_at: "2027-01-01T00:00:00Z" }, now);
assert(d.kind === "record-registration" && d.acknowledgedAt === now.toISOString(), "a sign-up time in the future is replaced with now", d);

d = decideAcknowledgment([], { matching_ack_version: V, matching_ack_at: "not a date" }, now);
assert(d.kind === "record-registration" && d.acknowledgedAt === now.toISOString(), "an unreadable sign-up time is replaced with now", d);

d = decideAcknowledgment([], null, now);
assert(d.kind === "ask", "missing sign-up details: ask", d);

const all = [...CONCEPT_PARAGRAPHS, ...FULL_STATEMENT.map((s) => s.body)].join(" ");
assert(/do not guarantee|does not promise/.test(all), "the statement says results are not guaranteed");
assert(/not a lender/.test(all), "the statement says RENZOLO is not a lender, broker or adviser");
assert(/separate written agreement/.test(all), "no success fee without a separate written agreement");
