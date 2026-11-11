import type { Tier } from "./pricing";

/** The tier comparison table, shown on the public pricing page and the
 * membership page. Every row must be something the app provides, or be
 * labelled "coming soon". `true` is a tick, `false` a dash, a string is
 * shown as written. */
export const TIER_FEATURES: { label: string; values: Record<Tier, boolean | string> }[] = [
  { label: "Full Readiness Assessment with AI insights", values: { essentials: true, growth: true, elevate: true } },
  { label: "Readiness Report", values: { essentials: "Full, downloadable", growth: "Full, downloadable", elevate: "Full, downloadable" } },
  { label: "90+ day growth and readiness plan (up to 36 months)", values: { essentials: true, growth: true, elevate: true } },
  { label: "Dashboard, goals, reminders and founder tools", values: { essentials: true, growth: true, elevate: true } },
  { label: "Valuation range and Market, Customer and Investor readiness scores", values: { essentials: true, growth: true, elevate: true } },
  { label: "AI market insight for your industry and country", values: { essentials: true, growth: true, elevate: true } },
  { label: "Advisor review of your report", values: { essentials: false, growth: true, elevate: true } },
  { label: "Lorenzo · AI: coaching any time and weekly check-ins", values: { essentials: false, growth: true, elevate: true } },
  { label: "One-on-one coaching included", values: { essentials: "1 × 30 min a quarter", growth: "2 × 30 min a quarter", elevate: "1 × 60 min a month" } },
  { label: "Pitch and investor readiness review", values: { essentials: false, growth: false, elevate: true } },
  { label: "Priority support", values: { essentials: false, growth: false, elevate: true } },
  { label: "Extra coaching sessions (60 min) at member prices", values: { essentials: "$75", growth: "$105", elevate: "$120" } },
  { label: "Priority when applying to cohorts (separate fee)", values: { essentials: "Launch", growth: "Launch and Build", elevate: "Launch, Build and Scale" } },
];

/** The short benefit list under each membership card (website and app),
 * approved Nov 11 2026. Keep in step with TIER_FEATURES. */
export const TIER_HIGHLIGHTS: Record<Tier, string[]> = {
  essentials: ["Full Readiness Assessment and report", "Valuation range and AI market insight", "Growth plan, dashboard and reminders", "One 30-minute coaching session a quarter"],
  growth: ["Everything in Essentials", "AI coach any time, with weekly check-ins", "Plan review, Market Intelligence and advisor review", "Two 30-minute coaching sessions a quarter"],
  elevate: ["Everything in Growth", "One 60-minute coaching session a month", "Pitch and investor readiness review", "Priority support · limited places"],
};

export const TIER_TAGLINES: Record<Tier, string> = {
  essentials: "Know where you stand and work your plan.",
  growth: "Go deeper, with coaching to carry out your plan.",
  elevate: "Hands-on support to raise, scale or win big contracts.",
};

export const MEMBERSHIP_POLICIES = [
  "Every membership is billed quarterly or annually and includes your Readiness Assessment. Annual plans include about 2 months free.",
  "Move up a tier any time: it starts straight away, and unused time on your current plan comes off the price.",
  "Moving down a tier takes effect when your current paid period ends.",
  "Cancelling simply means not renewing: you keep access to the end of the period you paid for. There are no partial refunds.",
  "Included coaching sessions don't roll over past the period they belong to. Sessions you buy are valid for a year.",
  "Elevate seats are limited. When they're full you can join the waitlist.",
];
