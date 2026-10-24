import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { parseAmount } from "@/lib/plan";
import { periodOf } from "@/lib/progress";

/** PUT /api/updates { period?, revenue?, customers?, cash?, wins?, challenges?, asks? }
 * The founder's monthly update: key numbers plus wins, challenges and
 * where they need help. One per month; saving again updates it. The
 * period defaults to this month and can be one of the last 12. */
export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  const m = await loadMembership(supabase, user.id);
  if (!entitlements(m.tier, m.purchases.length > 0).planBuilder) return NextResponse.json({ error: "Monthly updates are part of membership." }, { status: 402 });

  const b = (await req.json().catch(() => null)) as Record<string, unknown> | null;
  if (!b) return NextResponse.json({ error: "Missing update" }, { status: 400 });
  const thisMonth = periodOf(new Date());
  const yearAgo = periodOf(new Date(Date.now() - 365 * 864e5));
  const period = typeof b.period === "string" && /^\d{4}-\d{2}-01$/.test(b.period) && b.period <= thisMonth && b.period >= yearAgo ? b.period : thisMonth;
  const amount = (v: unknown) => (v === "" || v === null || v === undefined ? null : parseAmount(v));
  const revenue = amount(b.revenue);
  const customers = amount(b.customers);
  const cash = amount(b.cash);
  if ((revenue !== null && revenue < 0) || (customers !== null && (customers < 0 || !Number.isInteger(customers)))) {
    return NextResponse.json({ error: "Revenue and customers can't be negative, and customers must be a whole number." }, { status: 400 });
  }
  const text = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) || null : null);
  const row = {
    founder_id: user.id,
    period,
    revenue,
    customers,
    cash,
    wins: text(b.wins, 1500),
    challenges: text(b.challenges, 1500),
    asks: text(b.asks, 1000),
    updated_at: new Date().toISOString(),
  };
  if ([revenue, customers, cash, row.wins, row.challenges, row.asks].every((v) => v === null)) return NextResponse.json({ error: "Add at least one number or note." }, { status: 400 });
  const { error } = await supabase.from("founder_updates").upsert(row, { onConflict: "founder_id,period" });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true, period });
}
