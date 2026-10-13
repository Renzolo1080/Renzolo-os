"use client";
import { useEffect, useState } from "react";
import { track } from "@/lib/track";
import { useRouter } from "next/navigation";
import type { BlockKey } from "@/lib/scoring";
import type { SnapshotOverview } from "@/lib/snapshot";
import {
  QUICK_QUESTIONS,
  PLAN_QUESTIONS,
  STAGES,
  INDUSTRIES,
  COUNTRIES,
  BUSINESS_TYPES,
  YEARS_IN_BUSINESS,
  TEAM_SIZES,
  REVENUE_BANDS,
  PRIMARY_GOALS,
  TIME_HORIZONS,
  FUNDING_NEEDS,
  REGISTRATION_STATUSES,
  CHALLENGES,
  MAX_CHALLENGES,
  HEARD_FROM,
  type PlanKey,
  type QuickLevel,
} from "@/lib/quickcheck";
import { SnapshotResult } from "./SnapshotResult";

/** The Readiness Snapshot, 5-7 minutes, almost all dropdowns and taps.
 *
 * "public" (no account): starts with name, company and email, and shows
 * the short overview on the page when done.
 * "member" (signed in): skips contact details, saves to the founder's
 * account and goes to the dashboard. */

type Profile = {
  ventureStage: string;
  industry: string;
  country: string;
  businessType: string;
  yearsInBusiness: string;
  teamSize: string;
  annualRevenue: string;
  primaryGoal: string;
  timeHorizon: string;
  fundingNeed: string;
  registration: string;
  heardFrom: string;
};

const EMPTY: Profile = {
  ventureStage: "",
  industry: "",
  country: "",
  businessType: "",
  yearsInBusiness: "",
  teamSize: "",
  annualRevenue: "",
  primaryGoal: "",
  timeHorizon: "",
  fundingNeed: "",
  registration: "",
  heardFrom: "",
};

type Field = [keyof Profile, string, readonly string[]];

const BUSINESS_FIELDS: Field[] = [
  ["ventureStage", "Stage of your venture", STAGES],
  ["industry", "Industry", INDUSTRIES],
  ["country", "Country you operate in", COUNTRIES],
  ["businessType", "Business type", BUSINESS_TYPES],
  ["yearsInBusiness", "Years in business", YEARS_IN_BUSINESS],
  ["teamSize", "Team size", TEAM_SIZES],
  ["annualRevenue", "Annual revenue (US dollars)", REVENUE_BANDS],
];

const GOAL_FIELDS: Field[] = [
  ["primaryGoal", "Your main goal", PRIMARY_GOALS],
  ["timeHorizon", "When do you want to reach it?", TIME_HORIZONS],
  ["fundingNeed", "Are you looking for funding in the next 12 months?", FUNDING_NEEDS],
  ["registration", "Is your business registered with the government and tax authority?", REGISTRATION_STATUSES],
];

type Section = { id: string; title: string };

