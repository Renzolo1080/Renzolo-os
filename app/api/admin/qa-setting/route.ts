import { NextRequest, NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/** GET/PATCH /api/admin/qa-setting
 * Admin-only. Lets an admin flip whether every new AI report is queued
 * for mandatory human QA review (see app_settings.qa_review_enabled).
 * This is a live, no-redeploy toggle for a pilot/testing phase — turn it
 * off once report volume makes 100% human review infeasible. It never
 * gates what the founder receives (that's always instant); it only
 * controls whether a human is asked to read the report afterward. A
 * Low-confidence report is queued for review regardless of this
 * setting (see app/api/report/route.ts). */

async function requireAdmin() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: NextResponse.json({ error: "Not authenticated" }, { status: 401 }) };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || profile.role !== "admin") {
    return { error: NextResponse.json({ error: "Admin access required" }, { status: 403 }) };
  }
  return { userId: user.id };
}

export async function GET() {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const admin = createAdminClient();
  const { data, error } = await admin.from("app_settings").select("qa_review_enabled").eq("id", true).single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ qaReviewEnabled: data.qa_review_enabled });
}

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if (auth.error) return auth.error;

  const { qaReviewEnabled } = await req.json();
  if (typeof qaReviewEnabled !== "boolean") {
    return NextResponse.json({ error: "qaReviewEnabled must be a boolean" }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from("app_settings")
    .update({ qa_review_enabled: qaReviewEnabled, updated_at: new Date().toISOString(), updated_by: auth.userId })
    .eq("id", true);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ qaReviewEnabled });
}
