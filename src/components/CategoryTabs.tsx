"use client";

import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/constants";
import {
  Cherry,
  LeafyGreen,
  Wheat,
  Bean,
  Nut,
  Sprout,
  Leaf,
  Flame,
  LayoutGrid,
  type LucideIcon,
} from "lucide-react";

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  All: LayoutGrid,
  Fruits: Cherry,
  Vegetables: LeafyGreen,
  "Whole Grains": Wheat,
  Legumes: Bean,
  Nuts: Nut,
  Seeds: Sprout,
  Herbs: Leaf,
  Spices: Flame,
};

export default function CategoryTabs({
  active,
  onChange,
}: {
  active: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto no-scrollbar px-5 py-2.5">
      {CATEGORIES.map((cat) => {
        const isActive = cat === active;
        const color = cat === "All" ? "#22c55e" : (CATEGORY_COLORS[cat] ?? "#6b7260");
        const Icon = CATEGORY_ICONS[cat] ?? Leaf;
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-2 text-xs font-semibold transition-all ${
              isActive
                ? "text-white shadow-sm"
                : "bg-[#1a3a2a]/5 text-[#1a3a2a]/60 hover:bg-[#1a3a2a]/10"
            }`}
            style={
              isActive
                ? { backgroundColor: color }
                : undefined
            }
          >
            <Icon size={14} strokeWidth={isActive ? 2.25 : 1.75} />
            {cat}
          </button>
        );
      })}
    </div>
  );
}
