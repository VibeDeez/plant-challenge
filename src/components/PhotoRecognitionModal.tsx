"use client";

import { useState, useRef, useEffect } from "react";
import { X, Camera, Loader2, Check, AlertCircle, ShieldCheck } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/constants";
import {
  compressImage,
  getApproxDataUrlBytes,
  MAX_IMAGE_DATA_URL_BYTES,
  MAX_UPLOAD_FILE_BYTES,
} from "@/lib/imageUtils";
import {
  normalizeRecognitionConfidence,
  requiresConfidenceReview,
} from "@/lib/recognitionReview";
import { DUPLICATE_SPECIES_GUARD_COPY, DUPLICATE_SPECIES_SHORT_COPY } from "@/lib/copy";

type RecognizedPlant = {
  name: string;
  category: string;
  points: number;
  matched: boolean;
  confidence?: number;
};

type Props = {
  open: boolean;
  onClose: () => void;
  loggedNames: Set<string>;
  onLogPlants: (plants: RecognizedPlant[]) => void;
};

export default function PhotoRecognitionModal({
  open,
  onClose,
  loggedNames,
  onLogPlants,
}: Props) {
  const [preview, setPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecognizedPlant[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function reset() {
    setPreview(null);
    setLoading(false);
    setResults([]);
    setSelected(new Set());
    setError(null);
  }

  function handleClose() {
    reset();
    onClose();
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);
    setResults([]);

    try {
      if (file.size > MAX_UPLOAD_FILE_BYTES) {
        setError("Image is too large. Please pick one under 8MB.");
        return;
      }

      const dataUrl = await compressImage(file);
      if (getApproxDataUrlBytes(dataUrl) > MAX_IMAGE_DATA_URL_BYTES) {
        setError("Compressed image is still too large. Try a smaller or lower-detail photo.");
        return;
      }
      setPreview(dataUrl);
      setLoading(true);

      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!res.ok) throw new Error("Recognition failed");

      const data = await res.json();
      const plants: RecognizedPlant[] = (data.plants ?? []).map((plant: RecognizedPlant) => ({
        ...plant,
        confidence: normalizeRecognitionConfidence(plant.confidence),
      }));
      setResults(plants);

      const preSelected = new Set<number>();
      plants.forEach((p, i) => {
        if (!loggedNames.has(p.name)) preSelected.add(i);
      });
      setSelected(preSelected);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Could not identify plants. Try a clearer photo.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }

  function toggleSelect(idx: number) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(idx)) next.delete(idx);
      else next.add(idx);
      return next;
    });
  }

  function handleLog() {
    const toLog = results.filter((_, i) => selected.has(i));
    onLogPlants(toLog);
    handleClose();
  }

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") handleClose();
    };
    document.addEventListener("keydown", handler);

    if (!preview && !loading) {
      const t = setTimeout(() => fileRef.current?.click(), 180);
      return () => {
        clearTimeout(t);
        document.removeEventListener("keydown", handler);
      };
    }

    return () => document.removeEventListener("keydown", handler);
  }, [open, preview, loading]);

  if (!open) return null;

  const selectedCount = selected.size;
  const uncertainCount = results.filter(
    (plant) => !loggedNames.has(plant.name) && requiresConfidenceReview(normalizeRecognitionConfidence(plant.confidence))
  ).length;
  const duplicateCount = results.filter((plant) => loggedNames.has(plant.name)).length;

  return (
    <div className="fixed inset-0 z-50 flex items-end" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-black/40 animate-fadeIn" onClick={handleClose} />
      <div className="relative w-full max-h-[85vh] bg-brand-cream rounded-t-3xl overflow-y-auto pb-20 animate-slideUp">
        <div className="flex justify-center pt-2 pb-0">
          <div className="w-10 h-1 rounded-full bg-brand-dark/15" />
        </div>
        <div className="sticky top-safe bg-brand-cream z-10 flex items-center justify-between p-5 pb-3 border-b border-brand-dark/10">
          <h3 className="text-lg font-bold text-brand-dark font-display">Snap to Log</h3>
          <button
            onClick={handleClose}
            className="flex h-11 w-11 items-center justify-center rounded-xl text-brand-dark/40 hover:text-brand-dark hover:bg-brand-dark/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-brand-dark/20 flex flex-col items-center justify-center gap-3 hover:border-brand-green/50 hover:bg-brand-green/5 transition-colors"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-dark/5">
                <Camera size={28} className="text-brand-dark/40" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-brand-dark">Take or upload a photo</p>
                <p className="text-xs text-brand-muted mt-1">We&apos;ll identify the plants on your plate</p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={preview} alt="Meal photo" className="w-full aspect-[4/3] object-cover" />
              {loading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white/90 rounded-xl px-4 py-2.5">
                    <Loader2 size={18} className="animate-spin text-brand-green" />
                    <span className="text-sm font-medium text-brand-dark">Identifying plants...</span>
                  </div>
                </div>
              )}
              {!loading && (
                <button
                  onClick={() => {
                    reset();
                    fileRef.current?.click();
                  }}
                  className="absolute top-3 right-3 flex min-h-11 items-center bg-black/40 text-white rounded-xl px-4 py-1.5 text-xs font-medium hover:bg-black/60 transition-colors"
                >
                  Retake
                </button>
              )}
            </div>
          )}

          <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />

          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3 flex items-start gap-2">
              <AlertCircle size={16} className="text-red-600 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {results.length > 0 && !loading && (
            <>
              {(uncertainCount > 0 || duplicateCount > 0) && (
                <div className="rounded-xl border border-brand-dark/10 bg-white/80 p-3 text-xs text-brand-muted space-y-1">
                  {uncertainCount > 0 && (
                    <p className="flex items-center gap-1.5">
                      <ShieldCheck size={14} className="text-amber-600" />
                      {uncertainCount} item{uncertainCount === 1 ? "" : "s"} need a quick confidence review.
                    </p>
                  )}
                  {duplicateCount > 0 && <p>{DUPLICATE_SPECIES_GUARD_COPY}</p>}
                </div>
              )}

              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-brand-dark">
                  Found {results.length} plant{results.length !== 1 ? "s" : ""}
                </p>
                <button
                  onClick={() => {
                    if (selectedCount === results.filter((_, i) => !loggedNames.has(results[i].name)).length) {
                      setSelected(new Set());
                    } else {
                      const all = new Set<number>();
                      results.forEach((p, i) => {
                        if (!loggedNames.has(p.name)) all.add(i);
                      });
                      setSelected(all);
                    }
                  }}
                  className="min-h-11 rounded-lg px-2 text-xs font-medium text-brand-green"
                >
                  {selectedCount > 0 ? "Deselect all" : "Select all"}
                </button>
              </div>

              <div className="space-y-2">
                {results.map((plant, idx) => {
                  const alreadyLogged = loggedNames.has(plant.name);
                  const isSelected = selected.has(idx);
                  const color = CATEGORY_COLORS[plant.category] ?? "#6b7260";
                  const lowConfidence = requiresConfidenceReview(normalizeRecognitionConfidence(plant.confidence));

                  return (
                    <button
                      key={idx}
                      onClick={() => !alreadyLogged && toggleSelect(idx)}
                      disabled={alreadyLogged}
                      className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                        alreadyLogged
                          ? "bg-brand-dark/5 opacity-50"
                          : isSelected
                          ? "bg-white shadow-sm ring-1 ring-brand-green/30"
                          : "bg-white/50"
                      }`}
                    >
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          alreadyLogged
                            ? "bg-brand-green/20 border-brand-green/30"
                            : isSelected
                            ? "bg-brand-green border-brand-green"
                            : "border-brand-dark/20"
                        }`}
                      >
                        {(isSelected || alreadyLogged) && <Check size={12} className="text-white" strokeWidth={3} />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-brand-dark whitespace-normal break-words leading-snug">{plant.name}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-0.5">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: color }}
                          >
                            {plant.category}
                          </span>
                          <span className="text-[11px] text-brand-muted">
                            {plant.points === 0.25 ? "¼pt" : `${plant.points}pt`}
                          </span>
                          {lowConfidence && !alreadyLogged && (
                            <span className="text-[10px] rounded-full bg-amber-50 px-2 py-0.5 text-amber-700 border border-amber-200">
                              Review
                            </span>
                          )}
                          {alreadyLogged && (
                            <span className="text-[10px] rounded-full bg-brand-dark/5 px-2 py-0.5 text-brand-muted border border-brand-dark/10">
                              {DUPLICATE_SPECIES_SHORT_COPY}
                            </span>
                          )}
                          {!plant.matched && (
                            <span className="text-[10px] text-brand-muted/60 italic">custom</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleLog}
                disabled={selectedCount === 0}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors ${
                  selectedCount > 0
                    ? "bg-brand-green hover:bg-brand-green-hover"
                    : "bg-brand-green/30 cursor-not-allowed"
                }`}
              >
                {selectedCount > 0
                  ? `Log ${selectedCount} Plant${selectedCount !== 1 ? "s" : ""}`
                  : "Select plants to log"}
              </button>
            </>
          )}

          {results.length === 0 && !loading && preview && !error && (
            <div className="text-center py-6">
              <p className="text-sm text-brand-muted">No plant-based foods detected. Try a different photo.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
