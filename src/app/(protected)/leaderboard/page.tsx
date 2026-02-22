"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart, getWeekLabel } from "@/lib/weekUtils";
import { useApp } from "@/components/ProtectedLayout";
import LeaderboardRow from "@/components/LeaderboardRow";

type LeaderboardEntry = {
  member_id: string;
  display_name: string;
  avatar_emoji: string;
  user_id: string;
  total_points: number;
};

const supabase = createClient();

export default function LeaderboardPage() {
  const { userId } = useApp();
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const weekStart = getWeekStart();

  const fetchLeaderboard = useCallback(async () => {
    setLoading(true);

    const { data: logs, error } = await supabase
      .from("plant_log")
      .select("member_id, points, member(display_name, avatar_emoji, user_id)")
      .eq("week_start", weekStart);

    if (error || !logs) {
      setLoading(false);
      return;
    }

    // Aggregate by member
    const map = new Map<string, LeaderboardEntry>();
    for (const log of logs) {
      const member = log.member as unknown as {
        display_name: string;
        avatar_emoji: string;
        user_id: string;
      } | null;
      if (!member) continue;

      const existing = map.get(log.member_id);
      if (existing) {
        existing.total_points += log.points;
      } else {
        map.set(log.member_id, {
          member_id: log.member_id,
          display_name: member.display_name,
          avatar_emoji: member.avatar_emoji,
          user_id: member.user_id,
          total_points: log.points,
        });
      }
    }

    const sorted = Array.from(map.values()).sort(
      (a, b) => b.total_points - a.total_points
    );
    setEntries(sorted);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  return (
    <div className="px-4 pt-4">
      <h1 className="text-lg font-bold text-gray-900 mb-1">Leaderboard</h1>
      <p className="text-xs text-gray-500 mb-4">{getWeekLabel(weekStart)}</p>

      {loading ? (
        <div className="text-center text-gray-400 py-8 text-sm">
          Loading...
        </div>
      ) : entries.length === 0 ? (
        <div className="text-center py-8">
          <div className="text-4xl mb-2">🏆</div>
          <p className="text-sm text-gray-500">
            No entries yet this week. Start logging plants!
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {entries.map((entry, i) => (
            <LeaderboardRow
              key={entry.member_id}
              rank={i + 1}
              displayName={entry.display_name}
              emoji={entry.avatar_emoji}
              points={entry.total_points}
              isFamily={entry.user_id === userId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
