import { redirect } from "next/navigation";
import { createClient, createAdminClient } from "@/lib/supabase/server";
import { NOT_SHARED, SHARED_WITH_PARTNER, normalizeCode, validCode } from "@/lib/partner";
import { PartnerJoin, StopSharing } from "@/components/PartnerJoin";

export const metadata = { title: "Join a programme · Founder Trajectory™" };

/** A founder joins a partner's cohort with its code, choosing to share
 * their readiness progress; they can see and stop every share here. */
export default async function PartnerJoinPage({ searchParams }: { searchParams?: Promise<Record<string, string | string[] | undefined>> }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const sp = (await searchParams) ?? {};
  const code = normalizeCode(Array.isArray(sp.code) ? sp.code[0] : sp.code);
  const admin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createAdminClient() : null;
  const { data: cohort } =
    admin && validCode(code) ? await admin.from("partner_cohorts").select("id, name, open, partners(name)").eq("join_code", code).maybeSingle() : { data: null };
  const { data: mine } = await supabase.from("cohort_members").select("cohort_id, consented_at").eq("founder_id", user.id);
  const myIds = (mine ?? []).map((m: any) => m.cohort_id);
  const { data: myCohorts } = admin && myIds.length ? await admin.from("partner_cohorts").select("id, name, partners(name)").in("id", myIds) : { data: [] };

  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">Partner programmes</p>
      {cohort && cohort.open ? (
        <>
          <h1 className="mt-1 text-3xl font-bold text-navy">Join {cohort.name}</h1>
          <p className="mt-2 text-ink-soft">
            {(cohort as any).partners?.name} is supporting founders through Founder Trajectory™. Joining lets them follow your readiness progress, so they can support you
            and report on the programme.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold text-navy">What they'll see</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {SHARED_WITH_PARTNER.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl bg-white p-5 shadow-sm">
              <p className="font-semibold text-navy">What stays private</p>
              <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
                {NOT_SHARED.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="mt-6">
            {myIds.includes(cohort.id) ? (
              <p className="rounded-2xl bg-cream p-5 text-navy">You've already joined this programme.</p>
            ) : (
              <PartnerJoin code={code} partnerName={(cohort as any).partners?.name ?? "the partner"} cohortName={cohort.name} />
            )}
          </div>
        </>
      ) : (
        <>
          <h1 className="mt-1 text-3xl font-bold text-navy">Join a programme</h1>
          <p className="mt-2 text-ink-soft">{code ? "We couldn't find an open programme with that code. Check it with the organisation that invited you." : "Enter the code from the organisation that invited you."}</p>
          <form className="mt-4 flex gap-2" action="/partner/join">
            <input name="code" defaultValue={code} placeholder="e.g. AGENCY27" className="w-48 rounded-lg border border-gray-300 px-3 py-2 uppercase" />
            <button className="rounded-lg bg-navy px-4 py-2 font-semibold text-white">Continue</button>
          </form>
        </>
      )}

      {(myCohorts ?? []).length > 0 && (
        <section className="mt-10 rounded-2xl bg-white p-5 shadow-sm">
          <h2 className="font-semibold text-navy">Who you're sharing with</h2>
          <ul className="mt-3 divide-y">
            {(myCohorts ?? []).map((c: any) => (
              <li key={c.id} className="flex items-center justify-between gap-3 py-2 text-sm">
                <span>
                  {c.partners?.name} · {c.name}
                </span>
                <StopSharing cohortId={c.id} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
