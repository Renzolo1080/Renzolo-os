/** Free public tools (no login, nothing saved): a quick loan readiness
 * check built on what lenders commonly look at — can the business repay
 * (debt service coverage), how long it has traded, and whether its records
 * are in order. Guidance only, not a credit decision. Pure, so it can be
 * tested. */

export interface LoanCheckInput {
  monthlyRevenue: number;
  /** All monthly running costs, including repayments on existing loans. */
  monthlyCosts: number;
  loanAmount: number;
  termMonths: number;
  /** Annual interest rate, percent (e.g. 18). */
  annualRatePct: number;
  monthsTrading: number;
  bankStatements6m: boolean;
  registered: boolean;
  taxUpToDate: boolean;
}

export interface LoanCheckResult {
  monthlyRepayment: number;
  /** Cash left each month before the new loan, divided by the new repayment. */
  coverage: number | null;
  score: number;
  band: "Ready to apply" | "Nearly ready" | "Not ready yet";
  /** What to fix first, most important first (at most three). */
  fixes: string[];
}

/** Standard amortised monthly repayment. */
export function monthlyRepayment(amount: number, termMonths: number, annualRatePct: number): number {
  if (amount <= 0 || termMonths <= 0) return 0;
  const r = annualRatePct / 100 / 12;
  if (r <= 0) return amount / termMonths;
  return (amount * r) / (1 - Math.pow(1 + r, -termMonths));
}

const clamp = (n: number) => (Number.isFinite(n) && n > 0 ? n : 0);

export function loanCheck(raw: LoanCheckInput): LoanCheckResult {
  const i = { ...raw, monthlyRevenue: clamp(raw.monthlyRevenue), monthlyCosts: clamp(raw.monthlyCosts), loanAmount: clamp(raw.loanAmount), termMonths: clamp(raw.termMonths), annualRatePct: clamp(raw.annualRatePct), monthsTrading: clamp(raw.monthsTrading) };
  const pay = monthlyRepayment(i.loanAmount, i.termMonths, i.annualRatePct);
  const free = i.monthlyRevenue - i.monthlyCosts;
  const coverage = pay > 0 ? free / pay : null;

  const fixes: { weight: number; text: string }[] = [];
  let score = 0;
  // Repayment capacity: 40 points. Lenders commonly want 1.25x or more.
  if (coverage !== null) {
    if (coverage >= 1.25) score += 40;
    else if (coverage >= 1) {
      score += 25;
      fixes.push({ weight: 30, text: "Your cash after costs only just covers the repayment. Lenders usually want about 1.25 times the repayment; borrow less, over a longer term, or cut costs first." });
    } else {
      fixes.push({ weight: 40, text: "Your cash after costs doesn't cover the repayment yet. Reduce the amount, lengthen the term, or grow monthly profit before you apply." });
    }
  }
  // Time trading: 20 points.
  if (i.monthsTrading >= 24) score += 20;
  else if (i.monthsTrading >= 12) {
    score += 14;
    fixes.push({ weight: 8, text: "Many lenders prefer two years of trading. Under that, look at lenders and programmes for younger businesses, or smaller first loans." });
  } else if (i.monthsTrading >= 6) {
    score += 7;
    fixes.push({ weight: 15, text: "With under a year of trading, most banks will say not yet. Development finance, grants or supplier credit may fit better for now." });
  } else fixes.push({ weight: 20, text: "Under six months of trading is too early for most loans. Build a record of sales first, and consider grants or customer pre-payments." });
  // Records: 40 points.
  if (i.bankStatements6m) score += 15;
  else fixes.push({ weight: 25, text: "Run all business money through one business bank account and keep at least six months of statements; it's the first thing lenders ask for." });
  if (i.registered) score += 15;
  else fixes.push({ weight: 22, text: "Register the business. Most lenders and grant programmes can't fund an unregistered business." });
  if (i.taxUpToDate) score += 10;
  else fixes.push({ weight: 18, text: "Bring your tax filings up to date and get proof of it; lenders and buyers both check." });

  const band = score >= 75 ? "Ready to apply" : score >= 50 ? "Nearly ready" : "Not ready yet";
  return {
    monthlyRepayment: Math.round(pay * 100) / 100,
    coverage: coverage === null ? null : Math.round(coverage * 100) / 100,
    score,
    band,
    fixes: fixes.sort((a, b) => b.weight - a.weight).slice(0, 3).map((f) => f.text),
  };
}
