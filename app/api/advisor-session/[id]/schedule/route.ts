import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** PATCH /api/advisor-session/[id]/schedule
 * Marks a paid 1:1 session as scheduled. The actual time is coordinated
 * manually (email/call) for launch — Keep Manual, same as advisor
 * report review — this just records that it happened and who owns it. */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "advisor" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Advisor or admin role required" }, { status: 403 });
  }

  const { error } = await supabase
    .from("advisor_sessions")
    .update({ status: "scheduled", advisor_id: user.id, scheduled_at: new Date().toISOString() })
    .eq("id", params.id)
    // Unpaid sessions can't be scheduled (see paid_at in supabase/schema.sql).
    .not("paid_at", "is", null);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
