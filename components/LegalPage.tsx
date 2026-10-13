import React from "react";

/** Shared layout for the privacy, terms and refund pages. */
export function LegalPage({ title, updated, children }: { title: string; updated: string; children: React.ReactNode }) {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal">Founder Trajectory™ · Renzolo Enterprises LLC</p>
      <h1 className="mt-2 text-3xl font-bold text-navy">{title}</h1>
      <p className="mt-1 text-sm text-ink-soft">Last updated {updated}</p>
      <div className="legal mt-8 space-y-4 rounded-2xl bg-white p-6 text-sm leading-relaxed shadow-sm sm:p-8">{children}</div>
    </main>
  );
}

export const H = ({ id, children }: { id?: string; children: React.ReactNode }) => (
  <h2 id={id} className="pt-4 text-lg font-bold text-navy">
    {children}
  </h2>
);
export const UL = ({ items }: { items: React.ReactNode[] }) => (
  <ul className="list-disc space-y-1 pl-5">
    {items.map((i, n) => (
      <li key={n}>{i}</li>
    ))}
  </ul>
);
export function contactEmail(): string {
  return process.env.NEXT_PUBLIC_SUPPORT_EMAIL || "the address on our Contact page";
}