export function ReadinessSnapshotForm({ mode }: { mode: "public" | "member" }) {
  const router = useRouter();
  const sections: Section[] = [
    ...(mode === "public" ? [{ id: "you", title: "About you" }] : []),
    { id: "business", title: "Your venture" },
    { id: "goals", title: "Your goals" },
    { id: "plan", title: "Your strategic plan" },
    ...QUICK_QUESTIONS.map((q) => ({ id: `area:${q.key}`, title: "Your business model" })),
    { id: "finish", title: "Almost done" },
  ];
  const TOTAL = sections.length;

  const [screen, setScreen] = useState(0);
  const [fullName, setFullName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [email, setEmail] = useState("");
  const [profile, setProfile] = useState<Profile>(EMPTY);
  const [planAnswers, setPlanAnswers] = useState<Partial<Record<PlanKey, QuickLevel>>>({});
  const [coverage, setCoverage] = useState<BlockKey[]>([]);
  const [answers, setAnswers] = useState<Partial<Record<BlockKey, QuickLevel>>>({});
  const [evidence, setEvidence] = useState<BlockKey[]>([]);
  const [challenges, setChallenges] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [overview, setOverview] = useState<SnapshotOverview | null>(null);
  const [shareUrl, setShareUrl] = useState<string | null>(null);
  const [marketingConsent, setMarketingConsent] = useState(false);

  // Country pages (/ke, /za) link here with ?country=Kenya etc.
  useEffect(() => {
    try {
      const c = new URLSearchParams(window.location.search).get("country");
      if (c && (COUNTRIES as readonly string[]).includes(c)) setProfile((p) => (p.country ? p : { ...p, country: c }));
    } catch {}
  }, []);

  const current = sections[screen];
  const fieldsDone = (fields: Field[]) => fields.every(([k]) => profile[k] !== "");
  const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

  let canContinue = false;
  if (current.id === "you") canContinue = fullName.trim() !== "" && emailOk;
  else if (current.id === "business") canContinue = fieldsDone(BUSINESS_FIELDS);
  else if (current.id === "goals") canContinue = fieldsDone(GOAL_FIELDS);
  else if (current.id === "plan") canContinue = PLAN_QUESTIONS.every((q) => planAnswers[q.key] !== undefined);
  else if (current.id === "finish") canContinue = challenges.length > 0;
  else canContinue = answers[current.id.slice(5) as BlockKey] !== undefined;

  function go(delta: number) {
    setError(null);
    setScreen((s) => Math.max(0, Math.min(TOTAL - 1, s + delta)));
    if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function chooseArea(key: BlockKey, level: QuickLevel) {
    setAnswers((a) => ({ ...a, [key]: level }));
    setTimeout(() => setScreen((s) => Math.min(TOTAL - 1, s + 1)), 250);
  }

  function toggle<T>(list: T[], item: T, max?: number): T[] {
    if (list.includes(item)) return list.filter((x) => x !== item);
    if (max && list.length >= max) return [...list.slice(1), item];
    return [...list, item];
  }

  async function submit() {
    setSubmitting(true);
    setError(null);
    const payload = {
      profile: { ...profile, challenges },
      plan: { answers: planAnswers, coverage },
      answers,
      evidence,
    };
    try {
      const res = await fetch(mode === "public" ? "/api/snapshot" : "/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(mode === "public" ? { ...payload, contact: { fullName, companyName, email, marketingConsent } } : payload),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Something went wrong. Please try again.");
      track("snapshot_complete");
      if (mode === "public") {
        setShareUrl(data.shareUrl ?? null);
        setOverview(data.overview);
        window.scrollTo({ top: 0 });
      } else {
        router.push("/dashboard?snapshot=done");
      }
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (overview) return <SnapshotResult overview={overview} fullName={fullName} companyName={companyName} email={email} shareUrl={shareUrl} />;

  const selectClass = "w-full rounded-lg border border-gray-300 px-3 py-2.5 bg-white focus:border-navy focus:outline-none";
  const inputClass = selectClass;

  const renderSelects = (fields: Field[]) =>
    fields.map(([key, label, options]) => (
      <label key={key} className="block">
        <span className="block text-sm font-medium mb-1">{label}</span>
        <select className={selectClass} value={profile[key]} onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}>
          <option value="">Choose…</option>
          {options.map((o) => (
            <option key={o} value={o}>
              {o}
            </option>
          ))}
        </select>
      </label>
    ));

  // Progress is shown by section, so the nine area questions read as one part.
  const sectionNames = Array.from(new Set(sections.map((s) => s.title)));
  const sectionIndex = sectionNames.indexOf(current.title);

  return (
    <div className="mx-auto w-full max-w-2xl">
      <p className="text-xs font-semibold uppercase tracking-wide text-teal">Free Readiness Snapshot · 5 to 7 minutes</p>
      <div className="mt-3 mb-8">
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-soft mb-2">
          {sectionNames.map((name, i) => (
            <span key={name} className={i === sectionIndex ? "font-semibold text-navy" : i < sectionIndex ? "text-teal" : ""}>
              {i + 1}. {name}
            </span>
          ))}
        </div>
        <div className="h-2 rounded bg-white overflow-hidden" aria-hidden="true">
          <div className="h-full bg-gold transition-all" style={{ width: `${((screen + 1) / TOTAL) * 100}%` }} />
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        {current.id === "you" && (
          <section className="space-y-4">
            <h1 className="text-2xl font-bold text-navy">About you</h1>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Your name</span>
              <input className={inputClass} autoComplete="name" value={fullName} onChange={(e) => setFullName(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Company or venture name</span>
              <input className={inputClass} autoComplete="organization" value={companyName} onChange={(e) => setCompanyName(e.target.value)} />
            </label>
            <label className="block">
              <span className="block text-sm font-medium mb-1">Email address</span>
              <input className={inputClass} type="email" autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <span className="block text-xs text-ink-soft mt-1">We'll email you your results. Use the email you'd sign up with: your results will be waiting in your account.</span>
            </label>
            <label className="flex items-start gap-2 text-sm">
              <input type="checkbox" className="mt-1" checked={marketingConsent} onChange={(e) => setMarketingConsent(e.target.checked)} />
              <span>Also email me practical tips for growing my venture. You can unsubscribe at any time.</span>
            </label>
            <p className="text-xs text-ink-soft">
              By continuing you agree to our <a href="/terms" className="underline">terms</a> and <a href="/privacy" className="underline">privacy policy</a>.
            </p>
          </section>
        )}

        {current.id === "business" && (
          <section className="space-y-4">
            <h1 className="text-2xl font-bold text-navy">Your venture</h1>
            {renderSelects(BUSINESS_FIELDS)}
          </section>
        )}

        {current.id === "goals" && (
          <section className="space-y-4">
            <h1 className="text-2xl font-bold text-navy">Your goals</h1>
            {renderSelects(GOAL_FIELDS)}
          </section>
        )}

        {current.id === "plan" && (
          <section className="space-y-5">
            <div>
              <h1 className="text-2xl font-bold text-navy">Your strategic plan</h1>
              <p className="text-sm text-ink-soft mt-1">A good plan sets direction for every part of your business model.</p>
            </div>
            {PLAN_QUESTIONS.map((q) => (
              <label key={q.key} className="block">
                <span className="block text-sm font-medium mb-1">{q.question}</span>
                <select
                  className={selectClass}
                  value={planAnswers[q.key] ?? ""}
                  onChange={(e) => setPlanAnswers({ ...planAnswers, [q.key]: Number(e.target.value) as QuickLevel })}
                >
                  <option value="">Choose…</option>
                  {q.options.map((o, i) => (
                    <option key={o} value={i}>
                      {o}
                    </option>
                  ))}
                </select>
              </label>
            ))}
            <fieldset>
              <legend className="text-sm font-medium mb-2">Which parts of your business does your plan address? Tick all that apply.</legend>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => {
                  const on = coverage.includes(q.key);
                  return (
                    <button
                      key={q.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setCoverage((c) => toggle(c, q.key))}
                      className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-teal bg-teal text-white" : "border-gray-300"}`}
                    >
                      {q.area}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-ink-soft mt-2">No written plan yet? Leave them unticked.</p>
            </fieldset>
          </section>
        )}

        {current.id.startsWith("area:") &&
          (() => {
            const i = QUICK_QUESTIONS.findIndex((q) => `area:${q.key}` === current.id);
            const q = QUICK_QUESTIONS[i];
            return (
              <section className="space-y-4">
                <p className="text-sm font-semibold text-gold">
                  {q.area} · {i + 1} of {QUICK_QUESTIONS.length}
                </p>
                <h1 className="text-2xl font-bold text-navy">{q.question}</h1>
                <div className="space-y-3" role="radiogroup" aria-label={q.question}>
                  {q.options.map((text, level) => {
                    const selected = answers[q.key] === level;
                    return (
                      <button
                        key={level}
                        type="button"
                        role="radio"
                        aria-checked={selected}
                        onClick={() => chooseArea(q.key, level as QuickLevel)}
                        className={`w-full text-left rounded-lg border px-4 py-3 transition ${selected ? "border-navy bg-navy text-white" : "border-gray-300 hover:border-navy"}`}
                      >
                        {text}
                      </button>
                    );
                  })}
                </div>
              </section>
            );
          })()}

        {current.id === "finish" && (
          <section className="space-y-8">
            <div>
              <h1 className="text-2xl font-bold text-navy">Almost done</h1>
              <p className="text-sm text-ink-soft mt-1">Three last questions, then you'll see your results.</p>
            </div>
            <fieldset>
              <legend className="text-sm font-medium mb-2">
                Where do you have real evidence, such as sales records, contracts, customer data or accounts? Tick all that apply.
              </legend>
              <div className="flex flex-wrap gap-2">
                {QUICK_QUESTIONS.map((q) => {
                  const on = evidence.includes(q.key);
                  return (
                    <button
                      key={q.key}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setEvidence((e) => toggle(e, q.key))}
                      className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-teal bg-teal text-white" : "border-gray-300"}`}
                    >
                      {q.area}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <fieldset>
              <legend className="text-sm font-medium mb-2">What are your biggest challenges right now? Choose up to {MAX_CHALLENGES}.</legend>
              <div className="flex flex-wrap gap-2">
                {CHALLENGES.map((c) => {
                  const on = challenges.includes(c);
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={on}
                      onClick={() => setChallenges((list) => toggle(list, c, MAX_CHALLENGES))}
                      className={`rounded-full border px-3 py-1.5 text-sm ${on ? "border-navy bg-navy text-white" : "border-gray-300"}`}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </fieldset>
            <label className="block">
              <span className="block text-sm font-medium mb-1">How did you hear about us? (optional)</span>
              <select className={selectClass} value={profile.heardFrom} onChange={(e) => setProfile({ ...profile, heardFrom: e.target.value })}>
                <option value="">Choose…</option>
                {HEARD_FROM.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </select>
            </label>
          </section>
        )}

        {error && (
          <p role="alert" className="mt-6 text-red-600 text-sm">
            {error}
          </p>
        )}

        <div className="mt-8 flex justify-between items-center">
          <button type="button" className="rounded-lg border px-5 py-2 disabled:opacity-40" disabled={screen === 0 || submitting} onClick={() => go(-1)}>
            Back
          </button>
          {screen < TOTAL - 1 ? (
            <button type="button" className="rounded-lg bg-navy px-6 py-2 text-white font-semibold disabled:opacity-40" disabled={!canContinue} onClick={() => go(1)}>
              Next
            </button>
          ) : (
            <button type="button" className="rounded-lg bg-gold px-6 py-3 text-white font-semibold disabled:opacity-50" disabled={!canContinue || submitting} onClick={submit}>
              {submitting ? "Scoring…" : "See my results"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
