"use client";

import { useEffect } from "react";
import { X, Leaf } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";

type GutHealthPopoverProps = {
  plantName: string;
  category: string;
  blurb: string;
  onClose: () => void;
};

export default function GutHealthPopover({
  plantName,
  category,
  blurb,
  onClose,
}: GutHealthPopoverProps) {
  const color = CATEGORY_COLORS[category] ?? "#6b7260";
  const Icon = CATEGORY_ICONS[category] ?? Leaf;

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-6 animate-fadeIn"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40" />

      {/* Card */}
      <div
        className="relative max-w-xs w-full rounded-2xl bg-brand-cream p-5 shadow-xl animate-popIn"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-2 right-2 flex h-11 w-11 items-center justify-center rounded-full text-brand-muted hover:text-brand-dark hover:bg-brand-dark/5 transition-colors"
          aria-label="Close"
        >
          <X size={16} />
        </button>

        {/* Icon + heading */}
        <div className="flex items-center gap-3 mb-3 pr-6">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}18` }}
          >
            <Icon size={20} style={{ color }} strokeWidth={1.75} />
          </div>
          <div>
            <p className="text-base font-bold text-brand-dark font-display leading-tight">
              {plantName}
            </p>
            <p className="text-[11px] font-semibold tracking-wide uppercase" style={{ color }}>
              Gut Health
            </p>
          </div>
        </div>

        {/* Blurb */}
        <p className="text-sm text-brand-dark/80 leading-relaxed">
          {blurb}
        </p>
      </div>
    </div>
  );
}
