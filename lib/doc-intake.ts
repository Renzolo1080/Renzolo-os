/** AI document intake for capital readiness.
 *
 * A founder uploads a bank statement, financial statements, a business
 * registration certificate or a tax clearance. The AI reads it once and
 * returns the few figures lenders look at; we keep ONLY those figures and
 * checks, never the file, and never account numbers, ID numbers or
 * individual transactions. Then we flag what a lender would query:
 * too few months, out of date, expired, unreadable.
 *
 * Pure (prompt, parsing, checks), so it can be tested. */

export const DOC_TYPES = [
  { key: "bank_statement", label: "Business bank statement", hint: "6 to 12 months, as one PDF if you can" },
  { key: "financial_statements", label: "Financial statements", hint: "Income statement and balance sheet, or management accounts" },
  { key: "registration", label: "Business registration certificate", hint: "From your company registry" },
  { key: "tax_clearance", label: "Tax clearance or compliance certificate", hint: "Current, from your tax authority" },
] as const;
export type DocType = (typeof DOC_TYPES)[number]["key"];
export const isDocType = (v: unknown): v is DocType => typeof v === "string" && DOC_TYPES.some((d) => d.key === v);

export const ACCEPTED_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"] as const;
export const MAX_BYTES = 8 * 1024 * 1024;
export const DAILY_LIMIT = 10;

export function checkUpload(file: { type: string; size: number } | null): string | null {
  if (!file || file.size === 0) return "Choose a file to upload.";
  if (!(ACCEPTED_TYPES as readonly string[]).includes(file.type)) return "Upload a PDF, JPG, PNG or WebP file.";
  if (file.size > MAX_BYTES) return "That file is over 8 MB. Upload a smaller copy, or split a long statement.";
  return null;
}

export interface Extraction {
  docType: DocType;
  /** What the AI thinks the document actually is (may differ from what was chosen). */
  detectedType: DocType | "other";
  readable: boolean;
  businessName: string | null;
  currency: string | null;
  periodStart: string | null;
  periodEnd: string | null;
  monthsCovered: number | null;
  /** Certificates: issue and expiry dates. */
  issuedOn: string | null;
  expiresOn: string | null;
  figures: {
    totalInflows: number | null;
    totalOutflows: number | null;
    openingBalance: number | null;
    closingBalance: number | null;
    averageMonthlyInflow: number | null;
    revenue: number | null;
    expenses: number | null;
    netProfit: number | null;
    totalAssets: number | null;
    totalLiabilities: number | null;
  };
  /** The AI's own notes on problems (unsigned, partial pages, blurred…). */
  concerns: string[];
}

export function extractionPrompt(docType: DocType, today: string): string {
  const label = DOC_TYPES.find((d) => d.key === docType)!.label;
  return `You are helping a small-business founder get ready to apply for a loan. They uploaded a document they say is a "${label}". Today is ${today}.

Read the document and reply with ONE JSON object and nothing else, with exactly these keys:
{
  "detectedType": one of "bank_statement" | "financial_statements" | "registration" | "tax_clearance" | "other",
  "readable": true or false (false if blurred, cut off or not a business document),
  "businessName": the business or account holder name as printed, or null,
  "currency": ISO currency code such as "KES", "ZAR", "USD", or null,
  "periodStart": "YYYY-MM-DD" or null (first date covered),
  "periodEnd": "YYYY-MM-DD" or null (last date covered),
  "monthsCovered": number of whole or part months covered, or null,
  "issuedOn": "YYYY-MM-DD" or null (certificates),
  "expiresOn": "YYYY-MM-DD" or null (certificates),
  "figures": {
    "totalInflows": number or null, "totalOutflows": number or null,
    "openingBalance": number or null, "closingBalance": number or null,
    "averageMonthlyInflow": number or null,
    "revenue": number or null, "expenses": number or null, "netProfit": number or null,
    "totalAssets": number or null, "totalLiabilities": number or null
  },
  "concerns": up to 4 short sentences on anything a lender would query (missing pages, unsigned, handwritten changes, personal not business account, figures that don't add up). Empty list if none.
}

Rules: numbers are plain numbers in the document's currency, no symbols or commas. Use null when a value is not clearly shown; never guess. Do NOT include account numbers, ID or registration numbers, tax numbers, addresses, or individual transactions anywhere in your reply.`;
}

const ISO = /^\d{4}-\d{2}-\d{2}$/;
const date = (v: unknown) => (typeof v === "string" && ISO.test(v) && !Number.isNaN(Date.parse(v)) ? v : null);
const num = (v: unknown) => (typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 1e13 ? Math.round(v * 100) / 100 : null);
const text = (v: unknown, max: number) => (typeof v === "string" && v.trim() ? v.replace(/\d{6,}/g, "…").trim().slice(0, max) : null);

/** Turns the AI's reply into a safe Extraction, or null if it isn't usable.
 * Long digit runs are masked in any text, so an account or ID number that
 * slipped through is never stored. */
