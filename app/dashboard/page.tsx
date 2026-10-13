import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportPanel } from "@/components/ReportPanel";
import { BLOCK_KEYS } from "@/lib/scoring";
import { FounderDashboard } from "@/components/dashboard/FounderDashboard";
import { normalizeExtras } from "@/lib/dashboard";
import { loadPlan } from "@/lib/plan-server";
import { parsePlanReview } from "@/lib/plan-review";
import type { MarketInsights } from "@/lib/market";
import { PaymentBanner } from "@/components/PaymentBanner";
import { isSubscriptionActive, daysUntilExpiry, reconcilePendingPayments } from "@/lib/payments";
import { createPaymentStore } from "@/lib/payments-store";
import { detailsComplete } from "@/lib/quickcheck";
import { claimSnapshotLead } from "@/lib/snapshot-save";
import { SubscriptionFeatures } from "@/components/SubscriptionFeatures";
import { loadMembership } from "@/lib/membership-server";
import { entitlements, ASSESSMENT_CARRY_DAYS } from "@/lib/membership";
import { TIER_NAMES } from "@/lib/pricing";
import { ensureProfileExtras, readAttribution, publicAppUrl } from "@/lib/growth-server";
import { InviteCard } from "@/components/InviteCard";
import { PurchaseTracker } from "@/components/PurchaseTracker";
import { verifyTransaction, verifyTransactionByReference } from "@/lib/flutterwave";

