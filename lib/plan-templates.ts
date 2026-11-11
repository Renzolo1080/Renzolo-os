import { MAX_ACTIONS, MAX_GOALS, MAX_RISKS, type PlanAction, type PlanGoal, type PlanRisk, type StrategicPlan } from "./plan";
import type { BlockKey } from "./scoring";

/** Starter plans for the three outcomes RENZOLO gets founders ready for.
 * A template only ADDS to a plan: goals go into empty goal slots, actions
 * are added to areas that have room, risks fill free risk slots. Nothing a
 * founder has written is ever changed. Goals come with the measure but no
 * numbers, so the founder sets their own baseline and target. Pure. */

export type TemplateKey = "customers" | "capital" | "investment";

interface TemplateDef {
  key: TemplateKey;
  label: string;
  description: string;
  goals: { title: string; measure: string; unit: string; days: number }[];
  actions: { area: BlockKey; text: string; days: number }[];
  risks: { risk: string; likelihood: PlanRisk["likelihood"]; mitigation: string }[];
}

export const PLAN_TEMPLATES: TemplateDef[] = [
  {
    key: "customers",
    label: "Win more customers and contracts",
    description: "For founders whose next step is bigger buyers, corporate or government contracts, or supplier programmes.",
    goals: [
      { title: "Grow monthly revenue", measure: "Revenue per month", unit: "$", days: 180 },
      { title: "Win new contract customers", measure: "Contract customers", unit: "customers", days: 180 },
      { title: "Build a pipeline of qualified buyers", measure: "Qualified buyer conversations", unit: "customers", days: 90 },
    ],
    actions: [
      { area: "customerSegments", text: "Name the 20 buyers you most want, and what each one checks before buying", days: 14 },
      { area: "valueProposition", text: "Write a one-page capability statement with proof: results, capacity, certifications", days: 21 },
      { area: "keyResources", text: "Gather the documents buyers ask for: registration, tax clearance, insurance, references", days: 30 },
      { area: "channels", text: "Register on the supplier portals of your target buyers and programmes", days: 30 },
      { area: "keyActivities", text: "Write down your quality and delivery process so you can show you can deliver at scale", days: 45 },
    ],
    risks: [{ risk: "A large order stretches cash and capacity", likelihood: "medium", mitigation: "Agree payment terms up front and line up supplier or invoice finance before bidding" }],
  },
  {
    key: "capital",
    label: "Get ready for a loan, credit or grant",
    description: "For founders who need working capital, equipment finance, a loan or a grant.",
    goals: [
      { title: "Reach a healthy repayment cover", measure: "Cash after costs ÷ planned repayment", unit: "other", days: 120 },
      { title: "Build up months of clean bank statements", measure: "Months of business bank statements", unit: "other", days: 180 },
      { title: "Secure the funding the plan needs", measure: "Funding approved", unit: "$", days: 180 },
    ],
    actions: [
      { area: "revenueStreams", text: "Run all business income through one business bank account", days: 7 },
      { area: "costStructure", text: "Produce monthly income and expense statements for the last 6 to 12 months", days: 30 },
      { area: "keyResources", text: "Bring registration and tax filings up to date and keep the proof", days: 30 },
      { area: "costStructure", text: "Write a 12-month cash-flow forecast showing how the money is used and repaid", days: 45 },
      { area: "keyPartnerships", text: "List three lenders or grant programmes that fit your stage, and what each requires", days: 30 },
    ],
    risks: [{ risk: "Application rejected for missing records", likelihood: "medium", mitigation: "Check every document against the lender's list before applying; get a coach review first" }],
  },
  {
    key: "investment",
    label: "Get investor ready",
    description: "For founders raising equity, bringing in partners or preparing for new owners.",
    goals: [
      { title: "Show consistent growth", measure: "Month-on-month revenue growth", unit: "%", days: 180 },
      { title: "Prove customers stay", measure: "Customers retained after 6 months", unit: "%", days: 180 },
      { title: "Build an investor pipeline", measure: "Investor meetings held", unit: "other", days: 120 },
    ],
    actions: [
      { area: "valueProposition", text: "Write your investment story in one page: problem, solution, traction, team, the ask", days: 21 },
      { area: "revenueStreams", text: "Prepare three-year financial projections tied to your actual numbers", days: 45 },
      { area: "keyResources", text: "Set up a data room: company documents, financials, contracts, cap table", days: 45 },
      { area: "customerRelationships", text: "Collect three customer references an investor can call", days: 30 },
      { area: "keyPartnerships", text: "List 20 investors who back your sector, stage and country", days: 30 },
    ],
    risks: [{ risk: "Raising takes longer than the cash lasts", likelihood: "high", mitigation: "Start with at least 9 months of runway and have a non-equity backup (revenue, credit or grants)" }],
  },
];

const addDays = (today: string, days: number) => new Date(new Date(`${today}T00:00:00Z`).getTime() + days * 864e5).toISOString().slice(0, 10);
const norm = (s: string) => s.trim().toLowerCase();

export function applyTemplate(plan: StrategicPlan, key: TemplateKey, today: string, newId: () => string): { plan: StrategicPlan; added: { goals: number; actions: number; risks: number } } {
  const t = PLAN_TEMPLATES.find((x) => x.key === key);
  const out: StrategicPlan = structuredClone(plan);
  const added = { goals: 0, actions: 0, risks: 0 };
  if (!t) return { plan: out, added };

  const haveGoals = new Set(out.goals.map((g) => norm(g.title)));
  for (const g of t.goals) {
    if (out.goals.length >= MAX_GOALS) break;
    if (haveGoals.has(norm(g.title))) continue;
    const goal: PlanGoal = { id: newId(), title: g.title, measure: g.measure, unit: g.unit, baseline: null, target: null, start: today, date: addDays(today, g.days) };
    out.goals.push(goal);
    added.goals++;
  }
  for (const a of t.actions) {
    const area = out.areas[a.area] ?? { current: "", desired: "", actions: [] };
    if (area.actions.length >= MAX_ACTIONS || area.actions.some((x) => norm(x.text) === norm(a.text))) continue;
    const action: PlanAction = { id: newId(), text: a.text, owner: "", due: addDays(today, a.days), status: "not_started", doneOn: "", evidence: "" };
    area.actions.push(action);
    out.areas[a.area] = area;
    added.actions++;
  }
  for (const r of t.risks) {
    if (out.risks.length >= MAX_RISKS || out.risks.some((x) => norm(x.risk) === norm(r.risk))) continue;
    out.risks.push({ id: newId(), ...r });
    added.risks++;
  }
  return { plan: out, added };
}
