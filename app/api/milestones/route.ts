import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /api/milestones { assessmentId, blockKey?, title, targetDate? }
 * Creates one milestone under a founder's own assessment. RLS
 * ("milestones: via assessment ownership") scopes this to assessments
 * the caller actually owns, so a mismatched assessmentId simply fails
 * to insert rather than needing a manual ownership check here. */
export async function POST(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { assessmentId, blockKey, title, targetDate } = await req.json();
  if (!assessmentId || !title || !title.trim()) {
    return NextResponse.json({ error: "assessmentId and title are required" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("milestones")
    .insert({
      assessment_id: assessmentId,
      block_key: blockKey || null,
      title: title.trim(),
      target_date: targetDate || null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ milestone: data });
}
