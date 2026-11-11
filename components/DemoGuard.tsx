"use client";
import { useEffect } from "react";

/** On the demo page, nothing is saved: any change a visitor makes is
 * answered locally with "ok" and never reaches the server. */
export function DemoGuard() {
  useEffect(() => {
    const real = window.fetch;
    window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const method = (init?.method ?? "GET").toUpperCase();
      const url = typeof input === "string" ? input : input instanceof URL ? input.href : input.url;
      if (method !== "GET" && url.includes("/api/")) {
        return new Response(JSON.stringify({ ok: true, demo: true }), { status: 200, headers: { "Content-Type": "application/json" } });
      }
      return real(input, init);
    };
    return () => {
      window.fetch = real;
    };
  }, []);
  return null;
}
