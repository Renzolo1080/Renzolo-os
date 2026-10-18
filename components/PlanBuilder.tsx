"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ACTION_STATUSES,
  EXISTING_PLAN,
  FUNDING_NEEDS,
  FUNDING_SOURCES,
  GOAL_UNITS,
  LAST_UPDATED,
  LIKELIHOOD,
  MAX_ACTIONS,
  MAX_GOALS,
  MAX_RISKS,
  PLAN_STEPS,
  planChecks,
  planCompleteness,
  readyForReview,
  type PlanArea,
  type PlanGoal,
  type PlanStep,
  type StrategicPlan,
} from "@/lib/plan";
import { BLOCK_KEYS, BLOCK_LABELS, type BlockKey } from "@/lib/scoring";
import { PlanReviewPanel, type SavedReview } from "./PlanReviewPanel";

export interface AreaContext {
  key: BlockKey;
  score: number | null;
  /** What the founder said about this area in the assessment. */
  assessmentToday: string;
  assessmentDesired: string;
}

const input = "mt-1 w-full rounded-lg border border-gray-300 bg-white px-3 py-2";
const newId = (p: string) => `${p}${Date.now().toString(36)}${Math.floor(Math.random() * 1e4).toString(36)}`;

/** The guided Plan Builder. Founders build their plan here rather than
 * uploading one, starting from where the business is today (their
 * assessment), so the plan can be reviewed, tracked and kept current. */
