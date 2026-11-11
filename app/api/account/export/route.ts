import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { EXPORT_BY_ASSESSMENT, EXPORT_BY_FOUNDER, PRIVACY_VERSION } from "@/lib/privacy";

/** "Download my data": every row the founder's own session can read, as one
 * JSON file. Runs with the founder's session, so row-level security limits
 * it to their own data. A table that fails is listed rather than stopping
 * the download. */
export async function GET() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  const out: Record<string, unknown> = {
    exported_at: new Date().toISOString(),
    privacy_policy_version: PRIVACY_VERSION,
    account: {
      id: user.id,
      email: user.email,
      created_at: user.created_at,
      details: user.user_metadata ?? {},
    },
  };
  const skipped: string[] = [];

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  out.profile = profile ?? null;

  for (const table of EXPORT_BY_FOUNDER) {
    const { data, error } = await supabase.from(table).select("*").eq("founder_id", user.id);
    if (error) skipped.push(table);
    else out[table] = data ?? [];
  }

  const assessmentIds = ((out.assessments as { id: string }[] | undefined) ?? []).map((a) => a.id);
  for (const table of EXPORT_BY_ASSESSMENT) {
    if (!assessmentIds.length) {
      out[table] = [];
      continue;
    }
    const { data, error } = await supabase.from(table).select("*").in("assessment_id", assessmentIds);
    if (error) skipped.push(table);
    else out[table] = data ?? [];
  }
  if (skipped.length) out.not_included = { tables: skipped, note: "Email us and we will send these by hand." };

  const date = new Date().toISOString().slice(0, 10);
  return new NextResponse(JSON.stringify(out, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="renzolo-my-data-${date}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
