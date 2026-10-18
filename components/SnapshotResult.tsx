import type { SnapshotOverview } from "@/lib/snapshot";
import { SubscriptionFeatures } from "./SubscriptionFeatures";
import { ShareButtons } from "./ShareButtons";

/** The free Snapshot result: a short overview, one recommendation, and
 * the invitation to subscribe for the comprehensive assessment. */
export function SnapshotResult({
  overview,
  fullName,
  companyName,
  email,
  shareUrl = null,
}: {
  overview: SnapshotOverview;
  fullName: string;
  companyName: string;
  email: string;
  shareUrl?: string | null;
}) {
  const first = fullName.trim().split(/\s+/)[0];
  const registerHref = `/register?email=${encodeURIComponent(email.trim())}&name=${encodeURIComponent(fullName.trim())}`;
  return (
    <div className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wide text-teal">Your Readiness Snapshot</p>
        <h1 className="mt-1 text-3xl font-bold text-navy">
          {first ? `${first}, here's where ${companyName.trim() || "your business"} stands` : "Here's where your business stands"}
        </h1>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Venture Score</p>
          <p className="text-5xl font-bold text-navy">
            {overview.ventureScore}
            <span className="text-lg font-normal text-ink-soft"> / 100</span>
          </p>
          <p className="mt-1 font-semibold text-brand-text">{overview.tier}</p>
        </div>
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="text-sm text-ink-soft">Strategic Plan Readiness</p>
          <p className="text-5xl font-bold text-navy">
            {overview.planScore}
            <span className="text-lg font-normal text-ink-soft"> / 100</span>
          </p>
          <p className="mt-1 text-sm text-ink-soft">How solid your plan is, and how much of your business model it covers</p>
        </div>
      </div>

      <div className="rounded-2xl bg-white p-6 shadow-sm space-y-4">
        {overview.strongest && (
          <p>
            <span className="text-sm text-ink-soft">Strongest area: </span>
            <span className="font-semibold text-teal">{overview.strongest}</span>
          </p>
        )}
        {overview.weakest.length > 0 && (
          <div>
            <p className="text-sm text-ink-soft">Areas holding you back most</p>
            <ol className="mt-2 space-y-2">
              {overview.weakest.map((g, i) => (
                <li key={g} className="flex items-center gap-3">
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
                  <span className="font-medium">{g}</span>
                </li>
              ))}
            </ol>
          </div>
        )}
        <div className="rounded-lg border-l-4 border-gold bg-cream p-4">
          <p className="text-sm font-semibold text-navy">Our recommendation</p>
          <p className="mt-1 text-sm">{overview.recommendation}</p>
        </div>
      </div>

      {shareUrl && (
        <div className="rounded-2xl bg-white p-6 shadow-sm">
          <p className="font-semibold text-navy">Know a founder who should check their readiness?</p>
          <p className="mt-1 text-sm text-ink-soft">Share your score. Only the numbers are shown: never your name or answers.</p>
          <div className="mt-3">
            <ShareButtons url={shareUrl} text={`I scored ${overview.ventureScore}/100 on my Venture Readiness Snapshot. What's your Venture Readiness Score?`} />
          </div>
        </div>
      )}

      <div className="rounded-2xl bg-navy p-6 text-white sm:p-8">
        <p className="text-xl font-bold">Continue your Founder Trajectory™</p>
        <p className="mt-1 text-sm text-cream/80">Your Snapshot shows where the gaps are. A membership starts with your full Readiness Assessment, shows why the gaps are there and what to do about them, and supports you as you close them.</p>
        <div className="mt-5">
          <SubscriptionFeatures dark />
        </div>
        <a href={registerHref} className="mt-6 inline-block rounded-lg bg-brand px-6 py-3 font-semibold text-on-brand">
          Create my account and become a member
        </a>
        <p className="mt-3 text-xs text-cream/70">Sign up with {email.trim() || "the same email"} and this Snapshot will be waiting in your account.</p>
      </div>
    </div>
  );
}
