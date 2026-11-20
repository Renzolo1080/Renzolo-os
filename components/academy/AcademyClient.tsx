"use client";
import { useState } from "react";
import { track } from "@/lib/track";
import { VOLT_FIELDS, type VoltCard } from "@/lib/courses";

const primary =
  "btn-pop inline-flex min-h-[48px] items-center justify-center rounded-pill border-2 border-ink bg-brand px-6 font-semibold text-on-brand disabled:opacity-45";
const secondary = "inline-flex min-h-[48px] items-center justify-center rounded-pill border border-navy bg-white px-6 font-semibold text-navy disabled:opacity-45";

/** Starts checkout for a course or the bundle. Signed-out visitors are
 * sent to sign up first, then back here. The price is worked out again
 * on the server; nothing shown here is trusted. */
export function BuyCourseButton({ course, label, signedIn, returnTo, full = false }: { course: string; label: string; signedIn: boolean; returnTo: string; full?: boolean }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const cls = `${primary}${full ? " w-full" : ""}`;

  if (!signedIn) {
    return (
      <a href={`/login?next=${encodeURIComponent(returnTo)}`} className={cls}>
        {label}
      </a>
    );
  }

  async function buy() {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "course", course }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.link) throw new Error(data.error ?? "Something went wrong starting your payment.");
      track("begin_checkout", { item: `course:${course}` });
      window.location.assign(data.link);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong starting your payment.");
      setBusy(false);
    }
  }

  return (
    <div className={full ? "w-full" : ""}>
      <button type="button" onClick={buy} disabled={busy} className={cls}>
        {busy ? "Opening secure checkout…" : label}
      </button>
      {error && (
        <p role="alert" className="mt-2 text-sm font-semibold text-red-700">
          {error}
        </p>
      )}
    </div>
  );
}

/** The 5-minute VOLT practice and "mark complete" for one lesson. */
export function LessonPractice({
  course,
  lesson,
  initialVolt,
  initialEnergy,
  initiallyComplete,
  nextHref,
}: {
  course: string;
  lesson: string;
  initialVolt: VoltCard;
  initialEnergy: number | null;
  initiallyComplete: boolean;
  nextHref: string | null;
}) {
  const [volt, setVolt] = useState<VoltCard>(initialVolt);
  const [energy, setEnergy] = useState<string>(initialEnergy ? String(initialEnergy) : "");
  const [complete, setComplete] = useState(initiallyComplete);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function save(markComplete: boolean) {
    setBusy(true);
    setStatus(null);
    try {
      const res = await fetch("/api/courses/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ course, lesson, volt, energy: energy ? Number(energy) : null, complete: markComplete }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error ?? "Couldn't save. Please try again.");
      if (markComplete) {
        setComplete(true);
        if (nextHref) {
          window.location.assign(nextHref);
          return;
        }
        setStatus("Lesson complete. You've finished the course: re-score your readiness from your dashboard.");
      } else {
        setStatus("Saved to your plan.");
      }
    } catch (e: any) {
      setStatus(e?.message ?? "Couldn't save. Please try again.");
    }
    setBusy(false);
  }

  return (
    <div className="space-y-6">
      <section aria-labelledby="volt-h" className="space-y-4 rounded-panel bg-surface p-6 sm:p-8">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-text">5-minute practice</p>
        <h2 id="volt-h" className="text-2xl text-navy">
          Your VOLT card for this lesson
        </h2>
        {VOLT_FIELDS.map((f) => (
          <div key={f.key} className="flex flex-col gap-1.5">
            <label htmlFor={`volt-${f.key}`} className="font-semibold text-navy">
              {f.letter} · {f.label}
            </label>
            <textarea
              id={`volt-${f.key}`}
              rows={2}
              maxLength={600}
              placeholder={f.hint}
              value={volt[f.key] ?? ""}
              onChange={(e) => setVolt({ ...volt, [f.key]: e.target.value })}
              className="rounded-xl border border-line bg-white px-3.5 py-3 text-base"
            />
          </div>
        ))}
        <div className="flex max-w-xs flex-col gap-1.5">
          <label htmlFor="energy" className="font-semibold text-navy">
            Energy check this week
          </label>
          <select id="energy" value={energy} onChange={(e) => setEnergy(e.target.value)} className="min-h-[48px] rounded-xl border border-line bg-white px-3 text-base">
            <option value="">Choose 1 to 10</option>
            {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
              <option key={n} value={n}>
                {n} out of 10
              </option>
            ))}
          </select>
        </div>
        <p className="text-sm text-ink-soft">Saved to your account in RENZOLO OS™. Your coach sees it only if you share your plan with them.</p>
        <button type="button" onClick={() => save(false)} disabled={busy} className={secondary}>
          Save my VOLT card
        </button>
      </section>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <span className="text-sm text-ink-soft">{complete ? "You've completed this lesson." : ""}</span>
        <button type="button" onClick={() => save(true)} disabled={busy} className={primary}>
          {complete ? (nextHref ? "Next lesson" : "Done") : nextHref ? "Mark complete and continue" : "Mark complete"}
        </button>
      </div>
      {status && (
        <p role="status" className="text-sm font-semibold text-navy">
          {status}
        </p>
      )}
    </div>
  );
}

/** Admin: set or clear the Bunny Stream video for one lesson. */
export function LessonVideoForm({ course, lesson, current }: { course: string; lesson: string; current: string | null }) {
  const [value, setValue] = useState(current ?? "");
  const [msg, setMsg] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  async function save() {
    setBusy(true);
    setMsg(null);
    const res = await fetch("/api/admin/course-media", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ course, lesson, videoId: value }) });
    const data = await res.json().catch(() => ({}));
    setMsg(res.ok ? (data.removed ? "Removed" : "Saved") : data.error ?? "Couldn't save");
    setBusy(false);
  }
  const id = `video-${course}-${lesson}`;
  return (
    <div className="flex flex-wrap items-center gap-2">
      <label htmlFor={id} className="sr-only">
        Video ID for lesson {lesson}
      </label>
      <input id={id} value={value} onChange={(e) => setValue(e.target.value)} placeholder="Bunny video ID" className="min-h-[40px] w-80 max-w-full rounded-lg border border-line px-3 font-mono text-sm" />
      <button type="button" onClick={save} disabled={busy} className="min-h-[40px] rounded-pill border border-navy px-4 text-sm font-semibold text-navy">
        Save
      </button>
      {msg && (
        <span role="status" className="text-sm text-ink-soft">
          {msg}
        </span>
      )}
    </div>
  );
}
