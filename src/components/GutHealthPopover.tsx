"use client";

import { X, Leaf } from "lucide-react";
import { CATEGORY_COLORS, CATEGORY_ICONS } from "@/lib/constants";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";

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

  return (
    <Dialog
      open
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <DialogContent className="p-5">
        <DialogClose asChild>
          <button
            type="button"
            data-haptic="selection"
            className="absolute right-2 top-2 flex h-11 w-11 items-center justify-center rounded-full text-brand-muted transition-colors hover:bg-brand-dark/5 hover:text-brand-dark"
            aria-label="Close gut health dialog"
          >
            <X size={16} />
          </button>
        </DialogClose>

        <div className="mb-3 flex items-center gap-3 pr-6">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
            style={{ backgroundColor: `${color}18` }}
          >
            <Icon size={20} style={{ color }} strokeWidth={1.75} />
          </div>
          <div>
            <DialogTitle className="font-display text-base font-bold leading-tight text-brand-dark">
              {plantName}
            </DialogTitle>
            <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color }}>
              Gut Health
            </p>
          </div>
        </div>

        <DialogDescription className="text-sm leading-relaxed text-brand-dark/80">
          {blurb}
        </DialogDescription>
      </DialogContent>
    </Dialog>
  );
}
