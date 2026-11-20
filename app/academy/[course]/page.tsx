import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadAcademyViewer, loadProgress } from "@/lib/courses-server";
import { FORMAT_LABELS, allLessons, courseQuote, getCourse, lessonCount, memberDiscountPercent, courseSalesEnabled } from "@/lib/courses";
import { formatPrice } from "@/lib/pricing";
import { BuyCourseButton } from "@/components/academy/AcademyClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ course: string }> }): Promise<Metadata> {
  const c = getCourse((await params).course);
  return { title: c ? `${c.title} course | Founder Trajectory™ Academy` : "Course not found" };
}

const Check = () => (
  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-1 shrink-0">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

/** One course: outcome, outline and the buy card (or "continue" for owners). */
export default async function CoursePage({ params }: { params: Promise<{ course: string }> }) {
  const course = getCourse((await params).course);
  if (!course) notFound();
  const db = await createClient();
  const v = await loadAcademyViewer(db);
  const owned = v.owned.includes(course.slug);
  const q = courseQuote(course.slug, v.tier, v.region);
  const memberQ = courseQuote(course.slug, "growth", v.region);
  const progress = owned && v.userId ? await loadProgress(db, v.userId, course.slug) : [];
  const done = new Set(progress.filter((p) => p.completed_at).map((p) => p.lesson_key));
  const lessons = allLessons(course);
  const next = lessons.find((l) => !done.has(l.key)) ?? lessons[0];
  const pct = memberDiscountPercent();
  const sales = courseSalesEnabled();

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-soft">
        <a href="/academy" className="underline">
          Academy
        </a>{" "}
        <span aria-hidden="true">/</span> {course.title}
      </nav>
      <div className="mt-5 flex flex-wrap items-start gap-10">
        <div className="min-w-0 flex-[999_1_560px] space-y-8">
          <div className="space-y-3">
            <h1 className="text-4xl leading-tight text-navy sm:text-5xl">{course.title}</h1>
            <p className="text-lg text-ink-soft sm:text-xl">{course.outcome}</p>
            <p className="text-sm text-ink-soft">
              {lessonCount(course)} lessons · {course.hours} of video · self-paced over {course.weeks}
            </p>
          </div>
          <section className="space-y-3">
            <h2 className="text-2xl text-navy">What you'll leave with</h2>
            <ul className="space-y-2.5">
              {course.leaveWith.map((t) => (
                <li key={t} className="flex gap-2.5 text-navy">
                  <Check />
                  <span>{t}</span>
                </li>
              ))}
            </ul>
          </section>
          <section className="space-y-3">
            <h2 className="text-2xl text-navy">Course outline</h2>
            <p className="text-ink-soft">Each module follows Evaluate. Evolve. Execute. Elevate. and ends with a 5-minute VOLT practice.</p>
            {course.modules.map((m, i) => (
              <details key={m.title} open={i < 2} className="rounded-2xl border border-line bg-white px-5 py-4">
                <summary className="cursor-pointer text-lg font-semibold text-navy">
                  {i}. {m.title} <span className="text-sm font-normal text-ink-soft">· {m.lessons.length} lessons</span>
                </summary>
                <ul className="mt-3">
                  {m.lessons.map((l) => {
                    const canOpen = owned || l.preview;
                    return (
                      <li key={l.key} className="flex flex-wrap items-center justify-between gap-2 border-t border-line py-3">
                        <span className="flex items-center gap-2">
                          {done.has(l.key) && <span className="sr-only">Completed: </span>}
                          {done.has(l.key) && <Check />}
                          {canOpen ? (
                            <a href={`/academy/${course.slug}/${l.key}`} className="underline">
                              {Number(l.key.slice(1))}. {l.title}
                            </a>
                          ) : (
                            <span>
                              {Number(l.key.slice(1))}. {l.title}
                            </span>
                          )}
                        </span>
                        <span className="flex gap-2">
                          <span className="rounded-pill bg-surface px-3 py-1 text-xs font-semibold text-navy">{FORMAT_LABELS[l.format]}</span>
                          {l.preview && !owned && <span className="rounded-pill bg-[#fff3cc] px-3 py-1 text-xs font-semibold text-navy">Free preview</span>}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </details>
            ))}
          </section>
        </div>

        <aside aria-label={owned ? "Your course" : sales ? "Buy this course" : "Enrolment"} className="min-w-0 flex-[1_1_320px] space-y-4 rounded-panel border border-line bg-white p-7">
          {owned ? (
            <>
              <p className="text-xl font-semibold text-navy">You own this course.</p>
              <p className="text-ink-soft">
                {done.size} of {lessons.length} lessons complete.
              </p>
              <a href={`/academy/${course.slug}/${next.key}`} className="btn-pop inline-flex min-h-[48px] w-full items-center justify-center rounded-pill border-2 border-ink bg-brand px-6 font-semibold text-on-brand">
                {done.size ? `Continue lesson ${Number(next.key.slice(1))}` : "Start lesson 1"}
              </a>
            </>
          ) : !sales ? (
            <>
              <p className="text-xl font-semibold text-navy">Enrolment opens soon.</p>
              <p className="text-ink-soft">Watch the free preview lesson now. We will share course access details when enrolment opens.</p>
              <a href={`/academy/${course.slug}/l01`} className="btn-pop inline-flex min-h-[48px] w-full items-center justify-center rounded-pill border-2 border-ink bg-brand px-6 font-semibold text-on-brand">
                Watch the free preview
              </a>
            </>
          ) : (
            <>
              <p className="flex items-baseline gap-3">
                <span className="text-4xl font-bold text-navy">{formatPrice(q.charge)}</span>
                <span className="text-sm text-ink-soft">one-time, US dollars</span>
              </p>
              {v.tier ? (
                <p className="rounded-xl bg-[#fff8e1] px-4 py-3">
                  <strong>Your member price.</strong> You save {formatPrice({ amount: q.discount, currency: q.list.currency })} ({pct}% off {formatPrice(q.list)}).
                </p>
              ) : (
                <p className="rounded-xl bg-[#fff8e1] px-4 py-3">Members pay {formatPrice(memberQ.charge)}.</p>
              )}
              <BuyCourseButton course={course.slug} label={v.userId ? "Buy course" : "Log in to buy"} signedIn={!!v.userId} returnTo={`/academy/${course.slug}`} full />
              <a href={`/academy/${course.slug}/l01`} className="inline-flex min-h-[48px] w-full items-center justify-center rounded-pill border border-navy px-6 font-semibold text-navy">
                Watch the free preview
              </a>
              <ul className="space-y-2 pt-1 text-sm text-navy">
                {["Video lessons with captions", "Worksheets and templates", "A VOLT practice after every module", "Re-score in RENZOLO OS™ at the end", "Lifetime access, including updates"].map((t) => (
                  <li key={t} className="flex gap-2">
                    <Check />
                    <span>{t}</span>
                  </li>
                ))}
              </ul>
              <p className="text-sm text-ink-soft">
                Not included in any membership. See our <a href="/refunds" className="underline">refund policy</a>.
              </p>
            </>
          )}
        </aside>
      </div>
    </main>
  );
}
