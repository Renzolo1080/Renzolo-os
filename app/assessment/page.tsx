import { ReadinessSnapshotForm } from "@/components/ReadinessSnapshotForm";

/** A signed-in founder takes (or retakes) the Readiness Snapshot; the
 * result is saved to their account. Login is enforced by the proxy (proxy.ts). */
export default function AssessmentPage() {
  return (
    <main className="min-h-screen px-4 py-10 sm:px-6">
      <ReadinessSnapshotForm mode="member" />
    </main>
  );
}
