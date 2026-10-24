import { NextResponse } from "next/server";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { AGREEMENT_VERSION } from "@/lib/coaching";

/** POST /api/coaching/agreement — the founder accepts the current coaching agreement. */
export async function POST() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const { error } = await createAdminClient()
    .from("coaching_agreements")
    .upsert({ founder_id: user.id, version: AGREEMENT_VERSION }, { onConflict: "founder_id,version", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, version: AGREEMENT_VERSION });
}