export function parseExtraction(reply: string, docType: DocType): Extraction | null {
  const m = reply.match(/\{[\s\S]*\}/);
  if (!m) return null;
  let r: any;
  try {
    r = JSON.parse(m[0]);
  } catch {
    return null;
  }
  if (!r || typeof r !== "object") return null;
  const f = r.figures && typeof r.figures === "object" ? r.figures : {};
  const months = num(r.monthsCovered);
  return {
    docType,
    detectedType: isDocType(r.detectedType) ? r.detectedType : "other",
    readable: r.readable !== false,
    businessName: text(r.businessName, 120),
    currency: typeof r.currency === "string" && /^[A-Z]{3}$/.test(r.currency) ? r.currency : null,
    periodStart: date(r.periodStart),
    periodEnd: date(r.periodEnd),
    monthsCovered: months === null ? null : Math.max(0, Math.min(60, Math.round(months))),
    issuedOn: date(r.issuedOn),
    expiresOn: date(r.expiresOn),
    figures: {
      totalInflows: num(f.totalInflows),
      totalOutflows: num(f.totalOutflows),
      openingBalance: num(f.openingBalance),
      closingBalance: num(f.closingBalance),
      averageMonthlyInflow: num(f.averageMonthlyInflow),
      revenue: num(f.revenue),
      expenses: num(f.expenses),
      netProfit: num(f.netProfit),
      totalAssets: num(f.totalAssets),
      totalLiabilities: num(f.totalLiabilities),
    },
    concerns: (Array.isArray(r.concerns) ? r.concerns : []).map((c: unknown) => text(c, 200)).filter(Boolean).slice(0, 4) as string[],
  };
}

const daysBetween = (a: string, b: string) => Math.round((Date.parse(b) - Date.parse(a)) / 864e5);

/** What a lender would query, worst first. */
export function lenderChecks(e: Extraction, today: string): { level: "ok" | "warn" | "fix"; text: string }[] {
  const out: { level: "ok" | "warn" | "fix"; text: string }[] = [];
  if (!e.readable) out.push({ level: "fix", text: "We couldn't read this clearly. Upload a sharper scan or the original PDF." });
  if (e.detectedType !== "other" && e.detectedType !== e.docType) out.push({ level: "warn", text: `This looks like a ${DOC_TYPES.find((d) => d.key === e.detectedType)!.label.toLowerCase()}, not what you selected.` });
  if (e.detectedType === "other") out.push({ level: "fix", text: "This doesn't look like a business financial or compliance document." });
  if (e.docType === "bank_statement") {
    if (e.monthsCovered !== null && e.monthsCovered < 6) out.push({ level: "fix", text: `Covers ${e.monthsCovered} month${e.monthsCovered === 1 ? "" : "s"}. Most lenders ask for at least 6.` });
    else if (e.monthsCovered !== null) out.push({ level: "ok", text: `Covers ${e.monthsCovered} months.` });
  }
  if ((e.docType === "bank_statement" || e.docType === "financial_statements") && e.periodEnd) {
    const age = daysBetween(e.periodEnd, today);
    if (age > 90) out.push({ level: "fix", text: `Ends ${age} days ago. Lenders want figures from the last three months.` });
    else if (age > 45) out.push({ level: "warn", text: `Ends ${age} days ago. Get a newer one before you apply.` });
    else out.push({ level: "ok", text: "Recent enough for a lender." });
  }
  if (e.docType === "tax_clearance") {
    if (e.expiresOn && e.expiresOn < today) out.push({ level: "fix", text: `Expired on ${e.expiresOn}. Apply for a new one.` });
    else if (e.expiresOn && daysBetween(today, e.expiresOn) < 60) out.push({ level: "warn", text: `Expires on ${e.expiresOn}. Renew it before you apply.` });
    else if (e.expiresOn) out.push({ level: "ok", text: `Valid until ${e.expiresOn}.` });
  }
  if (e.docType === "financial_statements" && e.figures.netProfit !== null && e.figures.netProfit < 0) out.push({ level: "warn", text: "Shows a loss. Be ready to explain it and show how the loan improves it." });
  for (const c of e.concerns) out.push({ level: "warn", text: c });
  const rank = { fix: 0, warn: 1, ok: 2 };
  return out.sort((a, b) => rank[a.level] - rank[b.level]);
}

/** The capital-readiness document checklist: for each type, the latest
 * upload and whether it's good to go. */
export function documentChecklist(rows: { doc_type: string; created_at: string; result: Extraction }[], today: string) {
  return DOC_TYPES.map((d) => {
    const latest = rows.filter((r) => r.doc_type === d.key).sort((a, b) => b.created_at.localeCompare(a.created_at))[0] ?? null;
    if (!latest) return { ...d, status: "missing" as const, note: "Not uploaded yet" };
    const checks = lenderChecks(latest.result, today);
    const status = checks.some((c) => c.level === "fix") ? ("fix" as const) : checks.some((c) => c.level === "warn") ? ("warn" as const) : ("ok" as const);
    return { ...d, status, note: checks[0]?.text ?? "Looks good" };
  });
}
