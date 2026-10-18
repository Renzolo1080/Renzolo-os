import { decideAcknowledgment, MATCHING_STATEMENT_VERSION, FULL_STATEMENT, CONCEPT_PARAGRAPHS, ACK_SOURCES } from "../lib/matching-statement";
import { ensureMatchingAcknowledgment, hasActiveMatchingAddOn } from "../lib/acknowledgment-server";

function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

async function main() {
  const V = MATCHING_STATEMENT_VERSION;

  let d = decideAcknowledgment([], false);
  assert(d.kind === "not-needed", "founders without the Matching add-on are never asked", d);
  d = decideAcknowledgment(["0.9"], false);
  assert(d.kind === "not-needed", "not even after the statement changes", d);
  d = decideAcknowledgment([V], true);
  assert(d.kind === "acknowledged", "add-on founders who acknowledged the current version go straight in", d);
  d = decideAcknowledgment([], true);
  assert(d.kind === "ask", "add-on founders with no acknowledgment are asked", d);
  d = decideAcknowledgment(["0.9"], true);
  assert(d.kind === "ask", "add-on founders are asked again when the statement changes", d);

  assert(ACK_SOURCES.includes("checkout") && ACK_SOURCES.includes("login") && ACK_SOURCES.length === 2, "acknowledgments come from checkout or login only");

  // Until the add-on can be bought, nobody has it, so the dashboard never
  // asks and never touches the database for this.
  let queried = false;
  const fake = { from: () => { queried = true; throw new Error("should not query"); } } as any;
  assert((await hasActiveMatchingAddOn(fake, "x")) === false, "no founder has the add-on before its checkout exists");
  assert((await ensureMatchingAcknowledgment(fake, { id: "x" } as any)) === true && !queried, "the dashboard lets everyone through for now, without a database read");

  const all = [...CONCEPT_PARAGRAPHS, ...FULL_STATEMENT.map((s) => s.body)].join(" ");
  assert(/do not guarantee|does not promise/.test(all), "the statement says results are not guaranteed");
  assert(/not a lender/.test(all), "the statement says RENZOLO is not a lender, broker or adviser");
  assert(/separate written agreement/.test(all), "no success fee without a separate written agreement");
}

main();
