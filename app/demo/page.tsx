import { FounderDashboard } from "@/components/dashboard/FounderDashboard";
import { DemoGuard } from "@/components/DemoGuard";
import { demoData } from "@/lib/demo-data";

export const metadata = { title: "Demo dashboard · Founder Trajectory™", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

/** A public demo of the founder dashboard, for sales demos (Nov 11 2026).
 * The founder and business are invented; no real data is read, and
 * nothing a visitor changes is saved (components/DemoGuard.tsx). */

export default function DemoPage() {
  const d = demoData();
  return (
    <main className="mx-auto min-h-screen max-w-6xl px-4 py-10 sm:px-6">
      <DemoGuard />
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-navy px-5 py-4 text-white">
        <p className="text-sm">
          <b>Demo:</b> a sample founder, Amani of Amani Foods (Kenya), a Growth member. The business is invented. Click around: nothing you change is saved.
        </p>
        <a href="/snapshot" className="rounded-pill bg-brand px-5 py-2.5 text-sm font-bold text-on-brand">
          Get your own score free
        </a>
      </div>
      <h1 className="text-2xl font-bold text-navy">Your Founder Trajectory™</h1>
      <span aria-hidden="true" className="mb-6 mt-2 block h-1 w-24 rounded-full bg-brand" />
      <FounderDashboard {...d} />
    </main>
  );
}
