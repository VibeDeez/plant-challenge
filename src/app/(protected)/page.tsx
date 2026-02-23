"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart, getWeekLabel } from "@/lib/weekUtils";
import { TIPS } from "@/lib/constants";
import { useApp } from "@/components/ProtectedLayout";
import MemberSwitcher from "@/components/MemberSwitcher";
import ProgressRing from "@/components/ProgressRing";
import PlantCard from "@/components/PlantCard";
import Link from "next/link";
import Image from "next/image";
import { Plus, Leaf, TrendingUp } from "lucide-react";
import {
  Cherry,
  LeafyGreen,
  Wheat,
  Bean,
  Nut,
  Sprout,
  Flame,
  type LucideIcon,
} from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/constants";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Fruits: Cherry,
  Vegetables: LeafyGreen,
  "Whole Grains": Wheat,
  Legumes: Bean,
  Nuts: Nut,
  Seeds: Sprout,
  Herbs: Leaf,
  Spices: Flame,
};

const CATEGORY_ILLUSTRATIONS: Record<string, string> = {
  Fruits: "/illustrations/strawberry.png",
  Vegetables: "/illustrations/vegetables.png",
  "Whole Grains": "/illustrations/grains.png",
  Legumes: "/illustrations/legumes.png",
  Nuts: "/illustrations/nuts.png",
  Seeds: "/illustrations/seeds.png",
  Herbs: "/illustrations/herbs.png",
  Spices: "/illustrations/spices.png",
};

const ALL_ILLUSTRATIONS = [
  "/illustrations/strawberry.png",
  "/illustrations/vegetables.png",
  "/illustrations/grains.png",
  "/illustrations/legumes.png",
  "/illustrations/nuts.png",
  "/illustrations/seeds.png",
  "/illustrations/herbs.png",
  "/illustrations/spices.png",
];

// Deterministic selection based on the day of the year
function getDailyIllustration(): string {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  return ALL_ILLUSTRATIONS[dayOfYear % ALL_ILLUSTRATIONS.length];
}

// Get 2-3 illustrations for the background collage, offset from the hero one
function getCollageIllustrations(): string[] {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now.getTime() - start.getTime();
  const dayOfYear = Math.floor(diff / (1000 * 60 * 60 * 24));
  const idx1 = (dayOfYear + 2) % ALL_ILLUSTRATIONS.length;
  const idx2 = (dayOfYear + 5) % ALL_ILLUSTRATIONS.length;
  const idx3 = (dayOfYear + 7) % ALL_ILLUSTRATIONS.length;
  return [ALL_ILLUSTRATIONS[idx1], ALL_ILLUSTRATIONS[idx2], ALL_ILLUSTRATIONS[idx3]];
}

type PlantLog = {
  id: string;
  plant_name: string;
  category: string;
  points: number;
  logged_at: string;
};

const supabase = createClient();

