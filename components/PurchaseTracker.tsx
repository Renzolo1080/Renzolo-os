"use client";
import { useEffect } from "react";
import { track } from "@/lib/track";

/** Reports a confirmed purchase to analytics once (per payment). */
export function PurchaseTracker({ id, value, currency, item }: { id: string; value: number; currency: string; item: string }) {
  useEffect(() => {
    try {
      const key = `rz_tracked_${id}`;
      if (sessionStorage.getItem(key)) return;
      sessionStorage.setItem(key, "1");
    } catch {}
    track("purchase", { value, currency, item, transaction_id: id });
  }, [id, value, currency, item]);
  return null;
}
