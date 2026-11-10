import { LoanReadinessCheck } from "@/components/LoanReadinessCheck";
import { BreakevenCalculator } from "@/components/FinancialCalculators";

export const metadata = {
  title: "Free tools: loan readiness check · Founder Trajectory™",
  description: "Check whether your business is ready to apply for a loan, and what to fix first. Free, no sign-up, nothing saved.",
};

const SNAPSHOT = "/snapshot?utm_source=free_tools&utm_medium=tool&utm_campaign=loan_check";

/** Public free tools: no login, nothing saved. Each ends with the free
 * Readiness Snapshot. */
export default function FreeToolsPage() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">Free tools</p>
      <h1 className="mt-1 text-3xl font-bold text-navy">Are you ready to apply for a loan?</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Lenders look at whether you can repay, how long you've traded and whether your records are in order. Check all three in two minutes, and see what to fix first.
      </p>
      <div className="mt-8">
        <LoanReadinessCheck snapshotHref={SNAPSHOT} />
      </div>

      <h2 className="mt-14 text-2xl font-bold text-navy">How many sales do you need to break even?</h2>
      <p className="mt-2 max-w-2xl text-ink-soft">The number every lender and buyer expects you to know.</p>
      <div className="mt-6 max-w-xl rounded-2xl bg-white p-2 shadow-sm">
        <BreakevenCalculator />
      </div>

      <p className="mt-12 max-w-3xl text-xs leading-5 text-ink-soft">
        <b>Guidance only.</b> These tools give a general indication based on what lenders commonly check. They are not a credit decision or financial advice, and each lender
        sets its own criteria. Speak to a qualified adviser before taking on debt.
      </p>
    </main>
  );
}
