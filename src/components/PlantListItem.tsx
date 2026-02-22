"use client";

import { CATEGORY_COLORS, CATEGORY_EMOJI } from "@/lib/constants";
import { Check } from "lucide-react";

type Plant = {
  id: number;
  name: string;
  category: string;
  points: number;
};

export default function PlantListItem({
  plant,
  logged,
  onLog,
}: {
  plant: Plant;
  logged: boolean;
  onLog: (plant: Plant) => void;
}) {
  const color = CATEGORY_COLORS[plant.category] ?? "#6b7280";
  const emoji = CATEGORY_EMOJI[plant.category] ?? "🌱";

  return (
    <button
      onClick={() => !logged && onLog(plant)}
      disabled={logged}
      className={`flex items-center gap-3 w-full rounded-xl px-4 py-3 text-left transition-all ${
        logged
          ? "bg-gray-50 opacity-50"
          : "bg-white shadow-sm border border-gray-100 active:scale-[0.98]"
      }`}
    >
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {plant.name}
        </p>
        <p className="text-xs" style={{ color }}>
          {plant.category} · {plant.points === 0.25 ? "¼" : plant.points} pt
        </p>
      </div>
      {logged && (
        <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100">
          <Check size={14} className="text-green-600" />
        </div>
      )}
    </button>
  );
}
