"use client";

import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";
import { Check, Leaf } from "lucide-react";

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
  const color = CATEGORY_COLORS[plant.category] ?? "#6b7260";
  const Icon = CATEGORY_ICONS[plant.category] ?? Leaf;

  return (
    <button
      onClick={() => !logged && onLog(plant)}
      disabled={logged}
      className={`flex items-center gap-3 w-full rounded-2xl px-4 py-3.5 text-left transition-all ${
        logged
          ? "bg-brand-dark/5 opacity-60"
          : "bg-white hover:shadow-md active:scale-[0.98]"
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}12` }}
      >
        <Icon size={20} style={{ color }} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-brand-dark truncate">
          {plant.name}
        </p>
        <p className="text-xs font-medium" style={{ color }}>
          {plant.points === 0.25 ? "\u00BC" : plant.points} pt
        </p>
      </div>
      {logged && (
        <div className="flex items-center justify-center w-7 h-7 rounded-full bg-brand-green/10">
          <Check size={16} className="text-brand-green" strokeWidth={2.5} />
        </div>
      )}
    </button>
  );
}
