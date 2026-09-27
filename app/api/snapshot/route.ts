import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/server";
import { computeVentureScore, BLOCK_KEYS, type BlockKey } from "@/lib/scoring";

/** POST /api/snapshot
 * Body: { email, fullName, ventureStage, industry, ratings: Record<BlockKey, number> }
 * No auth required — this is the public, abbreviated "Readiness Snapshot"
 * lead-gen offer. Each block gets ONE quick 0-100 self-rating (not the
 * full six-measure breakdown from the paid assessment); we feed that
 * same value into all six measures so the existing scoring engine can be
 * reused unchanged, then return only a preview (score + tier), not the
 * full gap/sub-score breakdown — that stays behind registration.
 */
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, fullName, ventureStage, industry, ratings } = body as {
    email: string;
    fullName?: string;
    ventureStage?: string;
    industry?: string;
    ratings: Record<BlockKey, number>;
  };

  if (!email || !ratings) {
    return NextResponse.json({ error: "email and ratings are required" }, { status: 400 });
  }
  for (const key of BLOCK_KEYS) {
    if (typeof ratings[key] !== "number") {
      return NextResponse.json({ error: `Missing rating for block: ${key}` }, { status: 400 });
    }
  }

  const blockScores = {} as Record<BlockKey, number>;
  for (const key of BLOCK_KEYS) blockScores[key] = ratings[key];
  const { score, tier } = computeVentureScore(blockScores);

  const supabase = createAdminClient();
  const { error } = await supabase.from("snapshot_leads").insert({
    email,
    full_name: fullName ?? null,
    venture_stage: ventureStage ?? null,
    industry: industry ?? null,
    block_ratings: ratings,
    preview_score: score,
    preview_tier: tier,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Teaser only — full block-by-block breakdown, gaps, and the AI report
  // are reserved for a registered (and, for the full report, paying) user.
  return NextResponse.json({ previewScore: score, previewTier: tier });
}
