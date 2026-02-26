"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart } from "@/lib/weekUtils";
import {
  type Category,
  CATEGORY_COLORS,
  CATEGORY_ICONS,
  CATEGORY_ILLUSTRATIONS,
  CATEGORY_ORDER,
} from "@/lib/constants";
import { useApp } from "@/components/ProtectedLayout";
import CategoryTabs from "@/components/CategoryTabs";
import PlantListItem from "@/components/PlantListItem";
import { ArrowLeft, Plus, Search, X, Leaf, Camera } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PhotoRecognitionModal from "@/components/PhotoRecognitionModal";

type Plant = {
  id: number;
  name: string;
  category: string;
  points: number;
};

const supabase = createClient();

export default function AddPlantPage() {
  const { activeMember } = useApp();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [loggedNames, setLoggedNames] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<Category>("All");
  const [customName, setCustomName] = useState("");
  const [customCategory, setCustomCategory] = useState("Fruits");
  const [showCustom, setShowCustom] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const weekStart = useMemo(() => getWeekStart(), []);

  // Escape key closes custom plant modal
  useEffect(() => {
    if (!showCustom) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowCustom(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showCustom]);

  const fetchData = useCallback(async () => {
    if (!activeMember) return;
    const [plantsRes, logsRes] = await Promise.all([
      supabase.from("plant").select("*").order("name"),
      supabase
        .from("plant_log")
        .select("plant_name")
        .eq("member_id", activeMember.id)
        .eq("week_start", weekStart),
    ]);
    setPlants(plantsRes.data ?? []);
    setLoggedNames(new Set((logsRes.data ?? []).map((l) => l.plant_name)));
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
    }
  }

  async function logCustomPlant(e: React.FormEvent) {
    e.preventDefault();
    if (!activeMember || !customName.trim()) return;
    const isHerbOrSpice =
      customCategory === "Herbs" || customCategory === "Spices";
    const points = isHerbOrSpice ? 0.25 : 1;
    const { error } = await supabase.from("plant_log").insert({
      member_id: activeMember.id,
      plant_name: customName.trim(),
      category: customCategory,
      points,
      week_start: weekStart,
    });
    if (!error) {
      setLoggedNames((prev) => new Set(prev).add(customName.trim()));
      setCustomName("");
      setShowCustom(false);
    }
  }

  async function logRecognizedPlants(
    recognized: { name: string; category: string; points: number }[]
  ) {
    if (!activeMember) return;
    const inserts = recognized
      .filter((p) => !loggedNames.has(p.name))
      .map((p) => ({
        member_id: activeMember.id,
        plant_name: p.name,
        category: p.category,
        points: p.points,
        week_start: weekStart,
      }));
    if (inserts.length === 0) return;
    const { error } = await supabase.from("plant_log").insert(inserts);
    if (!error) {
      setLoggedNames((prev) => {
        const next = new Set(prev);
        inserts.forEach((i) => next.add(i.plant_name));
        return next;
      });
    }
  }

  const filtered = useMemo(
    () =>
      plants.filter((p) => {
        const matchCategory = category === "All" || p.category === category;
        const matchSearch =
          !search || p.name.toLowerCase().includes(search.toLowerCase());
        return matchCategory && matchSearch;
      }),
    [plants, category, search]
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
  const showGallery = category === "All" && !isSearching;

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

          {/* Snap to Log banner */}
          <button
            onClick={() => setShowCamera(true)}
            className="mb-3 flex min-h-11 w-full items-center gap-3 rounded-2xl bg-brand-green px-4 py-3 text-left transition-all hover:bg-brand-green-hover active:scale-[0.98]"
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/20">
              <Camera size={22} className="text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="text-sm font-bold text-white">Snap to Log</p>
              <p className="text-[11px] text-white/70">
                Take a photo and we&apos;ll find the plants
              </p>
            </div>
          </button>

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

      {/* === CATEGORY TABS === */}
      <div className="sticky top-safe z-30 bg-brand-cream shadow-sm">
        <div className="max-w-lg mx-auto">
          <CategoryTabs active={category} onChange={setCategory} />
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
                const illustration = CATEGORY_ILLUSTRATIONS[cat];
                return (
                  <section key={cat} className="animate-fadeInUp" style={{ animationDelay: `${i * 0.1}s` }}>
                    {/* Category header */}
                    <div className="rounded-2xl mb-3"
                      style={{ backgroundColor: `${color}08` }}
                    >
                      <div className="flex items-center gap-3 p-4">
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
                          style={{ backgroundColor: `${color}15` }}
                        >
                          <Icon
                            size={18}
                            style={{ color }}
                            strokeWidth={2}
                          />
                        </div>
                        <div>
                          <h2
                            className="text-lg font-bold text-brand-dark font-display"
                          >
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
                      </div>
                    </div>

                    {/* Plant grid with background illustration */}
                    <div className="relative overflow-hidden rounded-2xl min-h-[120px]">
                      {illustration && (
                        <div className="absolute -right-8 -bottom-8 w-[280px] h-[280px] pointer-events-none">
                          <Image
                            src={illustration}
                            alt=""
                            width={280}
                            height={280}
                            className="object-contain illo-accent"
                          />
                        </div>
                      )}
                      <div className="relative flex flex-wrap gap-1.5 justify-center py-3">
                      {items.map((plant) => {
                        const logged = loggedNames.has(plant.name);
                        return (
                          <button
                            key={plant.id}
                            onClick={() => !logged && logPlant(plant)}
                            disabled={logged}
                            className={`relative min-h-11 rounded-full px-4 py-1.5 text-left transition-all backdrop-blur-sm border ${
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
                    No plants found for &ldquo;{search || category}&rdquo;
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

      {/* === CUSTOM PLANT MODAL === */}
      {showCustom ? (
        <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-black/40 animate-fadeIn"
            onClick={() => setShowCustom(false)}
          />
          <div className="relative w-full bg-brand-cream rounded-t-3xl p-5 pb-20 animate-slideUp">
            <div className="flex justify-center pt-0 pb-3"><div className="w-10 h-1 rounded-full bg-brand-dark/15" /></div>
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-bold text-brand-dark font-display"
              >
                Custom Plant
              </h3>
              <button
                onClick={() => setShowCustom(false)}
                className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark/40 hover:text-brand-dark hover:bg-brand-dark/5 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            <form onSubmit={logCustomPlant} className="space-y-3">
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
                    {c}{" "}
                    {c === "Herbs" || c === "Spices" ? "(\u00BC pt)" : "(1 pt)"}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-xl bg-brand-green px-4 py-3 text-sm font-semibold text-white hover:bg-brand-green-hover transition-colors"
              >
                Log Plant
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          className="fixed bottom-24 right-5 z-40 flex h-12 items-center gap-2 rounded-2xl bg-brand-dark px-5 text-white shadow-lg hover:bg-brand-dark/90 active:scale-95 transition-all"
        >
          <Plus size={18} strokeWidth={2.5} />
          <span className="text-sm font-semibold">Custom</span>
        </button>
      )}

      <PhotoRecognitionModal
        open={showCamera}
        onClose={() => setShowCamera(false)}
        loggedNames={loggedNames}
        onLogPlants={logRecognizedPlants}
      />
    </>
  );
}