type SearchParams = Record<string, string | string[] | undefined>;
const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export default async function DashboardPage({ searchParams }: { searchParams?: SearchParams }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase.from("profiles").select("dashboard_widgets").eq("id", user.id).single();
  const extras = normalizeExtras(profile?.dashboard_widgets);

  const loadLatestScore = () =>
    supabase
      .from("scores")
      .select("*, assessments!inner(founder_id, extra)")
      .eq("assessments.founder_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
  let { data: latestScore } = await loadLatestScore();

  // New member who took the free public Snapshot with this same confirmed
  // email: carry it into their account so they don't answer twice.
  if (!latestScore && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    const claimed = await claimSnapshotLead(createAdminClient(), user).catch((e) => {
      console.error("Couldn't carry over the Readiness Snapshot:", e);
      return null;
    });
    // Looked up by the new assessment, not with the same query as above:
    // Next.js would hand back the earlier (empty) result for an identical
    // request made during the same page load.
    if (claimed) {
      ({ data: latestScore } = await supabase
        .from("scores")
        .select("*, assessments!inner(founder_id, extra)")
        .eq("assessment_id", claimed)
        .eq("assessments.founder_id", user.id)
        .limit(1)
        .maybeSingle());
    }
  }
  const planScore: number | null = typeof (latestScore as any)?.assessments?.extra?.planScore === "number" ? (latestScore as any).assessments.extra.planScore : null;

  // Safety net for "I paid but nothing happened": before reading the
  // subscription, re-check any of this founder's payments that are still
  // pending and complete them if Flutterwave now says they went through.
  // Bounded and never throws — see reconcilePendingPayments.
  if (process.env.FLUTTERWAVE_SECRET_KEY && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    await reconcilePendingPayments(user.id, {
      store: createPaymentStore(createAdminClient()),
      verify: (id) => verifyTransaction(id),
      verifyByReference: (ref) => verifyTransactionByReference(ref),
    });
  }

  const m = await loadMembership(supabase, user.id);

  // Once per founder: referral code, where they came from, who invited them.
  const referralCode = process.env.SUPABASE_SERVICE_ROLE_KEY
    ? await ensureProfileExtras(createAdminClient(), user.id, readAttribution(), user.user_metadata?.marketing_consent === true).catch(() => null)
    : null;
  const { data: rewards } = await supabase.from("referral_rewards").select("id");
  const subscription = m.subscription;
  const subscribed = isSubscriptionActive(subscription);
  const ent = entitlements(m.tier, m.purchases.length > 0);
  // Members, and founders who bought the one-time Readiness Assessment.
  const hasAccess = !!m.tier || m.purchases.length > 0;
  const latestPurchase = m.purchases[0] ?? null;
  const carryDaysLeft = latestPurchase
    ? Math.ceil((new Date(latestPurchase.purchased_at).getTime() + ASSESSMENT_CARRY_DAYS * 864e5 - Date.now()) / 864e5)
    : null;

  // The banner's wording comes from the address bar, which anyone can
  // edit — so "payment received" is only shown when the database agrees.
  let paymentResult = first(searchParams?.payment);
  const paymentProduct = first(searchParams?.product);
  if (paymentResult === "success") {
    let confirmed = subscribed;
    const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    if (paymentProduct === "assessment") {
      confirmed = m.purchases.some((p) => p.purchased_at >= since);
    } else if (paymentProduct === "coaching") {
      const { data: bought } = await supabase.from("coaching_credits").select("id").eq("source", "purchase").gte("created_at", since).limit(1).maybeSingle();
      confirmed = !!bought;
    } else if (paymentProduct === "advisor_session") {
      const { data: paidSession } = await supabase
        .from("advisor_sessions")
        .select("id")
        .eq("founder_id", user.id)
        .gte("paid_at", new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
        .limit(1)
        .maybeSingle();
      confirmed = !!paidSession;
    }
    if (!confirmed) paymentResult = "pending";
  }
  // For analytics: the payment just confirmed (amount only, nothing personal).
  const { data: lastPaid } =
    paymentResult === "success"
      ? await supabase.from("payments").select("id, amount, currency, product").eq("status", "successful").order("fulfilled_at", { ascending: false }).limit(1).maybeSingle()
      : { data: null };
  const daysLeft = daysUntilExpiry(subscription);
  const lapsed = !subscribed && subscription?.status === "active";

  // A subscriber gets their full report once they've answered the
  // detailed questions for their weakest areas (lib/quickcheck.ts).
  const { data: detailRows } =
    hasAccess && latestScore
      ? await supabase.from("block_responses").select("current_state").eq("assessment_id", latestScore.assessment_id)
      : { data: null };
  const detailsDone = detailsComplete(detailRows);
  const areasAnswered = (detailRows ?? []).filter((r: any) => (r.current_state ?? "").trim()).length;
  const gapLabels: string[] = ((latestScore?.gaps as any[] | null) ?? []).map((g) => g.label).filter(Boolean);

  // The founder's most recent report (for any score; reports are only
  // ever readable to their owner while they have access).
  const { data: existingReport } =
    hasAccess && latestScore
      ? await supabase.from("reports").select("id, diagnostic_markdown, level, score_id, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle()
      : { data: null };

  let dashboard: React.ComponentProps<typeof FounderDashboard> | null = null;
  let reportOutdated: string | null = null;
  if (hasAccess && latestScore) {
    const access = { member: ent.planBuilder, growth: ent.planReview };
    const [planRow, { data: checkins }, { data: updates }, { data: reviewRow }, { data: briefRow }] = await Promise.all([
      loadPlan(supabase, user.id),
      supabase.from("goal_checkins").select("goal_id, value, note, checked_on").order("checked_on", { ascending: true }).limit(500),
      supabase.from("founder_updates").select("period, revenue, customers, cash, wins, challenges, asks").order("period", { ascending: false }).limit(13),
      supabase.from("plan_reviews").select("result, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
      supabase.from("market_briefs").select("insights, created_at").order("created_at", { ascending: false }).limit(1).maybeSingle(),
    ]);
    const review = reviewRow ? parsePlanReview(JSON.stringify(reviewRow.result)) : null;

    let recommendations: { id: string; source: string; title: string }[] = [];
    let milestones: { id: string; title: string; target_date: string | null }[] = [];
    if (extras.includes("recommendations") && access.member) {
      const [{ data: recRows }, { data: msRows }] = await Promise.all([
        supabase.from("recommendations").select("id, source, title, priority, created_at").eq("assessment_id", latestScore.assessment_id),
        supabase.from("milestones").select("id, title, target_date").eq("assessment_id", latestScore.assessment_id).eq("completed", false),
      ]);
      recommendations = (recRows ?? [])
        .slice()
        .sort((a: any, b: any) => (a.source === b.source ? (a.source === "ai" ? (a.priority ?? 999) - (b.priority ?? 999) : b.created_at.localeCompare(a.created_at)) : a.source === "advisor" ? -1 : 1))
        .slice(0, 4)
        .map((r: any) => ({ id: r.id, source: r.source, title: r.title }));
      milestones = (msRows ?? []).slice().sort((a: any, b: any) => (a.target_date ?? "9999").localeCompare(b.target_date ?? "9999")).slice(0, 3);
    }
    let scoreHistory: { date: string; score: number }[] = [];
    if (extras.includes("history")) {
      const { data: historyRows } = await supabase
        .from("scores")
        .select("created_at, venture_score, assessments!inner(founder_id)")
        .eq("assessments.founder_id", user.id)
        .order("created_at", { ascending: true });
      scoreHistory = (historyRows ?? []).map((r: any) => ({ date: r.created_at, score: Number(r.venture_score) }));
    }

    if (existingReport) {
      if (existingReport.score_id !== latestScore.id) reportOutdated = "Your score has changed since this report was written.";
      else if (planRow && new Date(planRow.updated_at) > new Date(existingReport.created_at)) reportOutdated = "You've updated your plan since this report was written.";
      else if (reviewRow && new Date(reviewRow.created_at) > new Date(existingReport.created_at)) reportOutdated = "Your plan has been reviewed since this report was written.";
    }

    dashboard = {
      access,
      extras,
      score: latestScore,
      plan: planRow?.data ?? null,
      planCompleteness: planRow?.completeness ?? null,
      checkins: (checkins ?? []).map((c: any) => ({ ...c, value: Number(c.value) })),
      updates: (updates ?? []).map((u: any) => ({ ...u, revenue: u.revenue === null ? null : Number(u.revenue), cash: u.cash === null ? null : Number(u.cash) })),
      review: review && reviewRow ? { review, createdAt: reviewRow.created_at } : null,
      market: briefRow ? { createdAt: briefRow.created_at, insights: (briefRow.insights ?? { recommendations: [], targets: [] }) as MarketInsights } : null,
      areasAnswered,
      areasTotal: BLOCK_KEYS.length,
      report: { exists: !!existingReport, current: !!existingReport && !reportOutdated },
      scoreHistory,
      recommendations,
      milestones,
      coaching: { available: m.coachingAvailable, nextFrom: m.nextCoachingFrom, included: ent.includedCoaching },
      invite: referralCode ? <InviteCard inviteUrl={`${publicAppUrl()}/?ref=${referralCode}&utm_source=referral&utm_medium=member`} rewardsEarned={(rewards ?? []).length} /> : null,
      today: new Date().toISOString().slice(0, 10),
    };
  }

  return (
    <main className={`mx-auto min-h-screen px-4 py-10 sm:px-6 ${hasAccess && latestScore ? "max-w-6xl" : "max-w-2xl"}`}>
      <h1 className="mb-6 text-2xl font-bold text-navy">Your Founder Trajectory™</h1>

      <PaymentBanner payment={paymentResult} product={paymentProduct} />
      {lastPaid && <PurchaseTracker id={lastPaid.id} value={Number(lastPaid.amount)} currency={lastPaid.currency} item={lastPaid.product} />}

      {subscribed && daysLeft !== null && daysLeft <= 7 && (
        <div className="rounded border border-gold bg-cream p-4 text-sm mb-6">
          <span className="font-semibold text-navy">
            {daysLeft <= 1 ? "Your membership ends within a day." : `Your membership ends in ${daysLeft} days.`}
          </span>{" "}
          <a href="/dashboard/subscribe" className="text-teal underline">
            Renew now
          </a>{" "}
          <span className="text-ink-soft">— time is added on top of what you've already paid for.</span>
        </div>
      )}

      {!latestScore ? (
        <div>
          <p className="mb-1 font-semibold text-navy">Start with your free Readiness Snapshot</p>
          <p className="mb-4 text-ink-soft">5 to 7 minutes, mostly dropdowns and taps. You'll get your Venture Score, your Strategic Plan Readiness and the three areas holding you back.</p>
          <a href="/assessment" className="rounded bg-navy px-5 py-3 text-white font-semibold inline-block">
            Start the Snapshot
          </a>
        </div>
      ) : !hasAccess ? (
        <FreeResult score={latestScore.venture_score} tier={latestScore.venture_tier} planScore={planScore} gaps={gapLabels} lapsed={lapsed} />
      ) : (
        <div className="space-y-6">
          {m.tier ? (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy p-4 text-sm text-white">
              <span>
                <span className="font-semibold">{TIER_NAMES[m.tier]} member</span>
                {ent.includedCoaching ? <span className="text-cream/80"> · includes {ent.includedCoaching}</span> : null}
              </span>
              <a href="/dashboard/subscribe" className="font-semibold text-gold">
                {m.tier === "elevate" ? "Membership and coaching" : "Upgrade or manage"}
              </a>
            </div>
          ) : (
            <div className="rounded-2xl border border-gold bg-white p-5 text-sm">
              <p className="font-semibold text-navy">Your Readiness Assessment</p>
              <p className="mt-1 text-ink-soft">
                {carryDaysLeft !== null && carryDaysLeft > 0
                  ? `Join a membership within ${carryDaysLeft} day${carryDaysLeft === 1 ? "" : "s"} and this assessment carries straight into it.`
                  : "Join a membership to keep building on this assessment with a plan, tools and coaching."}
              </p>
              <a href="/dashboard/subscribe" className="mt-3 inline-block rounded-lg bg-gold px-4 py-2 font-semibold text-white">
                See membership options
              </a>
            </div>
          )}

          {dashboard && <FounderDashboard {...dashboard} />}

          <div id="report">
            {detailsDone || existingReport ? (
              <ReportPanel
                assessmentId={latestScore.assessment_id}
                scoreId={latestScore.id}
                initialReport={existingReport ?? null}
                canUpgradeToFull={ent.fullReport}
                outdatedReason={reportOutdated}
              />
            ) : (
              <div className="rounded-2xl border border-gold bg-cream p-6">
                <p className="font-semibold text-navy">One more step for your Readiness Report</p>
                <p className="mb-4 mt-1 text-sm text-ink-soft">
                  Complete the full assessment for at least your three weakest areas
                  {gapLabels.length ? ` (${gapLabels.join(", ")})` : ""}. About 5 minutes an area, saved as you go. It sharpens your score and lets your
                  report and plan speak to your actual business.
                </p>
                <a href="/assessment/details" className="inline-block rounded-lg bg-navy px-5 py-3 font-semibold text-white">
                  Continue the full assessment
                </a>
              </div>
            )}
          </div>

          {m.coachingAvailable > 0 && !extras.includes("coaching") && (
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-gold bg-white p-5">
              <p className="text-sm">
                <span className="font-semibold text-navy">One-on-one coaching: </span>
                you have {m.coachingAvailable} session{m.coachingAvailable > 1 ? "s" : ""} to book.
              </p>
              <a href="/dashboard/subscribe#one-time" className="rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
                Book a session
              </a>
            </div>
          )}

          {ent.aiCoaching && (
            <div className="rounded-2xl border border-dashed border-gold p-5">
              <p className="font-semibold text-navy">
                AI coaching <span className="ml-2 rounded-full bg-cream px-2 py-0.5 text-xs font-semibold text-gold">Coming soon</span>
              </p>
              <p className="mt-1 text-sm text-ink-soft">Ask questions about your plan and get check-ins as you carry it out. Included in your membership when it launches.</p>
            </div>
          )}

          {referralCode && ent.tools && !extras.includes("invite") && (
            <InviteCard inviteUrl={`${publicAppUrl()}/?ref=${referralCode}&utm_source=referral&utm_medium=member`} rewardsEarned={(rewards ?? []).length} />
          )}

          <a href="/tools" className="block text-center rounded border border-navy text-navy px-5 py-3 font-semibold">
            {ent.tools ? "Open Founder Tools (calculators, recommendations & milestones)" : "Open Founder Tools (free calculators)"}
          </a>
        </div>
      )}
    </main>
  );
}

/** What a founder sees before subscribing: enough of their result to want
 * the rest. The score and tier, and their three weakest areas named but
 * not explained. Everything that explains them is the paid product. */
function FreeResult({ score, tier, planScore, gaps, lapsed }: { score: number; tier: string; planScore: number | null; gaps: string[]; lapsed: boolean }) {
  return (
    <div className="space-y-6">
      <div className={`grid gap-4 ${planScore !== null ? "sm:grid-cols-2" : ""}`}>
        <div className="rounded border p-6">
          <p className="text-sm text-ink-soft">Your Venture Score</p>
          <p className="text-5xl font-bold text-navy">
            {score}
            <span className="text-lg font-normal text-ink-soft"> / 100</span>
          </p>
          <p className="text-gold font-semibold mt-1">{tier}</p>
        </div>
        {planScore !== null && (
          <div className="rounded border p-6">
            <p className="text-sm text-ink-soft">Strategic Plan Readiness</p>
            <p className="text-5xl font-bold text-navy">
              {planScore}
              <span className="text-lg font-normal text-ink-soft"> / 100</span>
            </p>
          </div>
        )}
      </div>

      {gaps.length > 0 && (
        <div className="rounded border p-6">
          <p className="font-semibold text-navy">Your 3 weakest areas</p>
          <ol className="mt-3 space-y-2">
            {gaps.map((g, i) => (
              <li key={g} className="flex items-center gap-3">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-navy text-sm font-bold text-white">{i + 1}</span>
                <span>{g}</span>
              </li>
            ))}
          </ol>
          <p className="text-sm text-ink-soft mt-4">These are holding your score back the most. Your full report explains why, and what to do about each one.</p>
        </div>
      )}

      <div className="rounded border p-6 bg-navy text-white">
        <p className="text-lg font-semibold">
          {lapsed ? "Your membership has ended" : "Continue your Founder Trajectory™"}
        </p>
        <div className="mt-4">
          <SubscriptionFeatures dark />
        </div>
        <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
          <a href="/dashboard/subscribe" className="inline-block rounded bg-gold px-6 py-3 text-center font-semibold text-white">
            {lapsed ? "Renew my membership" : "Become a member"}
          </a>
          {!lapsed && (
            <a href="/dashboard/subscribe#one-time" className="text-sm text-cream underline">
              Or get a one-time Readiness Assessment
            </a>
          )}
        </div>
      </div>

      <a href="/tools" className="block text-center rounded border border-navy text-navy px-5 py-3 font-semibold">
        Open Founder Tools (free calculators)
      </a>
    </div>
  );
}