export function PlanBuilder({
  initialPlan,
  isNew,
  gapKeys,
  areaContext,
  horizons,
  canReview,
  initialReview,
  initialUpdatedAt,
  startDirty = false,
}: {
  initialPlan: StrategicPlan;
  isNew: boolean;
  gapKeys: string[];
  areaContext: AreaContext[];
  horizons: string[];
  canReview: boolean;
  initialReview: SavedReview | null;
  initialUpdatedAt: string | null;
  /** Something was added to the saved plan on the way in (e.g. new assessment areas). */
  startDirty?: boolean;
}) {
  const [plan, setPlan] = useState<StrategicPlan>(initialPlan);
  const [step, setStep] = useState<PlanStep>(isNew ? "starting" : "review");
  const [dirty, setDirty] = useState(isNew || startDirty);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(initialUpdatedAt);
  const [error, setError] = useState<string | null>(null);
  const planRef = useRef(plan);
  planRef.current = plan;

  const checks = useMemo(() => planChecks(plan, gapKeys), [plan, gapKeys]);
  const pct = useMemo(() => planCompleteness(plan, gapKeys), [plan, gapKeys]);

  useEffect(() => {
    const warn = (e: BeforeUnloadEvent) => {
      if (dirty) e.preventDefault();
    };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [dirty]);

  function update(fn: (p: StrategicPlan) => StrategicPlan) {
    setPlan((p) => fn(structuredClone(p)));
    setDirty(true);
  }

  async function save(): Promise<boolean> {
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/plan", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ plan: planRef.current }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save. Please try again.");
      setDirty(false);
      setSavedAt(data.updatedAt);
      return true;
    } catch (e: any) {
      setError(e?.message ?? "Couldn't save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function go(next: PlanStep) {
    if (dirty) await save();
    setStep(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const idx = PLAN_STEPS.findIndex((s) => s.key === step);
  const stepDone = (k: PlanStep) => checks.filter((c) => c.step === k).every((c) => c.done);

  return (
    <div className="grid gap-8 lg:grid-cols-[240px_1fr]">
      <nav aria-label="Plan sections" className="lg:sticky lg:top-6 lg:self-start">
        <div className="rounded-2xl bg-navy p-4 text-white">
          <p className="text-sm text-cream/80">Plan complete</p>
          <p className="text-2xl font-bold">{pct}%</p>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-navy-panel" role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Plan complete">
            <div className="h-2 bg-teal" style={{ width: `${pct}%` }} />
          </div>
          <p className="mt-2 text-xs text-cream/70">{saving ? "Saving…" : dirty ? "Unsaved changes" : savedAt ? `Saved ${new Date(savedAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}` : "Not saved yet"}</p>
        </div>
        <ol className="mt-3 space-y-1">
          {PLAN_STEPS.map((s, i) => (
            <li key={s.key}>
              <button
                type="button"
                onClick={() => go(s.key)}
                aria-current={s.key === step ? "step" : undefined}
                className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm ${s.key === step ? "bg-white font-semibold text-navy shadow-sm" : "hover:bg-white"}`}
              >
                <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${s.key !== "review" && stepDone(s.key) ? "bg-teal text-white" : "border border-gray-300 text-ink-soft"}`}>
                  {s.key !== "review" && stepDone(s.key) ? "✓" : i + 1}
                </span>
                {s.label}
              </button>
            </li>
          ))}
        </ol>
      </nav>

      <div className="min-w-0">
        {step === "starting" && <Starting plan={plan} update={update} />}
        {step === "vision" && <Vision plan={plan} update={update} horizons={horizons} />}
        {step === "goals" && <Goals plan={plan} update={update} />}
        {step === "areas" && <Areas plan={plan} update={update} gapKeys={gapKeys} context={areaContext} />}
        {step === "resources" && <Resources plan={plan} update={update} />}
        {step === "risks" && <Risks plan={plan} update={update} />}
        {step === "review" && (
          <div className="space-y-6">
            <div className="rounded-2xl bg-white p-6 shadow-sm">
              <h2 className="text-2xl font-bold text-navy">Check your plan</h2>
              <p className="mt-1 text-sm text-ink-soft">What a complete plan has. Tap an item to fix it.</p>
              <ul className="mt-4 space-y-2">
                {checks.map((c) => (
                  <li key={c.key}>
                    <button type="button" onClick={() => go(c.step)} className="flex w-full items-start gap-3 rounded-lg px-2 py-1.5 text-left text-sm hover:bg-cream">
                      <span className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs ${c.done ? "bg-teal text-white" : "border-2 border-brand-text text-brand-text"}`}>{c.done ? "✓" : "!"}</span>
                      <span className={c.done ? "text-ink-soft" : "font-medium"}>{c.label}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <PlanReviewPanel canReview={canReview} ready={readyForReview(plan, gapKeys)} initialReview={initialReview} beforeReview={async () => (dirty ? save() : true)} planSavedAt={savedAt} />
          </div>
        )}

        {error && (
          <p role="alert" className="mt-4 text-sm text-red-600">
            {error}
          </p>
        )}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
          <button type="button" className="rounded-lg border border-gray-300 px-5 py-2.5 disabled:opacity-40" disabled={idx === 0 || saving} onClick={() => go(PLAN_STEPS[idx - 1].key)}>
            Back
          </button>
          <div className="flex gap-3">
            <button type="button" className="rounded-lg border border-navy px-5 py-2.5 font-semibold text-navy disabled:opacity-40" disabled={!dirty || saving} onClick={save}>
              {saving ? "Saving…" : "Save"}
            </button>
            {idx < PLAN_STEPS.length - 1 && (
              <button type="button" className="rounded-lg bg-navy px-6 py-2.5 font-semibold text-white disabled:opacity-40" disabled={saving} onClick={() => go(PLAN_STEPS[idx + 1].key)}>
                Save and continue
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

type SectionProps = { plan: StrategicPlan; update: (fn: (p: StrategicPlan) => StrategicPlan) => void };

function Section({ title, intro, children }: { title: string; intro: string; children: React.ReactNode }) {
  return (
    <section className="space-y-5">
      <div>
        <h2 className="text-2xl font-bold text-navy">{title}</h2>
        <p className="mt-1 max-w-2xl text-sm text-ink-soft">{intro}</p>
      </div>
      {children}
    </section>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return <div className="space-y-4 rounded-2xl bg-white p-5 shadow-sm">{children}</div>;
}

function Starting({ plan, update }: SectionProps) {
  const s = plan.starting;
  const old = s.existingPlan === "outdated" || s.existingPlan === "current";
  return (
    <Section title="Your starting point" intro="Plans go stale. We'll build from where your business is today, using your assessment, so nothing is carried over from an old plan without being checked.">
      <Card>
        <fieldset>
          <legend className="font-semibold text-navy">Do you already have a written business or strategic plan?</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {EXISTING_PLAN.map((o) => (
              <Choice key={o.value} chosen={s.existingPlan === o.value} onClick={() => update((p) => ((p.starting.existingPlan = o.value), p))}>
                {o.label}
              </Choice>
            ))}
          </div>
        </fieldset>
        {old && (
          <label className="block">
            <span className="font-semibold text-navy">When was it last updated?</span>
            <select className={input} value={s.lastUpdated} onChange={(e) => update((p) => ((p.starting.lastUpdated = e.target.value), p))}>
              <option value="">Choose…</option>
              {LAST_UPDATED.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </label>
        )}
        {old && (
          <label className="block">
            <span className="font-semibold text-navy">What has changed since you wrote it?</span>
            <span className="block text-sm text-ink-soft">Customers, products, team, money, competitors, rules. Anything your old plan doesn't know about.</span>
            <textarea className={input} rows={4} value={s.whatChanged} onChange={(e) => update((p) => ((p.starting.whatChanged = e.target.value), p))} />
          </label>
        )}
        {old && <p className="rounded-lg bg-cream p-3 text-sm">Keep your old plan open beside you and bring across only what's still true. Each section starts from your assessment answers, not the old plan.</p>}
      </Card>
    </Section>
  );
}

function Vision({ plan, update, horizons }: SectionProps & { horizons: string[] }) {
  return (
    <Section title="Where you're going" intro="Two short descriptions: the business as it is today, and as you want it to be at the end of this plan. Be concrete: customers, revenue, team, reach.">
      <Card>
        <label className="block">
          <span className="font-semibold text-navy">How far ahead does this plan go?</span>
          <select className={`${input} sm:w-56`} value={plan.vision.horizon} onChange={(e) => update((p) => ((p.vision.horizon = e.target.value), p))}>
            {horizons.map((h) => (
              <option key={h}>{h}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="font-semibold text-navy">Today</span>
          <span className="block text-sm text-ink-soft">E.g. "40 retail customers in Nairobi, $5k a month, two staff, selling by WhatsApp."</span>
          <textarea className={input} rows={4} value={plan.vision.current} onChange={(e) => update((p) => ((p.vision.current = e.target.value), p))} />
        </label>
        <label className="block">
          <span className="font-semibold text-navy">At the end of the plan ({plan.vision.horizon})</span>
          <span className="block text-sm text-ink-soft">E.g. "Supplying 3 supermarket chains in two cities, $25k a month, a sales lead hired, ready for a bank loan."</span>
          <textarea className={input} rows={4} value={plan.vision.desired} onChange={(e) => update((p) => ((p.vision.desired = e.target.value), p))} />
        </label>
      </Card>
    </Section>
  );
}

function Goals({ plan, update }: SectionProps) {
  const setGoal = (i: number, patch: Partial<PlanGoal>) => update((p) => ((p.goals[i] = { ...p.goals[i], ...patch }), p));
  return (
    <Section title="Goals" intro={`Up to ${MAX_GOALS} goals that tell you whether the plan is working. Each needs a number: where it stands now, the target and the date. You'll log progress against them on your dashboard.`}>
      {plan.goals.map((g, i) => (
        <Card key={g.id}>
          <div className="flex items-center justify-between">
            <p className="font-semibold text-navy">Goal {i + 1}</p>
            <button type="button" className="text-sm text-red-600" onClick={() => update((p) => ((p.goals = p.goals.filter((_, j) => j !== i)), p))}>
              Remove
            </button>
          </div>
          <label className="block text-sm">
            <span className="font-medium">Goal</span>
            <input className={input} value={g.title} placeholder="e.g. Grow monthly revenue" onChange={(e) => setGoal(i, { title: e.target.value })} />
          </label>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="block text-sm">
              <span className="font-medium">What you'll measure</span>
              <input className={input} value={g.measure} placeholder="e.g. Revenue per month" onChange={(e) => setGoal(i, { measure: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Unit</span>
              <select className={input} value={g.unit} onChange={(e) => setGoal(i, { unit: e.target.value })}>
                {GOAL_UNITS.map((u) => (
                  <option key={u} value={u}>
                    {u === "$" ? "$ (money)" : u === "%" ? "% (percent)" : u}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <NumberField label="Where it is now" value={g.baseline} onChange={(v) => setGoal(i, { baseline: v })} />
            <NumberField label="Target" value={g.target} onChange={(v) => setGoal(i, { target: v })} />
            <label className="block text-sm">
              <span className="font-medium">Start tracking from</span>
              <input type="date" className={input} value={g.start} onChange={(e) => setGoal(i, { start: e.target.value })} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Target date</span>
              <input type="date" className={input} value={g.date} onChange={(e) => setGoal(i, { date: e.target.value })} />
            </label>
          </div>
        </Card>
      ))}
      {plan.goals.length < MAX_GOALS && (
        <button
          type="button"
          className="rounded-lg border-2 border-dashed border-gray-300 px-5 py-3 font-semibold text-navy hover:border-navy"
          onClick={() => update((p) => (p.goals.push({ id: newId("g"), title: "", measure: "", unit: "$", baseline: null, target: null, start: new Date().toISOString().slice(0, 10), date: "" }), p))}
        >
          + Add a goal
        </button>
      )}
    </Section>
  );
}

/** Keeps what the founder typed while they type; stores a number. */
function NumberField({ label, value, onChange }: { label: string; value: number | null; onChange: (v: number | null) => void }) {
  const [text, setText] = useState(value === null ? "" : String(value));
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      <input
        className={input}
        inputMode="decimal"
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          const n = Number(e.target.value.replace(/[,\s$%]/g, ""));
          onChange(e.target.value.trim() === "" || !Number.isFinite(n) ? null : n);
        }}
      />
    </label>
  );
}

function Areas({ plan, update, gapKeys, context }: SectionProps & { gapKeys: string[]; context: AreaContext[] }) {
  const inPlan = BLOCK_KEYS.filter((k) => plan.areas[k]);
  const order = [...gapKeys.filter((k) => inPlan.includes(k as BlockKey)), ...inPlan.filter((k) => !gapKeys.includes(k))] as BlockKey[];
  const missingWeak = gapKeys.filter((k) => !plan.areas[k as BlockKey]) as BlockKey[];
  const addable = BLOCK_KEYS.filter((k) => !plan.areas[k]);
  const setArea = (k: BlockKey, fn: (a: PlanArea) => void) =>
    update((p) => {
      const a = p.areas[k] ?? { current: "", desired: "", actions: [] };
      fn(a);
      p.areas[k] = a;
      return p;
    });
  return (
    <Section title="Business areas" intro="For each area: where it is today, where it needs to be, and the actions that close the gap, with an owner and a date. Your three weakest areas come first and need to be in the plan.">
      {[...missingWeak, ...order].map((k) => {
        const a = plan.areas[k] ?? { current: "", desired: "", actions: [] };
        const ctx = context.find((c) => c.key === k);
        const weak = gapKeys.includes(k);
        return (
          <Card key={k}>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-lg font-bold text-navy">
                {BLOCK_LABELS[k]}
                {weak && <span className="ml-2 rounded bg-gold/20 px-2 py-0.5 align-middle text-xs font-semibold uppercase text-navy">Priority</span>}
              </p>
              <span className="text-sm text-ink-soft">{ctx?.score !== null && ctx?.score !== undefined ? `Score ${ctx.score}/100` : ""}</span>
            </div>
            {ctx?.assessmentToday && (
              <p className="rounded-lg bg-cream p-3 text-sm">
                <span className="font-semibold">In your assessment you said: </span>
                {ctx.assessmentToday}
              </p>
            )}
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                <span className="font-medium">Today</span>
                <textarea className={input} rows={3} value={a.current} onChange={(e) => setArea(k, (x) => (x.current = e.target.value))} />
              </label>
              <label className="block text-sm">
                <span className="font-medium">Where it needs to be</span>
                <textarea className={input} rows={3} value={a.desired} onChange={(e) => setArea(k, (x) => (x.desired = e.target.value))} />
              </label>
            </div>
            <div>
              <p className="text-sm font-semibold text-navy">Actions</p>
              <div className="mt-2 space-y-3">
                {a.actions.map((x, i) => (
                  <div key={x.id} className="grid grid-cols-2 gap-2 rounded-lg border border-gray-200 p-3 xl:grid-cols-[minmax(0,1fr)_110px_150px_120px_24px]">
                    <input className="col-span-2 min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm xl:col-span-1" aria-label="Action" placeholder="What will be done" value={x.text} onChange={(e) => setArea(k, (y) => (y.actions[i].text = e.target.value))} />
                    <input className="min-w-0 rounded-lg border border-gray-300 px-3 py-2 text-sm" aria-label="Owner" placeholder="Owner" value={x.owner} onChange={(e) => setArea(k, (y) => (y.actions[i].owner = e.target.value))} />
                    <input type="date" className="min-w-0 rounded-lg border border-gray-300 px-2 py-2 text-sm" aria-label="Due date" value={x.due} onChange={(e) => setArea(k, (y) => (y.actions[i].due = e.target.value))} />
                    <select className="min-w-0 rounded-lg border border-gray-300 bg-white px-2 py-2 text-sm" aria-label="Status" value={x.status} onChange={(e) => setArea(k, (y) => (y.actions[i].status = e.target.value as any))}>
                      {ACTION_STATUSES.map((s) => (
                        <option key={s.value} value={s.value}>
                          {s.label}
                        </option>
                      ))}
                    </select>
                    <button type="button" className="justify-self-end text-sm text-red-600" aria-label="Remove action" onClick={() => setArea(k, (y) => (y.actions = y.actions.filter((_, j) => j !== i)))}>
                      ✕
                    </button>
                  </div>
                ))}
              </div>
              {a.actions.length < MAX_ACTIONS && (
                <button type="button" className="mt-2 text-sm font-semibold text-teal" onClick={() => setArea(k, (y) => y.actions.push({ id: newId("a"), text: "", owner: "", due: "", status: "not_started" }))}>
                  + Add an action
                </button>
              )}
            </div>
            {!weak && (
              <button type="button" className="self-start text-sm text-red-600" onClick={() => update((p) => (delete p.areas[k], p))}>
                Remove this area from the plan
              </button>
            )}
          </Card>
        );
      })}
      {addable.length > 0 && (
        <label className="block max-w-sm text-sm">
          <span className="font-semibold text-navy">Add another area</span>
          <select
            className={input}
            value=""
            onChange={(e) => {
              const k = e.target.value as BlockKey;
              if (!k) return;
              const ctx = context.find((c) => c.key === k);
              update((p) => ((p.areas[k] = { current: ctx?.assessmentToday ?? "", desired: ctx?.assessmentDesired ?? "", actions: [] }), p));
            }}
          >
            <option value="">Choose an area…</option>
            {addable.map((k) => (
              <option key={k} value={k}>
                {BLOCK_LABELS[k]}
              </option>
            ))}
          </select>
        </label>
      )}
    </Section>
  );
}

function Resources({ plan, update }: SectionProps) {
  const r = plan.resources;
  return (
    <Section title="Money and people" intro="What the plan needs to happen. Lenders, investors and partners look for this first.">
      <Card>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="font-medium">Revenue today (per month or year)</span>
            <input className={input} value={r.revenueNow} placeholder="e.g. $5,000 a month" onChange={(e) => update((p) => ((p.resources.revenueNow = e.target.value), p))} />
          </label>
          <label className="block text-sm">
            <span className="font-medium">Revenue target at the end of the plan</span>
            <input className={input} value={r.revenueTarget} placeholder="e.g. $25,000 a month" onChange={(e) => update((p) => ((p.resources.revenueTarget = e.target.value), p))} />
          </label>
        </div>
        <label className="block text-sm">
          <span className="font-medium">Outside funding the plan needs</span>
          <select className={`${input} sm:w-72`} value={r.fundingNeed} onChange={(e) => update((p) => ((p.resources.fundingNeed = e.target.value), p))}>
            <option value="">Choose…</option>
            {FUNDING_NEEDS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
        {r.fundingNeed && r.fundingNeed !== "none" && (
          <>
            <fieldset>
              <legend className="text-sm font-medium">Where will it come from? Choose all that apply.</legend>
              <div className="mt-2 flex flex-wrap gap-2">
                {FUNDING_SOURCES.map((s) => (
                  <Choice
                    key={s}
                    small
                    chosen={r.fundingSources.includes(s)}
                    onClick={() => update((p) => ((p.resources.fundingSources = p.resources.fundingSources.includes(s) ? p.resources.fundingSources.filter((x) => x !== s) : [...p.resources.fundingSources, s]), p))}
                  >
                    {s}
                  </Choice>
                ))}
              </div>
            </fieldset>
            <label className="block text-sm">
              <span className="font-medium">What will the money pay for?</span>
              <textarea className={input} rows={3} value={r.fundingUse} onChange={(e) => update((p) => ((p.resources.fundingUse = e.target.value), p))} />
            </label>
          </>
        )}
        <label className="block text-sm">
          <span className="font-medium">People and skills the plan needs</span>
          <span className="block text-ink-soft">Hires, partners, advisers or training.</span>
          <textarea className={input} rows={3} value={r.people} onChange={(e) => update((p) => ((p.resources.people = e.target.value), p))} />
        </label>
      </Card>
    </Section>
  );
}

function Risks({ plan, update }: SectionProps) {
  return (
    <Section title="Risks" intro={`Up to ${MAX_RISKS} things that could knock the plan off course, and what you'll do about each.`}>
      {plan.risks.map((r, i) => (
        <Card key={r.id}>
          <div className="grid gap-3 sm:grid-cols-[1fr_140px]">
            <label className="block text-sm">
              <span className="font-medium">Risk</span>
              <input className={input} value={r.risk} placeholder="e.g. Our one big customer delays payment" onChange={(e) => update((p) => ((p.risks[i].risk = e.target.value), p))} />
            </label>
            <label className="block text-sm">
              <span className="font-medium">Likelihood</span>
              <select className={input} value={r.likelihood} onChange={(e) => update((p) => ((p.risks[i].likelihood = e.target.value as any), p))}>
                {LIKELIHOOD.map((l) => (
                  <option key={l.value} value={l.value}>
                    {l.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <label className="block text-sm">
            <span className="font-medium">What you'll do about it</span>
            <input className={input} value={r.mitigation} onChange={(e) => update((p) => ((p.risks[i].mitigation = e.target.value), p))} />
          </label>
          <button type="button" className="self-start text-sm text-red-600" onClick={() => update((p) => ((p.risks = p.risks.filter((_, j) => j !== i)), p))}>
            Remove
          </button>
        </Card>
      ))}
      {plan.risks.length < MAX_RISKS && (
        <button type="button" className="rounded-lg border-2 border-dashed border-gray-300 px-5 py-3 font-semibold text-navy hover:border-navy" onClick={() => update((p) => (p.risks.push({ id: newId("r"), risk: "", likelihood: "medium", mitigation: "" }), p))}>
          + Add a risk
        </button>
      )}
    </Section>
  );
}

function Choice({ chosen, onClick, children, small }: { chosen: boolean; onClick: () => void; children: React.ReactNode; small?: boolean }) {
  return (
    <button type="button" aria-pressed={chosen} onClick={onClick} className={`rounded-lg border text-left text-sm ${small ? "px-3 py-1.5" : "px-3 py-2.5"} ${chosen ? "border-navy bg-navy text-white" : "border-gray-300 bg-white hover:border-navy"}`}>
      {children}
    </button>
  );
}
