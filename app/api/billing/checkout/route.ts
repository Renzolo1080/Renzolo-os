import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { initiateCheckout } from "@/lib/flutterwave";

const PRICING = {
  monthly: { amount: 9, currency: "USD" },
  annual: { amount: 90, currency: "USD" },
} as const;

/** POST /api/billing/checkout { interval: "monthly" | "annual" }
 * Pricing shown here is a placeholder — the Phase 1 spec explicitly
 * leaves final price points pending workflow validation; do not treat
 * $9/$90 as approved. Update PRICING once real numbers are set. */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  const { interval } = (await req.json()) as { interval: "monthly" | "annual" };
  const plan = PRICING[interval];
  if (!plan) return NextResponse.json({ error: "Invalid interval" }, { status: 400 });

  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();

  const result = await initiateCheckout({
    founderId: user.id,
    email: user.email!,
    name: profile?.full_name ?? user.email!,
    interval,
    amount: plan.amount,
    currency: plan.currency,
    redirectUrl: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard?billing=success`,
  });

  return NextResponse.json(result);
}
