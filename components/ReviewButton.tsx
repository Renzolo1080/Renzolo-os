"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export function ReviewButton({ reportId }: { reportId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    await fetch(`/api/report/${reportId}/review`, { method: "PATCH" });
    setLoading(false);
    router.refresh();
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="rounded bg-teal px-4 py-2 text-white text-sm font-semibold disabled:opacity-50"
    >
      {loading ? "Saving…" : "Mark Reviewed"}
    </button>
  );
}
