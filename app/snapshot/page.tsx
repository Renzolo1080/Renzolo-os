import { ReadinessSnapshotForm } from "@/components/ReadinessSnapshotForm";

export const metadata = { title: "Free Readiness Snapshot · RENZOLO OS" };

export default function SnapshotPage() {
  return (
      <main className="px-4 py-10 sm:px-6">
        <ReadinessSnapshotForm mode="public" />
      </main>
  );
}
