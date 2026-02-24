"use client";

import { AVATAR_ICONS } from "@/lib/constants";
import PlantAvatar from "./PlantAvatar";

export default function PlantPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (key: string) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {AVATAR_ICONS.map((avatar) => (
        <button
          key={avatar.key}
          type="button"
          onClick={() => onChange(avatar.key)}
          className={`w-11 h-11 flex items-center justify-center rounded-full transition-all ${
            value === avatar.key
              ? "ring-2 ring-brand-green scale-110"
              : "hover:scale-105 opacity-70 hover:opacity-100"
          }`}
        >
          <PlantAvatar plantKey={avatar.key} size="lg" />
        </button>
      ))}
    </div>
  );
}
