"use client";
import { useState } from "react";
import { STAGES, COUNTRIES } from "@/lib/quickcheck";
import { CONTACT_TOPICS } from "@/lib/forms";

const input = "w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 focus:border-navy focus:outline-none";

function useSubmit(url: string) {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [error, setError] = useState<string | null>(null);
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus("sending");
    setError(null);
    const data = Object.fromEntries(new FormData(e.currentTarget).entries());
    try {
      const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data) });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error ?? "Something went wrong. Please try again.");
      setStatus("done");
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong. Please try again.");
      setStatus("error");
    }
  }
  return { status, error, submit };
}

/** Hidden field that only bots fill in. */
const Honeypot = () => (
  <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
    <label>
      Website
      <input name="website" tabIndex={-1} autoComplete="off" />
    </label>
  </div>
);

export function CohortForm({ defaultCohort = "essentials_growth" }: { defaultCohort?: "essentials_growth" | "elevate" }) {
  const { status, error, submit } = useSubmit("/api/applications");
  if (status === "done")
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-navy">Thank you, you're on the list.</p>
        <p className="mt-1 text-sm text-ink-soft">We'll email you when applications open for the next cohort, with dates, the fee and how to qualify.</p>
      </div>
    );
  return (
    <form onSubmit={submit} className="relative space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Your name</span>
          <input name="fullName" required autoComplete="name" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Company or venture</span>
          <input name="company" autoComplete="organization" className={input} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email address</span>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Country</span>
          <select name="country" className={input} defaultValue="">
            <option value="">Choose…</option>
            {COUNTRIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Stage</span>
          <select name="ventureStage" className={input} defaultValue="">
            <option value="">Choose…</option>
            {STAGES.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Which cohort?</span>
        <select name="cohort" className={input} defaultValue={defaultCohort}>
          <option value="essentials_growth">Founder Trajectory™ Academy cohort (Essentials and Growth members)</option>
          <option value="elevate">Elevate cohort (Elevate members)</option>
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">What do you want to achieve? (optional)</span>
        <textarea name="message" rows={3} className={input} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={status === "sending"} className="w-full rounded-lg bg-gold px-5 py-3 font-semibold text-white disabled:opacity-50">
        {status === "sending" ? "Sending…" : "Register my interest"}
      </button>
      <p className="text-xs text-ink-soft">
        We'll use these details to contact you about cohorts. See our <a href="/privacy" className="underline">privacy policy</a>.
      </p>
    </form>
  );
}

export function ContactForm() {
  const { status, error, submit } = useSubmit("/api/contact");
  if (status === "done")
    return (
      <div className="rounded-2xl bg-white p-6 text-center shadow-sm">
        <p className="text-lg font-semibold text-navy">Thank you, your message is on its way.</p>
        <p className="mt-1 text-sm text-ink-soft">We aim to reply within two working days.</p>
      </div>
    );
  return (
    <form onSubmit={submit} className="relative space-y-4 rounded-2xl bg-white p-6 shadow-sm">
      <Honeypot />
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Your name</span>
          <input name="fullName" required autoComplete="name" className={input} />
        </label>
        <label className="block">
          <span className="mb-1 block text-sm font-medium">Organisation (optional)</span>
          <input name="company" autoComplete="organization" className={input} />
        </label>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Email address</span>
        <input name="email" type="email" required autoComplete="email" className={input} />
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Topic</span>
        <select name="topic" className={input} defaultValue={CONTACT_TOPICS[0]}>
          {CONTACT_TOPICS.map((t) => (
            <option key={t}>{t}</option>
          ))}
        </select>
      </label>
      <label className="block">
        <span className="mb-1 block text-sm font-medium">Message</span>
        <textarea name="message" rows={5} required className={input} />
      </label>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button type="submit" disabled={status === "sending"} className="w-full rounded-lg bg-navy px-5 py-3 font-semibold text-white disabled:opacity-50">
        {status === "sending" ? "Sending…" : "Send message"}
      </button>
    </form>
  );
}
