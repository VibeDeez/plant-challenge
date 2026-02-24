"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { useApp } from "@/components/ProtectedLayout";
import { getWeekStart } from "@/lib/weekUtils";
import {
  formatActivityEvent,
  getActivityIcon,
  timeAgo,
  getShareUrl,
} from "@/lib/circles";
import type {
  Circle,
  CircleWeeklyScore,
  CircleAlltimeScore,
  CircleActivity,
  CircleActivityReaction,
  ReactionEmoji,
} from "@/lib/types/circle";
import { REACTION_EMOJIS } from "@/lib/types/circle";
import {
  Trophy,
  Settings,
  Users,
  Link2,
  Check,
  ChevronLeft,
} from "lucide-react";
import PlantAvatar from "@/components/PlantAvatar";

const supabase = createClient();

const RANK_COLORS: Record<
  number,
  { text: string; bg: string; accent: string }
> = {
  1: {
    text: "#b8860b",
    bg: "rgba(184,134,11,0.08)",
    accent: "rgba(184,134,11,0.18)",
  },
  2: {
    text: "#8a8a8a",
    bg: "rgba(138,138,138,0.06)",
    accent: "rgba(138,138,138,0.15)",
  },
  3: {
    text: "#a0522d",
    bg: "rgba(160,82,45,0.06)",
    accent: "rgba(160,82,45,0.15)",
  },
};

type Tab = "leaderboard" | "activity";
type LeaderboardView = "weekly" | "alltime";

// ---------- Inline leaderboard row components ----------

