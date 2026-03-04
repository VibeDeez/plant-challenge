"use client";

import {
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type ClipboardEvent,
} from "react";
import Link from "next/link";
import { Camera, ExternalLink, Leaf, Link2, Loader2, Search } from "lucide-react";
import { getWeekStart } from "@/lib/weekUtils";
import { compressImage } from "@/lib/imageUtils";
import type { MenuMaxResponse } from "@/lib/ai/menuMaxTypes";
import SageMenuLogReviewSheet from "@/components/SageMenuLogReviewSheet";

type SageMenuMaxProps = {
  memberId: string | null;
  alreadyLoggedThisWeek: string[];
  weekProgress: { points: number; uniquePlants: number; target: number };
  initialMode?: "url" | "image" | "discover";
};

type MenuApiError = {
  error?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isMenuMaxResponse(value: unknown): value is MenuMaxResponse {
  if (!isRecord(value)) return false;
  if (!Array.isArray(value.recommendations)) return false;
  if (!Array.isArray(value.logCandidates)) return false;
  if (!Array.isArray(value.sourceNotes)) return false;
  if (typeof value.confidence !== "number") return false;
  return true;
}

export default function SageMenuMax({
  memberId,
  alreadyLoggedThisWeek,
  weekProgress,
  initialMode = "url",
}: SageMenuMaxProps) {
  const [mode, setMode] = useState<"url" | "image" | "discover">(initialMode);
  const [url, setUrl] = useState("");
  const [query, setQuery] = useState("");
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [response, setResponse] = useState<MenuMaxResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [localLogged, setLocalLogged] = useState<string[]>(alreadyLoggedThisWeek);
  const weekStart = useMemo(() => getWeekStart(), []);

  const context = useMemo(
    () => ({
      alreadyLoggedThisWeek: Array.from(
        new Set([...alreadyLoggedThisWeek, ...localLogged].map((name) => name.trim()).filter(Boolean))
      ),
      weekProgress,
    }),
    [alreadyLoggedThisWeek, localLogged, weekProgress]
  );

  async function runMenuMax() {
    if (analyzing) return;
    if (mode === "url" && url.trim().length === 0) return;
    if (mode === "image" && !imageDataUrl) return;
    if (mode === "discover" && query.trim().length === 0) return;

    setAnalyzing(true);
    setError(null);
    setSuccessMessage(null);
    setResponse(null);

    try {
      const res = await fetch("/api/sage/menu-max", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode,
          url: mode === "url" ? url.trim() : undefined,
          imageDataUrl: mode === "image" ? imageDataUrl : undefined,
          query: mode === "discover" ? query.trim() : undefined,
          context,
        }),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => null)) as MenuApiError | null;
        setError(body?.error ?? "Menu Max could not analyze this menu.");
        return;
      }

      const body = (await res.json()) as unknown;
      if (!isMenuMaxResponse(body)) {
        setError("Menu Max returned an unexpected response.");
        return;
      }

      setResponse(body);
    } catch {
      setError("Could not reach Menu Max. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleImageFile(file: File) {
    setError(null);
    try {
      const compressed = await compressImage(file);
      setImageDataUrl(compressed);
    } catch {
      setError("Could not read image. Try another screenshot/photo.");
    }
  }

  async function handleFileChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    await handleImageFile(file);
  }

  async function handlePaste(event: ClipboardEvent<HTMLDivElement>) {
    const items = Array.from(event.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith("image/"));
    if (!imageItem) return;
    const file = imageItem.getAsFile();
    if (!file) return;
    event.preventDefault();
    await handleImageFile(file);
    setMode("image");
  }

  return (
    <>
      <section
        className="rounded-2xl border border-brand-dark/10 bg-white/70 p-4"
        onPaste={handlePaste}
      >
        <p className="mb-1 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted">
          <Leaf size={14} />
          Menu Max
        </p>
        <h2 className="text-lg font-display text-brand-dark">Restaurant helper</h2>
        <p className="mt-1 text-sm text-brand-muted">
          Paste a menu/recipe URL, upload a screenshot, or search the web for recipes that maximize your points.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => setMode("url")}
            data-haptic="selection"
            className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold ${
              mode === "url"
                ? "border-brand-green bg-brand-green/10 text-brand-dark"
                : "border-brand-dark/10 bg-white text-brand-muted"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Link2 size={14} />
              Menu URL
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("image")}
            data-haptic="selection"
            className={`min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold ${
              mode === "image"
                ? "border-brand-green bg-brand-green/10 text-brand-dark"
                : "border-brand-dark/10 bg-white text-brand-muted"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Camera size={14} />
              Screenshot
            </span>
          </button>
          <button
            type="button"
            onClick={() => setMode("discover")}
            data-haptic="selection"
            className={`col-span-2 min-h-11 rounded-xl border px-3 py-2 text-sm font-semibold ${
              mode === "discover"
                ? "border-brand-green bg-brand-green/10 text-brand-dark"
                : "border-brand-dark/10 bg-white text-brand-muted"
            }`}
          >
            <span className="inline-flex items-center justify-center gap-2 whitespace-nowrap">
              <Search size={14} />
              Find Recipe
            </span>
          </button>
        </div>

        {mode === "url" ? (
          <div className="mt-3 space-y-2">
            <label htmlFor="menu-max-url" className="text-xs font-medium text-brand-muted">
              Recipe or menu URL
            </label>
            <input
              id="menu-max-url"
              type="url"
              value={url}
              onChange={(event) => setUrl(event.target.value)}
              placeholder="https://www.thedefineddish.com/..."
              className="w-full min-h-11 rounded-xl border border-brand-dark/10 bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-brand-muted/70 focus:border-brand-green focus:outline-none"
            />
            <p className="text-[11px] text-brand-muted">
              Works with restaurant menus or recipe blogs.
            </p>
          </div>
        ) : mode === "image" ? (
          <div className="mt-3 space-y-2">
            <p className="text-xs font-medium text-brand-muted">
              Upload or paste screenshot/photo of the menu
            </p>
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-dashed border-brand-dark/20 bg-brand-bg px-3 py-3 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/5"
            >
              <Camera size={16} />
              {imageDataUrl ? "Replace screenshot" : "Choose screenshot"}
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
            <p className="text-[11px] text-brand-muted">
              Tip: you can copy a screenshot and paste it here.
            </p>
            {imageDataUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={imageDataUrl}
                alt="Menu preview"
                className="w-full rounded-xl border border-brand-dark/10 object-cover"
              />
            )}
          </div>
        ) : (
          <div className="mt-3 space-y-2">
            <label htmlFor="menu-max-query" className="text-xs font-medium text-brand-muted">
              What kind of recipe do you want?
            </label>
            <input
              id="menu-max-query"
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="high-protein vegetarian dinner"
              className="w-full min-h-11 rounded-xl border border-brand-dark/10 bg-white px-3 py-2 text-sm text-brand-dark placeholder:text-brand-muted/70 focus:border-brand-green focus:outline-none"
            />
            <p className="text-[11px] text-brand-muted">
              Menu Max will search recipe pages and rank the best options for plant diversity.
            </p>
          </div>
        )}

        <button
          type="button"
          onClick={runMenuMax}
          disabled={
            analyzing ||
            (mode === "url"
              ? url.trim().length === 0
              : mode === "image"
                ? !imageDataUrl
                : query.trim().length === 0)
          }
          className="mt-3 w-full min-h-11 rounded-xl bg-brand-green px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-green-hover disabled:cursor-not-allowed disabled:opacity-60"
        >
          {analyzing ? (
            <span className="inline-flex items-center gap-2">
              <Loader2 size={16} className="animate-spin" />
              {mode === "discover" ? "Finding recipes..." : "Analyzing menu..."}
            </span>
          ) : (
            mode === "discover" ? "Find Best Recipes" : "Find Top Picks"
          )}
        </button>

        {error && (
          <p className="mt-3 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        )}

        {successMessage && (
          <p className="mt-3 rounded-xl border border-brand-green/20 bg-brand-green/10 px-3 py-2 text-sm text-brand-dark">
            {successMessage}
          </p>
        )}

        {response && (
          <div className="mt-3 space-y-3">
            <div className="rounded-xl border border-brand-dark/10 bg-brand-cream/60 px-3 py-2 text-xs text-brand-muted">
              Confidence: {Math.round(response.confidence * 100)}%
              {response.sourceNotes.length > 0 ? ` · ${response.sourceNotes.join(" ")}` : ""}
            </div>

            <div className="space-y-2">
              {response.recommendations.map((recommendation) => (
                <article
                  key={`${recommendation.rank}-${recommendation.dishName}`}
                  className="rounded-xl border border-brand-dark/10 bg-brand-bg px-3 py-3"
                >
                  <p className="text-[11px] font-semibold uppercase tracking-wider text-brand-muted">
                    Pick {recommendation.rank}
                  </p>
                  <h3 className="text-sm font-semibold text-brand-dark">{recommendation.dishName}</h3>
                  <p className="mt-1 text-xs text-brand-muted">{recommendation.why}</p>
                  {recommendation.sourceUrl && (
                    <a
                      href={recommendation.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex items-center gap-1 text-[11px] font-medium text-brand-dark underline decoration-brand-dark/30 underline-offset-2"
                    >
                      {recommendation.sourceTitle ?? "View source recipe"}
                      <ExternalLink size={12} />
                    </a>
                  )}
                  <p className="mt-1 text-[11px] font-semibold text-brand-dark">
                    ~{recommendation.estimatedPoints} pts · {recommendation.estimatedUniquePlants} new species
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {recommendation.plants.map((plant, idx) => (
                      <span
                        key={`${recommendation.rank}-${plant.name}-${idx}`}
                        className="inline-flex min-h-7 items-center rounded-full border border-brand-dark/10 bg-white px-2 py-1 text-[11px] text-brand-dark"
                      >
                        {plant.name}
                        {plant.duplicateThisWeek ? " (dup)" : ""}
                      </span>
                    ))}
                  </div>
                </article>
              ))}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <button
                type="button"
                onClick={() => setReviewOpen(true)}
                data-haptic="selection"
                disabled={response.logCandidates.length === 0}
                className="w-full min-h-11 rounded-xl bg-brand-dark px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-brand-dark/90 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Review & Log Suggested Plants
              </button>
              <Link
                href="/add"
                className="inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-brand-dark/15 bg-white px-4 py-2 text-sm font-semibold text-brand-dark transition-colors hover:bg-brand-dark/5"
              >
                Log manually in Add
                <ExternalLink size={14} />
              </Link>
            </div>
          </div>
        )}
      </section>

      <SageMenuLogReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        plants={response?.logCandidates ?? []}
        memberId={memberId}
        weekStart={weekStart}
        onLogged={(count, names) => {
          setLocalLogged((prev) => [...prev, ...names]);
          setSuccessMessage(`Logged ${count} plant${count === 1 ? "" : "s"} from Menu Max.`);
        }}
      />
    </>
  );
}
