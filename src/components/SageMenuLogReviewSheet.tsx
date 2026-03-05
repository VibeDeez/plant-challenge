"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MenuMaxLogCandidate } from "@/lib/ai/menuMaxTypes";
import { Sheet, SheetClose, SheetContent, SheetTitle } from "@/components/ui/sheet";

type SageMenuLogReviewSheetProps = {
  open: boolean;
  onClose: () => void;
  plants: MenuMaxLogCandidate[];
  memberId: string | null;
  weekStart: string;
  onLogged: (count: number, names: string[]) => void;
};

const supabase = createClient();

export default function SageMenuLogReviewSheet({
  open,
  onClose,
  plants,
  memberId,
  weekStart,
  onLogged,
}: SageMenuLogReviewSheetProps) {
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    const defaults = new Set<number>();
    plants.forEach((plant, idx) => {
      if (!plant.duplicateThisWeek) defaults.add(idx);
    });
    setSelected(defaults);
    setSaving(false);
    setError(null);
  }, [open, plants]);

  const selectedCount = selected.size;
  const duplicateCount = useMemo(
    () => plants.filter((plant) => plant.duplicateThisWeek).length,
    [plants]
  );

  function toggle(index: number) {
    if (plants[index]?.duplicateThisWeek) return;
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  async function handleConfirm() {
    if (!memberId || selectedCount === 0 || saving) return;
    setSaving(true);
    setError(null);

    const inserts = plants
      .filter((plant, index) => selected.has(index) && !plant.duplicateThisWeek)
      .map((plant) => ({
        member_id: memberId,
        plant_name: plant.name,
        category: plant.category,
        points: plant.points,
        week_start: weekStart,
      }));

    const { error: insertError } = await supabase.from("plant_log").upsert(inserts, {
      onConflict: "member_id,plant_name,week_start",
      ignoreDuplicates: true,
    });
    if (insertError) {
      setSaving(false);
      setError("Could not save suggestions. Please try again.");
      return;
    }

    setSaving(false);
    onLogged(
      inserts.length,
      inserts.map((insert) => insert.plant_name)
    );
    onClose();
  }

  if (!open) return null;

  return (
    <Sheet
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) onClose();
      }}
    >
      <SheetContent className="max-h-[85vh]">
        <div className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain pb-[calc(env(safe-area-inset-bottom)+1rem)]">
        <div className="flex justify-center pt-2 pb-0">
          <div className="h-1 w-10 rounded-full bg-brand-dark/15" />
        </div>
        <div className="sticky top-safe z-10 flex items-center justify-between border-b border-brand-dark/10 bg-brand-cream p-5 pb-3">
          <div>
            <SheetTitle className="font-display text-lg font-bold text-brand-dark">
              Review & Log
            </SheetTitle>
            <p className="text-xs text-brand-muted">
              {duplicateCount > 0
                ? `${duplicateCount} already logged this week are locked and won't be logged again.`
                : "All suggested plants are selected by default."}
            </p>
          </div>
          <SheetClose asChild>
            <button
              type="button"
              data-haptic="selection"
              className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark/40 transition-colors hover:bg-brand-dark/5 hover:text-brand-dark"
              aria-label="Close Menu Max review sheet"
            >
              <X size={20} />
            </button>
          </SheetClose>
        </div>

        <div className="space-y-2 p-5">
          {plants.map((plant, index) => {
            const checked = selected.has(index);
            const duplicate = plant.duplicateThisWeek;
            return (
              <button
                key={`${plant.name}-${index}`}
                type="button"
                onClick={() => !duplicate && toggle(index)}
                disabled={duplicate}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                  duplicate
                    ? "border-brand-dark/10 bg-brand-dark/5 opacity-60"
                    : checked
                    ? "border-brand-green/30 bg-white"
                    : "border-brand-dark/10 bg-white/60"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    duplicate || checked
                      ? "border-brand-green bg-brand-green"
                      : "border-brand-dark/20 bg-white"
                  }`}
                >
                  {(duplicate || checked) && (
                    <Check size={12} className="text-white" strokeWidth={3} />
                  )}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brand-dark">{plant.name}</span>
                  <span className="block text-[11px] text-brand-muted">
                    {plant.category} · {plant.points === 0.25 ? "0.25" : plant.points} pt
                    {duplicate ? " · already logged this week" : ""}
                  </span>
                </span>
              </button>
            );
          })}

          {error && (
            <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}

          <button
            type="button"
            onClick={handleConfirm}
            disabled={saving || selectedCount === 0 || !memberId}
            className="w-full min-h-11 rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving
              ? "Saving..."
              : selectedCount > 0
              ? `Log ${selectedCount} plant${selectedCount === 1 ? "" : "s"}`
              : "Select plants to log"}
          </button>
        </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
