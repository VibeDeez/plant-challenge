"use client";

const MILESTONES = [15, 25, 30];

function getLabel(current: number, target: number, complete: boolean): string {
  if (complete) return "Challenge complete!";
  if (current >= 25) return "Almost there!";
  if (current >= 15) return "Halfway hero!";
  const remaining = target - current;
  return `${remaining} more plant${remaining === 1 ? "" : "s"} to go`;
}

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
    <div className={`w-full ${complete ? "animate-celebrate rounded-2xl" : ""}`}>
      {/* Big number + percentage */}
      <div className="flex items-baseline gap-3 mb-3">
        <span
          className="text-6xl font-black tracking-tight text-brand-cream font-display"
        >
          {current % 1 === 0 ? current : current.toFixed(1)}
        </span>
        <span className="text-lg text-brand-cream/40 font-medium">
          / {target}
        </span>
        <span
          className={`ml-auto text-2xl font-bold tabular-nums ${
            complete ? "text-brand-green" : current >= 25 ? "text-brand-rose-light" : "text-brand-cream"
          }`}
        >
          {pctDisplay}%
        </span>
      </div>

      {/* Fill meter — thickened to 6px */}
      <div className="relative w-full h-1.5 rounded-full bg-brand-cream/10 overflow-hidden">
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

      {/* Milestone dots */}
      <div className="relative w-full h-4 mt-1">
        {MILESTONES.map((m) => {
          const pos = (m / target) * 100;
          const reached = current >= m;
          return (
            <div
              key={m}
              className="absolute top-0 flex flex-col items-center -translate-x-1/2"
              style={{ left: `${pos}%` }}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  reached ? "bg-brand-green" : "bg-brand-cream/20"
                }`}
              />
              <span className={`text-[9px] mt-0.5 ${reached ? "text-brand-cream/60" : "text-brand-cream/20"}`}>
                {m}
              </span>
            </div>
          );
        })}
      </div>

      {/* Label */}
      <p className="mt-1 text-sm text-brand-cream/40">
        {getLabel(current, target, complete)}
      </p>
    </div>
  );
}
