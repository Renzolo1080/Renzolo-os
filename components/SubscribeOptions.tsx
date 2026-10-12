"use client";
import { useState } from "react";

export interface PlanOption {
  interval: "monthly" | "annual";
  name: string;
  price: string;
  per: string;
  /** e.g. "2 months free…" — shown only when it's true for the current prices. */
  note: string | null;
  /** Whether card auto-renewal is available for this plan (a Flutterwave
   * Payment Plan ID is configured, and this is the main currency). */
  autoRenewAvailable: boolean;
}

export interface CurrencyOption {
  currency: string;
  /** What Flutterwave's documentation says can be used to pay in this currency. */
  methods: string;
  plans: PlanOption[];
}

/** The plan cards on /dashboard/subscribe. Clicking a plan asks the
 * server to start a checkout and then sends the browser to Flutterwave's
 * hosted payment page — no card or mobile-money details are ever entered
 * on this site. When a local-currency price exists for the founder's
 * country they can choose which currency to pay in. */
export function SubscribeOptions({ options, renewing }: { options: CurrencyOption[]; renewing: boolean }) {
  const [currency, setCurrency] = useState(options[0]?.currency ?? "USD");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [autoRenew, setAutoRenew] = useState<Record<string, boolean>>({});

  const current = options.find((o) => o.currency === currency) ?? options[0];
  if (!current) return null;

  async function start(plan: PlanOption) {
    setBusy(plan.interval);
    setError(null);
    try {
      const res = await fetch("/api/billing/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          interval: plan.interval,
          currency: current.currency,
          autoRenew: plan.autoRenewAvailable && !!autoRenew[plan.interval],
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.link) throw new Error(data.error ?? "Something went wrong starting your payment.");
      window.location.assign(data.link);
      // Leave the button in its busy state while the browser navigates away.
    } catch (e: any) {
      setError(e?.message ?? "Something went wrong starting your payment.");
      setBusy(null);
    }
  }

  return (
    <div>
      {options.length > 1 && (
        <fieldset className="mb-4">
          <legend className="text-sm font-semibold text-navy mb-2">Pay in</legend>
          <div className="flex flex-wrap gap-2">
            {options.map((o) => (
              <label
                key={o.currency}
                className={`cursor-pointer rounded border px-4 py-2 text-sm ${o.currency === current.currency ? "border-navy bg-navy text-white" : "border-navy text-navy"}`}
              >
                <input
                  type="radio"
                  name="currency"
                  value={o.currency}
                  checked={o.currency === current.currency}
                  onChange={() => setCurrency(o.currency)}
                  disabled={busy !== null}
                  className="sr-only"
                />
                {o.currency}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      <div className="grid gap-4 sm:grid-cols-2">
        {current.plans.map((plan) => (
          <div key={plan.interval} className="rounded border p-6 flex flex-col">
            <p className="font-semibold text-navy">{plan.name}</p>
            <p className="mt-2">
              <span className="text-3xl font-bold text-navy">{plan.price}</span>
              <span className="text-ink-soft"> {plan.per}</span>
            </p>
            <p className="mt-1 text-sm text-gold font-semibold min-h-[1.25rem]">{plan.note ?? ""}</p>

            {plan.autoRenewAvailable && (
              <label className="mt-3 flex items-start gap-2 text-sm text-ink-soft">
                <input
                  type="checkbox"
                  className="mt-1"
                  checked={!!autoRenew[plan.interval]}
                  onChange={(e) => setAutoRenew((s) => ({ ...s, [plan.interval]: e.target.checked }))}
                />
                <span>Renew automatically by card. Leave unticked to make a single payment and renew yourself.</span>
              </label>
            )}

            <button
              onClick={() => start(plan)}
              disabled={busy !== null}
              className="mt-4 rounded bg-navy px-5 py-3 text-white font-semibold disabled:opacity-50"
            >
              {busy === plan.interval ? "Taking you to payment…" : renewing ? `Renew ${plan.name.toLowerCase()}` : `Choose ${plan.name.toLowerCase()}`}
            </button>
          </div>
        ))}
      </div>

      <p className="mt-3 text-sm text-ink-soft">{current.methods}</p>

      {error && (
        <p role="alert" className="mt-4 text-red-600 text-sm">
          {error}
        </p>
      )}
    </div>
  );
}
