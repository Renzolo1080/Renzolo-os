import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { loadAcademyViewer, loadProgress } from "@/lib/courses-server";
import { FORMAT_LABELS, STEP_LABELS, allLessons, findLesson, getCourse } from "@/lib/courses";
import { signedEmbedUrl } from "@/lib/course-video";
import { LessonPractice } from "@/components/academy/AcademyClient";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: Promise<{ course: string; lesson: string }> }): Promise<Metadata> {
  const p = await params;
  const c = getCourse(p.course);
  const l = c ? findLesson(c, p.lesson) : null;
  return { title: l ? `${l.title} | ${c!.title}` : "Lesson not found", robots: { index: false } };
}

/** One lesson: the video, what to make, and the VOLT practice. Buyers
 * see every lesson; anyone can watch a free-preview lesson. The video
 * link is signed per view and expires (lib/course-video.ts). */
export default async function LessonPage({ params }: { params: Promise<{ course: string; lesson: string }> }) {
  const p = await params;
  const course = getCourse(p.course);
  const lesson = course ? findLesson(course, p.lesson) : null;
  if (!course || !lesson) notFound();

  const db = await createClient();
  const v = await loadAcademyViewer(db);
  const owned = v.owned.includes(course.slug);
  if (!owned && !lesson.preview) redirect(`/academy/${course.slug}`);

  let videoUrl: string | null = null;
  if (process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const { data: media } = await createAdminClient()
      .from("course_lesson_media")
      .select("video_id")
      .eq("course_slug", course.slug)
      .eq("lesson_key", lesson.key)
      .maybeSingle();
    videoUrl = signedEmbedUrl(media?.video_id);
  }

  const lessons = allLessons(course);
  const progress = owned && v.userId ? await loadProgress(db, v.userId, course.slug) : [];
  const done = new Set(progress.filter((r) => r.completed_at).map((r) => r.lesson_key));
  const mine = progress.find((r) => r.lesson_key === lesson.key);
  const next = lessons[lesson.index + 1] ?? null;
  const prev = lessons[lesson.index - 1] ?? null;
  const pct = Math.round((done.size / lessons.length) * 100);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <div className="flex flex-wrap items-start gap-8">
        <nav aria-label="Course lessons" className="min-w-0 flex-[1_1_260px] rounded-3xl border border-line p-5">
          <a href={`/academy/${course.slug}`} className="font-semibold text-navy underline">
            {course.title}
          </a>
          {owned && (
            <div className="mt-3">
              <div role="progressbar" aria-valuenow={pct} aria-valuemin={0} aria-valuemax={100} aria-label="Course progress" className="h-2.5 overflow-hidden rounded-full bg-line">
                <div className="h-full rounded-full bg-navy" style={{ width: `${pct}%` }} />
              </div>
              <p className="mt-1.5 text-sm text-ink-soft">
                {done.size} of {lessons.length} lessons complete
              </p>
            </div>
          )}
          {course.modules.map((m) => (
            <div key={m.title}>
              <p className="mb-1 mt-4 text-sm font-semibold text-navy">{STEP_LABELS[m.step]}</p>
              <ul>
                {m.lessons.map((l) => {
                  const here = l.key === lesson.key;
                  const canOpen = owned || l.preview;
                  return (
                    <li key={l.key} aria-current={here ? "step" : undefined} className={`flex gap-2 py-1.5 text-sm ${here ? "font-semibold text-navy" : done.has(l.key) ? "text-ink-soft" : "text-navy"}`}>
                      <span aria-hidden="true" className="w-4 shrink-0 text-center">
                        {done.has(l.key) ? "✓" : here ? "•" : ""}
                      </span>
                      {canOpen && !here ? (
                        <a href={`/academy/${course.slug}/${l.key}`} className="hover:underline">
                          {l.title}
                        </a>
                      ) : (
                        <span>{l.title}</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="min-w-0 flex-[999_1_600px] space-y-5">
          {videoUrl ? (
            <div className="aspect-video overflow-hidden rounded-3xl bg-navy">
              <iframe
                src={videoUrl}
                title={`Lesson video: ${lesson.title}`}
                loading="lazy"
                allow="accelerometer; gyroscope; encrypted-media; picture-in-picture"
                allowFullScreen
                className="h-full w-full border-0"
              />
            </div>
          ) : (
            <div className="flex aspect-video items-center justify-center rounded-3xl bg-navy p-6 text-center text-[#c9d2dc]">Video coming soon. The written steps and worksheet below are ready now.</div>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="rounded-pill bg-surface px-3 py-1 text-xs font-semibold text-navy">{STEP_LABELS[lesson.module.step]}</span>
            <span className="rounded-pill bg-surface px-3 py-1 text-xs font-semibold text-navy">{FORMAT_LABELS[lesson.format]}</span>
            {lesson.preview && !owned && <span className="rounded-pill bg-[#fff3cc] px-3 py-1 text-xs font-semibold text-navy">Free preview</span>}
          </div>
          <h1 className="text-3xl leading-tight text-navy">
            Lesson {lesson.index + 1}: {lesson.title}
          </h1>
          {lesson.output && (
            <p className="text-ink-soft">
              <strong className="text-navy">You'll make:</strong> {lesson.output}
            </p>
          )}

          {owned ? (
            <LessonPractice
              course={course.slug}
              lesson={lesson.key}
              initialVolt={(mine?.volt ?? {}) as Record<string, string>}
              initialEnergy={mine?.energy ?? null}
              initiallyComplete={!!mine?.completed_at}
              nextHref={next ? `/academy/${course.slug}/${next.key}` : null}
            />
          ) : (
            <section className="space-y-3 rounded-panel bg-surface p-7">
              <h2 className="text-2xl text-navy">Like this lesson?</h2>
              <p className="text-ink-soft">Buy the course to unlock every lesson, the worksheets and your VOLT practice.</p>
              <a href={`/academy/${course.slug}`} className="btn-pop inline-flex min-h-[48px] items-center rounded-pill border-2 border-ink bg-brand px-6 font-semibold text-on-brand">
                See the course and price
              </a>
            </section>
          )}

          {owned && prev && (
            <a href={`/academy/${course.slug}/${prev.key}`} className="inline-block text-sm text-navy underline">
              ← Previous lesson
            </a>
          )}
        </div>
      </div>
    </main>
  );
}
