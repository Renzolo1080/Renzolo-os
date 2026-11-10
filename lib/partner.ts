/** The partner portal: organisations that sponsor a cohort of founders
 * (buyers, government agencies, lenders and investors, foundations) see
 * readiness progress for the founders who chose to share it with them.
 * Pure: consent wording, codes, the per-founder row and the cohort impact
 * summary, so they can be tested. */

export const CONSENT_VERSION = "1.0";

/** Shown to founders before they join; also what the partner pages read. */
export const SHARED_WITH_PARTNER = [
  "Your name and business name",
  "Your Total Readiness Score and band, and how it has changed since you joined",
  "How far through the full assessment and your growth plan you are",
];
export const NOT_SHARED = ["Your assessment answers and notes", "Your documents, financial figures and plan details", "Your coaching sessions and messages"];

export const normalizeCode = (v: unknown) => (typeof v === "string" ? v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12) : "");
export const validCode = (c: string) => /^[A-Z0-9]{6,12}$/.test(c);

export interface MemberInput {
  name: string;
  company: string | null;
  joinedAt: string;
  baseline: number | null;
  /** Current Total Readiness Score, null before any assessment. */
  score: number | null;
  band: string | null;
  areasAnswered: number;
  areasTotal: number;
  planCompleteness: number | null;
}

export interface MemberRow extends MemberInput {
  change: number | null;
  assessmentPct: number;
  planPct: number;
}

export function memberRow(m: MemberInput): MemberRow {
  return {
    ...m,
    change: m.score !== null && m.baseline !== null ? Math.round((m.score - m.baseline) * 10) / 10 : null,
    assessmentPct: m.areasTotal ? Math.round((Math.min(m.areasAnswered, m.areasTotal) / m.areasTotal) * 100) : 0,
    planPct: Math.max(0, Math.min(100, Math.round(m.planCompleteness ?? 0))),
  };
}

export interface ImpactSummary {
  members: number;
  scored: number;
  avgScore: number | null;
  avgBaseline: number | null;
  avgChange: number | null;
  improved: number;
  assessmentsComplete: number;
  plansStarted: number;
  plansReady: number;
  byBand: Record<string, number>;
}

const avg = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);

export function impactSummary(rows: MemberRow[]): ImpactSummary {
  const scored = rows.filter((r) => r.score !== null);
  const changes = rows.map((r) => r.change).filter((c): c is number => c !== null);
  const byBand: Record<string, number> = {};
  for (const r of scored) byBand[r.band ?? "Not yet"] = (byBand[r.band ?? "Not yet"] ?? 0) + 1;
  return {
    members: rows.length,
    scored: scored.length,
    avgScore: avg(scored.map((r) => r.score as number)),
    avgBaseline: avg(rows.map((r) => r.baseline).filter((b): b is number => b !== null)),
    avgChange: avg(changes),
    improved: changes.filter((c) => c > 0).length,
    assessmentsComplete: rows.filter((r) => r.assessmentPct >= 100).length,
    plansStarted: rows.filter((r) => r.planPct > 0).length,
    plansReady: rows.filter((r) => r.planPct >= 60).length,
    byBand,
  };
}
