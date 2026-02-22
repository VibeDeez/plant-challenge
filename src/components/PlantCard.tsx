"use client";

import { Trash2 } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_EMOJI } from "@/lib/constants";

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
  const color = CATEGORY_COLORS[log.category] ?? "#6b7280";
  const emoji = CATEGORY_EMOJI[log.category] ?? "🌱";

  return (
    <div className="flex items-center gap-3 rounded-xl bg-white px-4 py-3 shadow-sm border border-gray-100">
      <span className="text-xl">{emoji}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">
          {log.plant_name}
        </p>
        <p className="text-xs" style={{ color }}>
          {log.category} · {log.points === 0.25 ? "¼" : log.points} pt
        </p>
      </div>
      <button
        onClick={() => onDelete(log.id)}
        className="p-1.5 rounded-lg text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
}
