import { SUBSCRIPTION_FEATURES } from "@/lib/quickcheck";

/** The list of what a subscription includes, on a dark panel or a light one. */
export function SubscriptionFeatures({ dark = false, limit }: { dark?: boolean; limit?: number }) {
  const items = limit ? SUBSCRIPTION_FEATURES.slice(0, limit) : SUBSCRIPTION_FEATURES;
  return (
    <ul className="grid gap-x-6 gap-y-2 sm:grid-cols-2">
      {items.map((f) => (
        <li key={f} className={`flex gap-2 text-sm ${dark ? "text-cream" : "text-ink"}`}>
          <span aria-hidden="true" className="mt-0.5 font-bold text-gold">✓</span>
          <span>{f}</span>
        </li>
      ))}
    </ul>
  );
}
