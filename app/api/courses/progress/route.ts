import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { findLesson, getCourse, sanitizeEnergy, sanitizeVolt } from "@/lib/courses";

/** POST /api/courses/progress
 * Body: { course, lesson, complete?: boolean, volt?: {vision, opportunity, lever, thrust}, energy?: 1-10 }
 * Saves a founder's lesson progress and VOLT card. Runs as the founder:
 * the database only accepts it for a course they have bought. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in." }, { status: 401 });

  const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  const course = getCourse(body?.course);
  const lesson = course ? findLesson(course, body?.lesson) : null;
  if (!course || !lesson) return NextResponse.json({ error: "Lesson not found." }, { status: 404 });

  const { data: existing } = await supabase
    .from("course_lesson_progress")
    .select("completed_at, volt, energy")
    .eq("founder_id", user.id)
    .eq("course_slug", course.slug)
    .eq("lesson_key", lesson.key)
    .maybeSingle();

  const now = new Date().toISOString();
  const row = {
    founder_id: user.id,
    course_slug: course.slug,
    lesson_key: lesson.key,
    completed_at: body?.complete === true ? existing?.completed_at ?? now : existing?.completed_at ?? null,
    volt: body && "volt" in body ? sanitizeVolt(body.volt) : existing?.volt ?? {},
    energy: body && "energy" in body ? sanitizeEnergy(body.energy) : existing?.energy ?? null,
    updated_at: now,
  };
  const { error } = await supabase.from("course_lesson_progress").upsert(row, { onConflict: "founder_id,course_slug,lesson_key" });
  if (error) return NextResponse.json({ error: "Only founders who have bought this course can save progress." }, { status: 403 });
  return NextResponse.json({ ok: true, completed: !!row.completed_at });
}
