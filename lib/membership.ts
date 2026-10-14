import { TIER_RANK, INTERVAL_MONTHS, roundDownMoney, type Tier, type BillingInterval, type Price } from "./pricing";
import { isSubscriptionActive } from "./payments";

/** Membership rules that don't need a database: which tier is in force,
 * what each tier unlocks, and what changing plan costs. The database
 * applies the same rules when a payment lands (apply_membership in
 * supabase/schema.sql); test/membership.test.ts and test/db.test.ts check
 * both sides. */

const DAY_MS = 24 * 60 * 60 * 1000;

/** Average length of a billing period, for working out unused time. */
export function periodDays(interval: BillingInterval): number {
  return (365.25 / 12) * INTERVAL_MONTHS[interval];
}

export interface SubscriptionRow {
  status?: string | null;
  current_period_end?: string | null;
  auto_renew?: boolean | null;
  tier?: string | null;
  scheduled_tier?: string | null;
  scheduled_from?: string | null;
  billing_interval?: string | null;
}

const asTier = (v: unknown): Tier | null => (v === "essentials" || v === "growth" || v === "elevate" ? v : null);

/** The tier in force right now, or null with no active membership. A
 * membership from before tiers existed counts as Essentials. A scheduled
 * downgrade takes over once its start date has passed. */
export function effectiveTier(sub: SubscriptionRow | null | undefined, now: Date = new Date()): Tier | null {
  if (!sub || !isSubscriptionActive(sub, now)) return null;
  const scheduled = asTier(sub.scheduled_tier);
  if (scheduled && sub.scheduled_from && new Date(sub.scheduled_from).getTime() <= now.getTime()) return scheduled;
  return asTier(sub.tier) ?? "essentials";
}

/** A downgrade that has been paid for but hasn't started yet. */
export function upcomingTier(sub: SubscriptionRow | null | undefined, now: Date = new Date()): { tier: Tier; from: string } | null {
  const scheduled = asTier(sub?.scheduled_tier);
  if (!scheduled || !sub?.scheduled_from) return null;
  return new Date(sub.scheduled_from).getTime() > now.getTime() ? { tier: scheduled, from: sub.scheduled_from } : null;
}

export interface Entitlements {
  member: boolean;
  tier: Tier | null;
  /** The full, detailed Readiness Report, downloadable. */
  fullReport: boolean;
  /** The shorter Essentials report (scores, top gaps, plan). */
  summaryReport: boolean;
  valuation: boolean;
  marketInsight: boolean;
  /** Market, Customer and Investor readiness scores. */
  readinessScores: boolean;
  /** The guided Plan Builder (any member, and the one-time assessment). */
  planBuilder: boolean;
  /** AI review of the strategic plan. */
  planReview: boolean;
  /** The Market Intelligence page (researched brief, refreshed monthly). */
  marketIntel: boolean;
  /** The AI coach (/ai-coach). Launch programme participants will get it
   * through the cohort module. */
  aiCoaching: boolean;
  advisorReview: boolean;
  /** Dashboard, goals, reminders, tools, milestones. */
  tools: boolean;
  /** Coaching sessions included per billing period, as shown to founders. */
  includedCoaching: string | null;
}

/** What a founder can use. `purchasedAssessment` is the one-time $79
 * Readiness Assessment: it unlocks the full report, valuation, scores and
 * market insight for the assessment it was bought for, but not the
 * membership tools. */
export function entitlements(tier: Tier | null, purchasedAssessment = false): Entitlements {
  const rank = tier ? TIER_RANK[tier] : 0;
  const growthUp = rank >= TIER_RANK.growth;
  return {
    member: rank > 0,
    tier,
    fullReport: growthUp || purchasedAssessment,
    summaryReport: rank > 0,
    valuation: growthUp || purchasedAssessment,
    marketInsight: growthUp || purchasedAssessment,
    readinessScores: growthUp || purchasedAssessment,
    planBuilder: rank > 0 || purchasedAssessment,
    planReview: growthUp || purchasedAssessment,
    marketIntel: growthUp || purchasedAssessment,
    aiCoaching: growthUp,
    advisorReview: growthUp,
    tools: rank > 0,
    includedCoaching: tier === "growth" ? "2 one-on-one sessions per quarter" : tier === "elevate" ? "2 one-on-one sessions per month" : null,
  };
}

export type ChangeKind = "new" | "renewal" | "upgrade" | "downgrade";

export interface CurrentMembership {
  sub: SubscriptionRow | null;
  /** The most recent membership payment, used to value unused time. */
  lastPayment: { amount: number; currency: string; interval: BillingInterval } | null;
}

