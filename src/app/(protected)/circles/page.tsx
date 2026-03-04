"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart } from "@/lib/weekUtils";
import {
  isValidInviteCode,
  validateJoinCirclePayload,
} from "@/lib/circles";
import { useApp } from "@/components/ProtectedLayout";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Target, Plus, Ticket, X, Users, ChevronRight } from "lucide-react";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";

type CircleCard = {
  id: string;
  name: string;
  invite_code: string;
  member_count: number;
  my_score: number;
};

const supabase = createClient();

export default function CirclesPage() {
  const { activeMember } = useApp();
  const router = useRouter();
  const [circles, setCircles] = useState<CircleCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [joinOpen, setJoinOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinError, setJoinError] = useState("");
  const [joining, setJoining] = useState(false);
  const weekStart = useMemo(() => getWeekStart(), []);

  const fetchCircles = useCallback(async () => {
    if (!activeMember) return;
    setLoading(true);

    // Get circles the user belongs to
    const { data: memberships, error } = await supabase
      .from("circle_member")
      .select("circle_id, circle:circle_id(id, name, invite_code)")
      .eq("member_id", activeMember.id);

    if (error || !memberships) {
      setLoading(false);
      return;
    }

    // For each circle, fetch member count and user's weekly score
    const cards: CircleCard[] = await Promise.all(
      memberships.map(async (m) => {
        const circle = m.circle as unknown as {
          id: string;
          name: string;
          invite_code: string;
        };

        const [countResult, scoreResult] = await Promise.all([
          supabase
            .from("circle_member")
            .select("id", { count: "exact", head: true })
            .eq("circle_id", circle.id),
          supabase
            .from("circle_weekly_score")
            .select("total_points")
            .eq("circle_id", circle.id)
            .eq("member_id", activeMember.id)
            .eq("week_start", weekStart),
        ]);

        const scoreRow = scoreResult.data?.[0] as
          | { total_points: number }
          | undefined;

        return {
          id: circle.id,
          name: circle.name,
          invite_code: circle.invite_code,
          member_count: countResult.count ?? 0,
          my_score: scoreRow?.total_points ?? 0,
        };
      })
    );

    setCircles(cards);
    setLoading(false);
  }, [activeMember, weekStart]);

  useEffect(() => {
    let cancelled = false;
    fetchCircles().then(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [fetchCircles]);

  async function handleJoin(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMember || !joinCode.trim()) return;

    const normalizedCode = joinCode.trim().toUpperCase();
    if (!isValidInviteCode(normalizedCode)) {
      setJoinError("Invite codes are 6 characters using letters and numbers.");
      return;
    }

    setJoining(true);
    setJoinError("");

    const { data, error } = await supabase.rpc("join_circle", {
      p_invite_code: normalizedCode,
      p_member_id: activeMember.id,
    });

    if (error) {
      setJoinError(error.message || "Could not join circle");
      setJoining(false);
      return;
    }

    const validated = validateJoinCirclePayload(data);
    if (!validated.ok) {
      setJoinError(validated.message);
      setJoining(false);
      return;
    }
    setJoining(false);
    setJoinOpen(false);
    router.push(`/circles/${validated.circleId}`);
  }

  return (
    <>
      {/* === DARK GREEN HEADER === */}
      <div className="relative bg-brand-dark overflow-hidden grain border-b border-[#b8860b]/15">
        {/* Character mascot watermark */}
        <div className="absolute -right-6 -bottom-6 pointer-events-none">
          <Image
            src="/illustrations/character-tomato.png"
            alt=""
            width={160}
            height={160}
            className="object-contain illo-accent"
            priority
            unoptimized
          />
        </div>

        <div className="relative px-5 pt-6 pb-5">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-3 mb-1">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-brand-green/15">
                <Target
                  size={20}
                  className="text-brand-green"
                  strokeWidth={2}
                />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-brand-cream font-display">
                  Crop Circles
                </h1>
                <p className="text-xs text-brand-cream/40 mt-0.5">
                  Compete with friends on weekly leaderboards
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* === CONTENT === */}
      <div className="bg-brand-bg min-h-[60vh] grain-light">
        <div className="max-w-lg mx-auto px-5 py-4">
          {/* Action buttons */}
          <div className="flex gap-3 mb-6">
            <Link
              href="/circles/create"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors"
            >
              <Plus size={16} />
              Create a Circle
            </Link>
            <button
              onClick={() => {
                setJoinOpen(true);
                setJoinCode("");
                setJoinError("");
              }}
              data-haptic="selection"
              className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-brand-dark/10 bg-white/50 px-4 py-3 text-sm font-semibold text-brand-dark hover:bg-white/80 transition-colors"
            >
              <Ticket size={16} />
              Join a Circle
            </button>
          </div>

          {loading ? (
            /* --- Loading spinner --- */
            <div className="flex flex-col items-center justify-center py-16">
              <div className="h-8 w-8 rounded-full border-2 border-brand-green/20 border-t-brand-green animate-spin" />
              <p className="mt-4 text-sm text-brand-muted">
                Loading circles...
              </p>
            </div>
          ) : circles.length === 0 ? (
            /* --- Empty state --- */
            <div className="relative py-16">
              <div className="absolute -right-4 -bottom-2 pointer-events-none">
                <Image
                  src="/illustrations/library/walnut.png"
                  alt=""
                  width={180}
                  height={180}
                  className="object-contain illo-accent"
                />
              </div>
              <div className="relative text-center">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-dark/[0.04]">
                  <Target
                    size={28}
                    className="text-brand-dark/20"
                    strokeWidth={1.5}
                  />
                </div>
                <h2 className="text-lg font-bold text-brand-dark mb-1.5 font-display">
                  No Crop Circles yet
                </h2>
                <p className="text-sm text-brand-muted">
                  Create one and invite friends, or join with an invite code
                </p>
              </div>
            </div>
          ) : (
            /* --- Circle cards --- */
            <div className="space-y-3">
              {circles.map((circle, i) => (
                <Link
                  key={circle.id}
                  href={`/circles/${circle.id}`}
                  className="block animate-fadeInUp"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="bg-white/30 backdrop-blur-sm rounded-2xl border border-brand-dark/10 p-4 hover:bg-white/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="flex-1 min-w-0">
                        <h3 className="text-base font-semibold text-brand-dark font-display whitespace-normal break-words leading-snug">
                          {circle.name}
                        </h3>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="flex items-center gap-1 text-xs text-brand-muted">
                            <Users size={12} />
                            {circle.member_count}{" "}
                            {circle.member_count === 1 ? "member" : "members"}
                          </span>
                          <span className="text-xs text-brand-muted">
                            {circle.my_score} pts this week
                          </span>
                        </div>
                      </div>
                      <ChevronRight
                        size={18}
                        className="text-brand-muted/40 flex-shrink-0"
                      />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* === JOIN MODAL (bottom sheet) === */}
      <Sheet open={joinOpen} onOpenChange={setJoinOpen}>
        <SheetContent>
          <div className="p-6 pb-[calc(env(safe-area-inset-bottom)+1rem)]">
            <div className="mb-3 flex justify-center">
              <div className="h-1 w-10 rounded-full bg-brand-dark/15" />
            </div>

            <div className="mb-5 flex items-center justify-between">
              <SheetTitle className="text-xl font-bold text-brand-dark font-display">
                Join a Circle
              </SheetTitle>
              <SheetClose asChild>
                <button
                  type="button"
                  data-haptic="selection"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-muted hover:bg-brand-dark/5 transition-colors"
                  aria-label="Close join circle sheet"
                >
                  <X size={20} />
                </button>
              </SheetClose>
            </div>

            <form onSubmit={handleJoin} className="space-y-4">
              <div>
                <label
                  htmlFor="join-code"
                  className="block text-sm font-medium text-brand-dark mb-1.5"
                >
                  Invite Code
                </label>
                <input
                  id="join-code"
                  type="text"
                  maxLength={6}
                  value={joinCode}
                  onChange={(e) =>
                    setJoinCode(e.target.value.toUpperCase().slice(0, 6))
                  }
                  placeholder="e.g. ABC123"
                  className="w-full bg-white rounded-xl border border-brand-dark/20 px-4 py-3 text-brand-dark text-center font-mono text-lg tracking-widest uppercase focus:ring-2 focus:ring-brand-green focus:border-transparent focus:outline-none transition-all"
                  autoFocus
                />
              </div>

              {joinError && (
                <p className="text-sm text-red-600 text-center">{joinError}</p>
              )}

              <button
                type="submit"
                disabled={joinCode.length < 6 || joining}
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {joining ? "Joining..." : "Join"}
              </button>
            </form>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
