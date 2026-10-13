import { brandImage, OG_SIZE } from "@/lib/og";

export const alt = "Founder Trajectory: know exactly where your business stands";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandImage({
    eyebrow: "Venture Readiness Assessment and Development Support",
    title: "Know exactly where your business stands, and what to do next.",
    subtitle: "Take the free 5-7 minute Readiness Snapshot.",
  });
}
