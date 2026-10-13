import { brandImage, OG_SIZE } from "@/lib/og";

export const alt = "Founder Trajectory membership: Essentials, Growth and Elevate";
export const size = OG_SIZE;
export const contentType = "image/png";

export default function Image() {
  return brandImage({
    eyebrow: "Founder Trajectory™ membership",
    title: "Choose the support that fits where you want to be.",
    subtitle: "Essentials from $15/month · Growth $39/month · Elevate $149/month",
  });
}
