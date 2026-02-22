"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { getWeekStart } from "@/lib/weekUtils";
import { type Category } from "@/lib/constants";
import { useApp } from "@/components/ProtectedLayout";
import CategoryTabs from "@/components/CategoryTabs";
import PlantListItem from "@/components/PlantListItem";
import { ArrowLeft, Plus, Search } from "lucide-react";
import Link from "next/link";

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
    const isHerbOrSpice = customCategory === "Herbs" || customCategory === "Spices";
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

  const filtered = plants.filter((p) => {
    const matchCategory = category === "All" || p.category === category;
    const matchSearch =
      !search || p.name.toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <>
      <div className="sticky top-0 bg-[var(--background)] z-30 border-b border-gray-100">
        <div className="flex items-center gap-3 px-4 py-3">
          <Link
            href="/"
            className="p-1 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft size={22} className="text-gray-600" />
          </Link>
          <h1 className="text-lg font-semibold text-gray-900">Add Plant</h1>
        </div>

        <div className="px-4 pb-2">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search plants..."
              className="w-full rounded-lg border border-gray-200 bg-white py-2 pl-9 pr-3 text-sm focus:border-green-500 focus:outline-none focus:ring-1 focus:ring-green-500"
            />
          </div>
        </div>

        <CategoryTabs active={category} onChange={setCategory} />
      </div>

      <div className="px-4 pt-3 pb-4 space-y-2">
        {filtered.map((plant) => (
          <PlantListItem
            key={plant.id}
            plant={plant}
            logged={loggedNames.has(plant.name)}
            onLog={logPlant}
          />
        ))}

        {filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-sm text-gray-500">
              No plants found. Try adding a custom one.
            </p>
          </div>
        )}
      </div>

      {/* Custom plant entry */}
      {showCustom ? (
        <div className="fixed inset-0 z-50 flex items-end">
          <div
            className="absolute inset-0 bg-black/30"
            onClick={() => setShowCustom(false)}
          />
          <div className="relative w-full bg-white rounded-t-2xl p-4 pb-safe">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              Log Custom Plant
            </h3>
            <form onSubmit={logCustomPlant} className="space-y-3">
              <input
                type="text"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Plant name"
                required
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              />
              <select
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                className="w-full rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-green-500 focus:outline-none"
              >
                {[
                  "Fruits",
                  "Vegetables",
                  "Whole Grains",
                  "Legumes",
                  "Nuts",
                  "Seeds",
                  "Herbs",
                  "Spices",
                ].map((c) => (
                  <option key={c} value={c}>
                    {c}{" "}
                    {c === "Herbs" || c === "Spices" ? "(¼ pt)" : "(1 pt)"}
                  </option>
                ))}
              </select>
              <button
                type="submit"
                className="w-full rounded-lg bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition-colors"
              >
                Log Plant
              </button>
            </form>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setShowCustom(true)}
          className="fixed bottom-20 right-4 z-40 flex h-14 items-center gap-2 rounded-full bg-gray-800 px-5 text-white shadow-lg hover:bg-gray-700 active:scale-95 transition-all"
        >
          <Plus size={20} />
          <span className="text-sm font-medium">Custom</span>
        </button>
      )}
    </>
  );
}
