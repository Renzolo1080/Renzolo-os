/** One cell of the tier comparison table. */
export function TierCheck({ value, dark = false }: { value: boolean | string; dark?: boolean }) {
  if (value === true)
    return (
      <span className="font-bold text-teal-text" aria-label="Included">
        ✓
      </span>
    );
  if (value === false)
    return (
      <span className={dark ? "text-cream/40" : "text-gray-300"} aria-label="Not included">
        —
      </span>
    );
  return <span className={`text-sm ${value === "Coming soon" ? "italic text-ink-soft" : "font-medium text-navy"}`}>{value}</span>;
}
