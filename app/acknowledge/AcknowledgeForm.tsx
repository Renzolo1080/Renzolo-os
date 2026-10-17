"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MatchingConcept } from "@/components/MatchingConcept";
import { MATCHING_STATEMENT_VERSION } from "@/lib/matching-statement";

export function AcknowledgeForm() {
  const router = useRouter();
  const [checked, setChecked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!checked) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/acknowledgments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ version: MATCHING_STATEMENT_VERSION, source: "login" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data.error ?? "Couldn't save your acknowledgment. Please try again.");
        return;
      }
      router.replace("/dashboard");
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="flex min-h-[70vh] items-center justify-center px-4 py-12 sm:px-6">
      <form onSubmit={handleSubmit} className="w-full max-w-lg space-y-4 rounded-2xl bg-white p-6 shadow-sm sm:p-8">
        <h1 className="text-2xl font-bold text-navy">Before you continue</h1>
        <p className="text-sm text-ink-soft">
          The RENZOLO Network™ Matching Statement has been updated. As a Matching subscriber, please read and acknowledge it to continue.
        </p>
        <MatchingConcept checked={checked} onChange={setChecked} />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={!checked || saving}
          className="w-full rounded-lg bg-navy px-6 py-3 font-semibold text-white disabled:opacity-50"
        >
          {saving ? "Saving…" : "Continue to dashboard"}
        </button>
      </form>
    </main>
  );
}
