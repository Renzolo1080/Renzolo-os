import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { findLesson, getCourse } from "@/lib/courses";
import { isVideoId } from "@/lib/course-video";

/** POST /api/admin/course-media — admin only.
 * Body: { course, lesson, videoId } sets the Bunny Stream video for a
 * lesson; videoId "" removes it. Video IDs are kept server-side only. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (profile?.role !== "admin") return NextResponse.json({ error: "Admin access required" }, { status: 403 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const course = getCourse(body?.course);
  const lesson = course ? findLesson(course, body?.lesson) : null;
  if (!course || !lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const admin = createAdminClient();
  const raw = typeof body?.videoId === "string" ? body.videoId.trim() : "";
  if (raw === "") {
    await admin.from("course_lesson_media").delete().eq("course_slug", course.slug).eq("lesson_key", lesson.key);
    return NextResponse.json({ ok: true, removed: true });
  }
  if (!isVideoId(raw)) return NextResponse.json({ error: "That isn't a Bunny Stream video ID (it looks like 8-4-4-4-12 letters and numbers)." }, { status: 400 });
  const { error } = await admin
    .from("course_lesson_media")
    .upsert({ course_slug: course.slug, lesson_key: lesson.key, video_id: raw.toLowerCase(), updated_at: new Date().toISOString(), updated_by: user.id }, { onConflict: "course_slug,lesson_key" });
  if (error) return NextResponse.json({ error: "Could not save the video." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
