import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { loadMembership } from "@/lib/membership-server";
import { entitlements } from "@/lib/membership";
import { DocumentIntake, type DocRow } from "@/components/DocumentIntake";

export const metadata = { title: "Lender documents · Founder Trajectory™" };

/** Capital readiness: check the documents a lender will ask for. */
export default async function DocumentsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const m = await loadMembership(supabase, user.id);
  const allowed = entitlements(m.tier, m.purchases.length > 0).planBuilder;
  const { data: rows } = allowed
    ? await supabase.from("document_extractions").select("id, doc_type, file_name, result, created_at").eq("founder_id", user.id).order("created_at", { ascending: false }).limit(50)
    : { data: [] };
  return (
    <main className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-wide text-brand-text">Capital readiness</p>
      <h1 className="mt-1 text-3xl font-bold text-navy">Are your documents lender-ready?</h1>
      <p className="mt-2 max-w-2xl text-ink-soft">
        Upload the documents lenders and grant panels ask for. Our AI reads each one, pulls out the figures they look at, and flags what they'd query: too few months,
        out of date, expired or unclear.
      </p>
      <div className="mt-8">
        {allowed ? (
          <DocumentIntake initial={(rows ?? []) as DocRow[]} today={new Date().toISOString().slice(0, 10)} />
        ) : (
          <div className="rounded-2xl bg-white p-6 shadow-sm">
            <p className="text-navy">Document checks come with every membership and the one-time Readiness Assessment.</p>
            <a href="/dashboard/subscribe" className="mt-3 inline-block rounded-pill bg-brand px-5 py-2.5 font-semibold text-on-brand">
              See membership options
            </a>
          </div>
        )}
      </div>
      <p className="mt-10 text-xs leading-5 text-ink-soft">
        <b>Guidance only.</b> AI can misread documents; always check the figures against the original. These checks reflect what lenders commonly ask for and are not a credit
        decision.
      </p>
    </main>
  );
}
