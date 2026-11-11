import { brandImage, OG_SIZE } from "@/lib/og";

export const alt = "Free Readiness Snapshot: 5 minutes or less";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandImage({
    eyebrow: "Free · 5 minutes or less · no account needed",
    title: "How ready is your business?",
    subtitle: "Get your Total Readiness Score, your Strategic Plan Readiness and the three areas holding you back.",
  });
}
