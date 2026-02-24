"use client";

import { AVATAR_PLANTS } from "@/lib/constants";
import PlantAvatar from "./PlantAvatar";

export default function PlantPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (plantKey: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {AVATAR_PLANTS.map((plant) => (
        <button
          key={plant.key}
          type="button"
          onClick={() => onChange(plant.key)}
          className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${
            value === plant.key
              ? "ring-2 ring-brand-green scale-110"
              : "hover:scale-105 opacity-70 hover:opacity-100"
          }`}
        >
          <PlantAvatar plantKey={plant.key} size="lg" />
        </button>
      ))}
    </div>
  );
}
