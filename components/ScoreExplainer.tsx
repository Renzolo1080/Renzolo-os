import { COMPONENTS, COMPONENT_HELP, COMPONENT_LABELS } from "@/lib/readiness";

/** "How your score is made": tells founders how the Total Readiness Score
 * is calculated and how to ask a person to review it (POPIA s71, GDPR
 * art. 22, Nigeria GAID: profiling must be explained and open to human
 * review). */
export function ScoreExplainer() {
  return (
    <details className="rounded-2xl border border-gray-200 bg-white p-5 text-sm">
      <summary className="cursor-pointer font-semibold text-navy">How your score is made</summary>
      <div className="mt-3 space-y-3 text-ink-soft">
        <p>
          Your Total Readiness Score is calculated by fixed rules from your own answers, the evidence you add and your plan. It blends five
          component scores, each from 0 to 100. They count equally, unless you choose a main goal (customers, capital or investors), which gives
          that component more weight.
        </p>
        <ul className="list-disc space-y-1 pl-5">
          {COMPONENTS.map((c) => (
            <li key={c}>
              <span className="font-medium text-navy">{COMPONENT_LABELS[c]}:</span> {COMPONENT_HELP[c]}
            </li>
          ))}
        </ul>
        <p>
          AI writes the wording of your report and coaching. The only place AI affects a number is the Strategic score, which can include an AI
          review of your plan. The score is guidance for you, not a decision about you: RENZOLO OS™ does not approve or refuse any loan, contract
          or investment.
        </p>
        <p>
          Think a score is wrong? <a href="/account/data#review" className="text-teal underline">Ask a person to review it</a>. You can also correct
          your answers at any time.
        </p>
      </div>
    </details>
  );
}
