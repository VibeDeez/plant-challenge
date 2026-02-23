"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart } from "@/lib/weekUtils";
import { type Category, CATEGORY_COLORS } from "@/lib/constants";
import { useApp } from "@/components/ProtectedLayout";
import CategoryTabs from "@/components/CategoryTabs";
import PlantListItem from "@/components/PlantListItem";
import {
  ArrowLeft,
  Plus,
  Search,
  X,
  Cherry,
  LeafyGreen,
  Wheat,
  Bean,
  Nut,
  Sprout,
  Leaf,
  Flame,
  Camera,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import PhotoRecognitionModal from "@/components/PhotoRecognitionModal";

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

const CATEGORY_ORDER = [
  "Fruits",
  "Vegetables",
  "Whole Grains",
  "Legumes",
  "Nuts",
  "Seeds",
  "Herbs",
  "Spices",
];

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
  const weekStart = getWeekStart();

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
    plants: { name: string; category: string; points: number }[]
  ) {
    if (!activeMember) return;
    const inserts = plants
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

  const filtered = plants.filter((p) => {
    const matchCategory = category === "All" || p.category === category;
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  // Group filtered plants by category for gallery view
  const grouped = CATEGORY_ORDER.reduce<Record<string, Plant[]>>(
    (acc, cat) => {
      const items = filtered.filter((p) => p.category === cat);
      if (items.length > 0) acc[cat] = items;
      return acc;
    },
    {}
  );

  const isSearching = search.length > 0;
  const showGallery = category === "All" && !isSearching;

  return (
    <>
      {/* === HEADER === */}
      <div className="bg-[#1a3a2a] px-5 pt-4 pb-2 grain">
        <div className="max-w-lg mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Link
              href="/"
              className="p-1.5 rounded-xl text-[#f5f0e8]/60 hover:text-[#f5f0e8] hover:bg-[#f5f0e8]/10 transition-colors"
            >
              <ArrowLeft size={22} />
            </Link>
            <h1
              className="text-2xl font-bold text-[#f5f0e8]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              Log Plants
            </h1>
          </div>

          {/* Snap to Log banner */}
          <button
            onClick={() => setShowCamera(true)}
            className="w-full mb-3 flex items-center gap-3 rounded-2xl bg-[#22c55e] px-4 py-3 text-left hover:bg-[#1ea34d] active:scale-[0.98] transition-all"
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
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#f5f0e8]/30"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plants..."
              className="w-full rounded-xl bg-[#f5f0e8]/10 py-2.5 pl-10 pr-3 text-sm text-[#f5f0e8] placeholder:text-[#f5f0e8]/30 focus:bg-[#f5f0e8]/15 focus:outline-none transition-colors"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5f0e8]/30 hover:text-[#f5f0e8]"
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* === CATEGORY TABS === */}
      <div className="sticky top-0 z-30 bg-[#f5f0e8] shadow-sm">
        <div className="max-w-lg mx-auto">
          <CategoryTabs active={category} onChange={setCategory} />
        </div>
      </div>

      {/* === GALLERY / LIST === */}
      <div className="bg-[#f8faf8] min-h-[60vh] grain-light">
        <div className="max-w-lg mx-auto px-5 py-4">
          {showGallery ? (
            // Gallery view: grouped by category with big section headers
            <div className="space-y-8">
              {Object.entries(grouped).map(([cat, items]) => {
                const Icon = CATEGORY_ICONS[cat] ?? Leaf;
                const color = CATEGORY_COLORS[cat] ?? "#6b7260";
                const illustration = CATEGORY_ILLUSTRATIONS[cat];
                return (
                  <section key={cat}>
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
                            className="text-lg font-bold text-[#1a3a2a]"
                            style={{
                              fontFamily:
                                "Georgia, 'Times New Roman', serif",
                            }}
                          >
                            {cat}
                          </h2>
                          <p className="text-[11px] text-[#6b7260]">
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
                            className="object-contain opacity-[0.25]"
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
                            className={`relative rounded-full px-3.5 py-1.5 text-left transition-all backdrop-blur-sm border ${
                              logged
                                ? "bg-[#1a3a2a]/5 opacity-50 border-[#1a3a2a]/10"
                                : "bg-white/30 hover:bg-white/50 hover:shadow-md active:scale-[0.97] border-[#1a3a2a]/10"
                            }`}
                          >
                            <span className="flex items-center gap-1.5">
                              <span className="text-[13px] font-semibold text-[#1a3a2a]">
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
                  <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a3a2a]/5">
                    <Search
                      size={24}
                      className="text-[#1a3a2a]/30"
                      strokeWidth={1.5}
                    />
                  </div>
                  <p className="text-sm text-[#6b7260]">
                    No plants found. Try a custom entry.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* === CUSTOM PLANT MODAL === */}
      {showCustom ? (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setShowCustom(false)}
          />
          <div className="relative w-full bg-[#f5f0e8] rounded-t-3xl p-5 pb-20">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-lg font-bold text-[#1a3a2a]"
                style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
              >
                Custom Plant
              </h3>
              <button
                onClick={() => setShowCustom(false)}
                className="p-1.5 rounded-xl text-[#1a3a2a]/40 hover:text-[#1a3a2a] hover:bg-[#1a3a2a]/5 transition-colors"
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
                className="w-full rounded-xl bg-white px-4 py-3 text-sm text-[#1a3a2a] placeholder:text-[#6b7260] focus:outline-none focus:ring-2 focus:ring-[#22c55e]"
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full rounded-xl bg-white px-4 py-3 text-sm text-[#1a3a2a] focus:outline-none focus:ring-2 focus:ring-[#22c55e] appearance-none"
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
                className="w-full rounded-xl bg-[#22c55e] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ea34d] transition-colors"
              >
                Log Plant
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          className="fixed bottom-24 right-5 z-40 flex h-12 items-center gap-2 rounded-2xl bg-[#1a3a2a] px-5 text-white shadow-lg hover:bg-[#1a3a2a]/90 active:scale-95 transition-all"
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
