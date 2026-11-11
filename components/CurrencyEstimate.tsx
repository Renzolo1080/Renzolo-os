/** Checkout panel: what the USD prices come to in the founder's currency
 * at today's rate. An estimate only — never used to charge. */
export function CurrencyEstimate({
  currency,
  name,
  rate,
  updated,
  rows,
}: {
  currency: string;
  name: string;
  rate: string;
  updated: string | null;
  rows: { label: string; usd: string; local: string }[];
}) {
  if (rows.length === 0) return null;
  return (
    <section className="mt-6 rounded-2xl border border-teal/30 bg-white p-5 text-sm shadow-sm" aria-label={`Prices in ${name}`}>
      <h2 className="text-base font-semibold text-navy">What this costs in {name} ({currency})</h2>
      <p className="mt-1 text-ink-soft">
        Prices are charged in US dollars. At today&apos;s rate, $1 is about {rate}.
      </p>
      <table className="mt-3 w-full text-left">
        <thead>
          <tr className="text-xs uppercase tracking-wide text-ink-soft">
            <th className="py-1 font-semibold">Item</th>
            <th className="py-1 font-semibold">Price</th>
            <th className="py-1 font-semibold">About</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.label} className="border-t border-navy/10">
              <td className="py-1.5 text-navy">{r.label}</td>
              <td className="py-1.5 text-navy">{r.usd}</td>
              <td className="py-1.5 font-semibold text-navy">{r.local}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="mt-3 text-xs text-ink-soft">
        Estimate only. Your bank, card issuer or mobile-money provider sets the final rate and may add a fee.
        {updated ? ` Rates updated ${updated.replace(/ \+0000$/, " UTC")}.` : ""}{" "}
        <a href="https://www.exchangerate-api.com" className="underline" rel="noopener noreferrer" target="_blank">
          Rates by Exchange Rate API
        </a>
        .
      </p>
    </section>
  );
}
