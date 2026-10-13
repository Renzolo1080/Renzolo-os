"use client";
import { useState } from "react";
import { APP_URL } from "@/lib/site";

const field = "w-full rounded-xl border border-mist bg-white px-4 py-3 text-ink focus:border-navy focus:outline-none";
const STAGES = [
  "Discover: exploring an idea",
  "Validate: testing with real customers",
  "Build: developing the product or service",
  "Acquire: winning first and repeat customers",
  "Prepare: getting ready to grow or raise",
  "Fund: raising capital or financing",
  "Scale: expanding fast",
  "Exit: selling, merging or succession",
];
const TOPICS = ["General question", "Partnership", "Media", "Support with my account", "Cohorts and the Academy"];

function useSend(path: string) {
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState("sending");
    setError(null);
    const body = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(`${APP_URL}${path}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "That didn't send. Check your details and try again.");
      setState("sent");
    } catch (err: any) {
      setError(err?.message === "Failed to fetch" ? "That didn't send. Check your connection and try again." : err?.message);
      setState("error");
    }
  }
  return { state, error, onSubmit };
}

const Trap = () => (
  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
    <input name="website" tabIndex={-1} autoComplete="off" />
  </div>
);

export function InterestForm() {
  const { state, error, onSubmit } = useSend("/api/applications");
  if (state === "sent")
    return <p className="rounded-2xl bg-white p-8 text-lg">You're on the list. We'll email you when applications open, with dates, the fee and how to qualify.</p>;
  return (
    <form onSubmit={onSubmit} className="relative grid gap-4 rounded-2xl bg-white p-6 md:p-8">
      <Trap />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          Your name
          <input name="fullName" required autoComplete="name" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Business or company
          <input name="company" autoComplete="organization" className={field} />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold">
        Email address
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Stage
        <select name="ventureStage" className={field} defaultValue="">
          <option value="">Choose…</option>
          {STAGES.map((s) => (
            <option key={s}>{s}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Cohort
        <select name="cohort" className={field} defaultValue="foundations">
          <option value="foundations">Foundations (8 weeks)</option>
          <option value="growth">Growth Cohort (12 weeks)</option>
          <option value="elevate">Elevate Cohort (6 months)</option>
        </select>
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="rounded-full bg-gold px-6 py-3.5 font-semibold text-white disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Register my interest"}
      </button>
    </form>
  );
}

export function ContactForm() {
  const { state, error, onSubmit } = useSend("/api/contact");
  if (state === "sent") return <p className="rounded-2xl bg-white p-8 text-lg">Message sent. We reply within two working days.</p>;
  return (
    <form onSubmit={onSubmit} className="relative grid gap-4 rounded-2xl bg-white p-6 md:p-8">
      <Trap />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm font-semibold">
          Your name
          <input name="fullName" required autoComplete="name" className={field} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          Organisation (optional)
          <input name="company" autoComplete="organization" className={field} />
        </label>
      </div>
      <label className="grid gap-1.5 text-sm font-semibold">
        Email address
        <input name="email" type="email" required autoComplete="email" className={field} />
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Topic
        <select name="topic" className={field} defaultValue={TOPICS[0]}>
          {TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="grid gap-1.5 text-sm font-semibold">
        Message
        <textarea name="message" required rows={5} className={field} />
      </label>
      {error && <p className="text-sm text-red-700">{error}</p>}
      <button type="submit" disabled={state === "sending"} className="rounded-full bg-navy px-6 py-3.5 font-semibold text-white disabled:opacity-60">
        {state === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