export type PlanChange =
  | {
      ok: true;
      kind: ChangeKind;
      /** What the founder pays now. */
      charge: Price;
      /** List price before any credit. */
      listPrice: Price;
      /** Credit for unused time taken off this payment. */
      credit: number;
      /** Unused time worth more than this payment (all but one unit of it
       * is credited) becomes extra days on the new tier instead. */
      extraDays: number;
      /** When the paid period starts: now, or the end of the current one. */
      startsAt: string;
    }
  | { ok: false; reason: string };

/** What it costs, and when it starts, to buy `tier` for `interval` at
 * `listPrice`, given the founder's current membership.
 *
 *  - No active membership: a new period starting now.
 *  - Same tier: a renewal, added on after the current period.
 *  - Higher tier (upgrade): starts now. Unused time on the current
 *    period is credited, counted by days: from what was actually paid
 *    when the currency matches, otherwise from `currentListPrice` (the
 *    current tier's price in the new currency). At least one currency
 *    unit is always charged; any credit beyond that becomes extra days.
 *  - Lower tier (downgrade): starts when the current period ends; the
 *    founder keeps their current tier until then.
 *
 * Refused for a membership set up by hand (no end date) and while card
 * auto-renewal is on (Flutterwave would keep charging the old plan). */
export function planChange(
  current: CurrentMembership,
  target: { tier: Tier; interval: BillingInterval; listPrice: Price },
  now: Date = new Date(),
  currentListPrice: Price | null = null
): PlanChange {
  const { sub } = current;
  const tierNow = effectiveTier(sub, now);
  const nowIso = now.toISOString();
  const none = { credit: 0, extraDays: 0 };

  if (!tierNow) return { ok: true, kind: "new", charge: target.listPrice, listPrice: target.listPrice, startsAt: nowIso, ...none };

  if (!sub?.current_period_end) {
    return { ok: false, reason: "Your membership was set up by our team and has no end date. Contact us to change it." };
  }
  if (sub.auto_renew) {
    return {
      ok: false,
      reason:
        "Your membership renews automatically by card. Turn automatic renewal off first (use the link in Flutterwave's reminder email), then change your plan here.",
    };
  }

  const end = new Date(sub.current_period_end);
  const rankNow = TIER_RANK[tierNow];
  const rankTarget = TIER_RANK[target.tier];

  if (rankTarget < rankNow) {
    return { ok: true, kind: "downgrade", charge: target.listPrice, listPrice: target.listPrice, startsAt: end.toISOString(), ...none };
  }
  if (rankTarget === rankNow) {
    return { ok: true, kind: "renewal", charge: target.listPrice, listPrice: target.listPrice, startsAt: end.toISOString(), ...none };
  }

  // Upgrade.
  const remainingDays = Math.max(0, (end.getTime() - now.getTime()) / DAY_MS);
  const currency = target.listPrice.currency;
  let rawCredit = 0;
  const lp = current.lastPayment;
  if (lp && lp.currency.toUpperCase() === currency.toUpperCase()) {
    rawCredit = (lp.amount * remainingDays) / periodDays(lp.interval);
  } else if (currentListPrice && currentListPrice.currency.toUpperCase() === currency.toUpperCase() && lp) {
    rawCredit = (currentListPrice.amount * remainingDays) / periodDays(lp.interval);
  }
  const credit = roundDownMoney(rawCredit, currency);
  const minCharge = 1;
  const applied = roundDownMoney(Math.min(credit, Math.max(0, target.listPrice.amount - minCharge)), currency);
  const leftover = credit - applied;
  const dailyRate = target.listPrice.amount / periodDays(target.interval);
  const extraDays = leftover > 0 && dailyRate > 0 ? Math.floor((leftover / dailyRate) * 10) / 10 : 0;
  const charge = { amount: Math.round((target.listPrice.amount - applied) * 100) / 100, currency };
  return { ok: true, kind: "upgrade", charge, listPrice: target.listPrice, credit: applied, extraDays, startsAt: nowIso };
}

/** Elevate is limited by coaching hours (2 one-on-ones a month each). */
export function elevateSeatLimit(env: Record<string, string | undefined> = process.env): number {
  const n = Number(env.ELEVATE_SEAT_LIMIT);
  return Number.isInteger(n) && n > 0 ? n : 50;
}

/** How long after buying the $79 assessment it carries straight into a
 * membership without starting a fresh assessment. */
export const ASSESSMENT_CARRY_DAYS = 30;
