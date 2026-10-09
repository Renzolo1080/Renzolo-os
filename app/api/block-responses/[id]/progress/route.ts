import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_STATUSES = ["not_started", "on_track", "at_risk", "behind", "done"];

/** PATCH /api/block-responses/[id]/progress { progressStatus, progressNote? }
 * Lets a founder update their own self-reported progress against the
 * goal/target they set for one BMC block. RLS ("block_responses: via
 * assessment ownership") already scopes this to the founder's own rows
 * (or staff), so the only thing this route adds is input validation and
 * a server-set progress_updated_at timestamp. */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { progressStatus, progressNote } = await req.json();
  if (!VALID_STATUSES.includes(progressStatus)) {
    return NextResponse.json({ error: `progressStatus must be one of: ${VALID_STATUSES.join(", ")}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("block_responses")
    .update({
      progress_status: progressStatus,
      progress_note: progressNote ?? null,
      progress_updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Not found or not yours" }, { status: 404 });

  return NextResponse.json({ blockResponse: data });
}
