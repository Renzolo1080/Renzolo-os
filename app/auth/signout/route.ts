import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/** POST /auth/signout — ends the session and returns to the home page. */
export async function POST(req: NextRequest) {
  await createClient().auth.signOut();
  return NextResponse.redirect(new URL("/", req.url), { status: 303 });
}
