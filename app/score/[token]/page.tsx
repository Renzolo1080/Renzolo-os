import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getSharedScore } from "@/lib/shared-score";

export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: { params: { token: string } }): Promise<Metadata> {
  const s = await getSharedScore(params.token);
  if (!s) return { title: "Founder Trajectory™" };
  const title = `A founder scored ${Number(s.venture_score)}/100 on their Venture Readiness. What's yours?`;
  return {
    title,
    description: "Take the free 5-7 minute Readiness Snapshot and see where your venture stands.",
    openGraph: { title, description: "Take the free 5-7 minute Readiness Snapshot and see where your venture stands." },
  };
}

/** A shared score: "A founder scored 62 — what's yours?" Shows no name,
 * email or answers. Brings the sharer's referral code along, if any. */
export default async function SharedScorePage({ params }: { params: { token: string } }) {
  const s = await getSharedScore(params.token);
  if (!s) notFound();
  const ref = s.referral_code ? `&ref=${encodeURIComponent(s.referral_code)}` : "";
  const href = `/snapshot?utm_source=share&utm_medium=referral&utm_campaign=score_share${ref}`;
  return (
    <main>
      <section className="bg-navy text-white">
        <div className="mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gold">Venture Readiness Snapshot</p>
          <h1 className="mt-4 text-3xl font-bold sm:text-4xl">A founder just checked how ready their venture is.</h1>
          <div className="mx-auto mt-8 grid max-w-md grid-cols-2 gap-4">
            <div className="rounded-2xl bg-navy-panel p-5">
              <p className="text-sm text-cream/70">Venture Score</p>
              <p className="text-5xl font-bold">{Number(s.venture_score)}</p>
              <p className="mt-1 text-sm font-semibold text-gold">{s.venture_tier}</p>
            </div>
            <div className="rounded-2xl bg-navy-panel p-5">
              <p className="text-sm text-cream/70">Strategic Plan</p>
              <p className="text-5xl font-bold">{s.plan_score !== null ? Number(s.plan_score) : "—"}</p>
              <p className="mt-1 text-sm text-cream/70">out of 100</p>
            </div>
          </div>
          <p className="mx-auto mt-8 max-w-xl text-lg text-cream/85">What's yours? Take the free Readiness Snapshot: 5 to 7 minutes, no account needed.</p>
          <a href={href} className="mt-6 inline-block rounded-lg bg-gold px-7 py-4 text-lg font-semibold text-white">
            Check my venture's readiness
          </a>
        </div>
      </section>
    </main>
  );
}
