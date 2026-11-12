"use client";
import { useEffect, useState } from "react";
import { APP_URL } from "@/lib/site";

/** Prices for the visitor's region, from the app (lib/region.ts there).
 * The website is static, so it can't tell where a visitor is; the app
 * works it out from their connection and returns only their prices. */
type Prices = {
  zone: "africa" | "intl";
  assessment: string | null;
  tiers: Record<"essentials" | "growth" | "elevate", { quarterly: string | null; perMonth: string | null; annual: string | null }>;
};

let cache: Promise<Prices | null> | null = null;
function load(): Promise<Prices | null> {
  if (!cache) {
    cache = fetch(`${APP_URL}/api/prices`, { cache: "no-store" })
      .then((r) => (r.ok ? (r.json() as Promise<Prices>) : null))
      .catch(() => null);
  }
  return cache;
}

export type PriceKey = "assessment" | `${"essentials" | "growth" | "elevate"}.${"quarterly" | "perMonth" | "annual"}`;

function read(p: Prices, k: PriceKey): string | null {
  if (k === "assessment") return p.assessment;
  const [tier, field] = k.split(".") as ["essentials" | "growth" | "elevate", "quarterly" | "perMonth" | "annual"];
  return p.tiers[tier]?.[field] ?? null;
}

/** One price for this visitor. Shows a short placeholder while loading. */
export function Price({ k }: { k: PriceKey }) {
  const [v, setV] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let live = true;
    load().then((p) => {
      if (!live) return;
      const x = p ? read(p, k) : null;
      if (x) setV(x);
      else setFailed(true);
    });
    return () => {
      live = false;
    };
  }, [k]);
  if (v) return <>{v}</>;
  return <span aria-label={failed ? "See pricing" : "Loading price"} className="inline-block min-w-[2.5ch] animate-pulse rounded bg-current/10 align-middle">{failed ? "—" : " "}</span>;
}
