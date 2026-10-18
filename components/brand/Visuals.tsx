/** RENZOLO Vibrant building blocks (see design/renzolo-vibrant/brand-book.md).
 * Server components only; interactive pieces live in BrandClient.tsx.
 * Mirrors website/components/Visuals.tsx: keep the two in step. */

/** The three outcomes, in the fixed order and accents the brand book sets. */
export const OUTCOMES = [
  { key: "customers", num: "01", label: "Customers", title: "Win more customers", text: "Prove your offer and get ready for buyers, tenders and supplier programmes.", fill: "bg-brand text-on-brand" },
  { key: "capital", num: "02", label: "Capital", title: "Access credit and grants", text: "Get your plan, numbers and records lender-ready.", fill: "bg-gold text-on-gold" },
  { key: "investors", num: "03", label: "Investors", title: "Attract investment", text: "Show investors and partners a business that is ready to grow.", fill: "bg-teal text-on-teal" },
] as const;

/** Uppercase label above a section headline. `dark` for night bands. */
export function Eyebrow({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <p className={`text-[13px] font-bold uppercase leading-[18px] tracking-[0.08em] text-brand-text ${className}`}>{children}</p>;
}

/** Pill button with the playful offset shadow (primary / secondary) or a link. */
export function Button({
  href,
  children,
  variant = "primary",
  className = "",
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "link";
  className?: string;
}) {
  if (variant === "link") {
    return (
      <a href={href} className={`font-semibold text-teal-text underline underline-offset-4 ${className}`}>
        {children}
      </a>
    );
  }
  const fill = variant === "primary" ? "bg-brand text-on-brand" : "bg-surface-raised text-ink";
  return (
    <a
      href={href}
      className={`btn-pop inline-flex items-center justify-center gap-2 rounded-pill border-2 border-ink px-6 py-3 text-base font-semibold ${fill} ${className}`}
    >
      {children}
    </a>
  );
}

/** Ambient light for the hero and night bands: one or two slow glows, static
 * under reduced motion. Decorative. */
export function Glow({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="ambient absolute -left-24 top-0 h-80 w-80 rounded-full bg-brand/10 blur-3xl" />
      <div className="ambient ambient-2 absolute -right-24 bottom-0 h-96 w-96 rounded-full bg-gold/10 blur-3xl" />
    </div>
  );
}

/** Faint dot grid for dark bands. */
export function DotGrid() {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0"
      style={{ backgroundImage: "radial-gradient(var(--glass-edge) 1px, transparent 1px)", backgroundSize: "24px 24px" }}
    />
  );
}

/** The hero motif: staggered brand / gold / teal blocks rising left to right. */
export function TrajectoryBlocks({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none flex items-end gap-3 ${className}`}>
      <span className="rise-block block h-24 w-1/3 rounded-panel bg-brand" style={{ animationDelay: "0.35s" }} />
      <span className="rise-block block h-40 w-1/3 rounded-panel bg-gold" style={{ animationDelay: "0.45s" }} />
      <span className="rise-block block h-56 w-1/3 rounded-panel bg-teal" style={{ animationDelay: "0.55s" }} />
    </div>
  );
}

/** The three outcome cards: the only cards that carry the offset shadow. */
export function OutcomeCards({ hrefFor }: { hrefFor: (key: string) => string }) {
  return (
    <div className="grid gap-6 md:grid-cols-3">
      {OUTCOMES.map((o) => (
        <a key={o.key} href={hrefFor(o.key)} className="card-pop group block rounded-card border border-line bg-surface-raised p-6 md:p-8">
          <span className={`flex h-12 w-12 items-center justify-center rounded-card font-display text-xl font-extrabold ${o.fill}`}>{o.num}</span>
          <Eyebrow className="mt-4">{o.label}</Eyebrow>
          <h3 className="mt-1 font-display text-[22px] font-bold leading-7">{o.title}</h3>
          <p className="mt-2 text-ink-muted">{o.text}</p>
          <span className="mt-4 inline-block font-semibold text-teal-text underline underline-offset-4">See how</span>
        </a>
      ))}
    </div>
  );
}

/** Compact outcome chips (used on dark heroes). */
export function OutcomeChips({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {OUTCOMES.map((o) => (
        <li key={o.key} className={`rounded-pill px-4 py-2 text-sm font-semibold ${o.fill}`}>
          {o.title}
        </li>
      ))}
    </ul>
  );
}

/** A real product screen, framed. */
export function Screen({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`overflow-hidden rounded-panel border border-line bg-surface-raised shadow-soft ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block w-full" width={1280} height={800} loading="lazy" decoding="async" />
    </div>
  );
}

/** Portrait slot: a real photo when supplied, otherwise the wordmark initials
 * (never a stock or AI-generated face). */
export function Portrait({ name, photo, className = "" }: { name: string; photo?: string; className?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} className={`rounded-panel object-cover ${className}`} />;
  }
  const initials = name.split(" ").map((w) => w[0]).filter((ch) => /[A-Z]/.test(ch)).slice(0, 2).join("");
  return (
    <div aria-hidden="true" className={`relative flex items-end overflow-hidden rounded-panel bg-surface-tint ${className}`}>
      <div className="absolute inset-x-6 bottom-0 flex items-end gap-2">
        <span className="block h-16 w-1/3 rounded-t-card bg-brand" />
        <span className="block h-28 w-1/3 rounded-t-card bg-gold" />
        <span className="block h-40 w-1/3 rounded-t-card bg-teal" />
      </div>
      <span className="relative m-6 font-display text-6xl font-extrabold text-ink">{initials}</span>
    </div>
  );
}

/** Thin brand rule used as a section divider. */
export function SignalBand({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`flex h-1.5 w-full ${className}`}>
      <span className="flex-1 bg-brand" />
      <span className="flex-1 bg-gold" />
      <span className="flex-1 bg-teal" />
    </div>
  );
}

export function Arrow({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

/** Score ring (dashboard): teal progress on a quiet track, number in mono. */
export function ScoreRing({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={label ?? `${value} out of 100`}>
      <circle cx="32" cy="32" r={r} fill="none" stroke="currentColor" strokeOpacity="0.2" strokeWidth="7" />
      <circle className="ring-fill" cx="32" cy="32" r={r} fill="none" stroke="var(--teal)" strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(value / 100) * c} ${c}`} transform="rotate(-90 32 32)" />
      <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="600" fill="currentColor" style={{ fontFamily: "var(--font-mono)" }}>
        {value}
      </text>
    </svg>
  );
}
