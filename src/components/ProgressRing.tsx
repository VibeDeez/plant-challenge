"use client";

export default function ProgressRing({
  current,
  target = 30,
}: {
  current: number;
  target?: number;
}) {
  const pct = Math.min(current / target, 1);
  const r = 54;
  const circumference = 2 * Math.PI * r;
  const offset = circumference * (1 - pct);

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width="140" height="140" className="-rotate-90">
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="10"
        />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={pct >= 1 ? "#16a34a" : "#22c55e"}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500"
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-gray-900">
          {current % 1 === 0 ? current : current.toFixed(2)}
        </div>
        <div className="text-xs text-gray-500">/ {target} pts</div>
      </div>
    </div>
  );
}
