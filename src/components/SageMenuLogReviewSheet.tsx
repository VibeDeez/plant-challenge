"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { MenuMaxLogCandidate } from "@/lib/ai/menuMaxTypes";

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
      .filter((_, index) => selected.has(index))
      .map((plant) => ({
        member_id: memberId,
        plant_name: plant.name,
        category: plant.category,
        points: plant.points,
        week_start: weekStart,
      }));

    const { error: insertError } = await supabase.from("plant_log").insert(inserts);
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
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={onClose} />
      <div className="relative w-full max-h-[85vh] overflow-y-auto rounded-t-3xl bg-brand-cream pb-20 animate-slideUp">
        <div className="flex justify-center pt-2 pb-0">
          <div className="h-1 w-10 rounded-full bg-brand-dark/15" />
        </div>
        <div className="sticky top-safe z-10 flex items-center justify-between border-b border-brand-dark/10 bg-brand-cream p-5 pb-3">
          <div>
            <h3 className="font-display text-lg font-bold text-brand-dark">Review & Log</h3>
            <p className="text-xs text-brand-muted">
              {duplicateCount > 0
                ? `${duplicateCount} already logged this week are unselected by default.`
                : "All suggested plants are selected by default."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark/40 transition-colors hover:bg-brand-dark/5 hover:text-brand-dark"
          >
            <X size={20} />
          </button>
        </div>

        <div className="space-y-2 p-5">
          {plants.map((plant, index) => {
            const checked = selected.has(index);
            return (
              <button
                key={`${plant.name}-${index}`}
                type="button"
                onClick={() => toggle(index)}
                className={`flex min-h-11 w-full items-center gap-3 rounded-xl border px-3 py-2 text-left transition-colors ${
                  checked
                    ? "border-brand-green/30 bg-white"
                    : "border-brand-dark/10 bg-white/60"
                }`}
              >
                <span
                  className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border ${
                    checked
                      ? "border-brand-green bg-brand-green"
                      : "border-brand-dark/20 bg-white"
                  }`}
                >
                  {checked && <Check size={12} className="text-white" strokeWidth={3} />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold text-brand-dark">{plant.name}</span>
                  <span className="block text-[11px] text-brand-muted">
                    {plant.category} · {plant.points === 0.25 ? "0.25" : plant.points} pt
                    {plant.duplicateThisWeek ? " · already logged this week" : ""}
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
    </div>
  );
}
