import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { loadLatestAssessment, loadPlan } from "@/lib/plan-server";
import { briefRefresh, type MarketInsights } from "@/lib/market";
import { allActions } from "@/lib/plan";
import { BLOCK_LABELS, type BlockKey } from "@/lib/scoring";
import { ReportMarkdown } from "@/components/ReportMarkdown";
import { MarketGenerate, AddToPlan } from "@/components/MarketActions";

export const dynamic = "force-dynamic";

const fmt = (iso: string) => new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
const VERDICT: Record<string, string> = { realistic: "bg-teal text-on-brand", stretch: "bg-brand text-on-brand", unrealistic: "bg-red-600 text-on-brand" };

/** Market Intelligence: a researched brief on the founder's industry in
 * their country, written to strengthen their strategic plan. */
export default async function MarketPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const m = await loadMembership(supabase, user.id);
  const ent = entitlements(m.tier, m.purchases.length > 0);
  const latest = await loadLatestAssessment(supabase, user.id);
  if (!latest) redirect("/assessment");

  const industry = String(latest.assessment?.industry ?? "");
  const country = String(latest.assessment?.geography ?? "");

  if (!ent.marketIntel) {
    return (
      <main className="mx-auto min-h-screen max-w-3xl px-4 py-10 sm:px-6">
        <a href="/dashboard" className="text-sm text-teal">
          ← Back to dashboard
        </a>
        <h1 className="mt-3 text-3xl font-bold text-navy">Market Intelligence</h1>
        <div className="mt-6 rounded-2xl bg-navy p-6 text-white">
          <p className="text-lg font-semibold">Live research on {industry || "your industry"} in {country || "your country"}, built around your plan</p>
          <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-cream/90">
            <li>Market size, trends, customers, competitors and pricing benchmarks, with sources</li>
            <li>Funding options and the rules that apply to businesses like yours</li>
            <li>Recommendations for your plan, which you can add in one tap</li>
            <li>A reality check on each of your targets</li>
            <li>Refreshed every month</li>
          </ul>
          <a href="/dashboard/subscribe" className="mt-5 inline-block rounded-lg bg-brand px-5 py-3 font-semibold text-on-brand">
            See Growth
          </a>
          <p className="mt-3 text-xs text-cream/70">Included with Growth, Elevate and the one-time Readiness Assessment.</p>
        </div>
      </main>
    );
  }

  const [{ data: briefs }, planRow] = await Promise.all([
    supabase.from("market_briefs").select("id, industry, country, markdown, sources, insights, created_at, plan_updated_at").order("created_at", { ascending: false }).limit(10),
    loadPlan(supabase, user.id),
  ]);
  const brief = briefs?.[0] ?? null;
  const refresh = briefRefresh(briefs ?? [], { industry, country });
  const insights = (brief?.insights ?? { recommendations: [], targets: [] }) as MarketInsights;
  const planTexts = new Set(planRow ? allActions(planRow.data).map((a) => a.text.toLowerCase()) : []);
  const goalTitle = (id: string) => planRow?.data.goals.find((g) => g.id === id)?.title ?? "";
  const planChanged = brief && planRow && (!brief.plan_updated_at || new Date(planRow.updated_at) > new Date(brief.plan_updated_at));
  const sources = ((brief?.sources as { title: string; url: string }[] | null) ?? []).filter((s) => /^https?:\/\//.test(s.url));

  return (
    <main className="mx-auto min-h-screen max-w-5xl px-4 py-10 sm:px-6">
      <a href="/dashboard" className="text-sm text-teal">
        ← Back to dashboard
      </a>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-navy">Market Intelligence</h1>
          <p className="mt-1 text-ink-soft">
            {industry} · {country}
            {brief ? ` · researched ${fmt(brief.created_at)}` : ""}
          </p>
        </div>
        <MarketGenerate
          label={brief ? "Refresh my brief" : "Create my market brief"}
          disabledReason={refresh.allowed ? null : `${refresh.reason ?? ""}${refresh.nextAt ? ` Next refresh: ${fmt(refresh.nextAt)}.` : ""}`}
        />
      </div>
      {!planRow && (
        <p className="mt-6 rounded-lg border border-gold/60 bg-cream p-4 text-sm">
          Tip: <a href="/plan" className="font-semibold text-teal underline">build your plan</a> first. The brief then checks your goals against the market and
          recommends changes to your plan.
        </p>
      )}
      {planChanged && <p className="mt-6 rounded-lg border border-teal/40 bg-white p-3 text-sm">You've changed your plan since this brief was written. It will use your latest plan when it next refreshes.</p>}

      {!brief ? (
        <div className="mt-8 rounded-2xl bg-white p-6 shadow-sm">
          <p className="font-semibold text-navy">What you'll get</p>
          <p className="mt-1 text-sm text-ink-soft">
            Live research on your market (size, trends, customers, competitors, pricing, funding and rules) with sources, then recommendations for your plan
            and a reality check on your targets. It takes 2 to 3 minutes and refreshes monthly.
          </p>
        </div>
      ) : (
        <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
          <article className="min-w-0 rounded-2xl bg-white p-6 shadow-sm">
            <ReportMarkdown markdown={brief.markdown} />
          </article>
          <aside className="space-y-6">
            {insights.recommendations.length > 0 && (
              <div className="rounded-2xl bg-navy p-5 text-white">
                <p className="font-semibold">For your plan</p>
                <ul className="mt-3 space-y-4">
                  {insights.recommendations.map((r, i) => (
                    <li key={i} className="text-sm">
                      <p className="text-xs uppercase tracking-wide text-gold">
                        {r.area !== "general" ? BLOCK_LABELS[r.area as BlockKey] ?? r.area : "General"}
                        {r.goalId && goalTitle(r.goalId) ? ` · ${goalTitle(r.goalId)}` : ""}
                      </p>
                      <p className="mt-0.5 font-medium">{r.action}</p>
                      <p className="mt-0.5 text-xs text-cream/75">{r.why}</p>
                      {r.area !== "general" && planRow && (
                        <div className="mt-2 rounded bg-white/95 px-2 py-1">
                          <AddToPlan area={r.area} text={r.action} alreadyInPlan={planTexts.has(r.action.toLowerCase())} />
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {insights.targets.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="font-semibold text-navy">Your targets vs the market</p>
                <ul className="mt-3 space-y-3">
                  {insights.targets.map((t, i) => (
                    <li key={i} className="text-sm">
                      <span className={`mr-2 rounded px-1.5 py-0.5 text-xs font-semibold capitalize ${VERDICT[t.verdict]}`}>{t.verdict}</span>
                      <span className="font-medium">{goalTitle(t.goalId)}</span>
                      <p className="mt-1 text-xs text-ink-soft">{t.comment}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {sources.length > 0 && (
              <div className="rounded-2xl bg-white p-5 shadow-sm">
                <p className="font-semibold text-navy">Sources read</p>
                <ul className="mt-2 space-y-1.5 text-xs">
                  {sources.slice(0, 12).map((s) => (
                    <li key={s.url}>
                      <a href={s.url} target="_blank" rel="noopener noreferrer nofollow" className="text-teal underline">
                        {s.title}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </aside>
        </div>
      )}
    </main>
  );
}
