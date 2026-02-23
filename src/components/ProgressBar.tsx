"use client";

export default function ProgressBar({
  current,
  target = 30,
}: {
  current: number;
  target?: number;
}) {
  const pct = Math.min(current / target, 1);
  const pctDisplay = Math.round(pct * 100);
  const complete = pct >= 1;

  return (
    <div className="w-full">
      {/* Big number + percentage */}
      <div className="flex items-baseline gap-3 mb-3">
        <span
          className="text-6xl font-black tracking-tight text-brand-cream"
          style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
        >
          {current % 1 === 0 ? current : current.toFixed(1)}
        </span>
        <span className="text-lg text-brand-cream/40 font-medium">
          / {target}
        </span>
        <span
          className="ml-auto text-2xl font-bold tabular-nums"
          style={{ color: complete ? "#22c55e" : "#f5f0e8" }}
        >
          {pctDisplay}%
        </span>
      </div>

      {/* Fill meter */}
      <div className="relative w-full h-3 rounded-full bg-brand-cream/10 overflow-hidden">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
          style={{
            width: `${Math.max(pct * 100, 1)}%`,
            backgroundColor: "#22c55e",
            boxShadow: complete
              ? "0 0 16px rgba(34,197,94,0.5)"
              : undefined,
          }}
        />
      </div>

      {/* Label */}
      <p className="mt-2 text-sm text-brand-cream/40">
        {complete
          ? "Challenge complete"
          : `${target - current} more plant${target - current === 1 ? "" : "s"} to go`}
      </p>
    </div>
  );
}
