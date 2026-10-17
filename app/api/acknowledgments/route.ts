import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MATCHING_STATEMENT_KEY, MATCHING_STATEMENT_VERSION } from "@/lib/matching-statement";

/** Records a logged-in founder's acknowledgment of the current Matching
 * Statement. The version must be the current one, so a page left open
 * through a statement change can't acknowledge the old text. */
export async function POST(request: Request) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  let body: unknown = null;
  try {
    body = await request.json();
  } catch {
    // handled below
  }
  const version = (body as { version?: unknown } | null)?.version;
  if (version !== MATCHING_STATEMENT_VERSION) {
    return NextResponse.json(
      { error: "The Matching Statement has been updated. Reload the page to read the current version." },
      { status: 409 }
    );
  }

  const { error } = await supabase.from("acknowledgments").insert({
    founder_id: user.id,
    statement: MATCHING_STATEMENT_KEY,
    version: MATCHING_STATEMENT_VERSION,
    source: "login",
    user_agent: (request.headers.get("user-agent") ?? "").slice(0, 400) || null,
  });
  if (error && error.code !== "23505") {
    console.error("Couldn't save acknowledgment:", error.message);
    return NextResponse.json({ error: "Couldn't save your acknowledgment. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
