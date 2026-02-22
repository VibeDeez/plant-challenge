"use client";

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
  const medal =
    rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : null;

  return (
    <div
      className={`flex items-center gap-3 rounded-xl px-4 py-3 ${
        isFamily
          ? "bg-green-50 border border-green-200"
          : "bg-white border border-gray-100"
      }`}
    >
      <div className="w-8 text-center">
        {medal ? (
          <span className="text-lg">{medal}</span>
        ) : (
          <span className="text-sm font-medium text-gray-400">{rank}</span>
        )}
      </div>
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {displayName}
        </p>
        {isFamily && (
          <p className="text-xs text-green-600">Family</p>
        )}
      </div>
      <div className="text-right">
        <p className="text-sm font-bold text-gray-900">
          {points % 1 === 0 ? points : points.toFixed(2)}
        </p>
        <p className="text-xs text-gray-400">pts</p>
      </div>
    </div>
  );
}
