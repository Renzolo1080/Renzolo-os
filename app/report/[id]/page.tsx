import { createClient } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import { ReportMarkdown } from "@/components/ReportMarkdown";
import { PrintButton } from "@/components/PrintButton";

export const dynamic = "force-dynamic";

/** A clean, printable copy of a full Readiness Report: "Save as PDF" from
 * the browser's print dialog downloads it. Row-level security decides
 * who can read the report (its owner while a member, or for good when
 * bought with the one-time assessment). Summary reports aren't offered
 * for download. */
export default async function ReportPrintPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: report } = await supabase
    .from("reports")
    .select("id, diagnostic_markdown, level, created_at, assessments(extra)")
    .eq("id", params.id)
    .maybeSingle();
  if (!report || report.level === "summary") notFound();
  const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single();
  const company = (report as any).assessments?.extra?.companyName as string | undefined;

  return (
    <main className="mx-auto max-w-3xl bg-white px-6 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <a href="/dashboard" className="text-sm text-teal">
          ← Back to dashboard
        </a>
        <PrintButton />
      </div>
      <header className="border-b-2 border-gold pb-4">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Founder Trajectory™ · Powered by RENZOLO OS™</p>
        <h1 className="mt-2 text-3xl font-bold text-navy">Readiness Report</h1>
        <p className="mt-1 text-sm text-ink-soft">
          {[profile?.full_name, company].filter(Boolean).join(" · ")}
          {" · "}
          {new Date(report.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
        </p>
      </header>
      <ReportMarkdown markdown={report.diagnostic_markdown} />
      <p className="mt-8 border-t pt-4 text-xs text-ink-soft">
        AI-drafted report for your own planning. Market figures and the valuation range are directional, not formal advice or a valuation.
      </p>
    </main>
  );
}
