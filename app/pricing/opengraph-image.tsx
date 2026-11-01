import { brandImage, OG_SIZE } from "@/lib/og";

export const alt = "Founder Trajectory membership: Essentials, Growth and Elevate";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandImage({
    eyebrow: "Founder Trajectory™ membership",
    title: "Choose the support that fits where you want to be.",
    subtitle: "Essentials $60/quarter · Growth $147/quarter · Elevate $699/quarter",
  });
}
