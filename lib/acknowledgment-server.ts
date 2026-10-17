import type { SupabaseClient, User } from "@supabase/supabase-js";
import { MATCHING_STATEMENT_KEY, MATCHING_STATEMENT_VERSION, decideAcknowledgment, type AckSource } from "./matching-statement";

/** Whether the founder has an active RENZOLO Network™ Matching add-on.
 *
 * The add-on can't be bought yet: its monthly price is still to be set.
 * When the add-on checkout is built, this reads the founder's add-on from
 * the database. Until then no founder has it, so nobody is asked to
 * acknowledge the Matching Statement. */
export async function hasActiveMatchingAddOn(_supabase: SupabaseClient, _founderId: string): Promise<boolean> {
  return false;
}

/** False when the founder has the Matching add-on but hasn't acknowledged
 * the current Matching Statement; the dashboard then sends them to
 * /acknowledge. True for everyone else.
 *
 * If the acknowledgments table can't be read, this logs the problem and
 * lets the founder through rather than locking them out of their dashboard. */
export async function ensureMatchingAcknowledgment(supabase: SupabaseClient, user: User): Promise<boolean> {
  const hasMatching = await hasActiveMatchingAddOn(supabase, user.id);
  if (!hasMatching) return true;

  const { data, error } = await supabase
    .from("acknowledgments")
    .select("version")
    .eq("founder_id", user.id)
    .eq("statement", MATCHING_STATEMENT_KEY);
  if (error) {
    console.error("Couldn't read acknowledgments; letting the founder through:", error.message);
    return true;
  }
  const decision = decideAcknowledgment(
    (data ?? []).map((r: { version: string }) => r.version),
    hasMatching
  );
  return decision.kind !== "ask";
}

/** Saves the founder's acknowledgment of the current Matching Statement,
 * using their own session. Used by the login step now, and by the Matching
 * add-on checkout once it exists (record it before taking payment).
 * Recording the same version twice is not an error. */
export async function recordMatchingAcknowledgment(
  supabase: SupabaseClient,
  founderId: string,
  source: AckSource,
  userAgent: string | null
): Promise<{ ok: true } | { ok: false; message: string }> {
  const { error } = await supabase.from("acknowledgments").insert({
    founder_id: founderId,
    statement: MATCHING_STATEMENT_KEY,
    version: MATCHING_STATEMENT_VERSION,
    source,
    user_agent: (userAgent ?? "").slice(0, 400) || null,
  });
  if (error && error.code !== "23505") return { ok: false, message: error.message };
  return { ok: true };
}
