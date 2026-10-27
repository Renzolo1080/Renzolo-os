import { QUICK_QUESTIONS } from "@/lib/quickcheck";

/** A country page (/ke, /za): local wording, the same free Snapshot with
 * the country already filled in, and tracking tags so posts aimed at that
 * country can be measured. */
export function CountryLanding({
  code,
  country,
  headline,
  intro,
  goals,
  payNote,
}: {
  code: string;
  country: string;
  headline: string;
  intro: string;
  goals: string[];
  payNote: string;
}) {
  const href = `/snapshot?country=${encodeURIComponent(country)}&utm_source=site&utm_medium=country_page&utm_campaign=${code}`;
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-12 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Founder Trajectory™ · {country}</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-bold leading-tight sm:text-5xl">{headline}</h1>
          <p className="mt-5 max-w-2xl text-lg text-cream/85">{intro}</p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
            <a href={href} className="rounded-lg bg-brand px-7 py-4 text-center text-lg font-semibold text-on-brand">
              Start your free Readiness Snapshot
            </a>
            <span className="text-sm text-cream/70">5 minutes or less · no account needed</span>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <h2 className="text-2xl font-bold text-navy">Built for where you want to go</h2>
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {goals.map((g) => (
            <div key={g} className="rounded-2xl bg-white p-5 text-sm shadow-sm">
              <span className="font-bold text-teal-text">✓</span> {g}
            </div>
          ))}
        </div>
        <div className="mt-10 grid gap-8 md:grid-cols-2">
          <div>
            <h2 className="text-xl font-bold text-navy">What the Snapshot checks</h2>
            <p className="mt-2 text-sm text-ink-soft">Your strategic plan, and all nine building blocks of your business model:</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {QUICK_QUESTIONS.map((q) => (
                <span key={q.key} className="rounded-full bg-white px-3 py-1.5 text-sm text-navy shadow-sm">
                  {q.area}
                </span>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-gold/50 bg-white p-6 text-sm">
            <p className="font-semibold text-navy">Membership and payment</p>
            <p className="mt-2 text-ink-soft">{payNote}</p>
            <a href="/pricing" className="mt-4 inline-block font-semibold text-teal underline">
              See membership options
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
