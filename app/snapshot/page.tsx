import { ReadinessSnapshotForm } from "@/components/ReadinessSnapshotForm";
import { SiteHeader } from "@/components/SiteHeader";

export const metadata = { title: "Free Readiness Snapshot · RENZOLO OS" };

export default function SnapshotPage() {
  return (
    <>
      <SiteHeader />
      <main className="min-h-screen px-4 py-10 sm:px-6">
        <ReadinessSnapshotForm mode="public" />
      </main>
    </>
  );
}
