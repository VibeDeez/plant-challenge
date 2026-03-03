"use client";

import { useEffect, useState, useCallback, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart } from "@/lib/weekUtils";
import {
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_ORDER,
} from "@/lib/constants";
import { useApp } from "@/components/ProtectedLayout";
import PlantListItem from "@/components/PlantListItem";
import { ArrowLeft, Plus, Search, X, Leaf, Camera, Trophy, Mic, ChevronDown } from "lucide-react";
import Link from "next/link";
import PhotoRecognitionModal from "@/components/PhotoRecognitionModal";
import VoiceLogModal from "@/components/VoiceLogModal";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";

type Plant = {
  id: number;
  name: string;
  category: string;
  points: number;
};

type LogFeedback = {
  pointsAdded: number;
  duplicateCount: number;
  newUniqueCount: number;
  uniqueProgress: number;
  hasCircleImpact: boolean;
};

function normalizePlantName(name: string): string {
  return name.trim().replace(/\s+/g, " ");
}

const supabase = createClient();

export default function AddPlantPage() {
  const { activeMember } = useApp();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loggedNames, setLoggedNames] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Fruits");
  const [showCustom, setShowCustom] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [showVoice, setShowVoice] = useState(false);
  const [weekTotalPoints, setWeekTotalPoints] = useState(0);
  const [feedback, setFeedback] = useState<LogFeedback | null>(null);
  const [circleCount, setCircleCount] = useState(0);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const weekStart = useMemo(() => getWeekStart(), []);

  const toggleCategory = useCallback((cat: string) => {
    setExpandedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) {
        next.delete(cat);
      } else {
        next.add(cat);
      }
      return next;
    });
  }, []);

  const fetchData = useCallback(async () => {
    if (!activeMember) return;
    const [plantsRes, logsRes, circlesRes] = await Promise.all([
      supabase.from("plant").select("*").order("name"),
      supabase
        .from("plant_log")
        .select("plant_name, points")
        .eq("member_id", activeMember.id)
        .eq("week_start", weekStart),
      supabase
        .from("circle_member")
        .select("circle_id", { count: "exact", head: true })
        .eq("member_id", activeMember.id),
    ]);
    setPlants(plantsRes.data ?? []);
    const logs = logsRes.data ?? [];
    setLoggedNames(new Set(logs.map((l) => l.plant_name)));
    setWeekTotalPoints(logs.reduce((sum, l) => sum + Number(l.points ?? 0), 0));
    setCircleCount(circlesRes.count ?? 0);
  }, [activeMember, weekStart]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function logPlant(plant: Plant) {
    if (!activeMember) return;
    const { error } = await supabase.from("plant_log").insert({
      member_id: activeMember.id,
      plant_name: plant.name,
      category: plant.category,
      points: plant.points,
      week_start: weekStart,
    });
    if (!error) {
      setLoggedNames((prev) => new Set(prev).add(plant.name));
      setWeekTotalPoints((prev) => prev + plant.points);
      setFeedback({
        pointsAdded: plant.points,
        duplicateCount: 0,
        newUniqueCount: 1,
        uniqueProgress: loggedNames.size + 1,
        hasCircleImpact: circleCount > 0,
      });
    }
  }

  async function logCustomPlant(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMember || !customName.trim()) return;
    const normalizedCustomName = normalizePlantName(customName);
    const alreadyLoggedThisWeek = Array.from(loggedNames).some(
      (name) => normalizePlantName(name).toLowerCase() === normalizedCustomName.toLowerCase()
    );
    const isHerbOrSpice =
      customCategory === "Herbs" || customCategory === "Spices";
    const points = isHerbOrSpice ? 0.25 : 1;
    const { error } = await supabase.from("plant_log").insert({
      member_id: activeMember.id,
      plant_name: normalizedCustomName,
      category: customCategory,
      points,
      week_start: weekStart,
    });
    if (!error) {
      setLoggedNames((prev) => new Set(prev).add(normalizedCustomName));
      setWeekTotalPoints((prev) => prev + points);
      setFeedback({
        pointsAdded: points,
        duplicateCount: alreadyLoggedThisWeek ? 1 : 0,
        newUniqueCount: alreadyLoggedThisWeek ? 0 : 1,
        uniqueProgress: loggedNames.size + (alreadyLoggedThisWeek ? 0 : 1),
        hasCircleImpact: circleCount > 0,
      });
      setCustomName("");
      setShowCustom(false);
    }
  }

  async function logRecognizedPlants(
    recognized: { name: string; category: string; points: number; confidence?: number }[]
  ) {
    if (!activeMember) return;

    const normalizedLogged = new Set(
      Array.from(loggedNames).map((name) => normalizePlantName(name).toLowerCase())
    );

    const seen = new Set<string>();
    const uniqueRecognized = recognized
      .map((plant) => ({
        ...plant,
        name: normalizePlantName(plant.name),
      }))
      .filter((p) => p.name.length > 0)
      .filter((p) => {
        const key = p.name.toLowerCase();
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
      });

    const inserts = uniqueRecognized
      .filter((p) => !normalizedLogged.has(p.name.toLowerCase()))
      .map((p) => ({
        member_id: activeMember.id,
        plant_name: p.name,
        category: p.category,
        points: p.points,
        week_start: weekStart,
      }));

    const duplicateCount = recognized.length - inserts.length;
    if (inserts.length === 0) {
      setFeedback({
        pointsAdded: 0,
        duplicateCount,
        newUniqueCount: 0,
        uniqueProgress: loggedNames.size,
        hasCircleImpact: circleCount > 0,
      });
      return;
    }
    const { error } = await supabase.from("plant_log").insert(inserts);
    if (!error) {
      const addedPoints = inserts.reduce((sum, row) => sum + Number(row.points ?? 0), 0);
      setWeekTotalPoints((prev) => prev + addedPoints);
      setLoggedNames((prev) => {
        const next = new Set(prev);
        inserts.forEach((i) => next.add(i.plant_name));
        return next;
      });
      setFeedback({
        pointsAdded: addedPoints,
        duplicateCount,
        newUniqueCount: inserts.length,
        uniqueProgress: loggedNames.size + inserts.length,
        hasCircleImpact: circleCount > 0,
      });
    }
  }

  async function logVoicePlants(
    recognized: { name: string; category: string; points: number; confidence?: number }[]
  ) {
    await logRecognizedPlants(recognized);
  }

  const filtered = useMemo(
    () =>
      plants.filter((p) => {
        const matchSearch =
          !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchSearch;
      }),
    [plants, search]
  );

  // Group filtered plants by category for gallery view
  const grouped = useMemo(
    () =>
      CATEGORY_ORDER.reduce<Record<string, Plant[]>>((acc, cat) => {
        const items = filtered.filter((p) => p.category === cat);
        if (items.length > 0) acc[cat] = items;
        return acc;
      }, {}),
    [filtered]
  );

  const isSearching = search.length > 0;
  const showGallery = !isSearching;

  return (
    <>
      {/* === HEADER === */}
      <div className="bg-brand-dark px-page pt-4 pb-2 grain">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-cream/60 hover:text-brand-cream hover:bg-brand-cream/10 transition-colors"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1
              className="text-2xl font-bold text-brand-cream font-display"
            >
              Log Plants
            </h1>
          </div>

          <div className="mb-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {/* Pic Log banner */}
            <button
              onClick={() => setShowCamera(true)}
              className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-brand-cream/25 bg-gradient-to-br from-brand-cream/16 to-brand-cream/8 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-[2px] transition-all hover:border-brand-cream/40 hover:from-brand-cream/20 hover:to-brand-cream/12 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-cream/30 bg-brand-green/20">
                <Camera size={22} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Pic Log</p>
                <p className="text-xs leading-snug text-brand-cream/85">
                  Take or upload a pic of your meal or recipe
                </p>
              </div>
            </button>

            <button
              onClick={() => setShowVoice(true)}
              className="flex min-h-11 w-full items-center gap-3 rounded-2xl border border-brand-cream/25 bg-gradient-to-br from-brand-cream/16 to-brand-cream/8 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-[2px] transition-all hover:border-brand-cream/40 hover:from-brand-cream/20 hover:to-brand-cream/12 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-cream/30 bg-brand-green/20">
                <Mic size={22} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Voice Log</p>
                <p className="text-xs leading-snug text-brand-cream/85">Say what you ate in your own words</p>
              </div>
            </button>

            <Link
              href="/sage?mode=image"
              className="sm:col-span-2 flex min-h-11 w-full items-center gap-3 rounded-2xl border border-brand-cream/25 bg-gradient-to-br from-brand-cream/16 to-brand-cream/8 px-4 py-3 text-left shadow-[inset_0_1px_0_rgba(255,255,255,0.18)] backdrop-blur-[2px] transition-all hover:border-brand-cream/40 hover:from-brand-cream/20 hover:to-brand-cream/12 active:scale-[0.98]"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-brand-cream/30 bg-brand-green/20">
                <Leaf size={22} className="text-white" strokeWidth={2} />
              </div>
              <div>
                <p className="text-sm font-bold text-white">Menu Max</p>
                <p className="text-xs leading-snug text-brand-cream/85">
                  Analyze menus, recipe links, or web recipe searches for top picks
                </p>
              </div>
            </Link>
          </div>

          {feedback && (
            <div className="mb-3 rounded-2xl border border-brand-green/25 bg-brand-green/10 p-3 text-brand-dark">
              <p className="text-sm font-semibold flex items-center gap-2">
                <Trophy size={15} className="text-brand-green" />
                {feedback.pointsAdded > 0 ? `+${feedback.pointsAdded} pts added` : "No new points added"}
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                {feedback.duplicateCount > 0
                  ? `${feedback.duplicateCount} duplicate ${feedback.duplicateCount === 1 ? "entry" : "entries"} this week did not add a new unique point.`
                  : `${feedback.newUniqueCount} new unique ${feedback.newUniqueCount === 1 ? "species" : "species"} logged.`}
              </p>
              <p className="mt-1 text-xs text-brand-muted">
                Weekly progress: {feedback.uniqueProgress} unique plants · {weekTotalPoints} total points
              </p>
              {feedback.hasCircleImpact && (
                <p className="mt-1 text-xs text-brand-muted">
                  Circle impact: this log now counts in your circles leaderboard totals.
                </p>
              )}
            </div>
          )}

          {/* Search bar */}
          <div className="relative mb-2">
            <Search
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-brand-cream/30"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plants..."
              className="min-h-11 w-full rounded-xl bg-brand-cream/10 py-2.5 pl-10 pr-3 text-sm text-brand-cream placeholder:text-brand-cream/30 transition-colors focus:bg-brand-cream/15 focus:outline-none"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-2 top-1/2 -translate-y-1/2 flex h-11 w-11 items-center justify-center text-brand-cream/30 hover:text-brand-cream"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* === GALLERY / LIST === */}
      <div className="bg-brand-bg min-h-[60vh] grain-light">
        <div className="mx-auto max-w-lg px-page py-section-tight">
          {showGallery ? (
            // Gallery view: grouped by category with big section headers
            <div className="stack-section">
              {Object.entries(grouped).map(([cat, items], i) => {
                const Icon = CATEGORY_ICONS[cat] ?? Leaf;
                const color = CATEGORY_COLORS[cat] ?? "#6b7260";
                const isExpanded = expandedCategories.has(cat);
                const panelId = `category-panel-${cat.toLowerCase().replace(/\s+/g, "-")}`;
                return (
                  <section key={cat} className="animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                    <div
                      className="overflow-hidden rounded-2xl border border-brand-dark/10 bg-white/50 backdrop-blur-[2px]"
                      style={{ backgroundColor: `${color}08` }}
                    >
                      {/* Category header */}
                      <button
                        type="button"
                        aria-expanded={isExpanded}
                        aria-controls={panelId}
                        onClick={() => toggleCategory(cat)}
                        className="flex min-h-11 w-full items-center gap-3 p-4 text-left active:scale-[0.995]"
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon size={18} style={{ color }} strokeWidth={2} />
                        </div>
                        <div>
                          <h2 className="text-lg font-bold text-brand-dark font-display">
                            {cat}
                          </h2>
                          <p className="text-[11px] text-brand-muted">
                            {items.length}{" "}
                            {items.length === 1 ? "plant" : "plants"} ·{" "}
                            {cat === "Herbs" || cat === "Spices"
                              ? "\u00BC pt each"
                              : "1 pt each"}
                          </p>
                        </div>
                        <div className="ml-auto flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/45 text-brand-dark/65">
                          <ChevronDown
                            size={18}
                            strokeWidth={2.25}
                            className={`transition-transform duration-200 ${isExpanded ? "rotate-180" : ""}`}
                          />
                        </div>
                      </button>

                      <div
                        id={panelId}
                        className="grid transition-[grid-template-rows,opacity] duration-300 ease-out"
                        style={{
                          gridTemplateRows: isExpanded ? "1fr" : "0fr",
                          opacity: isExpanded ? 1 : 0,
                        }}
                      >
                        <div className="min-h-0">
                          <div className="relative overflow-hidden border-t border-brand-dark/10">
                            <div className="relative flex flex-wrap justify-center gap-1.5 py-3">
                              {items.map((plant) => {
                                const logged = loggedNames.has(plant.name);
                                return (
                                  <button
                                    key={plant.id}
                                    onClick={() => !logged && logPlant(plant)}
                                    disabled={logged}
                                    className={`relative min-h-11 rounded-full border px-4 py-1.5 text-left transition-all backdrop-blur-sm ${
                                      logged
                                        ? "bg-brand-dark/5 opacity-50 border-brand-dark/10"
                                        : "bg-white/30 hover:bg-white/50 hover:shadow-md active:scale-[0.97] border-brand-dark/10"
                                    }`}
                                  >
                                    <span className="flex items-center gap-1.5">
                                      <span className="text-[13px] font-semibold text-brand-dark">
                                        {plant.name}
                                      </span>
                                      {logged && (
                                        <svg
                                          width="12"
                                          height="12"
                                          viewBox="0 0 10 10"
                                          fill="none"
                                          className="shrink-0"
                                        >
                                          <path
                                            d="M2 5l2.5 2.5L8 3"
                                            stroke="#22c55e"
                                            strokeWidth="1.5"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                          />
                                        </svg>
                                      )}
                                    </span>
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </section>
                );
              })}

              {/* Don't see your plant? CTA */}
              <button
                onClick={() => setShowCustom(true)}
                className="w-full rounded-2xl border-2 border-dashed border-brand-dark/15 bg-brand-dark/[0.03] p-5 text-center transition-colors hover:border-brand-dark/25 hover:bg-brand-dark/[0.06] active:scale-[0.99]"
              >
                <div className="mx-auto mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-brand-green/10">
                  <Plus size={20} className="text-brand-green" strokeWidth={2} />
                </div>
                <p className="text-sm font-bold text-brand-dark font-display">
                  Don&apos;t see your plant?
                </p>
                <p className="text-[12px] text-brand-muted mt-0.5">
                  Add any plant — everything counts toward your 30
                </p>
              </button>
            </div>
          ) : (
            // Flat list view (when category filter or search is active)
            <div className="space-y-2">
              {filtered.length > 0 && (
                <button
                  onClick={() => setShowCustom(true)}
                  className="mb-2 flex min-h-11 w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-brand-dark/20 bg-brand-dark/[0.03] px-4 py-3 text-sm font-semibold text-brand-dark transition-colors hover:border-brand-dark/30 hover:bg-brand-dark/[0.06] active:scale-[0.99]"
                >
                  <Plus size={16} strokeWidth={2.5} className="text-brand-green" />
                  Add a Custom Plant
                </button>
              )}

              {filtered.map((plant) => (
                <PlantListItem
                  key={plant.id}
                  plant={plant}
                  logged={loggedNames.has(plant.name)}
                  onLog={logPlant}
                />
              ))}

              {filtered.length === 0 && (
                <div className="text-center py-16">
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/5">
                    <Search
                      size={24}
                      className="text-brand-dark/30"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-sm text-brand-muted mb-3">
                    No plants found for &ldquo;{search}&rdquo;
                  </p>
                  <button
                    onClick={() => setShowCustom(true)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-brand-green px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-green-hover active:scale-[0.97] transition-all"
                  >
                    <Plus size={16} strokeWidth={2.5} />
                    Add as Custom Plant
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === CUSTOM PLANT SHEET === */}
      <Sheet open={showCustom} onOpenChange={setShowCustom}>
        <SheetContent className="max-h-[calc(100dvh-0.5rem)]">
          <div className="flex h-full min-h-[360px] flex-col p-5 pb-[calc(env(safe-area-inset-bottom)+0.75rem)]">
            <div className="flex justify-center pt-0 pb-3">
              <div className="h-1 w-10 rounded-full bg-brand-dark/15" />
            </div>

            <div className="mb-4 flex items-center justify-between">
              <SheetTitle className="text-lg font-bold text-brand-dark font-display">
                Custom Plant
              </SheetTitle>
              <SheetClose asChild>
                <button
                  type="button"
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark/40 hover:text-brand-dark hover:bg-brand-dark/5 transition-colors"
                  aria-label="Close custom plant sheet"
                >
                  <X size={20} />
                </button>
              </SheetClose>
            </div>

            <form onSubmit={logCustomPlant} className="flex min-h-0 flex-1 flex-col">
              <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pb-4">
                <input
                  type="text"
                  value={customName}
                  onChange={(e) => setCustomName(e.target.value)}
                  placeholder="Plant name"
                  required
                  autoFocus
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted focus:outline-none focus:ring-2 focus:ring-brand-green"
                />
                <select
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full rounded-xl bg-white px-4 py-3 text-sm text-brand-dark focus:outline-none focus:ring-2 focus:ring-brand-green appearance-none"
                >
                  {CATEGORY_ORDER.map((c) => (
                    <option key={c} value={c}>
                      {c} {c === "Herbs" || c === "Spices" ? "(\u00BC pt)" : "(1 pt)"}
                    </option>
                  ))}
                </select>
              </div>

              <div className="shrink-0 border-t border-brand-dark/10 bg-brand-cream pt-3">
                <button
                  type="submit"
                  className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors"
                >
                  Log Plant
                </button>
              </div>
            </form>
          </div>
        </SheetContent>
      </Sheet>

      <PhotoRecognitionModal
        open={showCamera}
        onClose={() => setShowCamera(false)}
        loggedNames={loggedNames}
        onLogPlants={logRecognizedPlants}
      />

      <VoiceLogModal
        open={showVoice}
        onClose={() => setShowVoice(false)}
        plants={plants}
        loggedNames={loggedNames}
        onLogPlants={logVoicePlants}
      />
    </>
  );
}
