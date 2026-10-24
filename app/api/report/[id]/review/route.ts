import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/report/[id]/review
 * Marks a Diagnostic Report as advisor-reviewed. Restricted to
 * advisor/admin roles — this is the human-in-the-loop gate the Phase 1
 * spec requires before an AI-drafted report reaches a paid-tier founder. */
export async function PATCH(req: NextRequest, { params: paramsPromise }: { params: Promise<{ id: string }> }) {
  const params = await paramsPromise;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "advisor" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Advisor or admin role required" }, { status: 403 });
  }

  const { error } = await supabase
    .from("reports")
    .update({ advisor_reviewed: true, advisor_id: user.id, reviewed_at: new Date().toISOString() })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
