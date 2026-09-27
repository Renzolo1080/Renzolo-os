export default function HomePage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 text-center">
      <h1 className="text-3xl font-bold text-navy">
        RENZOLO<span className="text-gold"> OS</span>
      </h1>
      <p className="mt-3 max-w-xl text-ink-soft">
        Founder Readiness Assessment — know your Venture Score, your gaps, and
        your next 90 days, in one sitting.
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-4">
        <a href="/quiz" className="rounded bg-gold px-6 py-3 text-white font-semibold">
          Take the 60-Second Readiness Quiz
        </a>
        <a href="/snapshot" className="rounded bg-navy px-6 py-3 text-white font-semibold">
          Start Free Readiness Snapshot
        </a>
        <a href="/login" className="rounded border border-navy px-6 py-3 text-navy font-semibold">
          Log In
        </a>
      </div>
    </main>
  );
}
