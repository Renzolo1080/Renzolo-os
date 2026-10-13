"use client";
import { useState } from "react";

/** WhatsApp, LinkedIn, Facebook, X and copy-link buttons for a URL. */
export function ShareButtons({ url, text, dark = false }: { url: string; text: string; dark?: boolean }) {
  const [copied, setCopied] = useState(false);
  const u = encodeURIComponent(url);
  const t = encodeURIComponent(text);
  const links = [
    { name: "WhatsApp", href: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}` },
    { name: "LinkedIn", href: `https://www.linkedin.com/sharing/share-offsite/?url=${u}` },
    { name: "Facebook", href: `https://www.facebook.com/sharer/sharer.php?u=${u}` },
    { name: "X", href: `https://twitter.com/intent/tweet?text=${t}&url=${u}` },
  ];
  const base = dark ? "border-cream/40 text-white" : "border-navy text-navy";
  return (
    <div className="flex flex-wrap gap-2">
      {links.map((l) => (
        <a key={l.name} href={l.href} target="_blank" rel="noopener noreferrer" className={`rounded-lg border px-3 py-2 text-sm font-semibold ${base}`}>
          {l.name}
        </a>
      ))}
      <button
        type="button"
        onClick={async () => {
          try {
            await navigator.clipboard.writeText(url);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
          } catch {
            window.prompt("Copy this link", url);
          }
        }}
        className={`rounded-lg border px-3 py-2 text-sm font-semibold ${base}`}
      >
        {copied ? "Copied" : "Copy link"}
      </button>
    </div>
  );
}
