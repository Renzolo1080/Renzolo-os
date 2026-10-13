import { createClient, createAdminClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { ReportPanel } from "@/components/ReportPanel";
import { GoalProgressRow } from "@/components/GoalProgressRow";
import { DashboardCustomizer } from "@/components/DashboardCustomizer";
import { ProgressOverview, type TopRecommendation, type TopMilestone } from "@/components/ProgressOverview";
import { BLOCK_LABELS, type BlockKey } from "@/lib/scoring";
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
  const widgets: string[] = profile?.dashboard_widgets ?? ["reminders", "valuation", "goalsProgress", "progressOverview"];
  const showReminders = widgets.includes("reminders");
  const showValuation = widgets.includes("valuation");
  const showGoalsProgress = widgets.includes("goalsProgress");
  const showProgressOverview = widgets.includes("progressOverview");

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
  const gapLabels: string[] = ((latestScore?.gaps as any[] | null) ?? []).map((g) => g.label).filter(Boolean);

  // If this founder already has a report for their latest score, show it
  // straight away instead of asking them to generate (and pay for the AI
  // cost of) a new one on every visit.
  const { data: existingReport } =
    hasAccess && latestScore
      ? await supabase
          .from("reports")
          .select("id, diagnostic_markdown, level")
          .eq("score_id", latestScore.id)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle()
      : { data: null };

  const needsBlockResponses = latestScore && ent.tools && (showReminders || showGoalsProgress || showProgressOverview);
  const { data: blockResponses } = needsBlockResponses
    ? await supabase
        .from("block_responses")
        .select("id, block_key, goal_target, target_date, progress_status")
        .eq("assessment_id", latestScore.assessment_id)
    : { data: null };

  const now = Date.now();
  const TWO_WEEKS_MS = 14 * 24 * 60 * 60 * 1000;
  const withDates = (blockResponses ?? []).filter((b) => b.target_date && b.progress_status !== "done");
  const overdueGoals = withDates.filter((b) => new Date(b.target_date!).getTime() < now);
  const dueSoonGoals = withDates.filter((b) => {
    const t = new Date(b.target_date!).getTime();
    return t >= now && t - now <= TWO_WEEKS_MS;
  });

  let topRecommendations: TopRecommendation[] = [];
  let topMilestones: TopMilestone[] = [];
  let scoreHistory: { date: string; score: number }[] = [];
  const statusCounts: Record<string, number> = {};

  if (showProgressOverview && latestScore && ent.tools) {
    for (const b of blockResponses ?? []) {
      statusCounts[b.progress_status] = (statusCounts[b.progress_status] ?? 0) + 1;
    }

    const { data: recRows } = await supabase
      .from("recommendations")
      .select("id, source, title, priority, created_at, profiles(full_name)")
      .eq("assessment_id", latestScore.assessment_id);

    topRecommendations = (recRows ?? [])
      .slice()
      .sort((a: any, b: any) => {
        const tierA = a.source === "advisor" ? 0 : 1;
        const tierB = b.source === "advisor" ? 0 : 1;
        if (tierA !== tierB) return tierA - tierB;
        if (a.source === "ai") return (a.priority ?? 999) - (b.priority ?? 999);
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      })
      .slice(0, 3)
      .map((r: any) => ({ id: r.id, source: r.source, title: r.title, advisor_name: r.profiles?.full_name ?? null }));

    const { data: milestoneRows } = await supabase
      .from("milestones")
      .select("id, block_key, title, target_date, completed")
      .eq("assessment_id", latestScore.assessment_id)
      .eq("completed", false);

    topMilestones = (milestoneRows ?? [])
      .slice()
      .sort((a, b) => {
        if (!a.target_date) return 1;
        if (!b.target_date) return -1;
        return new Date(a.target_date).getTime() - new Date(b.target_date).getTime();
      })
      .slice(0, 3)
      .map((m) => ({
        id: m.id,
        title: m.title,
        target_date: m.target_date,
        blockLabel: m.block_key ? BLOCK_LABELS[m.block_key as BlockKey] ?? m.block_key : null,
      }));

    const { data: historyRows } = await supabase
      .from("scores")
      .select("created_at, venture_score, assessments!inner(founder_id)")
      .eq("assessments.founder_id", user.id)
      .order("created_at", { ascending: true });

    scoreHistory = (historyRows ?? []).map((r: any) => ({ date: r.created_at, score: r.venture_score }));
  }

  return (
    <main className="min-h-screen px-6 py-10 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-navy mb-6">Your Founder Trajectory™</h1>

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

          {ent.tools && <DashboardCustomizer initialWidgets={widgets} />}

          {showReminders && (overdueGoals.length > 0 || dueSoonGoals.length > 0) && (
            <div className="rounded border border-gold bg-cream p-4 text-sm">
              {overdueGoals.length > 0 && (
                <p className="text-red-700 font-semibold">
                  {overdueGoals.length} goal{overdueGoals.length > 1 ? "s" : ""} overdue.
                </p>
              )}
              {dueSoonGoals.length > 0 && (
                <p className="text-navy">
                  {dueSoonGoals.length} goal{dueSoonGoals.length > 1 ? "s" : ""} due in the next 14 days.
                </p>
              )}
            </div>
          )}

          {/* Standard view — always shown */}
          <div className="rounded border p-6">
            <p className="text-sm text-ink-soft">Venture Score</p>
            <p className="text-4xl font-bold text-navy">
              {latestScore.venture_score}
              <span className="text-lg font-normal text-ink-soft"> / 100</span>
            </p>
            <p className="text-gold font-semibold">{latestScore.venture_tier}</p>
          </div>

          {ent.readinessScores ? (
            <div className="grid grid-cols-3 gap-4">
              <Stat label="Market" value={latestScore.market_subscore} />
              <Stat label="Customer" value={latestScore.customer_subscore} />
              <Stat label="Investor" value={latestScore.investor_subscore} />
            </div>
          ) : (
            <Locked text="Market, Customer and Investor readiness scores, your valuation range and an AI market insight come with Growth." />
          )}

          <div className="rounded border p-4">
            <p className="text-sm text-ink-soft">Health Index</p>
            <p className="text-2xl font-bold">
              {latestScore.health_index} <span className="text-sm font-normal text-ink-soft">({latestScore.health_confidence} confidence)</span>
            </p>
          </div>

          {showProgressOverview && (
            <ProgressOverview
              topRecommendations={topRecommendations}
              topMilestones={topMilestones}
              statusCounts={statusCounts}
              scoreHistory={scoreHistory}
            />
          )}

          {ent.valuation && (showValuation || !m.tier) && latestScore.valuation_low != null && latestScore.valuation_high != null && (
            <div className="rounded border p-6 bg-navy text-white">
              <p className="text-sm text-cream/80">Estimated Business Value</p>
              <p className="text-3xl font-bold">
                ${Number(latestScore.valuation_low).toLocaleString()} – ${Number(latestScore.valuation_high).toLocaleString()}
              </p>
              <p className="text-xs text-cream/70 mt-2">{latestScore.valuation_basis}</p>
              <p className="text-xs text-cream/70 mt-2 italic">
                Directional estimate for your own planning, not a formal valuation, appraisal, or investment
                advice. Consult a qualified professional before relying on this for funding, a sale, or any
                legal purpose.
              </p>
            </div>
          )}

          {ent.tools && showGoalsProgress && blockResponses && blockResponses.some((b) => b.goal_target || b.target_date) && (
            <div className="rounded border p-4">
              <p className="font-semibold text-navy mb-1">Goals & Progress</p>
              <p className="text-xs text-ink-soft mb-2">
                Your own targets and dates from the assessment — update status any time.
              </p>
              <div>
                {blockResponses.filter((b) => b.goal_target || b.target_date).map((b) => (
                  <GoalProgressRow
                    key={b.id}
                    blockResponseId={b.id}
                    label={BLOCK_LABELS[b.block_key as BlockKey] ?? b.block_key}
                    goalTarget={b.goal_target ?? ""}
                    targetDate={b.target_date}
                    status={b.progress_status}
                    overdue={!!b.target_date && new Date(b.target_date).getTime() < now}
                  />
                ))}
              </div>
            </div>
          )}

          {detailsDone || existingReport ? (
            <ReportPanel
              assessmentId={latestScore.assessment_id}
              scoreId={latestScore.id}
              initialReport={existingReport ?? null}
              canUpgradeToFull={ent.fullReport}
            />
          ) : (
            <div className="rounded border border-gold p-6 bg-cream">
              <p className="font-semibold text-navy">One more step for your Readiness Report</p>
              <p className="text-sm text-ink-soft mt-1 mb-4">
                Answer a few detailed questions about your three weakest areas
                {gapLabels.length ? ` (${gapLabels.join(", ")})` : ""}. It takes about 10 minutes, sharpens your score, and lets
                your report and growth plan speak to your actual business. You'll also choose how far ahead your plan should go.
              </p>
              <a href="/assessment/details" className="rounded bg-navy px-5 py-3 text-white font-semibold inline-block">
                Answer the detailed questions
              </a>
            </div>
          )}

          {(m.coachingAvailable > 0 || ent.includedCoaching) && (
            <div className="rounded-2xl border p-5">
              <p className="font-semibold text-navy">One-on-one coaching</p>
              <p className="mt-1 text-sm text-ink-soft">
                {m.coachingAvailable > 0
                  ? `You have ${m.coachingAvailable} session${m.coachingAvailable > 1 ? "s" : ""} to book.`
                  : m.nextCoachingFrom
                  ? `Your next included sessions arrive on ${new Date(m.nextCoachingFrom).toLocaleDateString("en-GB", { day: "numeric", month: "long", timeZone: "UTC" })}.`
                  : "No sessions to book right now."}
              </p>
              <a href="/dashboard/subscribe#one-time" className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
                {m.coachingAvailable > 0 ? "Book a session" : "Buy extra sessions"}
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

          {referralCode && <InviteCard inviteUrl={`${publicAppUrl()}/?ref=${referralCode}&utm_source=referral&utm_medium=member`} rewardsEarned={(rewards ?? []).length} />}

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

function Locked({ text }: { text: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-gray-300 p-4 text-sm">
      <span className="text-ink-soft">{text}</span>
      <a href="/dashboard/subscribe" className="font-semibold text-teal">
        See Growth
      </a>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded border p-4 text-center">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="text-xl font-bold">{value}</p>
    </div>
  );
}
