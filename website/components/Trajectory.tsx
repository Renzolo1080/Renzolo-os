import { STAGES } from "@/lib/site";

/** The eight Founder Trajectory(TM) stages on a rising curve: the site's
 * signature image. The line draws itself once on load (not when the
 * visitor prefers reduced motion). */
const W = 1000;
const H = 440;

const points = STAGES.map((_, i) => {
  const t = i / (STAGES.length - 1);
  return { x: 60 + t * (W - 140), y: H - 60 - Math.pow(t, 1.7) * (H - 130) };
});

/** Smooth curve through the points (Catmull-Rom converted to Béziers). */
function curve(p: { x: number; y: number }[]): string {
  let d = `M ${p[0].x} ${p[0].y}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[i - 1] ?? p[i];
    const p1 = p[i];
    const p2 = p[i + 1];
    const p3 = p[i + 2] ?? p2;
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += ` C ${c1.x.toFixed(1)} ${c1.y.toFixed(1)}, ${c2.x.toFixed(1)} ${c2.y.toFixed(1)}, ${p2.x.toFixed(1)} ${p2.y.toFixed(1)}`;
  }
  return d;
}

export function Trajectory() {
  const d = curve(points);
  return (
    <figure className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" role="img" aria-labelledby="traj-title">
        <defs>
          <linearGradient id="traj-grad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#E8603C" />
            <stop offset="50%" stopColor="#F4B740" />
            <stop offset="100%" stopColor="#22B8B0" />
          </linearGradient>
        </defs>
        <title id="traj-title">The Founder Trajectory: Discover, Validate, Build, Acquire, Prepare, Fund, Scale, Exit</title>
        {[0.25, 0.5, 0.75].map((f) => (
          <line key={f} x1="40" x2={W - 40} y1={H - 60 - f * (H - 130)} y2={H - 60 - f * (H - 130)} stroke="#122D44" strokeWidth="1" />
        ))}
        <path d={d} fill="none" stroke="#122D44" strokeWidth="14" strokeLinecap="round" />
        <path className="trajectory-path" d={d} fill="none" stroke="url(#traj-grad)" strokeWidth="5" strokeLinecap="round" />
        {points.map((p, i) => (
          <g key={STAGES[i]}>
            <circle
              className="trajectory-dot"
              style={{ animationDelay: `${0.3 + (i / (STAGES.length - 1)) * 2.2}s`, transformOrigin: `${p.x}px ${p.y}px` }}
              cx={p.x}
              cy={p.y}
              r={i === STAGES.length - 1 ? 13 : 10}
              fill={i === STAGES.length - 1 ? "#22B8B0" : "#071727"}
              stroke="#E3C27E"
              strokeWidth="4"
            />
            <text
              x={p.x}
              y={i < 2 ? p.y + 46 : p.y - 26}
              textAnchor={i === STAGES.length - 1 ? "end" : "middle"}
              className="hidden fill-white font-display sm:inline"
              style={{ fontSize: 24, fontWeight: 700 }}
            >
              {STAGES[i]}
            </text>
          </g>
        ))}
      </svg>
      <figcaption className="mt-4 flex flex-wrap gap-x-3 gap-y-1 text-sm text-mist sm:hidden">
        {STAGES.map((s, i) => (
          <span key={s}>
            {i + 1}. {s}
          </span>
        ))}
      </figcaption>
    </figure>
  );
}
