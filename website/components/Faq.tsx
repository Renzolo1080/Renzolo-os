const QUESTIONS: [string, string][] = [
  ["Who is Founder Trajectory™ for?", "Founders and suppliers at any stage, from first idea to exit, in any country. We're launching first in Kenya, South Africa and the United States."],
  ["How long does the free Snapshot take?", "Five minutes or less, with no account needed. You see your results straight away."],
  ["Do I need a registered business?", "No. If you haven't registered yet, the assessment shows what formalising would change and builds it into your plan."],
  ["How do I pay?", "By card in US dollars today. Paying in local currency, including M-Pesa in Kenya, is being set up."],
  ["Is the valuation an official valuation?", "No. It's a directional range for your own planning, not a formal valuation or financial advice."],
  ["Can I cancel?", "Yes. Cancelling just means not renewing, and you keep access until the end of the period you paid for."],
  ["Is my information private?", "Yes. We never sell your information, and your answers are only used to create your results and support you."],
];

/** The questions founders ask most before joining. */
export function Faq({ dark = false }: { dark?: boolean }) {
  return (
    <div className={`divide-y border-y ${dark ? "divide-panel border-panel" : "divide-mist border-mist"}`}>
      {QUESTIONS.map(([q, a]) => (
        <details key={q} className="group py-5">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-6 font-display text-lg font-bold">
            {q}
            <span aria-hidden="true" className="text-2xl font-normal text-gold transition-transform group-open:rotate-45">
              +
            </span>
          </summary>
          <p className={`mt-3 max-w-3xl ${dark ? "text-mist" : "text-muted"}`}>{a}</p>
        </details>
      ))}
    </div>
  );
}
