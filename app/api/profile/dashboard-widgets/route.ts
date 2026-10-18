import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { MAX_EXTRAS, MIN_EXTRAS, setFor, validExtras } from "@/lib/dashboard";

/** PATCH /api/profile/dashboard-widgets { extras: string[] }
 * Saves the 3 to 5 extra views a founder has added to the standard
 * dashboard, in their chosen order. RLS ("profiles: self update") scopes
 * this to the caller's own row; the column grant limits what can change. */
export async function PATCH(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const body = (await req.json().catch(() => null)) as { extras?: unknown } | null;
  const extras = validExtras(body?.extras);
  if (!extras) return NextResponse.json({ error: `Choose between ${MIN_EXTRAS} and ${MAX_EXTRAS} different views.` }, { status: 400 });

  const { data, error } = await supabase
    .from("profiles")
    .update({ dashboard_widgets: extras, dashboard_view: setFor(extras) })
    .eq("id", user.id)
    .select("dashboard_widgets, dashboard_view")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ extras: data.dashboard_widgets, set: data.dashboard_view });
}
