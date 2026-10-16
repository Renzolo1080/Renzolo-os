/** Brand-refresh visuals (Oct 2026): "navy and gold, with sunrise energy".
 * Everything is drawn in code or uses real product screens, so the site
 * never relies on stock photos. The same file is mirrored in the app at
 * components/brand/Visuals.tsx; keep the two in step. */

export const OUTCOMES = [
  { key: "customers", label: "Win customers", note: "Buyer- and contract-ready", color: "#E8603C" },
  { key: "capital", label: "Qualify for capital", note: "Loans, credit and grants", color: "#F4B740" },
  { key: "investors", label: "Attract investors", note: "Investors and partners", color: "#22B8B0" },
] as const;

/** The signature gradient: coral to sunrise to lagoon. */
export function GradientDefs({ id }: { id: string }) {
  return (
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="0">
        <stop offset="0%" stopColor="#E8603C" />
        <stop offset="50%" stopColor="#F4B740" />
        <stop offset="100%" stopColor="#22B8B0" />
      </linearGradient>
    </defs>
  );
}

/** Soft coloured light behind dark sections. Decorative. */
export function Glow({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden="true" className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`}>
      <div className="glow-orb absolute -left-24 top-10 h-72 w-72 rounded-full bg-coral/25 blur-3xl" />
      <div className="glow-orb glow-orb-2 absolute right-[-6rem] top-1/3 h-96 w-96 rounded-full bg-lagoon/20 blur-3xl" />
      <div className="glow-orb absolute bottom-[-8rem] left-1/3 h-80 w-80 rounded-full bg-sunrise/15 blur-3xl" />
      <div
        className="absolute inset-0 opacity-[0.07]"
        style={{ backgroundImage: "radial-gradient(#E3C27E 1px, transparent 1px)", backgroundSize: "22px 22px" }}
      />
    </div>
  );
}

/** Original geometric band, inspired by the rhythm of African textiles
 * without copying any particular cloth. Used as a divider. */
export function SignalBand({ className = "", dark = false }: { className?: string; dark?: boolean }) {
  const id = dark ? "signal-dark" : "signal-light";
  const base = dark ? "#071727" : "#F7F4EE";
  return (
    <svg aria-hidden="true" className={`block h-5 w-full ${className}`} preserveAspectRatio="none">
      <defs>
        <pattern id={id} width="96" height="20" patternUnits="userSpaceOnUse">
          <rect width="96" height="20" fill={base} />
          <rect x="0" y="0" width="24" height="20" fill="#C18B2C" />
          <path d="M24 0 L36 10 L24 20 Z" fill="#E8603C" />
          <path d="M36 10 L48 0 L48 20 Z" fill="#F4B740" />
          <rect x="52" y="4" width="4" height="12" fill="#22B8B0" />
          <rect x="60" y="4" width="4" height="12" fill="#22B8B0" />
          <path d="M68 20 L78 4 L88 20 Z" fill="#087F77" />
          <rect x="90" y="0" width="6" height="20" fill="#122D44" />
        </pattern>
      </defs>
      <rect width="100%" height="20" fill={`url(#${id})`} />
    </svg>
  );
}

/** A score ring filled with the signature gradient. */
export function ScoreRing({ value, size = 64, label }: { value: number; size?: number; label?: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const id = `ring-${size}-${value}`;
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} role="img" aria-label={label ?? `${value} out of 100`}>
      <GradientDefs id={id} />
      <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(201,211,220,.25)" strokeWidth="7" />
      <circle
        className="ring-fill"
        cx="32"
        cy="32"
        r={r}
        fill="none"
        stroke={`url(#${id})`}
        strokeWidth="7"
        strokeLinecap="round"
        strokeDasharray={`${(value / 100) * c} ${c}`}
        transform="rotate(-90 32 32)"
        style={{ ["--ring-len" as string]: `${(value / 100) * c}` }}
      />
      <text x="32" y="37" textAnchor="middle" fontSize="16" fontWeight="800" fill="currentColor" fontFamily="inherit">
        {value}
      </text>
    </svg>
  );
}

/** The three outcomes every founder chooses from. */
export function OutcomeChips({ className = "" }: { className?: string }) {
  return (
    <ul className={`flex flex-wrap gap-2 ${className}`}>
      {OUTCOMES.map((o) => (
        <li key={o.key} className="flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-4 py-2 text-sm font-semibold text-white backdrop-blur">
          <span aria-hidden="true" className="h-2.5 w-2.5 rounded-full" style={{ background: o.color, boxShadow: `0 0 12px ${o.color}` }} />
          {o.label}
        </li>
      ))}
    </ul>
  );
}

/** Real RENZOLO OS screens in a laptop and a phone, with floating cards.
 * Screens are from the demo account (sample business "Owusu Farms"). */
