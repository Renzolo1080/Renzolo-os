import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/recommendations { assessmentId, title, detail?, blockKey?, reportId? }
 * Advisor/admin only — lets a human coach add their own recommendation
 * (source: 'advisor') alongside whatever the AI report already
 * extracted automatically (source: 'ai', see app/api/report/route.ts).
 * Both land in the same `recommendations` table so a founder sees one
 * combined list on /tools. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
  if (!profile || (profile.role !== "advisor" && profile.role !== "admin")) {
    return NextResponse.json({ error: "Advisor access required" }, { status: 403 });
  }

  const { assessmentId, title, detail, blockKey, reportId } = await req.json();
  if (!assessmentId || !title || !title.trim()) {
    return NextResponse.json({ error: "assessmentId and title are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("recommendations")
    .insert({
      assessment_id: assessmentId,
      report_id: reportId || null,
      source: "advisor",
      block_key: blockKey || null,
      title: title.trim(),
      detail: detail || null,
      advisor_id: user.id,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ recommendation: data });
}