export default function HomePage() {
  const { activeMember } = useApp();
  const [logs, setLogs] = useState<PlantLog[]>([]);
  const [loading, setLoading] = useState(true);
  const weekStart = getWeekStart();

  const fetchLogs = useCallback(async () => {
    if (!activeMember) return;
    setLoading(true);
    const { data } = await supabase
      .from("plant_log")
      .select("id, plant_name, category, points, logged_at")
      .eq("member_id", activeMember.id)
      .eq("week_start", weekStart)
      .order("logged_at", { ascending: false });
    setLogs(data ?? []);
    setLoading(false);
  }, [activeMember, weekStart]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  async function handleDelete(id: string) {
    const { error } = await supabase.from("plant_log").delete().eq("id", id);
    if (!error) {
      setLogs((prev) => prev.filter((l) => l.id !== id));
    }
  }

  const totalPoints = logs.reduce((sum, l) => sum + l.points, 0);
  const [tip] = useState(() => TIPS[Math.floor(Math.random() * TIPS.length)]);

  // Group logs by category for the breakdown
  const categoryBreakdown = logs.reduce<Record<string, number>>((acc, log) => {
    acc[log.category] = (acc[log.category] || 0) + 1;
    return acc;
  }, {});

  const categoriesUsed = Object.keys(categoryBreakdown).length;

  const heroIllustration = getDailyIllustration();
  const collageIllustrations = getCollageIllustrations();

  return (
    <>
      <MemberSwitcher />

      {/* === TIP CARD === */}
      <div className="bg-[#f5f0e8] px-5 pt-4 pb-2 grain-light">
        <div className="max-w-lg mx-auto">
          <div className="rounded-xl bg-[#1a3a2a]/5 border border-[#1a3a2a]/10 px-4 py-3">
            <p className="text-xs font-medium text-[#1a3a2a]/70 leading-relaxed">
              {tip}
            </p>
          </div>
        </div>
      </div>

      {/* === HERO HEADER === */}
      <section className="relative bg-[#1a3a2a] px-5 pt-6 pb-8 -mt-1 overflow-hidden grain">
        {/* Botanical illustration — anchored right, subtle */}
        <div className="absolute -right-6 -bottom-8 pointer-events-none">
          <Image
            src="/illustrations/strawberry.png"
            alt=""
            width={180}
            height={180}
            className="object-contain opacity-[0.10]"
            priority
          />
        </div>

        <div className="relative max-w-lg mx-auto">
          {/* Week label */}
          <p className="text-[#f5f0e8]/40 text-xs font-medium tracking-widest uppercase mb-8">
            {getWeekLabel(weekStart)}
          </p>

          {/* Fill meter */}
          <ProgressRing current={totalPoints} />

          {/* Quick add CTA */}
          <Link
            href="/add"
            className="mt-6 flex items-center justify-center gap-2 w-full py-3.5 rounded-xl bg-[#22c55e] text-white font-semibold text-sm hover:bg-[#1ea34d] active:scale-[0.98] transition-all"
          >
            <Plus size={18} strokeWidth={2.5} />
            Log a Plant
          </Link>
        </div>
      </section>

      {/* === CATEGORY BREAKDOWN MOSAIC === */}
      {categoriesUsed > 0 && (
        <section className="bg-[#f5f0e8] px-5 py-5 grain-light">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp size={14} className="text-[#6b7260]" />
              <h3 className="text-xs font-semibold text-[#6b7260] tracking-widest uppercase">
                Categories Hit
              </h3>
              <span className="text-xs text-[#6b7260]/60 ml-auto">
                {categoriesUsed} of 8
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {Object.entries(categoryBreakdown).map(([cat, count]) => {
                const Icon = CATEGORY_ICONS[cat] ?? Leaf;
                const color = CATEGORY_COLORS[cat] ?? "#6b7260";
                const illustration = CATEGORY_ILLUSTRATIONS[cat];
                return (
                  <div
                    key={cat}
                    className="relative overflow-hidden rounded-2xl border border-[#1a3a2a]/10"
                  >
                    {/* Background illustration */}
                    {illustration && (
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <Image
                          src={illustration}
                          alt=""
                          width={200}
                          height={200}
                          className="object-cover w-full h-full opacity-[0.35]"
                        />
                      </div>
                    )}
                    {/* Glassmorphic overlay */}
                    <div className="relative bg-white/40 backdrop-blur-sm px-3.5 py-3 flex items-center gap-2.5">
                      <div
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl"
                        style={{ backgroundColor: `${color}20` }}
                      >
                        <Icon size={16} style={{ color }} strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1a3a2a] truncate">
                          {cat}
                        </p>
                      </div>
                      <span
                        className="text-[11px] font-bold px-2 py-0.5 rounded-full shrink-0"
                        style={{
                          backgroundColor: `${color}18`,
                          color,
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* === PLANT LOG === */}
      <section className="relative bg-[#f8faf8] px-5 py-6 min-h-[40vh] overflow-hidden grain-light">
        {/* Botanical collage background - only when there are logs */}
        {!loading && logs.length > 0 && (
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-4 -left-8 w-56 h-56 rotate-[-15deg]">
              <Image
                src={collageIllustrations[0]}
                alt=""
                width={220}
                height={220}
                className="object-contain opacity-[0.06]"
              />
            </div>
            <div className="absolute top-1/4 -right-10 w-60 h-60 rotate-[10deg]">
              <Image
                src={collageIllustrations[1]}
                alt=""
                width={240}
                height={240}
                className="object-contain opacity-[0.05]"
              />
            </div>
            <div className="absolute -bottom-8 left-1/4 w-52 h-52 rotate-[5deg]">
              <Image
                src={collageIllustrations[2]}
                alt=""
                width={200}
                height={200}
                className="object-contain opacity-[0.04]"
              />
            </div>
          </div>
        )}

        <div className="relative max-w-lg mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2
              className="text-xl font-bold text-[#1a3a2a]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              This Week
            </h2>
            <span className="text-xs font-medium text-[#6b7260]">
              {logs.length} {logs.length === 1 ? "plant" : "plants"}
            </span>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-16">
              <div className="w-8 h-8 border-2 border-[#22c55e]/20 border-t-[#22c55e] rounded-full animate-spin" />
            </div>
          ) : logs.length === 0 ? (
            <div className="relative text-center py-16">
              {/* Botanical illustration for empty state */}
              <div className="absolute -right-6 -bottom-4 pointer-events-none">
                <Image
                  src="/illustrations/strawberry.png"
                  alt=""
                  width={200}
                  height={200}
                  className="object-contain opacity-[0.15]"
                />
              </div>
              <div className="relative">
                <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1a3a2a]/5 backdrop-blur-sm">
                  <Leaf
                    size={28}
                    className="text-[#1a3a2a]/30"
                    strokeWidth={1.5}
                  />
                </div>
                <p
                  className="text-lg font-semibold text-[#1a3a2a] mb-1"
                  style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
                >
                  No plants yet
                </p>
                <p className="text-sm text-[#6b7260]">
                  Tap the button above to log your first plant.
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              {logs.map((log) => (
                <PlantCard key={log.id} log={log} onDelete={handleDelete} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
