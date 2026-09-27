const STATUS_ORDER = ["not_started", "on_track", "at_risk", "behind", "done"] as const;
const STATUS_LABELS: Record<string, string> = {
  not_started: "Not started",
  on_track: "On track",
  at_risk: "At risk",
  behind: "Behind",
  done: "Done",
};
const STATUS_BAR_COLORS: Record<string, string> = {
  not_started: "bg-gray-300",
  on_track: "bg-teal",
  at_risk: "bg-yellow-400",
  behind: "bg-red-500",
  done: "bg-green-500",
};

export interface TopRecommendation {
  id: string;
  source: "ai" | "advisor";
  title: string;
  advisor_name?: string | null;
}

export interface TopMilestone {
  id: string;
  title: string;
  target_date: string | null;
  blockLabel?: string | null;
}

export interface ScoreHistoryPoint {
  date: string;
  score: number;
}

/** A condensed "at a glance" view — NOT the full lists (those live on
 * /tools) — for a founder/CEO who wants the headline picture without
 * digging in: the 3 most important recommendations, the 3 nearest
 * milestones, and one chart of progress against their own goals. Kept
 * as a plain server component (no client JS) since nothing here is
 * interactive — SVG/CSS only. */
export function ProgressOverview({
  topRecommendations,
  topMilestones,
  statusCounts,
  scoreHistory,
}: {
  topRecommendations: TopRecommendation[];
  topMilestones: TopMilestone[];
  statusCounts: Record<string, number>;
  scoreHistory: ScoreHistoryPoint[];
}) {
  const maxCount = Math.max(1, ...STATUS_ORDER.map((s) => statusCounts[s] ?? 0));

  return (
    <div className="rounded border p-4 space-y-6">
      <div>
        <p className="font-semibold text-navy mb-2">Top Recommendations</p>
        {topRecommendations.length === 0 ? (
          <p className="text-sm text-ink-soft">None yet.</p>
        ) : (
          <ul className="space-y-1">
            {topRecommendations.map((r) => (
              <li key={r.id} className="text-sm flex items-start gap-2">
                <span
                  className={`inline-block text-xs font-semibold rounded px-1.5 py-0.5 mt-0.5 shrink-0 ${
                    r.source === "ai" ? "bg-teal/10 text-teal" : "bg-gold/20 text-navy"
                  }`}
                >
                  {r.source === "ai" ? "AI" : "Coach"}
                </span>
                <span>{r.title}</span>
              </li>
            ))}
          </ul>
        )}
        <a href="/tools" className="text-xs text-teal">
          See all recommendations →
        </a>
      </div>

      <div>
        <p className="font-semibold text-navy mb-2">Nearest Milestones</p>
        {topMilestones.length === 0 ? (
          <p className="text-sm text-ink-soft">None yet.</p>
        ) : (
          <ul className="space-y-1">
            {topMilestones.map((m) => {
              const overdue = m.target_date && new Date(m.target_date).getTime() < Date.now();
              return (
                <li key={m.id} className="text-sm flex justify-between gap-2">
                  <span>
                    {m.title}
                    {m.blockLabel && <span className="text-ink-soft"> · {m.blockLabel}</span>}
                  </span>
                  <span className={overdue ? "text-red-600 font-semibold shrink-0" : "text-ink-soft shrink-0"}>
                    {m.target_date ? new Date(m.target_date).toLocaleDateString() : "No date"}
                    {overdue ? " — OVERDUE" : ""}
                  </span>
                </li>
              );
            })}
          </ul>
        )}
        <a href="/tools" className="text-xs text-teal">
          See all milestones →
        </a>
      </div>

      <div>
        <p className="font-semibold text-navy mb-2">Progress Against Your Goals</p>
        <div className="space-y-1.5">
          {STATUS_ORDER.map((status) => {
            const count = statusCounts[status] ?? 0;
            return (
              <div key={status} className="flex items-center gap-2 text-xs">
                <span className="w-20 shrink-0 text-ink-soft">{STATUS_LABELS[status]}</span>
                <div className="flex-1 bg-gray-100 rounded h-3 overflow-hidden">
                  <div
                    className={`h-3 ${STATUS_BAR_COLORS[status]}`}
                    style={{ width: `${(count / maxCount) * 100}%` }}
                  />
                </div>
                <span className="w-4 text-right shrink-0">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="font-semibold text-navy mb-2">Venture Score Over Time</p>
        {scoreHistory.length < 2 ? (
          <p className="text-sm text-ink-soft">Complete another assessment to see your progress trend over time.</p>
        ) : (
          <ScoreTrendChart points={scoreHistory} />
        )}
      </div>
    </div>
  );
}

function ScoreTrendChart({ points }: { points: ScoreHistoryPoint[] }) {
  const width = 280;
  const height = 90;
  const padding = 12;
  const n = points.length;
  const coords = points.map((p, i) => {
    const x = padding + (i * (width - 2 * padding)) / (n - 1);
    const y = height - padding - (p.score / 100) * (height - 2 * padding);
    return { x, y, score: p.score, date: p.date };
  });
  const linePoints = coords.map((c) => `${c.x},${c.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-xs">
      <polyline points={linePoints} fill="none" stroke="#087F77" strokeWidth={2} />
      {coords.map((c, i) => (
        <circle key={i} cx={c.x} cy={c.y} r={3} fill="#071727" />
      ))}
      <text x={coords[0].x} y={height - 1} fontSize={9} fill="#6b7280">
        {new Date(coords[0].date).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
      </text>
      <text x={coords[n - 1].x} y={height - 1} fontSize={9} fill="#6b7280" textAnchor="end">
        {new Date(coords[n - 1].date).toLocaleDateString(undefined, { month: "short", year: "2-digit" })}
      </text>
      <text x={coords[n - 1].x} y={coords[n - 1].y - 6} fontSize={10} fill="#071727" textAnchor="end" fontWeight="bold">
        {coords[n - 1].score}
      </text>
    </svg>
  );
}
