export const metadata = { title: "Unsubscribe · Founder Trajectory™" };

/** Asks for one click to confirm, so link-scanning email filters can't
 * unsubscribe someone by accident. */
export default function UnsubscribePage({ searchParams }: { searchParams: { e?: string; t?: string; done?: string } }) {
  const done = searchParams.done === "1";
  return (
    <main className="flex min-h-[60vh] items-center justify-center px-4 py-12">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow-sm">
        {done ? (
          <>
            <h1 className="text-2xl font-bold text-navy">You're unsubscribed</h1>
            <p className="mt-2 text-ink-soft">We won't send you any more tips or follow-up emails. Emails about your account and payments still arrive.</p>
          </>
        ) : (
          <>
            <h1 className="text-2xl font-bold text-navy">Stop follow-up emails?</h1>
            <p className="mt-2 text-ink-soft">{searchParams.e ? `For ${searchParams.e}.` : ""} You'll still receive emails about your account and payments.</p>
            <form method="post" action="/api/unsubscribe" className="mt-6">
              <input type="hidden" name="e" value={searchParams.e ?? ""} />
              <input type="hidden" name="t" value={searchParams.t ?? ""} />
              <button type="submit" className="w-full rounded-lg bg-navy px-5 py-3 font-semibold text-white">
                Unsubscribe
              </button>
            </form>
          </>
        )}
      </div>
    </main>
  );
}
