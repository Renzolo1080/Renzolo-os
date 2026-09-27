"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScheduleButton({ sessionId }: { sessionId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/advisor-session/${sessionId}/schedule`, { method: "PATCH" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded bg-gold px-4 py-2 text-navy text-sm font-semibold disabled:opacity-50"
    >
      {loading ? "Saving…" : "Mark Scheduled"}
    </button>
  );
}
