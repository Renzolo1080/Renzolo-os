import { checkUpload, documentChecklist, extractionPrompt, lenderChecks, parseExtraction } from "../lib/doc-intake";

function assert(cond: boolean, msg: string, detail?: unknown) {
  if (!cond) {
    console.error("FAIL:", msg, detail === undefined ? "" : JSON.stringify(detail));
    process.exitCode = 1;
  } else console.log("PASS:", msg);
}

const today = "2026-11-20";

// --- uploads ---------------------------------------------------------------------
assert(checkUpload(null) !== null && checkUpload({ type: "application/pdf", size: 0 }) !== null, "an empty upload is refused");
assert(checkUpload({ type: "application/zip", size: 100 }) === "Upload a PDF, JPG, PNG or WebP file.", "only PDFs and images");
assert(checkUpload({ type: "application/pdf", size: 9 * 1024 * 1024 })?.includes("8 MB") === true, "8 MB limit");
assert(checkUpload({ type: "image/png", size: 5000 }) === null, "a normal image is fine");

// --- the prompt never asks for identifiers ------------------------------------------
const prompt = extractionPrompt("bank_statement", today);
assert(prompt.includes("Do NOT include account numbers") && prompt.includes(today), "prompt forbids account and ID numbers");

// --- parsing ---------------------------------------------------------------------------
const reply = `Here you go:
{"detectedType":"bank_statement","readable":true,"businessName":"Ama Foods Ltd acct 0123456789","currency":"KES",
 "periodStart":"2026-07-01","periodEnd":"2026-09-30","monthsCovered":3,"issuedOn":null,"expiresOn":null,
 "figures":{"totalInflows":1250000,"totalOutflows":1100000.456,"openingBalance":"lots","closingBalance":150000,"averageMonthlyInflow":416666.67,"revenue":null,"expenses":null,"netProfit":null,"totalAssets":null,"totalLiabilities":null},
 "concerns":["Page 3 is missing","Account 99887766554433 is a personal account",5],"accountNumber":"0123456789"}`;
const e = parseExtraction(reply, "bank_statement")!;
assert(!!e && e.currency === "KES" && e.monthsCovered === 3 && e.figures.totalInflows === 1250000 && e.figures.totalOutflows === 1100000.46, "figures parsed and rounded", e?.figures);
assert(e.figures.openingBalance === null, "non-numbers become null, never guessed");
assert(!JSON.stringify(e).includes("0123456789") && !JSON.stringify(e).includes("99887766554433") && !("accountNumber" in (e as any)), "account numbers are never kept, even if the AI returns them", e);
assert(e.concerns.length === 2, "only text concerns are kept");
assert(parseExtraction("I can't read this", "bank_statement") === null && parseExtraction("{not json}", "registration") === null, "unusable replies are rejected");

// --- lender checks -----------------------------------------------------------------------
const checks = lenderChecks(e, today);
assert(checks[0].level === "fix" && checks[0].text.startsWith("Covers 3 months"), "under 6 months is the first fix", checks);
assert(checks.some((c) => c.text.startsWith("Ends 51 days ago")), "a statement ending 51 days ago gets a warning", checks);
const tax = parseExtraction(`{"detectedType":"tax_clearance","readable":true,"expiresOn":"2026-10-31","figures":{},"concerns":[]}`, "tax_clearance")!;
assert(lenderChecks(tax, today)[0].text === "Expired on 2026-10-31. Apply for a new one.", "an expired tax clearance must be renewed");
const wrong = parseExtraction(`{"detectedType":"registration","readable":true,"figures":{},"concerns":[]}`, "tax_clearance")!;
assert(lenderChecks(wrong, today).some((c) => c.text.includes("looks like a business registration certificate")), "flags a document that isn't what was selected");

// --- checklist -------------------------------------------------------------------------------
const list = documentChecklist([{ doc_type: "bank_statement", created_at: "2026-11-19T00:00:00Z", result: e }, { doc_type: "tax_clearance", created_at: "2026-11-19T00:00:00Z", result: tax }], today);
assert(list.length === 4 && list[0].status === "fix" && list[1].status === "missing" && list[3].status === "fix", "checklist: statement needs work, financials missing, tax expired", list.map((l) => l.status));

// --- partner portal ---------------------------------------------------------------------
import("../lib/partner").then(({ impactSummary, memberRow, normalizeCode, validCode, SHARED_WITH_PARTNER, NOT_SHARED }) => {
  assert(normalizeCode(" agency-27 ") === "AGENCY27" && validCode("AGENCY27") && !validCode("AB1") && normalizeCode(42) === "", "join codes are cleaned and checked");
  const base = { name: "Ama", company: "Ama Foods", joinedAt: "2026-11-20", areasTotal: 9 };
  const a = memberRow({ ...base, baseline: 42, score: 55.5, band: "Getting ready", areasAnswered: 9, planCompleteness: 70 });
  const b = memberRow({ ...base, name: "Kofi", baseline: 60, score: 58, band: "Nearly ready", areasAnswered: 4, planCompleteness: 0 });
  const c = memberRow({ ...base, name: "Zola", baseline: null, score: null, band: null, areasAnswered: 0, planCompleteness: null });
  assert(a.change === 13.5 && a.assessmentPct === 100 && a.planPct === 70, "per-founder change and progress", a);
  assert(b.change === -2 && b.assessmentPct === 44 && c.change === null && c.planPct === 0, "decline and not-yet-assessed handled", { b, c });
  const s = impactSummary([a, b, c]);
  assert(s.members === 3 && s.scored === 2 && s.avgScore === 56.8 && s.avgBaseline === 51 && s.avgChange === 5.8 && s.improved === 1, "cohort averages only count founders with data", s);
  assert(s.assessmentsComplete === 1 && s.plansStarted === 1 && s.plansReady === 1 && s.byBand["Getting ready"] === 1, "completion counts and bands", s);
  assert(impactSummary([]).avgScore === null && impactSummary([]).members === 0, "an empty cohort shows dashes, not errors");
  assert(!SHARED_WITH_PARTNER.join(" ").toLowerCase().includes("answers") && NOT_SHARED.join(" ").includes("assessment answers"), "consent wording: answers stay private");
});
