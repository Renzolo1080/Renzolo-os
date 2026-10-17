import type { SupabaseClient, User } from "@supabase/supabase-js";
import { MATCHING_STATEMENT_KEY, MATCHING_STATEMENT_VERSION, decideAcknowledgment } from "./matching-statement";

/** True when the founder has acknowledged the current Matching Statement.
 *
 * Uses the founder's own session: the database lets founders read their own
 * acknowledgments and add one for themselves. A founder who ticked the box
 * at registration gets their row written here, on their first visit after
 * confirming their email.
 *
 * If the acknowledgments table can't be read (for example, before the
 * migration is applied), this logs the problem and lets the founder through
 * rather than locking everyone out of their dashboard. */
export async function ensureMatchingAcknowledgment(supabase: SupabaseClient, user: User): Promise<boolean> {
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
    user.user_metadata
  );
  if (decision.kind === "acknowledged") return true;
  if (decision.kind === "ask") return false;

  const { error: insertError } = await supabase.from("acknowledgments").insert({
    founder_id: user.id,
    statement: MATCHING_STATEMENT_KEY,
    version: MATCHING_STATEMENT_VERSION,
    acknowledged_at: decision.acknowledgedAt,
    source: "registration",
  });
  // 23505: already recorded (two tabs at once). Anything else: they still
  // ticked the box at sign-up, so let them in and record it next time.
  if (insertError && insertError.code !== "23505") {
    console.error("Couldn't record the registration acknowledgment:", insertError.message);
  }
  return true;
}
