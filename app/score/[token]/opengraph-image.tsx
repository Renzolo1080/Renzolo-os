import { brandImage, OG_SIZE } from "@/lib/og";
import { getSharedScore } from "@/lib/shared-score";

export const runtime = "nodejs";
export const alt = "A founder's Venture Readiness score";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function Image({ params }: { params: { token: string } }) {
  const s = await getSharedScore(params.token);
  return brandImage({
    eyebrow: "Venture Readiness Snapshot",
    big: s ? String(Number(s.venture_score)) : "?",
    bigLabel: s ? s.venture_tier : undefined,
    title: "A founder just scored their venture. What's yours?",
    subtitle: "Free · 5 to 7 minutes · no account needed",
  });
}
