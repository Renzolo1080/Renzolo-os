import { notFound, redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cohortRows, partnersForUser } from "@/lib/partner-server";
import { impactSummary } from "@/lib/partner";
import { PrintButton } from "@/components/PrintButton";

export const metadata = { title: "Impact report · RENZOLO OS™" };
export const dynamic = "force-dynamic";

/** A cohort's impact report for its partner: readiness at a glance, then
 * one row per founder who chose to share. Printable. */
export default async function ImpactReport({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) notFound();
  const admin = createAdminClient();
  const { data: cohort } = await admin.from("partner_cohorts").select("id, name, partner_id, partners(name)").eq("id", id).maybeSingle();
  if (!cohort) notFound();
  const { data: me } = await admin.from("profiles").select("role").eq("id", user.id).maybeSingle();
  const allowed = me?.role === "admin" || (await partnersForUser(admin, user.id)).some((p) => p.id === cohort.partner_id);
  if (!allowed) notFound();

  const rows = await cohortRows(admin, id);
  const s = impactSummary(rows);
  const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
  const tile = (label: string, value: string, sub?: string) => (
    <div className="rounded-xl bg-cream p-4">
      <p className="text-xs text-ink-soft">{label}</p>
      <p className="text-3xl font-bold text-navy">{value}</p>
      {sub && <p className="text-xs text-ink-soft">{sub}</p>}
    </div>
  );
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">Impact report · {today}</p>
          <h1 className="mt-1 text-3xl font-bold text-navy">{cohort.name}</h1>
          <p className="text-ink-soft">{(cohort as any).partners?.name} · Founder Trajectory™, powered by RENZOLO OS™</p>
        </div>
        <div className="print:hidden">
          <PrintButton />
        </div>
      </div>

      <section className="mt-8 grid grid-cols-2 gap-3 md:grid-cols-4">
        {tile("Founders taking part", String(s.members), `${s.scored} with a readiness score`)}
        {tile("Average Total Readiness Score", s.avgScore === null ? "—" : String(s.avgScore), s.avgBaseline === null ? undefined : `${s.avgBaseline} when they joined`)}
        {tile("Average change", s.avgChange === null ? "—" : `${s.avgChange > 0 ? "+" : ""}${s.avgChange}`, `${s.improved} founder${s.improved === 1 ? "" : "s"} improved`)}
        {tile("Plans ready to act on", String(s.plansReady), `${s.assessmentsComplete} full assessments done`)}
      </section>

      {Object.keys(s.byBand).length > 0 && (
        <section className="mt-6 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-navy">Where founders stand</h2>
          <ul className="mt-3 flex flex-wrap gap-3 text-sm">
            {["Ready", "Nearly ready", "Getting ready", "Not yet"].map((b) => (
              <li key={b} className="rounded-full bg-cream px-4 py-1.5">
                <span className="font-semibold text-navy">{s.byBand[b] ?? 0}</span> {b}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="mt-6 overflow-x-auto rounded-2xl bg-white p-5 shadow-sm">
        <h2 className="font-semibold text-navy">Founders</h2>
        {rows.length === 0 ? (
          <p className="mt-2 text-sm text-ink-soft">No founders have joined yet. Share the invite link with your cohort.</p>
        ) : (
          <table className="mt-3 w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase text-ink-soft">
              <tr>
                <th className="py-2">Founder</th>
                <th>Readiness</th>
                <th>Change</th>
                <th>Assessment</th>
                <th>Plan</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {rows.map((r, i) => (
                <tr key={i}>
                  <td className="py-2">
                    <span className="font-medium text-navy">{r.name}</span>
                    {r.company && <span className="block text-xs text-ink-soft">{r.company}</span>}
                  </td>
                  <td>{r.score === null ? "Not assessed yet" : `${r.score} · ${r.band}`}</td>
                  <td>{r.change === null ? "—" : `${r.change > 0 ? "+" : ""}${r.change}`}</td>
                  <td>{r.assessmentPct}%</td>
                  <td>{r.planPct}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <p className="mt-8 text-xs leading-5 text-ink-soft">
        Only founders who chose to share are included, and only their scores and progress: never their answers, documents or coaching notes. Readiness scores are
        guidance, not a guarantee of any contract, credit or investment outcome. Contracts won, capital raised and jobs created will be added as founders report them.
      </p>
    </main>
  );
}
