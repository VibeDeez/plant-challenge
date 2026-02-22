"use client";

import { CATEGORIES, CATEGORY_COLORS, type Category } from "@/lib/constants";

export default function CategoryTabs({
  active,
  onChange,
}: {
  active: Category;
  onChange: (c: Category) => void;
}) {
  return (
    <div className="flex gap-1.5 overflow-x-auto no-scrollbar px-4 py-2">
      {CATEGORIES.map((cat) => {
        const isActive = cat === active;
        const color = cat === "All" ? "#22c55e" : CATEGORY_COLORS[cat];
        return (
          <button
            key={cat}
            onClick={() => onChange(cat)}
            className="shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-all border"
            style={
              isActive
                ? { backgroundColor: color, color: "#fff", borderColor: color }
                : { backgroundColor: "#fff", color: "#6b7280", borderColor: "#e5e7eb" }
            }
          >
            {cat}
          </button>
        );
      })}
    </div>
  );
}
