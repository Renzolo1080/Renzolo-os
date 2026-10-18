import type { Tier } from "./pricing";

/** The tier comparison table, shown on the public pricing page and the
 * membership page. Every row must be something the app provides, or be
 * labelled "coming soon". `true` is a tick, `false` a dash, a string is
 * shown as written. */
export const TIER_FEATURES: { label: string; values: Record<Tier, boolean | string> }[] = [
  { label: "Full Readiness Assessment with AI insights", values: { essentials: true, growth: true, elevate: true } },
  { label: "Readiness Report", values: { essentials: "Summary", growth: "Full, downloadable", elevate: "Full, downloadable" } },
  { label: "90+ day growth and readiness plan (up to 36 months)", values: { essentials: true, growth: true, elevate: true } },
  { label: "Dashboard, goals, reminders and founder tools", values: { essentials: true, growth: true, elevate: true } },
  { label: "Valuation range and Market, Customer and Investor readiness scores", values: { essentials: false, growth: true, elevate: true } },
  { label: "AI market insight for your industry and country", values: { essentials: false, growth: true, elevate: true } },
  { label: "Advisor review of your report", values: { essentials: false, growth: true, elevate: true } },
  { label: "Lorenzo · AI: coaching any time and weekly check-ins", values: { essentials: false, growth: true, elevate: true } },
  { label: "One-on-one coaching included", values: { essentials: false, growth: "2 per quarter", elevate: "2 per month" } },
  { label: "Pitch and investor readiness review", values: { essentials: false, growth: false, elevate: true } },
  { label: "Priority support", values: { essentials: false, growth: false, elevate: true } },
  { label: "Extra coaching sessions at member prices", values: { essentials: true, growth: true, elevate: true } },
  { label: "Priority when applying to cohorts (separate fee)", values: { essentials: "Launch", growth: "Launch and Build", elevate: "Launch, Build and Scale" } },
];

export const TIER_TAGLINES: Record<Tier, string> = {
  essentials: "Know where you stand and work your plan.",
  growth: "Go deeper, with coaching to carry out your plan.",
  elevate: "Hands-on support to raise, scale or win big contracts.",
};

export const MEMBERSHIP_POLICIES = [
  "Growth and Elevate are billed quarterly or annually. Annual plans include 2 months free.",
  "Move up a tier any time: it starts straight away, and unused time on your current plan comes off the price.",
  "Moving down a tier takes effect when your current paid period ends.",
  "Cancelling simply means not renewing: you keep access to the end of the period you paid for. There are no partial refunds.",
  "Included coaching sessions don't roll over past the period they belong to. Sessions you buy are valid for a year.",
  "Elevate seats are limited. When they're full you can join the waitlist.",
];
