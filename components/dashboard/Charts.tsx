/** Small SVG charts for the dashboard. No client JavaScript. */

const TEAL = "#087F77";
const NAVY = "#071727";
const GOLD = "#C18B2C";
const GREY = "#9CA3AF";

export function Sparkline({ values, width = 96, height = 28, label }: { values: number[]; width?: number; height?: number; label: string }) {
  if (values.length < 2) return null;
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * (width - 4) + 2},${height - 2 - ((v - min) / range) * (height - 4)}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height}`} width={width} height={height} role="img" aria-label={label}>
      <polyline points={pts} fill="none" stroke={TEAL} strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
}

const dayNum = (d: string) => Date.parse(`${d.slice(0, 10)}T00:00:00Z`) / 864e5;
const shortDate = (d: string) => new Date(`${d.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });

/** A goal's expected path (straight line from baseline to target) against
 * the actual check-ins. */
export function GoalChart({
  baseline,
  target,
  start,
  due,
  points,
  title,
}: {
  baseline: number;
  target: number;
  start: string;
  due: string;
  points: { date: string; value: number }[];
  title: string;
}) {
  const w = 300;
  const h = 120;
  const pad = { l: 8, r: 8, t: 10, b: 18 };
  const x0 = dayNum(start || points[0]?.date || due);
  const x1 = Math.max(dayNum(due), ...points.map((p) => dayNum(p.date)), x0 + 1);
  const values = [baseline, target, ...points.map((p) => p.value)];
  const lo = Math.min(...values);
  const hi = Math.max(...values);
  const span = hi - lo || 1;
  const X = (d: number) => pad.l + ((d - x0) / (x1 - x0)) * (w - pad.l - pad.r);
  const Y = (v: number) => h - pad.b - ((v - lo) / span) * (h - pad.t - pad.b);
  const today = X(Math.min(x1, Math.max(x0, Date.now() / 864e5)));
  const actual = points.filter((p) => dayNum(p.date) >= x0 - 365);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={`${title}: expected path and actual progress`}>
      <line x1={today} x2={today} y1={pad.t - 4} y2={h - pad.b} stroke={GREY} strokeDasharray="2 3" />
      <line x1={X(x0)} y1={Y(baseline)} x2={X(dayNum(due))} y2={Y(target)} stroke={GOLD} strokeWidth={2} strokeDasharray="5 4" />
      <circle cx={X(dayNum(due))} cy={Y(target)} r={4} fill={GOLD} />
      {actual.length > 0 && (
        <polyline points={[{ date: start || actual[0].date, value: baseline }, ...actual].map((p) => `${X(dayNum(p.date))},${Y(p.value)}`).join(" ")} fill="none" stroke={TEAL} strokeWidth={2.5} strokeLinejoin="round" />
      )}
      {actual.map((p, i) => (
        <circle key={i} cx={X(dayNum(p.date))} cy={Y(p.value)} r={3} fill={NAVY} />
      ))}
      <text x={pad.l} y={h - 4} fontSize={9} fill={GREY}>
        {shortDate(start || actual[0]?.date || due)}
      </text>
      <text x={w - pad.r} y={h - 4} fontSize={9} fill={GREY} textAnchor="end">
        {shortDate(due)}
      </text>
    </svg>
  );
}

export function LineChart({ points, label, format = (n: number) => String(n), height = 110 }: { points: { label: string; value: number }[]; label: string; format?: (n: number) => string; height?: number }) {
  if (points.length < 2) return <p className="text-sm text-ink-soft">Not enough data for a trend yet.</p>;
  const w = 300;
  const h = height;
  const pad = { l: 6, r: 6, t: 16, b: 16 };
  const vals = points.map((p) => p.value);
  const lo = Math.min(0, ...vals);
  const hi = Math.max(...vals);
  const span = hi - lo || 1;
  const X = (i: number) => pad.l + (i / (points.length - 1)) * (w - pad.l - pad.r);
  const Y = (v: number) => h - pad.b - ((v - lo) / span) * (h - pad.t - pad.b);
  const last = points[points.length - 1];
  return (
    <svg viewBox={`0 0 ${w} ${h}`} className="w-full" role="img" aria-label={label}>
      <polyline points={points.map((p, i) => `${X(i)},${Y(p.value)}`).join(" ")} fill="none" stroke={TEAL} strokeWidth={2.5} strokeLinejoin="round" />
      {points.map((p, i) => (
        <circle key={i} cx={X(i)} cy={Y(p.value)} r={2.5} fill={NAVY} />
      ))}
      <text x={X(points.length - 1)} y={Y(last.value) - 6} fontSize={10} fontWeight="bold" fill={NAVY} textAnchor="end">
        {format(last.value)}
      </text>
      <text x={pad.l} y={h - 3} fontSize={9} fill={GREY}>
        {points[0].label}
      </text>
      <text x={w - pad.r} y={h - 3} fontSize={9} fill={GREY} textAnchor="end">
        {last.label}
      </text>
    </svg>
  );
}

/** Horizontal bars, 0-100. */
export function Bars({ rows }: { rows: { label: string; value: number; highlight?: boolean }[] }) {
  return (
    <div className="space-y-2">
      {rows.map((r) => (
        <div key={r.label} className="grid grid-cols-[minmax(0,9rem)_1fr_2rem] items-center gap-2 text-xs">
          <span className={`truncate ${r.highlight ? "font-semibold text-navy" : "text-ink-soft"}`}>{r.label}</span>
          <div className="h-2.5 overflow-hidden rounded bg-gray-100">
            <div className={`h-2.5 ${r.value >= 70 ? "bg-teal" : r.value >= 45 ? "bg-gold" : "bg-red-500"}`} style={{ width: `${Math.max(2, Math.min(100, r.value))}%` }} />
          </div>
          <span className="text-right font-semibold">{Math.round(r.value)}</span>
        </div>
      ))}
    </div>
  );
}
