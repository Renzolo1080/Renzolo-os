import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/** POST /api/membership/waitlist — joins the Elevate waitlist (seats are
 * limited by coaching hours; see ELEVATE_SEAT_LIMIT). */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { error } = await createAdminClient().from("elevate_waitlist").upsert({ founder_id: user.id }, { onConflict: "founder_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: "Could not add you to the waitlist. Please try again." }, { status: 500 });
  return NextResponse.json({ ok: true });
}
