"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export interface OneOffPrices {
  currency: string;
  assessment: string | null;
  single: string | null;
  pack: string | null;
}

/** The one-time Readiness Assessment and coaching sessions, plus booking
 * a session with an available coaching credit. */
export function OneOffPurchases({
  prices,
  showAssessment,
  member,
  coachingAvailable,
  nextCoachingFrom,
  standardSingle,
  standardPack,
}: {
  prices: OneOffPrices[];
  showAssessment: boolean;
  member: boolean;
  coachingAvailable: number;
  nextCoachingFrom: string | null;
  standardSingle: string | null;
  standardPack: string | null;
}) {
  const router = useRouter();
  const [currency, setCurrency] = useState(prices[0]?.currency ?? "USD");
  const p = prices.find((x) => x.currency === currency) ?? prices[0];
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [booked, setBooked] = useState(false);

  async function buy(body: Record<string, unknown>, key: string) {
    setBusy(key);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...body, currency: p.currency }) });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.link) throw new Error(data.error ?? "Something went wrong starting your payment.");
      window.location.assign(data.link);
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong starting your payment.");
      setBusy(null);
    }
  }

  async function book() {
    setBusy("book");
    setError(null);
    const res = await fetch("/api/coaching/book", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(null);
    if (!res.ok) return setError(data.error ?? "Could not book right now.");
    setBooked(true);
    router.refresh();
  }

  if (!p) return null;
  return (
    <div className="space-y-5">
      {prices.length > 1 && (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold text-navy">Pay in</span>
          {prices.map((x) => (
            <button
              key={x.currency}
              type="button"
              aria-pressed={x.currency === p.currency}
              onClick={() => setCurrency(x.currency)}
              className={`rounded-lg border px-4 py-2 text-sm ${x.currency === p.currency ? "border-navy bg-navy text-white" : "border-navy text-navy"}`}
            >
              {x.currency}
            </button>
          ))}
        </div>
      )}

      <div className={`grid gap-5 ${showAssessment ? "md:grid-cols-2" : ""}`}>
        {showAssessment && p.assessment && (
          <div className="flex flex-col rounded-2xl border border-gold/50 bg-white p-6 shadow-sm">
            <p className="text-xs font-semibold uppercase tracking-wide text-teal">One-time · no membership</p>
            <p className="mt-1 text-xl font-bold text-navy">Readiness Assessment</p>
            <p className="mt-2 text-4xl font-bold text-navy">{p.assessment}</p>
            <ul className="mt-4 space-y-1.5 text-sm">
              {[
                "Full assessment and detailed AI Readiness Report, downloadable",
                "Valuation range and Market, Customer and Investor readiness scores",
                "AI market insight for your industry and country",
                "A recommendation of the membership tier that fits you",
                "Join within 30 days and your assessment carries straight into your membership",
              ].map((t) => (
                <li key={t} className="flex gap-2">
                  <span className="font-bold text-gold">✓</span>
                  <span>{t}</span>
                </li>
              ))}
            </ul>
            <button type="button" onClick={() => buy({ kind: "assessment" }, "assessment")} disabled={busy !== null} className="mt-auto rounded-lg bg-navy px-5 py-3 font-semibold text-white disabled:opacity-50">
              {busy === "assessment" ? "Taking you to payment…" : `Buy the assessment · ${p.assessment}`}
            </button>
          </div>
        )}

        <div className="flex flex-col rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-teal">{member ? "Member prices" : "No minimum"}</p>
          <p className="mt-1 text-xl font-bold text-navy">One-on-one coaching</p>
          <p className="mt-1 text-sm text-ink-soft">With a RENZOLO coach. Sessions are valid for a year; we arrange the time with you by email.</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {[
              { key: "coaching_single", label: "1 session", price: p.single, standard: standardSingle },
              { key: "coaching_pack3", label: "3 sessions", price: p.pack, standard: standardPack },
            ].map((o) =>
              o.price ? (
                <button
                  key={o.key}
                  type="button"
                  onClick={() => buy({ kind: "coaching", item: o.key }, o.key)}
                  disabled={busy !== null}
                  className="rounded-lg border border-navy px-4 py-3 text-left disabled:opacity-50"
                >
                  <span className="block text-sm text-ink-soft">{o.label}</span>
                  <span className="block text-2xl font-bold text-navy">
                    {busy === o.key ? "…" : o.price}
                    {member && o.standard && o.standard !== o.price && <span className="ml-2 text-sm font-normal text-ink-soft line-through">{o.standard}</span>}
                  </span>
                </button>
              ) : null
            )}
          </div>
          <div className="mt-5 rounded-lg bg-cream p-4 text-sm">
            {coachingAvailable > 0 ? (
              <>
                <p className="font-semibold text-navy">
                  You have {coachingAvailable} coaching session{coachingAvailable > 1 ? "s" : ""} to book.
                </p>
                {booked ? (
                  <p className="mt-1 text-teal">Requested. We'll email you to arrange a time.</p>
                ) : (
                  <button type="button" onClick={book} disabled={busy !== null} className="mt-2 rounded-lg bg-gold px-4 py-2 font-semibold text-white disabled:opacity-50">
                    {busy === "book" ? "Booking…" : "Book a session"}
                  </button>
                )}
              </>
            ) : (
              <p className="text-ink-soft">
                No coaching sessions to book right now
                {nextCoachingFrom ? `. Your next included sessions arrive on ${new Date(nextCoachingFrom).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}.` : "."}
              </p>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
