import type { SupabaseClient } from "@supabase/supabase-js";
import { headers } from "next/headers";
import { ipCountryFrom, regionFor, type Region } from "./region";
import { loadMembership } from "./membership-server";
import type { Tier } from "./pricing";
import type { CourseSlug } from "./courses";

/** What the Academy pages need to know about the visitor. Works signed
 * out (no tier, nothing owned). `db` is the visitor's own session, so
 * row-level security limits every read to their own rows. */
export async function loadAcademyViewer(db: SupabaseClient): Promise<{
  userId: string | null;
  tier: Tier | null;
  owned: CourseSlug[];
  region: Region;
}> {
  const {
    data: { user },
  } = await db.auth.getUser();
  const ip = ipCountryFrom(await headers());
  if (!user) return { userId: null, tier: null, owned: [], region: regionFor(null, ip) };
  const [{ data: profile }, m, { data: enrollments }] = await Promise.all([
    db.from("profiles").select("country").eq("id", user.id).maybeSingle(),
    loadMembership(db, user.id),
    db.from("course_enrollments").select("course_slug").eq("founder_id", user.id),
  ]);
  return {
    userId: user.id,
    tier: m.tier,
    owned: (enrollments ?? []).map((e: { course_slug: string }) => e.course_slug as CourseSlug),
    region: regionFor(profile?.country, ip),
  };
}

export interface LessonProgressRow {
  lesson_key: string;
  completed_at: string | null;
  volt: Record<string, string> | null;
  energy: number | null;
}

export async function loadProgress(db: SupabaseClient, founderId: string, course: CourseSlug): Promise<LessonProgressRow[]> {
  const { data } = await db
    .from("course_lesson_progress")
    .select("lesson_key, completed_at, volt, energy")
    .eq("founder_id", founderId)
    .eq("course_slug", course);
  return (data ?? []) as LessonProgressRow[];
}
