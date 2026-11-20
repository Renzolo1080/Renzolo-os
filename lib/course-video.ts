import { createHash } from "crypto";

/** Course lesson videos are hosted on Bunny Stream and played through its
 * embedded player. Paid lessons are protected with Bunny's token
 * authentication: the player URL carries a token that expires, so a
 * copied link stops working and only signed-in buyers can watch.
 *
 * Settings (Vercel; never in code):
 *   BUNNY_STREAM_LIBRARY_ID   the video library's ID
 *   BUNNY_STREAM_TOKEN_KEY    the library's token authentication key
 *
 * Turn on "Embed view token authentication" for the library in Bunny so
 * an unsigned URL is refused. Without these settings, lessons show
 * "Video coming soon" rather than an unprotected player. */

type Env = Record<string, string | undefined>;

/** How long a signed player link works. Long enough for a lesson and a
 * rewatch; short enough that a shared link soon dies. */
export const VIDEO_LINK_SECONDS = 4 * 60 * 60;

/** Bunny video IDs are GUIDs. Anything else is refused. */
export function isVideoId(v: unknown): v is string {
  return typeof v === "string" && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(v.trim());
}

export function videoConfigured(env: Env = process.env): boolean {
  return !!(env.BUNNY_STREAM_LIBRARY_ID?.trim() && env.BUNNY_STREAM_TOKEN_KEY?.trim());
}

/** A signed, expiring embed URL for one video, or null if video hosting
 * isn't set up or the ID isn't valid. Token = SHA-256 hex of
 * (token key + video ID + expiry), per Bunny's embed token authentication. */
export function signedEmbedUrl(videoId: string | null | undefined, env: Env = process.env, now: number = Date.now()): string | null {
  const library = env.BUNNY_STREAM_LIBRARY_ID?.trim();
  const key = env.BUNNY_STREAM_TOKEN_KEY?.trim();
  if (!library || !key || !isVideoId(videoId)) return null;
  const id = videoId.trim().toLowerCase();
  const expires = Math.floor(now / 1000) + VIDEO_LINK_SECONDS;
  const token = createHash("sha256").update(key + id + expires).digest("hex");
  return `https://iframe.mediadelivery.net/embed/${encodeURIComponent(library)}/${id}?token=${token}&expires=${expires}&autoplay=false&preload=false`;
}
