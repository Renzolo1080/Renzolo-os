"use client";

import { useEffect, useRef, useState } from "react";

/** Tabs across the offer pages. The row stays pinned under the header and,
 * on the Founder Trajectory page, highlights the section you're reading.
 * The only movement is the highlight itself, so nothing extra to switch off
 * for reduced motion. */
export const OFFERS = [
  ["assessment", "Assessment", "/founder-trajectory/#assessment"],
  ["membership", "Membership", "/founder-trajectory/#membership"],
  ["coaching", "Coaching", "/founder-trajectory/#coaching"],
  ["academy", "Academy", "/academy/"],
] as const;

type Key = (typeof OFFERS)[number][0];

export function OfferTabs({ current, spy = false }: { current: Key; spy?: boolean }) {
  const [active, setActive] = useState<Key>(current);
  const [top, setTop] = useState(0);
  const nav = useRef<HTMLElement>(null);

  // Sit directly under the sticky header, whatever its height on this screen.
  useEffect(() => {
    const header = document.getElementById("site-header");
    if (!header) return;
    const fit = () => setTop(header.getBoundingClientRect().height);
    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  // Highlight the section in view (Founder Trajectory page only).
  useEffect(() => {
    if (!spy) return;
    const ids: Key[] = ["assessment", "membership", "coaching"];
    const els = ids.map((id) => document.getElementById(id)).filter(Boolean) as HTMLElement[];
    const pick = () => {
      const line = top + (nav.current?.offsetHeight ?? 0) + 24;
      let on: Key = ids[0];
      for (const el of els) if (el.getBoundingClientRect().top <= line) on = el.id as Key;
      setActive(on);
    };
    pick();
    window.addEventListener("scroll", pick, { passive: true });
    window.addEventListener("resize", pick);
    return () => {
      window.removeEventListener("scroll", pick);
      window.removeEventListener("resize", pick);
    };
  }, [spy, top]);

  // On a phone, keep the highlighted tab in view inside the row.
  useEffect(() => {
    const row = nav.current?.querySelector("ul");
    const pill = row?.querySelector<HTMLElement>("[aria-current]");
    if (!row || !pill) return;
    const l = pill.offsetLeft - 12, r = pill.offsetLeft + pill.offsetWidth + 12;
    if (l < row.scrollLeft) row.scrollLeft = l;
    else if (r > row.scrollLeft + row.clientWidth) row.scrollLeft = r - row.clientWidth;
  }, [active]);

  return (
    <nav ref={nav} aria-label="Our offers" style={{ top }} className="sticky z-20 border-b border-line bg-surface/95 backdrop-blur">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-3 py-2">
        {OFFERS.map(([key, label, href]) => {
          const on = key === active;
          return (
            <li key={key} className="shrink-0">
              <a
                href={href}
                aria-current={on ? "true" : undefined}
                className={`inline-flex rounded-pill px-4 py-2 text-sm font-semibold transition-colors duration-200 ${on ? "bg-ink text-surface" : "text-ink-muted hover:bg-surface-tint hover:text-ink"}`}
              >
                {label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
