import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { COURSES, FORMAT_LABELS, allLessons } from "@/lib/courses";
import { formatPrice } from "@/lib/pricing";
import { videoConfigured } from "@/lib/course-video";
import { LessonVideoForm } from "@/components/academy/AcademyClient";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Academy admin | RENZOLO OS™", robots: { index: false } };

/** Admin only: buyers, revenue and completion per course, and the video
 * for each lesson. Videos are uploaded in Bunny Stream; paste each video's
 * ID here. */
export default async function AcademyAdminPage() {
  const db = await createClient();
  const {
    data: { user },
  } = await db.auth.getUser();
  if (!user) redirect("/login?next=/academy/admin");
  const { data: profile } = await db.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") redirect("/academy");

  const admin = createAdminClient();
  const [{ data: enrollments }, { data: payments }, { data: media }, { data: progress }] = await Promise.all([
    admin.from("course_enrollments").select("course_slug, founder_id"),
    admin.from("payments").select("course_slug, amount, currency").eq("product", "course").eq("status", "successful"),
    admin.from("course_lesson_media").select("course_slug, lesson_key, video_id"),
    admin.from("course_lesson_progress").select("course_slug, founder_id, lesson_key, completed_at").not("completed_at", "is", null),
  ]);
  const revenue = (payments ?? []).reduce((s: number, p: any) => s + (p.currency === "USD" ? Number(p.amount) : 0), 0);

  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-8">
      <p className="text-xs font-bold uppercase tracking-[0.12em] text-brand-text">Admin</p>
      <h1 className="mt-1 text-4xl text-navy">Academy courses</h1>
      <p className="mt-2 text-ink-soft">
        Course sales to date: <strong className="text-navy">{formatPrice({ amount: Math.round(revenue * 100) / 100, currency: "USD" })}</strong> from {(payments ?? []).length} payments.
      </p>
      {!videoConfigured() && (
        <p role="status" className="mt-4 rounded-xl border border-gold bg-[#fff8e1] px-4 py-3 text-navy">
          Video hosting isn't connected yet. Add BUNNY_STREAM_LIBRARY_ID and BUNNY_STREAM_TOKEN_KEY in Vercel, then lessons with a video ID will play.
        </p>
      )}

      <div className="mt-6 overflow-x-auto rounded-3xl border border-line">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="text-sm text-ink-soft">
              {["Course", "Buyers", "Videos added", "Finished the course"].map((h) => (
                <th key={h} className="border-b border-line px-4 py-3 font-semibold">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COURSES.map((c) => {
              const n = allLessons(c).length;
              const buyers = new Set((enrollments ?? []).filter((e: any) => e.course_slug === c.slug).map((e: any) => e.founder_id));
              const vids = (media ?? []).filter((m: any) => m.course_slug === c.slug).length;
              const perFounder = new Map<string, number>();
              for (const p of (progress ?? []) as any[]) if (p.course_slug === c.slug) perFounder.set(p.founder_id, (perFounder.get(p.founder_id) ?? 0) + 1);
              const finished = [...perFounder.values()].filter((k) => k >= n).length;
              return (
                <tr key={c.slug}>
                  <td className="border-b border-line px-4 py-3 font-semibold text-navy">{c.title}</td>
                  <td className="border-b border-line px-4 py-3">{buyers.size}</td>
                  <td className="border-b border-line px-4 py-3">
                    {vids} / {n}
                  </td>
                  <td className="border-b border-line px-4 py-3">{finished}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {COURSES.map((c) => (
        <details key={c.slug} className="mt-6 rounded-3xl border border-line px-6 py-4">
          <summary className="cursor-pointer text-xl font-semibold text-navy">{c.title}: lesson videos</summary>
          <ul className="mt-3">
            {allLessons(c).map((l) => (
              <li key={l.key} className="flex flex-wrap items-center justify-between gap-3 border-t border-line py-3">
                <span className="text-sm text-navy">
                  {l.index + 1}. {l.title} <span className="text-ink-soft">· {FORMAT_LABELS[l.format]}</span>
                </span>
                <LessonVideoForm course={c.slug} lesson={l.key} current={(media ?? []).find((m: any) => m.course_slug === c.slug && m.lesson_key === l.key)?.video_id ?? null} />
              </li>
            ))}
          </ul>
        </details>
      ))}
    </main>
  );
}