export function ProductShowcase({ className = "" }: { className?: string }) {
  return (
    <div className={`relative mx-auto w-full max-w-[640px] pb-16 pt-6 ${className}`}>
      {/* Laptop */}
      <div className="relative rounded-2xl border border-white/10 bg-[#0d2236] p-2 shadow-[0_30px_80px_-20px_rgba(0,0,0,.7)]">
        <div className="flex items-center gap-1.5 px-2 pb-2">
          <span className="h-2.5 w-2.5 rounded-full bg-coral/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-sunrise/80" />
          <span className="h-2.5 w-2.5 rounded-full bg-lagoon/80" />
          <span className="ml-3 truncate rounded-md bg-white/5 px-3 py-0.5 text-[10px] text-mist">app.renzoloenterprises.com/dashboard</span>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/screen-dashboard.jpg" alt="The RENZOLO OS dashboard: revenue, customers, cash, Venture Score and goals, target against actual" className="block w-full rounded-lg" width={1280} height={800} />
      </div>

      {/* Phone */}
      <div className="float-b absolute -bottom-2 right-[-4%] w-[34%] min-w-[130px] rounded-[1.6rem] border-[5px] border-[#0b1b2b] bg-[#0b1b2b] shadow-[0_25px_60px_-15px_rgba(0,0,0,.8)] sm:right-[-8%]">
        <div className="mx-auto mb-1 mt-0.5 h-1.5 w-12 rounded-full bg-white/15" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/img/phone-aicoach.jpg" alt="The AI coach on a phone, answering a pricing question and suggesting a dated action" className="block w-full rounded-[1.1rem]" width={520} height={1125} />
      </div>

      {/* Floating cards */}
      <div className="float-a absolute -left-3 top-0 flex items-center gap-3 rounded-2xl border border-white/10 bg-navy/90 px-4 py-3 text-white shadow-xl backdrop-blur sm:-left-10">
        <ScoreRing value={78} size={52} label="Venture Score 78 out of 100" />
        <div>
          <p className="text-[11px] uppercase tracking-wider text-mist">Venture Score</p>
          <p className="font-display text-sm font-bold">
            62 <span className="text-sunrise">→ 78</span> in 90 days
          </p>
        </div>
      </div>
      <div className="float-c absolute -left-2 bottom-6 hidden rounded-2xl bg-white px-4 py-3 shadow-xl sm:block sm:-left-8">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-teal">Goal on track</p>
        <p className="mt-0.5 text-sm font-bold text-navy">Supply 3 supermarket chains</p>
        <div className="mt-2 h-1.5 w-44 overflow-hidden rounded-full bg-mist/50">
          <div className="h-full w-2/3 rounded-full" style={{ background: "linear-gradient(90deg,#E8603C,#F4B740,#22B8B0)" }} />
        </div>
      </div>
    </div>
  );
}

/** A real screen in a browser frame, for feature sections. */
export function Screen({ src, alt, className = "" }: { src: string; alt: string; className?: string }) {
  return (
    <div className={`rounded-2xl border border-navy/10 bg-white p-2 shadow-[0_20px_50px_-20px_rgba(7,23,39,.35)] ${className}`}>
      <div className="flex gap-1.5 px-2 pb-2">
        <span className="h-2 w-2 rounded-full bg-coral/70" />
        <span className="h-2 w-2 rounded-full bg-sunrise/70" />
        <span className="h-2 w-2 rounded-full bg-lagoon/70" />
      </div>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt={alt} className="block w-full rounded-lg" width={1280} height={800} />
    </div>
  );
}

/** Portrait slot: a real photo when supplied, otherwise a monogram on the
 * signature gradient (never a stock photo). */
export function Portrait({ name, photo, className = "" }: { name: string; photo?: string; className?: string }) {
  if (photo) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={photo} alt={name} className={`rounded-3xl object-cover ${className}`} />;
  }
  const initials = name.split(" ").map((w) => w[0]).filter((ch) => /[A-Z]/.test(ch)).slice(0, 2).join("");
  return (
    <div
      aria-hidden="true"
      className={`relative flex items-center justify-center overflow-hidden rounded-3xl ${className}`}
      style={{ background: "linear-gradient(135deg,#071727 0%,#122D44 55%,#087F77 100%)" }}
    >
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-sunrise/30 blur-2xl" />
      <div className="absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-coral/30 blur-2xl" />
      <span className="relative font-display text-6xl font-extrabold text-white" style={{ fontWeight: 800 }}>
        {initials}
      </span>
    </div>
  );
}

/** A scrolling ticker of short phrases. Decorative copy is repeated for the
 * loop; screen readers get it once. */
export function Marquee({ items, className = "" }: { items: string[]; className?: string }) {
  const row = (hidden: boolean) => (
    <ul aria-hidden={hidden || undefined} className="flex shrink-0 items-center">
      {items.map((t) => (
        <li key={t} className="flex items-center whitespace-nowrap px-6 font-display text-lg font-bold md:text-xl">
          {t}
          <svg aria-hidden="true" viewBox="0 0 20 20" className="ml-12 h-4 w-4">
            <path d="M10 0 L12.5 7.5 L20 10 L12.5 12.5 L10 20 L7.5 12.5 L0 10 L7.5 7.5 Z" fill="currentColor" />
          </svg>
        </li>
      ))}
    </ul>
  );
  return (
    <div className={`overflow-hidden py-4 ${className}`}>
      <div className="marquee">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}

/** Rotating word for headlines (first word shows when motion is off). */
export function Rotator({ words, className = "" }: { words: string[]; className?: string }) {
  return (
    <span className={`rotator ${className}`}>
      {words.map((w) => (
        <span key={w}>{w}</span>
      ))}
    </span>
  );
}

export function Arrow({ className = "h-5 w-5" }: { className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}
