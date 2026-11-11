import { FounderDashboard, type DashboardData } from "@/components/dashboard/FounderDashboard";
import { DemoGuard } from "@/components/DemoGuard";
import { emptyPlan, type StrategicPlan } from "@/lib/plan";
import { readinessFromRows } from "@/lib/readiness";
import { trajectory } from "@/lib/live-score";
import { BLOCK_LABELS, type BlockKey } from "@/lib/scoring";

export const metadata = { title: "Demo dashboard · Founder Trajectory™", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** A public demo of the founder dashboard, for sales demos (Nov 11 2026).
 * The founder and business are invented; no real data is read, and
 * nothing a visitor changes is saved (components/DemoGuard.tsx). */

const DAY = 864e5;
const iso = (d: Date) => d.toISOString().slice(0, 10);
const ago = (today: Date, days: number) => iso(new Date(today.getTime() - days * DAY));
const ahead = (today: Date, days: number) => iso(new Date(today.getTime() + days * DAY));
const monthStart = (today: Date, back: number) => iso(new Date(Date.UTC(today.getUTCFullYear(), today.getUTCMonth() - back, 1)));

function demoData(): DashboardData {
  const now = new Date();
  const today = iso(now);
  const start = ago(now, 120);
  const reassessed = ago(now, 30);

  const blocks: Record<BlockKey, number> = {
    customerSegments: 62, valueProposition: 66, channels: 44, customerRelationships: 55, revenueStreams: 41,
    keyResources: 58, keyActivities: 61, keyPartnerships: 47, costStructure: 52,
  };
  const gaps = (Object.entries(blocks) as [BlockKey, number][]).sort((a, b) => a[1] - b[1]).slice(0, 3).map(([block, score]) => ({ block, label: BLOCK_LABELS[block], score }));
  const score = {
    id: "demo-score", created_at: `${reassessed}T09:00:00Z`, block_scores: blocks, gaps,
    market_subscore: 54, customer_subscore: 58, investor_subscore: 42,
    health_index: 61, health_confidence: "Medium", evidence_completeness: 0.55,
    valuation_low: 180000, valuation_high: 260000, valuation_basis: "Revenue multiple for an early-growth food processing business in Kenya, adjusted for readiness.",
  };

  const plan: StrategicPlan = emptyPlan();
  plan.tracking = { targetScore: 72, targetDate: ahead(now, 240), reassessEvery: 90, reassessOn: "" };
  plan.goals = [
    { id: "g1", title: "Win supermarket contracts", measure: "Contract customers", unit: "customers", baseline: 1, target: 6, start, date: ahead(now, 240) },
    { id: "g2", title: "Grow monthly revenue", measure: "Monthly revenue", unit: "USD", baseline: 8000, target: 20000, start, date: ahead(now, 240) },
    { id: "g3", title: "Qualify for a working-capital loan", measure: "Lender checklist items met", unit: "items", baseline: 2, target: 8, start, date: ahead(now, 150) },
  ] as any;
  const a = (id: string, text: string, status: "done" | "in_progress" | "not_started", due: string, doneOn = "", evidence = "") => ({ id, text, owner: "Amani", due, status, doneOn, evidence });
  plan.areas = {
    channels: { current: "Sells through two local shops and market stalls.", desired: "Supplying three regional supermarket chains.", actions: [
      a("c1", "Get supermarket listing requirements from 3 buyers", "done", ago(now, 40), ago(now, 42), "Requirements from three supermarket buyers"),
      a("c2", "Get food-safety certification", "in_progress", ahead(now, 20)),
      a("c3", "Pitch to 2 supermarket buyers", "not_started", ahead(now, 45)),
    ] },
    revenueStreams: { current: "One product line, cash sales.", desired: "Two product lines with 30-day invoicing.", actions: [
      a("r1", "Launch the 1kg family pack", "done", ago(now, 20), ago(now, 18), "First 400 packs sold"),
      a("r2", "Set wholesale price list", "not_started", ago(now, 5)),
    ] },
    keyPartnerships: { current: "No formal supplier agreements.", desired: "Two contracted farmer cooperatives.", actions: [
      a("p1", "Sign a supply agreement with a farmer cooperative", "in_progress", ahead(now, 30)),
    ] },
    costStructure: { current: "Costs tracked in a notebook.", desired: "Monthly management accounts.", actions: [
      a("k1", "Move bookkeeping to accounting software", "done", ago(now, 60), ago(now, 58), "Software set up, 3 months entered"),
      a("k2", "Prepare 12 months of bank statements for lenders", "not_started", ahead(now, 14)),
    ] },
  } as any;
  plan.risks = [{ id: "x1", text: "A large buyer pays late", likelihood: "medium", response: "Invoice factoring line; 30-day terms only with deposit" }] as any;

  const checkins = [
    { goal_id: "g1", value: 2, checked_on: ago(now, 70) }, { goal_id: "g1", value: 3, checked_on: ago(now, 20) },
    { goal_id: "g2", value: 9800, checked_on: ago(now, 60) }, { goal_id: "g2", value: 12400, checked_on: ago(now, 10) },
    { goal_id: "g3", value: 4, checked_on: ago(now, 25) },
  ];
  const updates = [5, 4, 3, 2, 1].map((back, i) => ({ period: monthStart(now, back), revenue: [8100, 8900, 9800, 11200, 12400][i], customers: [14, 16, 19, 23, 27][i], cash: [4200, 5100, 4800, 6300, 7400][i] }));
  const confirmed = [{ date: `${reassessed}T09:00:00Z`, total: 54 }, { date: `${start}T09:00:00Z`, total: 46 }];
  const readiness = readinessFromRows(score, { completeness: 78, review: 70 }, 60);

  const t = trajectory({
    plan, confirmed, checkins, updates,
    documents: [{ doc_type: "bank_statement", created_at: `${ago(now, 12)}T00:00:00Z`, ok: true }],
    startBlocks: blocks, today,
  } as any);

  return {
    access: { member: true, growth: true, valuation: true },
    extras: ["goalCharts", "kpiTrends", "valuation", "areas", "gaps"],
    score,
    readiness,
    plan,
    planCompleteness: 78,
    checkins,
    updates,
    review: null,
    market: null,
    areasAnswered: 9,
    areasTotal: 9,
    report: { exists: true, current: true },
    scoreHistory: [{ date: start, score: 46 }, { date: reassessed, score: 54 }],
    recommendations: [
      { id: "rec1", source: "Readiness Report", title: "Get food-safety certification before pitching supermarkets" },
      { id: "rec2", source: "Coach", title: "Use the cooperative agreement as proof of supply in buyer pitches" },
    ],
    milestones: [{ id: "m1", title: "First supermarket listing", target_date: ahead(now, 60) }],
    coaching: { available: 1, nextFrom: null, included: "2 one-on-one 30-minute sessions per quarter" },
    commitments: [{ id: "cm1", sessionId: "s1", text: "Send the cooperative the draft supply agreement", due: ahead(now, 6) }],
    invite: null,
    today,
    nextReminder: null,
    trajectory: t,
  };
}

export default function DemoPage() {
  const d = demoData();
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <DemoGuard />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy px-5 py-4 text-white">
        <p className="text-sm">
          <b>Demo:</b> a sample founder, Amani of Amani Foods (Kenya), a Growth member. The business is invented. Click around: nothing you change is saved.
        </p>
        <a href="/snapshot" className="rounded-pill bg-brand px-5 py-2.5 text-sm font-bold text-on-brand">
          Get your own score free
        </a>
      </div>
      <h1 className="text-2xl font-bold text-navy">Your Founder Trajectory™</h1>
      <span aria-hidden="true" className="mb-6 mt-2 block h-1 w-24 rounded-full bg-brand" />
      <FounderDashboard {...d} />
    </main>
  );
}
