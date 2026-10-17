import { CONCEPT_PARAGRAPHS, CONCEPT_TITLE, MATCHING_STATEMENT_PATH } from "@/lib/matching-statement";

/** The short RENZOLO Network™ Matching concept statement with its required
 * acknowledgment box. Used on the registration form and the login
 * acknowledgment step. The full statement opens in a new tab so a
 * half-filled form is never lost. */
export function MatchingConcept({
  checked,
  onChange,
  id = "matching-ack",
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  id?: string;
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="space-y-2 rounded-xl border border-gray-200 bg-gray-50 p-4 text-sm">
      <h2 id={`${id}-title`} className="font-semibold text-navy">
        {CONCEPT_TITLE}
      </h2>
      {CONCEPT_PARAGRAPHS.map((p) => (
        <p key={p.slice(0, 24)} className="text-ink-soft">
          {p}
        </p>
      ))}
      <label htmlFor={id} className="flex items-start gap-2 pt-1 font-medium">
        <input id={id} type="checkbox" className="mt-1" checked={checked} onChange={(e) => onChange(e.target.checked)} required />
        <span>
          I have read and agree to the{" "}
          <a href={MATCHING_STATEMENT_PATH} target="_blank" rel="noopener" className="text-teal underline">
            RENZOLO Network™ Matching Statement
          </a>
          .
        </span>
      </label>
    </section>
  );
}