function HeroCard({
  entry,
  isMe,
  subtitle,
}: {
  entry: { display_name: string; avatar_emoji: string; total_points: number; is_ghost: boolean };
  isMe: boolean;
  subtitle?: string;
}) {
  const rc = RANK_COLORS[1];
  const pts = entry.total_points % 1 === 0 ? entry.total_points : entry.total_points.toFixed(2);
  return (
    <div className={entry.is_ghost ? "opacity-40" : ""}>
      <div
        className={`relative overflow-hidden rounded-3xl border ${
          isMe
            ? "border-brand-green/30 shadow-[0_0_24px_rgba(34,197,94,0.12)]"
            : "border-brand-dark/10"
        }`}
        style={{ backgroundColor: rc.bg }}
      >
        <div className="relative bg-white/30 backdrop-blur-sm p-5">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl"
              style={{ backgroundColor: rc.accent }}
            >
              <span className="text-3xl font-bold font-display" style={{ color: rc.text }}>
                1
              </span>
            </div>
            <div className="flex-1 min-w-0 pt-0.5">
              <div className="flex items-center gap-2">
                <PlantAvatar plantKey={entry.avatar_emoji} size="lg" />
                <div className="min-w-0">
                  <p className="text-lg font-bold text-brand-dark truncate font-display">
                    {entry.display_name}
                  </p>
                  {isMe && <p className="text-xs font-medium text-brand-green">You</p>}
                  {entry.is_ghost && (
                    <p className="text-[11px] text-brand-muted">inactive</p>
                  )}
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold text-brand-dark font-display">{pts}</p>
              <p className="text-xs text-brand-muted">points</p>
              {subtitle && (
                <p className="text-[11px] text-brand-muted mt-0.5">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PodiumCard({
  rank,
  entry,
  isMe,
  subtitle,
}: {
  rank: 2 | 3;
  entry: { display_name: string; avatar_emoji: string; total_points: number; is_ghost: boolean };
  isMe: boolean;
  subtitle?: string;
}) {
  const rc = RANK_COLORS[rank];
  const pts = entry.total_points % 1 === 0 ? entry.total_points : entry.total_points.toFixed(2);
  return (
    <div className={entry.is_ghost ? "opacity-40" : ""}>
      <div
        className={`relative overflow-hidden rounded-2xl border ${
          isMe
            ? "border-brand-green/25 shadow-[0_0_16px_rgba(34,197,94,0.08)]"
            : "border-brand-dark/10"
        }`}
        style={{ backgroundColor: rc.bg }}
      >
        <div className="relative bg-white/30 backdrop-blur-sm px-4 py-3.5">
          <div className="flex items-center gap-3.5">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
              style={{ backgroundColor: rc.accent }}
            >
              <span className="text-xl font-bold font-display" style={{ color: rc.text }}>
                {rank}
              </span>
            </div>
            <PlantAvatar plantKey={entry.avatar_emoji} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-semibold text-brand-dark truncate">
                {entry.display_name}
              </p>
              {isMe && <p className="text-[11px] font-medium text-brand-green">You</p>}
              {entry.is_ghost && (
                <p className="text-[11px] text-brand-muted">inactive</p>
              )}
            </div>
            <div className="text-right shrink-0">
              <p className="text-xl font-bold text-brand-dark font-display">{pts}</p>
              {subtitle && (
                <p className="text-[11px] text-brand-muted">{subtitle}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function StandardRow({
  rank,
  entry,
  isMe,
  subtitle,
}: {
  rank: number;
  entry: { display_name: string; avatar_emoji: string; total_points: number; is_ghost: boolean };
  isMe: boolean;
  subtitle?: string;
}) {
  const pts = entry.total_points % 1 === 0 ? entry.total_points : entry.total_points.toFixed(2);
  return (
    <div className={entry.is_ghost ? "opacity-40" : ""}>
      <div
        className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
          isMe
            ? "bg-brand-green/10 border border-brand-green/20"
            : "bg-white border border-brand-dark/[0.06]"
        }`}
      >
        <div className="w-8 text-center">
          <span className="text-sm font-medium text-brand-muted">{rank}</span>
        </div>
        <PlantAvatar plantKey={entry.avatar_emoji} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-brand-dark truncate">{entry.display_name}</p>
          {isMe && <p className="text-[11px] font-medium text-brand-green">You</p>}
          {entry.is_ghost && (
            <p className="text-[11px] text-brand-muted">inactive</p>
          )}
        </div>
        <div className="text-right">
          <p className="text-sm font-bold text-brand-dark">{pts}</p>
          <p className="text-[10px] text-brand-muted">
            {subtitle || "pts"}
          </p>
        </div>
      </div>
    </div>
  );
}

// ---------- Main page ----------

export default function CircleDetailPage() {
  const params = useParams();
  const circleId = params.id as string;
  const { activeMember } = useApp();

  // Circle data
  const [circle, setCircle] = useState<Circle | null>(null);
  const [memberCount, setMemberCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Tabs
  const [tab, setTab] = useState<Tab>("leaderboard");
  const [lbView, setLbView] = useState<LeaderboardView>("weekly");

  // Leaderboard
  const [weeklyScores, setWeeklyScores] = useState<CircleWeeklyScore[]>([]);
  const [alltimeScores, setAlltimeScores] = useState<CircleAlltimeScore[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  // Activity
  const [activities, setActivities] = useState<CircleActivity[]>([]);
  const [reactions, setReactions] = useState<CircleActivityReaction[]>([]);
  const [activityLoading, setActivityLoading] = useState(false);
  const [openPicker, setOpenPicker] = useState<string | null>(null);

  // Invite copy
  const [copied, setCopied] = useState(false);

  const weekStart = useMemo(() => getWeekStart(), []);
  const isAdmin = !!(circle && activeMember && circle.admin_id === activeMember.id);

  // ---------- Fetch circle info ----------
  const fetchCircle = useCallback(async () => {
    setLoading(true);
    setError(null);

    const [circleRes, countRes] = await Promise.all([
      supabase.from("circle").select("*").eq("id", circleId).single(),
      supabase
        .from("circle_member")
        .select("id", { count: "exact", head: true })
        .eq("circle_id", circleId),
    ]);

    if (circleRes.error || !circleRes.data) {
      setError("Circle not found");
      setLoading(false);
      return;
    }

    setCircle(circleRes.data as Circle);
    setMemberCount(countRes.count ?? 0);
    setLoading(false);
  }, [circleId]);

  // ---------- Fetch weekly scores ----------
  const fetchWeekly = useCallback(async () => {
    setLbLoading(true);
    const { data } = await supabase
      .from("circle_weekly_score")
      .select("*")
      .eq("circle_id", circleId)
      .eq("week_start", weekStart);

    if (data) {
      const scores = data as CircleWeeklyScore[];
      // Sort: active members by points desc, then ghosts by points desc
      scores.sort((a, b) => {
        if (a.is_ghost !== b.is_ghost) return a.is_ghost ? 1 : -1;
        return b.total_points - a.total_points;
      });
      setWeeklyScores(scores);
    }
    setLbLoading(false);
  }, [circleId, weekStart]);

  // ---------- Fetch alltime scores ----------
  const fetchAlltime = useCallback(async () => {
    setLbLoading(true);
    const { data } = await supabase
      .from("circle_alltime_score")
      .select("*")
      .eq("circle_id", circleId);

    if (data) {
      const scores = data as CircleAlltimeScore[];
      scores.sort((a, b) => {
        if (a.is_ghost !== b.is_ghost) return a.is_ghost ? 1 : -1;
        return b.total_points - a.total_points;
      });
      setAlltimeScores(scores);
    }
    setLbLoading(false);
  }, [circleId]);

  // ---------- Fetch activity + reactions ----------
  const fetchActivity = useCallback(async () => {
    setActivityLoading(true);

    const { data: actData } = await supabase
      .from("circle_activity")
      .select(
        "id, circle_id, member_id, event_type, payload, created_at, member:member_id(display_name, avatar_emoji)"
      )
      .eq("circle_id", circleId)
      .order("created_at", { ascending: false })
      .limit(20);

    if (actData) {
      type MemberJoin = { display_name: string; avatar_emoji: string };
      const parsed: CircleActivity[] = actData.map((row) => {
        const raw = row.member as unknown;
        const member = (Array.isArray(raw) ? raw[0] : raw) as MemberJoin | null;
        return {
          id: row.id as string,
          circle_id: row.circle_id as string,
          member_id: row.member_id as string | null,
          event_type: row.event_type as CircleActivity["event_type"],
          payload: row.payload as Record<string, unknown>,
          created_at: row.created_at as string,
          display_name: member?.display_name ?? "Unknown",
          avatar_emoji: member?.avatar_emoji ?? "",
        };
      });
      setActivities(parsed);

      // Fetch reactions for these activities
      const ids = parsed.map((a) => a.id);
      if (ids.length > 0) {
        const { data: rxData } = await supabase
          .from("circle_activity_reaction")
          .select("*")
          .in("activity_id", ids);
        if (rxData) {
          setReactions(rxData as CircleActivityReaction[]);
        }
      } else {
        setReactions([]);
      }
    }

    setActivityLoading(false);
  }, [circleId]);

  // ---------- Lifecycle ----------
  useEffect(() => {
    let cancelled = false;
    fetchCircle().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [fetchCircle]);

  // Fetch tab data when circle loads or tab/view changes
  useEffect(() => {
    if (!circle) return;
    let cancelled = false;
    if (tab === "leaderboard") {
      if (lbView === "weekly") fetchWeekly().then(() => { if (cancelled) return; });
      else fetchAlltime().then(() => { if (cancelled) return; });
    } else {
      fetchActivity().then(() => { if (cancelled) return; });
    }
    return () => { cancelled = true; };
  }, [circle, tab, lbView, fetchWeekly, fetchAlltime, fetchActivity]);

  // ---------- Copy invite ----------
  function handleCopy() {
    if (!circle) return;
    const url = getShareUrl(circle.invite_code);
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  // ---------- Reactions ----------
  async function handleReaction(activityId: string, emoji: ReactionEmoji) {
    if (!activeMember) return;

    const existing = reactions.find(
      (r) => r.activity_id === activityId && r.member_id === activeMember.id
    );

    if (existing && existing.emoji === emoji) {
      // Toggle off
      await supabase
        .from("circle_activity_reaction")
        .delete()
        .eq("activity_id", activityId)
        .eq("member_id", activeMember.id);
    } else if (existing) {
      // Switch emoji: delete old, insert new
      const { error } = await supabase
        .from("circle_activity_reaction")
        .delete()
        .eq("activity_id", activityId)
        .eq("member_id", activeMember.id);
      if (!error) {
        await supabase.from("circle_activity_reaction").insert({
          activity_id: activityId,
          member_id: activeMember.id,
          emoji,
        });
      }
    } else {
      // New reaction
      await supabase.from("circle_activity_reaction").insert({
        activity_id: activityId,
        member_id: activeMember.id,
        emoji,
      });
    }

    // Re-fetch reactions for all visible activities
    const ids = activities.map((a) => a.id);
    if (ids.length > 0) {
      const { data: rxData } = await supabase
        .from("circle_activity_reaction")
        .select("*")
        .in("activity_id", ids);
      if (rxData) setReactions(rxData as CircleActivityReaction[]);
    }

    setOpenPicker(null);
  }

  // ---------- Helpers ----------
  const reactionsByActivity = useMemo(() => {
    const map = new Map<string, Map<ReactionEmoji, { count: number; userReacted: boolean }>>();
    for (const r of reactions) {
      let actMap = map.get(r.activity_id);
      if (!actMap) {
        actMap = new Map();
        map.set(r.activity_id, actMap);
      }
      const prev = actMap.get(r.emoji) ?? { count: 0, userReacted: false };
      prev.count += 1;
      if (activeMember && r.member_id === activeMember.id) prev.userReacted = true;
      actMap.set(r.emoji, prev);
    }
    return map;
  }, [reactions, activeMember]);

  // ---------- Sorted leaderboard data ----------
  const currentScores = lbView === "weekly" ? weeklyScores : alltimeScores;

  // ---------- Loading / Error states ----------
  if (loading) {
    return (
      <div className="bg-brand-bg min-h-screen grain-light flex flex-col items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
        <p className="mt-4 text-sm text-brand-muted">Loading circle...</p>
      </div>
    );
  }

  if (error || !circle) {
    return (
      <div className="bg-brand-bg min-h-screen grain-light">
        <div className="max-w-lg mx-auto px-5 py-16 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dark/[0.04]">
            <Trophy size={28} className="text-brand-dark/20" strokeWidth={1.5} />
          </div>
          <h2 className="text-lg font-bold text-brand-dark mb-1.5 font-display">
            Circle not found
          </h2>
          <p className="text-sm text-brand-muted mb-6">
            This circle may have been deleted or you may not have access.
          </p>
          <Link
            href="/circles"
            className="inline-flex items-center gap-2 text-sm font-semibold text-brand-green hover:underline"
          >
            <ChevronLeft size={16} />
            Back to Circles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* === DARK HEADER === */}
      <div className="relative bg-brand-dark overflow-hidden grain border-b border-[#b8860b]/15">
        <div className="relative px-5 pt-5 pb-4">
          <div className="max-w-lg mx-auto">
            {/* Back arrow + settings */}
            <div className="flex items-center justify-between mb-3">
              <Link
                href="/circles"
                className="flex items-center gap-1.5 text-brand-cream/60 hover:text-brand-cream transition-colors"
              >
                <ChevronLeft size={18} />
                <span className="text-sm">Circles</span>
              </Link>
              {isAdmin && (
                <Link
                  href={`/circles/${circleId}/settings`}
                  className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-cream/10 hover:bg-brand-cream/20 transition-colors"
                >
                  <Settings size={16} className="text-brand-cream/60" />
                </Link>
              )}
            </div>

            {/* Circle name */}
            <h1 className="text-2xl font-bold text-brand-cream font-display mb-2">
              {circle.name}
            </h1>

            {/* Member count + invite */}
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5 text-xs text-brand-cream/50">
                <Users size={13} />
                {memberCount} {memberCount === 1 ? "member" : "members"}
              </span>

              <button
                onClick={handleCopy}
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium transition-all ${
                  copied
                    ? "bg-brand-green/20 text-brand-green"
                    : "bg-brand-cream/10 text-brand-cream/60 hover:bg-brand-cream/15 hover:text-brand-cream/80"
                }`}
              >
                {copied ? (
                  <>
                    <Check size={12} />
                    Link Copied
                  </>
                ) : (
                  <>
                    <Link2 size={12} />
                    Copy Invite Link
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Tab bar */}
        <div className="max-w-lg mx-auto px-5">
          <div className="flex gap-6">
            <button
              onClick={() => setTab("leaderboard")}
              className={`pb-3 text-sm font-medium transition-colors ${
                tab === "leaderboard"
                  ? "border-b-2 border-brand-green text-brand-green font-semibold"
                  : "text-brand-cream/40 hover:text-brand-cream/60"
              }`}
            >
              Leaderboard
            </button>
            <button
              onClick={() => setTab("activity")}
              className={`pb-3 text-sm font-medium transition-colors ${
                tab === "activity"
                  ? "border-b-2 border-brand-green text-brand-green font-semibold"
                  : "text-brand-cream/40 hover:text-brand-cream/60"
              }`}
            >
              Activity
            </button>
          </div>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="bg-brand-bg min-h-[60vh] grain-light pb-24">
        <div className="max-w-lg mx-auto px-5 py-4">
          {tab === "leaderboard" ? (
            <>
              {/* Sub-tabs: Weekly / All Time */}
              <div className="flex gap-2 mb-5">
                <button
                  onClick={() => setLbView("weekly")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    lbView === "weekly"
                      ? "bg-brand-green text-white"
                      : "bg-brand-dark/[0.06] text-brand-muted hover:bg-brand-dark/10"
                  }`}
                >
                  This Week
                </button>
                <button
                  onClick={() => setLbView("alltime")}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                    lbView === "alltime"
                      ? "bg-brand-green text-white"
                      : "bg-brand-dark/[0.06] text-brand-muted hover:bg-brand-dark/10"
                  }`}
                >
                  All Time
                </button>
              </div>

              {lbLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-8 w-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
                  <p className="mt-4 text-sm text-brand-muted">Loading scores...</p>
                </div>
              ) : currentScores.length === 0 ? (
                <div className="relative py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dark/[0.04]">
                    <Trophy size={28} className="text-brand-dark/20" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg font-bold text-brand-dark mb-1.5 font-display">
                    No scores yet
                  </h2>
                  <p className="text-sm text-brand-muted">
                    Start logging plants to see the leaderboard!
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {/* Top 3 podium */}
                  {currentScores[0] && (
                    <div className="animate-fadeInUp" style={{ animationDelay: "0s" }}>
                      <HeroCard
                        entry={currentScores[0]}
                        isMe={currentScores[0].member_id === activeMember?.id}
                        subtitle={
                          lbView === "alltime" && "avg_weekly" in currentScores[0]
                            ? `${(currentScores[0] as CircleAlltimeScore).avg_weekly.toFixed(1)} avg/wk`
                            : undefined
                        }
                      />
                    </div>
                  )}

                  {currentScores[1] && (
                    <div className="animate-fadeInUp" style={{ animationDelay: "0.08s" }}>
                      <PodiumCard
                        rank={2}
                        entry={currentScores[1]}
                        isMe={currentScores[1].member_id === activeMember?.id}
                        subtitle={
                          lbView === "alltime" && "avg_weekly" in currentScores[1]
                            ? `${(currentScores[1] as CircleAlltimeScore).avg_weekly.toFixed(1)} avg/wk`
                            : undefined
                        }
                      />
                    </div>
                  )}

                  {currentScores[2] && (
                    <div className="animate-fadeInUp" style={{ animationDelay: "0.16s" }}>
                      <PodiumCard
                        rank={3}
                        entry={currentScores[2]}
                        isMe={currentScores[2].member_id === activeMember?.id}
                        subtitle={
                          lbView === "alltime" && "avg_weekly" in currentScores[2]
                            ? `${(currentScores[2] as CircleAlltimeScore).avg_weekly.toFixed(1)} avg/wk`
                            : undefined
                        }
                      />
                    </div>
                  )}

                  {/* Rank 4+ */}
                  {currentScores.slice(3).map((entry, i) => (
                    <div
                      key={entry.member_id}
                      className="animate-fadeInUp"
                      style={{ animationDelay: `${(i + 3) * 0.08}s` }}
                    >
                      <StandardRow
                        rank={i + 4}
                        entry={entry}
                        isMe={entry.member_id === activeMember?.id}
                        subtitle={
                          lbView === "alltime" && "avg_weekly" in entry
                            ? `${(entry as CircleAlltimeScore).avg_weekly.toFixed(1)} avg/wk`
                            : undefined
                        }
                      />
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* === ACTIVITY TAB === */
            <>
              {activityLoading ? (
                <div className="flex flex-col items-center justify-center py-16">
                  <div className="h-8 w-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
                  <p className="mt-4 text-sm text-brand-muted">Loading activity...</p>
                </div>
              ) : activities.length === 0 ? (
                <div className="relative py-16 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dark/[0.04]">
                    <Trophy size={28} className="text-brand-dark/20" strokeWidth={1.5} />
                  </div>
                  <h2 className="text-lg font-bold text-brand-dark mb-1.5 font-display">
                    No activity yet
                  </h2>
                  <p className="text-sm text-brand-muted">
                    Start logging plants to see activity here!
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {activities.map((act, i) => {
                    const rxMap = reactionsByActivity.get(act.id) ?? new Map();
                    const pickerOpen = openPicker === act.id;

                    return (
                      <div
                        key={act.id}
                        className="bg-white/30 backdrop-blur-sm rounded-2xl border border-brand-dark/10 p-4 animate-fadeInUp"
                        style={{ animationDelay: `${i * 0.06}s` }}
                      >
                        {/* Event info */}
                        <div className="flex items-start gap-3">
                          <div className="flex items-center gap-2 shrink-0 pt-0.5">
                            <span className="text-lg">{getActivityIcon(act.event_type)}</span>
                            <PlantAvatar plantKey={act.avatar_emoji ?? "sprout"} size="sm" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm text-brand-dark">
                              {formatActivityEvent(
                                act.event_type,
                                act.display_name ?? "Unknown",
                                act.payload
                              )}
                            </p>
                            <p className="text-xs text-brand-muted mt-0.5">
                              {timeAgo(act.created_at)}
                            </p>
                          </div>
                        </div>

                        {/* Reactions */}
                        <div className="flex flex-wrap items-center gap-1.5 mt-3">
                          {REACTION_EMOJIS.map((re) => {
                            const data = rxMap.get(re.key);
                            if (!data) return null;
                            return (
                              <button
                                key={re.key}
                                onClick={() => handleReaction(act.id, re.key)}
                                className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs transition-colors ${
                                  data.userReacted
                                    ? "bg-brand-green/20 border border-brand-green"
                                    : "bg-brand-dark/[0.04] border border-brand-dark/10"
                                }`}
                              >
                                <span>{re.display}</span>
                                <span className="font-medium">{data.count}</span>
                              </button>
                            );
                          })}

                          {/* + button to open picker */}
                          <button
                            onClick={() => setOpenPicker(pickerOpen ? null : act.id)}
                            className="flex items-center justify-center h-7 w-7 rounded-full bg-brand-dark/[0.04] border border-brand-dark/10 text-brand-muted hover:bg-brand-dark/10 transition-colors text-sm"
                          >
                            +
                          </button>
                        </div>

                        {/* Reaction picker */}
                        {pickerOpen && (
                          <div className="flex items-center gap-1 mt-2 animate-fadeIn">
                            {REACTION_EMOJIS.map((re) => (
                              <button
                                key={re.key}
                                onClick={() => handleReaction(act.id, re.key)}
                                className="flex items-center justify-center h-9 w-9 rounded-xl hover:bg-brand-dark/[0.06] transition-colors text-lg"
                              >
                                {re.display}
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </>
  );
}
