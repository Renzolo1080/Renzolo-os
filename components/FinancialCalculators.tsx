"use client";
import { useState } from "react";

/** Two simple, pure-client calculators (no data saved) — a founder can
 * plug in their own numbers and see the result instantly. Deliberately
 * basic (breakeven, CAC/LTV) rather than a full financial model, per the
 * "not too complex" scope decision for Founder Tools. */
export function FinancialCalculators() {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <BreakevenCalculator />
      <CacLtvCalculator />
    </div>
  );
}

function num(v: string): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function BreakevenCalculator() {
  const [fixedCosts, setFixedCosts] = useState("");
  const [price, setPrice] = useState("");
  const [variableCost, setVariableCost] = useState("");

  const contribution = num(price) - num(variableCost);
  const breakevenUnits = contribution > 0 ? Math.ceil(num(fixedCosts) / contribution) : null;
  const breakevenRevenue = breakevenUnits != null ? breakevenUnits * num(price) : null;

  return (
    <div className="rounded border p-4 space-y-3">
      <p className="font-semibold text-navy">Breakeven Calculator</p>
      <Field label="Monthly fixed costs ($)" value={fixedCosts} onChange={setFixedCosts} />
      <Field label="Price per unit/customer ($)" value={price} onChange={setPrice} />
      <Field label="Variable cost per unit/customer ($)" value={variableCost} onChange={setVariableCost} />
      <div className="pt-2 text-sm">
        {contribution <= 0 ? (
          <p className="text-red-600">Price must be higher than variable cost to ever break even.</p>
        ) : (
          <>
            <p>
              Breakeven volume: <span className="font-bold">{breakevenUnits?.toLocaleString()}</span> units/customers per month
            </p>
            <p>
              Breakeven revenue: <span className="font-bold">${breakevenRevenue?.toLocaleString()}</span> per month
            </p>
          </>
        )}
      </div>
    </div>
  );
}

function CacLtvCalculator() {
  const [spend, setSpend] = useState("");
  const [customersAcquired, setCustomersAcquired] = useState("");
  const [avgRevenue, setAvgRevenue] = useState("");
  const [grossMarginPct, setGrossMarginPct] = useState("");
  const [lifetimeMonths, setLifetimeMonths] = useState("");

  const cac = num(customersAcquired) > 0 ? num(spend) / num(customersAcquired) : null;
  const ltv = num(avgRevenue) * (num(grossMarginPct) / 100) * num(lifetimeMonths);
  const ratio = cac && cac > 0 ? ltv / cac : null;

  return (
    <div className="rounded border p-4 space-y-3">
      <p className="font-semibold text-navy">CAC / LTV Calculator</p>
      <Field label="Total acquisition spend, this period ($)" value={spend} onChange={setSpend} />
      <Field label="Customers acquired, this period" value={customersAcquired} onChange={setCustomersAcquired} />
      <Field label="Avg. monthly revenue per customer ($)" value={avgRevenue} onChange={setAvgRevenue} />
      <Field label="Gross margin (%)" value={grossMarginPct} onChange={setGrossMarginPct} />
      <Field label="Avg. customer lifetime (months)" value={lifetimeMonths} onChange={setLifetimeMonths} />
      <div className="pt-2 text-sm space-y-1">
        <p>
          CAC: <span className="font-bold">{cac != null ? `$${cac.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : "—"}</span>
        </p>
        <p>
          LTV: <span className="font-bold">${ltv.toLocaleString(undefined, { maximumFractionDigits: 2 })}</span>
        </p>
        {ratio != null && (
          <p className={ratio >= 3 ? "text-teal font-semibold" : ratio >= 1 ? "text-yellow-700 font-semibold" : "text-red-600 font-semibold"}>
            LTV:CAC ratio: {ratio.toFixed(1)}:1 {ratio >= 3 ? "(healthy)" : ratio >= 1 ? "(thin — watch this)" : "(losing money per customer)"}
          </p>
        )}
      </div>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-ink-soft mb-1">{label}</span>
      <input
        type="number"
        inputMode="decimal"
        className="w-full rounded border px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </label>
  );
}
