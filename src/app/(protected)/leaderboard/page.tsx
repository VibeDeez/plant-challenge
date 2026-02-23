"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart, getWeekLabel } from "@/lib/weekUtils";
import { useApp } from "@/components/ProtectedLayout";
import LeaderboardRow from "@/components/LeaderboardRow";
import { Trophy } from "lucide-react";
import Image from "next/image";

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
  const weekStart = useMemo(() => getWeekStart(), []);

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
    type MemberJoin = { display_name: string; avatar_emoji: string; user_id: string };
    const map = new Map<string, LeaderboardEntry>();
    for (const log of logs) {
      // Supabase FK join — runtime guarantees single object, SDK types as array
      const raw = log.member as unknown;
      const member = (Array.isArray(raw) ? raw[0] : raw) as MemberJoin | null;
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
    <>
      {/* === DARK GREEN HEADER === */}
      <div className="relative bg-brand-dark overflow-hidden grain">
        {/* Background botanical watermark */}
        <div className="absolute -right-6 -bottom-6 pointer-events-none">
          <Image
            src="/illustrations/strawberry.png"
            alt=""
            width={160}
            height={160}
            className="object-contain opacity-[0.10]"
            priority
          />
        </div>

        <div className="relative px-5 pt-6 pb-5">
          <div className="max-w-lg mx-auto">
            {/* Trophy icon + title */}
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-cream/10">
                <Trophy size={20} className="text-brand-cream/60" strokeWidth={1.75} />
              </div>
              <div>
                <h1
                  className="text-2xl font-bold text-brand-cream"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  Leaderboard
                </h1>
                <p className="text-xs text-brand-cream/40 mt-0.5">
                  {getWeekLabel(weekStart)}
                </p>
              </div>
            </div>

            {/* Summary line */}
            {!loading && entries.length > 0 && (
              <p className="text-[13px] text-brand-cream/30 mt-3">
                {entries.length} {entries.length === 1 ? "participant" : "participants"} this week
              </p>
            )}
          </div>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="bg-brand-bg min-h-[60vh] grain-light">
        <div className="max-w-lg mx-auto px-5 py-4">
          {loading ? (
            /* --- Loading spinner --- */
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
              <p className="mt-4 text-sm text-brand-muted">Loading leaderboard...</p>
            </div>
          ) : entries.length === 0 ? (
            /* --- Empty state with botanical accent --- */
            <div className="relative py-16">
              {/* Subtle botanical illustration */}
              <div className="absolute -right-4 -bottom-2 pointer-events-none">
                <Image
                  src="/illustrations/nuts.png"
                  alt=""
                  width={180}
                  height={180}
                  className="object-contain opacity-[0.12]"
                />
              </div>

              {/* Empty message */}
              <div className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dark/[0.04]">
                  <Trophy
                    size={28}
                    className="text-brand-dark/20"
                    strokeWidth={1.5}
                  />
                </div>
                <h2
                  className="text-lg font-bold text-brand-dark mb-1.5"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  No entries yet
                </h2>
                <p className="text-sm text-brand-muted">
                  Start logging plants to see the leaderboard come alive!
                </p>
              </div>
            </div>
          ) : (
            /* --- Leaderboard entries --- */
            <div className="space-y-2.5">
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
      </div>
    </>
  );
}
