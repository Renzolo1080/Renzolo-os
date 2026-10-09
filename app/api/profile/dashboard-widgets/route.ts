import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const VALID_WIDGETS = ["reminders", "valuation", "goalsProgress", "progressOverview"];

/** PATCH /api/profile/dashboard-widgets { widgets: string[] }
 * Lets a founder choose which OPTIONAL widgets appear on their own
 * dashboard, beyond the standard view (Venture Score, sub-scores,
 * Health Index, report/subscribe, and Founder Tools, which are always
 * shown to everyone). RLS ("profiles: self update") already scopes
 * this to the caller's own row. */
export async function PATCH(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { widgets } = await req.json();
  if (!Array.isArray(widgets) || widgets.some((w) => !VALID_WIDGETS.includes(w))) {
    return NextResponse.json({ error: `widgets must be a subset of: ${VALID_WIDGETS.join(", ")}` }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ dashboard_widgets: widgets })
    .eq("id", user.id)
    .select("dashboard_widgets")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ dashboardWidgets: data.dashboard_widgets });
}
