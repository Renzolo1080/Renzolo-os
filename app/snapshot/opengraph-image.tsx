import { brandImage, OG_SIZE } from "@/lib/og";

export const alt = "Free Readiness Snapshot: 5-7 minutes";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandImage({
    eyebrow: "Free · 5 to 7 minutes · no account needed",
    title: "How ready is your business?",
    subtitle: "Get your Total Readiness Score, your Strategic Plan Readiness and the three areas holding you back.",
  });
}
