import type { SupabaseClient } from "@supabase/supabase-js";
import { effectiveTier, type CurrentMembership, type SubscriptionRow } from "./membership";
import { isBillingInterval, type Tier } from "./pricing";

/** Reads what the pages and checkout need to know about a founder's
 * membership. `db` is the founder's own session (row-level security limits
 * every read to their own rows). */
export async function loadMembership(db: SupabaseClient, founderId: string, now: Date = new Date()) {
  const [{ data: sub }, { data: lastPay }, { data: purchases }, { data: credits }] = await Promise.all([
    db
      .from("subscriptions")
      .select("status, current_period_end, auto_renew, tier, scheduled_tier, scheduled_from, billing_interval")
      .eq("founder_id", founderId)
      .maybeSingle(),
    db
      .from("payments")
      .select("amount, currency, billing_interval, fulfilled_at")
      .eq("founder_id", founderId)
      .eq("product", "subscription")
      .eq("status", "successful")
      .order("fulfilled_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    db.from("assessment_purchases").select("id, purchased_at").eq("founder_id", founderId).order("purchased_at", { ascending: false }),
    db.from("coaching_credits").select("quantity, used, available_from, expires_at, source").eq("founder_id", founderId),
  ]);

  const subscription = (sub as SubscriptionRow | null) ?? null;
  const tier: Tier | null = effectiveTier(subscription, now);
  const current: CurrentMembership = {
    sub: subscription,
    lastPayment:
      lastPay && isBillingInterval(lastPay.billing_interval)
        ? { amount: Number(lastPay.amount), currency: String(lastPay.currency), interval: lastPay.billing_interval }
        : null,
  };
  const t = now.getTime();
  const coachingAvailable = (credits ?? [])
    .filter((c: any) => new Date(c.available_from).getTime() <= t && new Date(c.expires_at).getTime() > t)
    .reduce((n: number, c: any) => n + Math.max(0, c.quantity - c.used), 0);
  const nextCoaching = (credits ?? [])
    .filter((c: any) => new Date(c.available_from).getTime() > t && c.used < c.quantity)
    .sort((a: any, b: any) => a.available_from.localeCompare(b.available_from))[0] as any;

  return {
    subscription,
    tier,
    current,
    purchases: (purchases ?? []) as { id: string; purchased_at: string }[],
    coachingAvailable,
    nextCoachingFrom: (nextCoaching?.available_from as string | undefined) ?? null,
  };
}

/** How many founders currently have Elevate in force (service role). */
export async function countElevateMembers(admin: SupabaseClient, now: Date = new Date()): Promise<number> {
  const { data } = await admin
    .from("subscriptions")
    .select("status, current_period_end, auto_renew, tier, scheduled_tier, scheduled_from")
    .or("tier.eq.elevate,scheduled_tier.eq.elevate");
  return (data ?? []).filter((s: any) => effectiveTier(s, now) === "elevate").length;
}
