import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { loadAcademyViewer } from "@/lib/courses-server";
import { reconcilePendingPayments } from "@/lib/payments";
import { createPaymentStore } from "@/lib/payments-store";
import { verifyTransaction, verifyTransactionByReference } from "@/lib/flutterwave";
import { COURSES, allLessons, courseQuote } from "@/lib/courses";
import { formatPrice } from "@/lib/pricing";
import { PaymentBanner } from "@/components/PaymentBanner";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "My courses | RENZOLO OS™" };

/** The founder's courses: progress, the next lesson, and courses still to buy. */
export default async function MyCoursesPage({ searchParams }: { searchParams: Promise<{ payment?: string; product?: string }> }) {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login?next=/academy/mine");

  // Same safety net as the dashboard: finish any payment that went
  // through but hasn't been applied yet.
  if (process.env.FLUTTERWAVE_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await reconcilePendingPayments(user.id, {
      store: createPaymentStore(createAdminClient()),
      verify: (id) => verifyTransaction(id),
      verifyByReference: (ref) => verifyTransactionByReference(ref),
    });
  }

  const v = await loadAcademyViewer(db);
  const sp = await searchParams;
  // An address-bar "success" counts only once the course is really there.
  const payment = sp.payment === "success" && v.owned.length === 0 ? "pending" : sp.payment;

  const { data: rows } = await db.from("course_lesson_progress").select("course_slug, lesson_key, completed_at").eq("founder_id", user.id);
  const mine = COURSES.filter((c) => v.owned.includes(c.slug));
  const others = COURSES.filter((c) => !v.owned.includes(c.slug));

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <PaymentBanner payment={payment} product={sp.product} />
      <h1 className="text-4xl text-navy">My courses</h1>

      {mine.length === 0 && (
        <p className="mt-4 text-ink-soft">
          You haven't bought a course yet.{" "}
          <a href="/academy" className="font-semibold text-navy underline">
            Browse the Academy
          </a>
          .
        </p>
      )}

      <div className="mt-6 space-y-5">
        {mine.map((c) => {
          const lessons = allLessons(c);
          const done = new Set((rows ?? []).filter((r: any) => r.course_slug === c.slug && r.completed_at).map((r: any) => r.lesson_key));
          const next = lessons.find((l) => !done.has(l.key));
          const pct = Math.round((done.size / lessons.length) * 100);
          return (
            <article key={c.slug} className="space-y-3 rounded-panel border border-line p-7">
              <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-text">{next ? (done.size ? "In progress" : "Not started") : "Complete"}</p>
              <h2 className="text-3xl text-navy">{c.title}</h2>
              {next && (
                <p className="text-ink-soft">
                  Next up: Lesson {next.index + 1} · {next.title}
                </p>
              )}
              <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label={`${c.title} progress`} className="h-2.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-navy" style={{ width: `${pct}%` }} />
              </div>
              <p className="text-sm text-ink-soft">
                {done.size} of {lessons.length} lessons complete
              </p>
              <a
                href={`/academy/${c.slug}/${(next ?? lessons[0]).key}`}
                className="btn-pop inline-flex min-h-[48px] items-center rounded-pill border-2 border-ink bg-brand px-6 font-semibold text-on-brand"
              >
                {next ? (done.size ? `Continue lesson ${next.index + 1}` : "Start lesson 1") : "Review the course"}
              </a>
              {!next && (
                <p className="text-sm text-navy">
                  Course complete. <a href="/dashboard" className="underline">Re-score your readiness on your dashboard</a>.
                </p>
              )}
            </article>
          );
        })}
      </div>

      {others.length > 0 && (
        <>
          <h2 className="mt-12 text-2xl text-navy">Add another course</h2>
          <div className="mt-4 grid gap-5 md:grid-cols-3">
            {others.map((c) => (
              <article key={c.slug} className="space-y-2 rounded-3xl border border-line p-6">
                <h3 className="text-xl text-navy">{c.title}</h3>
                <p className="text-sm text-ink-soft">
                  {v.tier ? "Your member price" : "Price"} {formatPrice(courseQuote(c.slug, v.tier, v.region).charge)}
                </p>
                <a href={`/academy/${c.slug}`} className="inline-flex min-h-[44px] items-center rounded-pill border border-navy px-5 font-semibold text-navy">
                  View course
                </a>
              </article>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
