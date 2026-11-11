import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { cohortRows, cohortsForPartner, partnersForUser } from "@/lib/partner-server";
import { impactSummary } from "@/lib/partner";

export const metadata = { title: "Partner portal · RENZOLO OS™" };
export const dynamic = "force-dynamic";

/** Partner portal home: the partner's cohorts, join codes and headline progress. */
export default async function PartnerHome() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return <main className="p-10">Partner portal not configured.</main>;
  const admin = createAdminClient();
  const partners = await partnersForUser(admin, user.id);
  if (partners.length === 0)
    return (
      <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
        <h1 className="text-2xl font-bold text-navy">Partner portal</h1>
        <p className="mt-2 text-ink-soft">This account isn't linked to a partner organisation. If you sponsor a RENZOLO programme, contact hello@renzoloenterprises.com.</p>
      </main>
    );
  const sections = await Promise.all(
    partners.map(async (p) => ({
      partner: p,
      cohorts: await Promise.all((await cohortsForPartner(admin, p.id)).map(async (c: any) => ({ cohort: c, summary: impactSummary(await cohortRows(admin, c.id)) }))),
    }))
  );
  return (
    <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">Partner portal</p>
      {sections.map(({ partner, cohorts }) => (
        <section key={partner.id} className="mt-2">
          <h1 className="text-3xl font-bold text-navy">{partner.name}</h1>
          {cohorts.length === 0 && <p className="mt-4 text-ink-soft">No programmes yet. Your RENZOLO contact will set up your first cohort.</p>}
          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {cohorts.map(({ cohort, summary }) => (
              <article key={cohort.id} className="rounded-2xl bg-white p-5 shadow-sm">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <h2 className="text-lg font-semibold text-navy">{cohort.name}</h2>
                  <span className="text-xs text-ink-soft">{cohort.open ? "Open" : "Closed"} · code {cohort.join_code}</span>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-3 text-center">
                  <div className="rounded-lg bg-cream p-3">
                    <dt className="text-xs text-ink-soft">Founders</dt>
                    <dd className="text-2xl font-bold text-navy">{summary.members}</dd>
                  </div>
                  <div className="rounded-lg bg-cream p-3">
                    <dt className="text-xs text-ink-soft">Avg. readiness</dt>
                    <dd className="text-2xl font-bold text-navy">{summary.avgScore ?? "—"}</dd>
                  </div>
                  <div className="rounded-lg bg-cream p-3">
                    <dt className="text-xs text-ink-soft">Avg. change</dt>
                    <dd className="text-2xl font-bold text-navy">{summary.avgChange === null ? "—" : `${summary.avgChange > 0 ? "+" : ""}${summary.avgChange}`}</dd>
                  </div>
                </dl>
                <p className="mt-3 text-xs text-ink-soft">Invite link: /partner/join?code={cohort.join_code}</p>
                <a href={`/partner/report/${cohort.id}`} className="mt-3 inline-block rounded-lg bg-navy px-4 py-2 text-sm font-semibold text-white">
                  Open impact report
                </a>
              </article>
            ))}
          </div>
        </section>
      ))}
    </main>
  );
}
