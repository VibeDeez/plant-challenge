"use client";

import { CATEGORIES, CATEGORY_COLORS, CATEGORY_ICONS, type Category } from "@/lib/constants";
import { Leaf } from "lucide-react";

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
                : "bg-brand-dark/5 text-brand-dark/60 hover:bg-brand-dark/10"
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
