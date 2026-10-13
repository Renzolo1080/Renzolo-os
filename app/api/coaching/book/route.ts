import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";

/** POST /api/coaching/book — uses one of the founder's coaching credits
 * (bought, or included in Growth/Elevate) to request a one-on-one
 * session. The session goes into the advisor queue; the time is arranged
 * by the RENZOLO team by email for now. */
export async function POST() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { data, error } = await createAdminClient().rpc("use_coaching_credit", { p_founder: user.id });
  if (error) return NextResponse.json({ error: "Could not book right now. Please try again." }, { status: 500 });
  if (!data) return NextResponse.json({ error: "You have no coaching sessions available to book." }, { status: 409 });
  return NextResponse.json({ sessionId: data });
}
