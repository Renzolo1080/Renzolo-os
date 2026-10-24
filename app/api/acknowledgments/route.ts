import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { ACK_SOURCES, MATCHING_STATEMENT_VERSION, type AckSource } from "@/lib/matching-statement";
import { recordMatchingAcknowledgment } from "@/lib/acknowledgment-server";

/** Records a logged-in founder's acknowledgment of the current Matching
 * Statement, from the login step or the Matching add-on checkout. The
 * version must be the current one, so a page left open through a statement
 * change can't acknowledge the old text. */
export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please log in again." }, { status: 401 });

  let body: { version?: unknown; source?: unknown } | null = null;
  try {
    body = await request.json();
  } catch {
    // handled below
  }
  if (body?.version !== MATCHING_STATEMENT_VERSION) {
    return NextResponse.json(
      { error: "The Matching Statement has been updated. Reload the page to read the current version." },
      { status: 409 }
    );
  }
  const source: AckSource = ACK_SOURCES.includes(body.source as AckSource) ? (body.source as AckSource) : "login";

  const result = await recordMatchingAcknowledgment(supabase, user.id, source, request.headers.get("user-agent"));
  if (!result.ok) {
    console.error("Couldn't save acknowledgment:", result.message);
    return NextResponse.json({ error: "Couldn't save your acknowledgment. Please try again." }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
