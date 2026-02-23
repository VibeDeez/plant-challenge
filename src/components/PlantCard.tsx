"use client";

import { Trash2, type LucideIcon } from "lucide-react";
import {
  Cherry,
  LeafyGreen,
  Wheat,
  Bean,
  Nut,
  Sprout,
  Leaf,
  Flame,
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

type PlantLog = {
  id: string;
  plant_name: string;
  category: string;
  points: number;
};

export default function PlantCard({
  log,
  onDelete,
}: {
  log: PlantLog;
  onDelete: (id: string) => void;
}) {
  const color = CATEGORY_COLORS[log.category] ?? "#6b7260";
  const Icon = CATEGORY_ICONS[log.category] ?? Leaf;

  return (
    <div className="group flex items-center gap-3.5 rounded-2xl bg-white px-4 py-3.5 transition-all hover:shadow-md">
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
        style={{ backgroundColor: `${color}12` }}
      >
        <Icon size={20} style={{ color }} strokeWidth={1.75} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[15px] font-semibold text-[#1a3a2a] truncate">
          {log.plant_name}
        </p>
        <p className="text-xs font-medium" style={{ color }}>
          {log.category} · {log.points === 0.25 ? "¼" : log.points} pt
        </p>
      </div>
      <button
        onClick={() => onDelete(log.id)}
        className="p-2 rounded-xl text-[#1a3a2a]/20 opacity-0 group-hover:opacity-100 hover:text-red-500 hover:bg-red-50 transition-all"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
