"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { getPlantByKey } from "@/lib/constants";

const SIZES = {
  sm: 24,
  md: 32,
  lg: 48,
  xl: 80,
} as const;

const FONT_SIZES = {
  sm: "text-[10px]",
  md: "text-xs",
  lg: "text-base",
  xl: "text-2xl",
} as const;

export default function PlantAvatar({
  plantKey,
  size = "md",
}: {
  plantKey: string;
  size?: keyof typeof SIZES;
}) {
  const plant = getPlantByKey(plantKey);
  const px = SIZES[size];
  const [imgError, setImgError] = useState(false);

  return (
    <div
      className="rounded-full bg-brand-cream overflow-hidden shrink-0 flex items-center justify-center"
      style={{ width: px, height: px }}
    >
      {imgError ? (
        <span className={`${FONT_SIZES[size]} text-brand-dark/40 font-display leading-none select-none`}>
          {plant.label.charAt(0)}
        </span>
      ) : (
        <img
          src={plant.path}
          alt={plant.label}
          width={px}
          height={px}
          className="w-full h-full object-cover"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
