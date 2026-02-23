"use client";

import Image from "next/image";

const PODIUM_ILLUSTRATIONS = [
  "/illustrations/strawberry.png",
  "/illustrations/vegetables.png",
  "/illustrations/legumes.png",
];

const RANK_COLORS: Record<number, { text: string; bg: string; accent: string }> = {
  1: { text: "#b8860b", bg: "rgba(184,134,11,0.08)", accent: "rgba(184,134,11,0.18)" },
  2: { text: "#8a8a8a", bg: "rgba(138,138,138,0.06)", accent: "rgba(138,138,138,0.15)" },
  3: { text: "#a0522d", bg: "rgba(160,82,45,0.06)", accent: "rgba(160,82,45,0.15)" },
};

export default function LeaderboardRow({
  rank,
  displayName,
  emoji,
  points,
  isFamily,
}: {
  rank: number;
  displayName: string;
  emoji: string;
  points: number;
  isFamily: boolean;
}) {
  const pointsDisplay = points % 1 === 0 ? points : points.toFixed(2);
  const progress = Math.min(points / 30, 1);
  const isPodium = rank <= 3;
  const isHero = rank === 1;
  const rankColor = RANK_COLORS[rank];

  // --- HERO CARD (1st place) ---
  if (isHero) {
    return (
      <div
        className={`relative overflow-hidden rounded-3xl border ${
          isFamily
            ? "border-brand-green/30 shadow-[0_0_24px_rgba(34,197,94,0.12)]"
            : "border-brand-dark/10"
        }`}
        style={{ backgroundColor: rankColor.bg }}
      >
        {/* Background botanical illustration */}
        <div className="absolute inset-0 flex items-center justify-end pointer-events-none">
          <Image
            src={PODIUM_ILLUSTRATIONS[0]}
            alt=""
            width={280}
            height={280}
            className="object-contain illo-accent translate-x-8"
          />
        </div>

        {/* Glassmorphic overlay */}
        <div className="relative bg-white/30 backdrop-blur-sm p-5">
          <div className="flex items-start gap-4">
            {/* Rank badge */}
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: rankColor.accent }}
            >
              <span
                className="text-3xl font-bold font-display"
                style={{ color: rankColor.text }}
              >
                1
              </span>
            </div>

            {/* Name and emoji */}
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{emoji}</span>
                <div className="min-w-0">
                  <p
                    className="text-lg font-bold text-brand-dark truncate font-display"
                  >
                    {displayName}
                  </p>
                  {isFamily && (
                    <p className="text-xs font-medium text-brand-green">Your family</p>
                  )}
                </div>
              </div>
            </div>

            {/* Points */}
            <div className="text-right shrink-0">
              <p
                className="text-3xl font-bold text-brand-dark font-display"
              >
                {pointsDisplay}
              </p>
              <p className="text-xs text-brand-muted">points</p>
            </div>
          </div>

          {/* Progress bar */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-1.5">
              <p className="text-[11px] text-brand-muted">Progress to 30</p>
              <p className="text-[11px] font-semibold text-brand-dark">
                {Math.round(progress * 100)}%
              </p>
            </div>
            <div className="relative w-full h-2.5 rounded-full bg-brand-dark/[0.06] overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-full transition-all duration-700 ease-out"
                style={{
                  width: `${Math.max(progress * 100, 2)}%`,
                  backgroundColor: progress >= 1 ? "#22c55e" : rankColor.text,
                  boxShadow:
                    progress >= 1
                      ? "0 0 12px rgba(34,197,94,0.4)"
                      : undefined,
                }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- PODIUM CARDS (2nd & 3rd) ---
  if (isPodium && rankColor) {
    return (
      <div
        className={`relative overflow-hidden rounded-2xl border ${
          isFamily
            ? "border-brand-green/25 shadow-[0_0_16px_rgba(34,197,94,0.08)]"
            : "border-brand-dark/10"
        }`}
        style={{ backgroundColor: rankColor.bg }}
      >
        {/* Subtle botanical bg */}
        <div className="absolute right-0 top-0 bottom-0 flex items-center pointer-events-none">
          <Image
            src={PODIUM_ILLUSTRATIONS[rank - 1]}
            alt=""
            width={160}
            height={160}
            className="object-contain illo-accent translate-x-4"
          />
        </div>

        <div className="relative bg-white/30 backdrop-blur-sm px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            {/* Rank badge */}
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: rankColor.accent }}
            >
              <span
                className="text-xl font-bold font-display"
                style={{ color: rankColor.text }}
              >
                {rank}
              </span>
            </div>

            {/* Avatar */}
            <span className="text-xl">{emoji}</span>

            {/* Name */}
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-brand-dark truncate">
                {displayName}
              </p>
              {isFamily && (
                <p className="text-[11px] font-medium text-brand-green">Your family</p>
              )}
            </div>

            {/* Points + mini progress */}
            <div className="text-right shrink-0">
              <p
                className="text-xl font-bold text-brand-dark font-display"
              >
                {pointsDisplay}
              </p>
              <div className="mt-1 w-16 h-1.5 rounded-full bg-brand-dark/[0.06] overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-700 ease-out"
                  style={{
                    width: `${Math.max(progress * 100, 3)}%`,
                    backgroundColor: progress >= 1 ? "#22c55e" : rankColor.text,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- STANDARD ROWS (4th+) ---
  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
        isFamily
          ? "bg-brand-green/[0.06] border border-brand-green/20"
          : "bg-white border border-brand-dark/[0.06]"
      }`}
    >
      {/* Rank number */}
      <div className="w-8 text-center">
        <span className="text-sm font-medium text-brand-muted">{rank}</span>
      </div>

      {/* Avatar */}
      <span className="text-xl">{emoji}</span>

      {/* Name */}
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-brand-dark truncate">{displayName}</p>
        {isFamily && (
          <p className="text-[11px] font-medium text-brand-green">Your family</p>
        )}
      </div>

      {/* Points + mini progress */}
      <div className="flex items-center gap-3">
        <div className="w-12 h-1.5 rounded-full bg-brand-dark/[0.06] overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700 ease-out"
            style={{
              width: `${Math.max(progress * 100, 3)}%`,
              backgroundColor: progress >= 1 ? "#22c55e" : "#1a3a2a",
              opacity: progress >= 1 ? 1 : 0.3,
            }}
          />
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-brand-dark">{pointsDisplay}</p>
          <p className="text-[10px] text-brand-muted">pts</p>
        </div>
      </div>
    </div>
  );
}
