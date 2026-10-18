"use client";
import { useState } from "react";
import { ShareButtons } from "./ShareButtons";

/** A member's referral link, plus sharing their latest score. */
export function InviteCard({ inviteUrl, rewardsEarned }: { inviteUrl: string; rewardsEarned: number }) {
  const [scoreUrl, setScoreUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function shareScore() {
    setBusy(true);
    setError(null);
    const res = await fetch("/api/share", { method: "POST" });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok || !data.url) return setError(data.error ?? "Could not create a link.");
    setScoreUrl(data.url);
  }

  return (
    <div className="rounded-2xl border p-5">
      <p className="font-semibold text-navy">Invite a founder, get a free month</p>
      <p className="mt-1 text-sm text-ink-soft">
        When a founder you invite becomes a paying member, we add a free month to your membership.
        {rewardsEarned > 0 ? ` You've earned ${rewardsEarned} so far.` : ""}
      </p>
      <p className="mt-3 break-all rounded-lg bg-cream px-3 py-2 text-sm">{inviteUrl}</p>
      <div className="mt-3">
        <ShareButtons url={inviteUrl} text="I'm using Founder Trajectory to get my venture ready to grow. Take the free Readiness Snapshot:" />
      </div>
      <div className="mt-4 border-t pt-4">
        {scoreUrl ? (
          <>
            <p className="mb-2 text-sm text-ink-soft">Your score link (numbers only, never your name or answers):</p>
            <ShareButtons url={scoreUrl} text="I checked my readiness with Founder Trajectory. What's your Total Readiness Score?" />
          </>
        ) : (
          <button type="button" onClick={shareScore} disabled={busy} className="text-sm font-semibold text-teal underline disabled:opacity-50">
            {busy ? "Creating link…" : "Share my Readiness Score"}
          </button>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    </div>
  );
}
