# AI Food Recognition Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Let users photograph their meal and auto-identify plant-based foods to log toward their weekly score.

**Architecture:** Next.js API route receives base64 image from client, calls OpenRouter vision model (google/gemini-2.0-flash-lite), cross-references identified plants against the `plant` table, and returns matched results. A review modal on the Add Plant page lets users confirm which plants to log.

**Tech Stack:** OpenRouter API (vision), Next.js Route Handlers, client-side canvas for image compression, Supabase for plant matching and logging.

---

### Task 1: Add OPENROUTER_API_KEY to environment

**Files:**
- Modify: `.env.local`

**Step 1: Add the key**

Append to `.env.local`:

```
OPENROUTER_API_KEY=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
```

**Step 2: Verify it's not exposed client-side**

Confirm no `NEXT_PUBLIC_` prefix. Server-side only.

**Step 3: Commit**

No commit — `.env.local` is gitignored.

---

### Task 2: Create the `/api/recognize` route

**Files:**
- Create: `src/app/api/recognize/route.ts`

**Step 1: Write the API route**

```typescript
import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const VISION_MODEL = "google/gemini-2.0-flash-lite";

const SYSTEM_PROMPT = `You are a food recognition assistant for a plant diversity tracking app. Analyze the photo and identify all visible plant-based whole foods.

Rules:
- Only identify plant-based foods (no meat, dairy, eggs, oils, or heavily processed items)
- Each plant species should be listed once
- Categorize each into exactly one of: Fruits, Vegetables, Whole Grains, Legumes, Nuts, Seeds, Herbs, Spices
- For mixed dishes, list the individual plant components you can identify
- Use common English names (e.g. "Tomato" not "Solanum lycopersicum")
- Be specific: "Red Lentils" not just "Lentils", "Brown Rice" not just "Rice"
- If you can see garnishes or herbs, include them

Respond with ONLY a JSON array, no other text:
[{"name": "Plant Name", "category": "Category"}]

If no plant foods are visible, respond with: []`;

export async function POST(req: NextRequest) {
  if (!OPENROUTER_API_KEY) {
    return NextResponse.json(
      { error: "API key not configured" },
      { status: 500 }
    );
  }

  try {
    const { image } = await req.json();

    if (!image || typeof image !== "string") {
      return NextResponse.json(
        { error: "Missing image data" },
        { status: 400 }
      );
    }

    // Call OpenRouter vision model
    const orResponse = await fetch(OPENROUTER_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENROUTER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          {
            role: "user",
            content: [
              { type: "text", text: "Identify the plant-based foods in this photo." },
              { type: "image_url", image_url: { url: image } },
            ],
          },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });

    if (!orResponse.ok) {
      const errText = await orResponse.text();
      console.error("OpenRouter error:", orResponse.status, errText);
      return NextResponse.json(
        { error: "Vision model request failed" },
        { status: 502 }
      );
    }

    const orData = await orResponse.json();
    const content = orData.choices?.[0]?.message?.content ?? "[]";

    // Parse JSON from response (strip markdown code fences if present)
    const jsonStr = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    let identified: { name: string; category: string }[];

    try {
      identified = JSON.parse(jsonStr);
      if (!Array.isArray(identified)) identified = [];
    } catch {
      console.error("Failed to parse vision response:", content);
      identified = [];
    }

    // Valid categories
    const validCategories = new Set([
      "Fruits", "Vegetables", "Whole Grains", "Legumes",
      "Nuts", "Seeds", "Herbs", "Spices",
    ]);

    // Filter to valid entries
    identified = identified.filter(
      (item) =>
        item.name &&
        typeof item.name === "string" &&
        item.category &&
        validCategories.has(item.category)
    );

    // Cross-reference against plant table for exact matches
    const supabase = await createClient();
    const { data: dbPlants } = await supabase
      .from("plant")
      .select("name, category, points");

    const plantMap = new Map(
      (dbPlants ?? []).map((p) => [p.name.toLowerCase(), p])
    );

    const results = identified.map((item) => {
      const match = plantMap.get(item.name.toLowerCase());
      const isHerbOrSpice =
        item.category === "Herbs" || item.category === "Spices";
      return {
        name: match ? match.name : item.name,
        category: match ? match.category : item.category,
        points: match ? match.points : isHerbOrSpice ? 0.25 : 1,
        matched: !!match,
      };
    });

    return NextResponse.json({ plants: results });
  } catch (err) {
    console.error("Recognize error:", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/app/api/recognize/route.ts
git commit -m "feat: add /api/recognize route for AI plant identification"
```

---

### Task 3: Create the image compression utility

**Files:**
- Create: `src/lib/imageUtils.ts`

**Step 1: Write the utility**

```typescript
/**
 * Compress an image file to a base64 JPEG data URL.
 * Resizes to maxDim on longest side, compresses to quality.
 */
export function compressImage(
  file: File,
  maxDim = 1024,
  quality = 0.8
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        let { width, height } = img;

        if (width > maxDim || height > maxDim) {
          if (width > height) {
            height = Math.round((height * maxDim) / width);
            width = maxDim;
          } else {
            width = Math.round((width * maxDim) / height);
            height = maxDim;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) return reject(new Error("Canvas not supported"));
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.onerror = () => reject(new Error("Failed to load image"));
      img.src = reader.result as string;
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/lib/imageUtils.ts
git commit -m "feat: add client-side image compression utility"
```

---

### Task 4: Create PhotoRecognitionModal component

**Files:**
- Create: `src/components/PhotoRecognitionModal.tsx`

**Step 1: Write the component**

```typescript
"use client";

import { useState, useRef } from "react";
import { X, Camera, Loader2, Check } from "lucide-react";
import { CATEGORY_COLORS } from "@/lib/constants";
import { compressImage } from "@/lib/imageUtils";

type RecognizedPlant = {
  name: string;
  category: string;
  points: number;
  matched: boolean;
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
      const dataUrl = await compressImage(file);
      setPreview(dataUrl);
      setLoading(true);

      const res = await fetch("/api/recognize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ image: dataUrl }),
      });

      if (!res.ok) {
        throw new Error("Recognition failed");
      }

      const data = await res.json();
      const plants: RecognizedPlant[] = data.plants ?? [];
      setResults(plants);

      // Pre-select all that aren't already logged
      const preSelected = new Set<number>();
      plants.forEach((p, i) => {
        if (!loggedNames.has(p.name)) preSelected.add(i);
      });
      setSelected(preSelected);
    } catch {
      setError("Could not identify plants. Try a clearer photo.");
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

  if (!open) return null;

  const selectedCount = selected.size;

  return (
    <div className="fixed inset-0 z-50 flex items-end">
      <div className="absolute inset-0 bg-black/40" onClick={handleClose} />
      <div className="relative w-full max-h-[85vh] bg-[#f5f0e8] rounded-t-3xl overflow-y-auto pb-20">
        {/* Header */}
        <div className="sticky top-0 bg-[#f5f0e8] z-10 flex items-center justify-between p-5 pb-3 border-b border-[#1a3a2a]/10">
          <h3
            className="text-lg font-bold text-[#1a3a2a]"
            style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
          >
            Snap to Log
          </h3>
          <button
            onClick={handleClose}
            className="p-1.5 rounded-xl text-[#1a3a2a]/40 hover:text-[#1a3a2a] hover:bg-[#1a3a2a]/5 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-5 space-y-4">
          {/* Photo area */}
          {!preview ? (
            <button
              onClick={() => fileRef.current?.click()}
              className="w-full aspect-[4/3] rounded-2xl border-2 border-dashed border-[#1a3a2a]/20 flex flex-col items-center justify-center gap-3 hover:border-[#22c55e]/50 hover:bg-[#22c55e]/5 transition-colors"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#1a3a2a]/5">
                <Camera size={28} className="text-[#1a3a2a]/40" strokeWidth={1.5} />
              </div>
              <div className="text-center">
                <p className="text-sm font-semibold text-[#1a3a2a]">
                  Take or upload a photo
                </p>
                <p className="text-xs text-[#6b7260] mt-1">
                  We&apos;ll identify the plants on your plate
                </p>
              </div>
            </button>
          ) : (
            <div className="relative rounded-2xl overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={preview}
                alt="Meal photo"
                className="w-full aspect-[4/3] object-cover"
              />
              {loading && (
                <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                  <div className="flex items-center gap-2 bg-white/90 rounded-xl px-4 py-2.5">
                    <Loader2 size={18} className="animate-spin text-[#22c55e]" />
                    <span className="text-sm font-medium text-[#1a3a2a]">
                      Identifying plants...
                    </span>
                  </div>
                </div>
              )}
              {!loading && (
                <button
                  onClick={() => { reset(); fileRef.current?.click(); }}
                  className="absolute top-3 right-3 bg-black/40 text-white rounded-xl px-3 py-1.5 text-xs font-medium hover:bg-black/60 transition-colors"
                >
                  Retake
                </button>
              )}
            </div>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleFile}
            className="hidden"
          />

          {/* Error */}
          {error && (
            <div className="rounded-xl bg-red-50 border border-red-200 p-3">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Results */}
          {results.length > 0 && !loading && (
            <>
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-[#1a3a2a]">
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
                  className="text-xs font-medium text-[#22c55e]"
                >
                  {selectedCount > 0 ? "Deselect all" : "Select all"}
                </button>
              </div>

              <div className="space-y-2">
                {results.map((plant, idx) => {
                  const alreadyLogged = loggedNames.has(plant.name);
                  const isSelected = selected.has(idx);
                  const color = CATEGORY_COLORS[plant.category] ?? "#6b7260";

                  return (
                    <button
                      key={idx}
                      onClick={() => !alreadyLogged && toggleSelect(idx)}
                      disabled={alreadyLogged}
                      className={`w-full flex items-center gap-3 rounded-xl p-3 text-left transition-all ${
                        alreadyLogged
                          ? "bg-[#1a3a2a]/5 opacity-50"
                          : isSelected
                          ? "bg-white shadow-sm ring-1 ring-[#22c55e]/30"
                          : "bg-white/50"
                      }`}
                    >
                      {/* Checkbox */}
                      <div
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-md border transition-colors ${
                          alreadyLogged
                            ? "bg-[#22c55e]/20 border-[#22c55e]/30"
                            : isSelected
                            ? "bg-[#22c55e] border-[#22c55e]"
                            : "border-[#1a3a2a]/20"
                        }`}
                      >
                        {(isSelected || alreadyLogged) && (
                          <Check size={12} className="text-white" strokeWidth={3} />
                        )}
                      </div>

                      {/* Plant info */}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a3a2a] truncate">
                          {plant.name}
                          {alreadyLogged && (
                            <span className="font-normal text-[#6b7260] ml-1">
                              (already logged)
                            </span>
                          )}
                        </p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span
                            className="inline-block rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
                            style={{ backgroundColor: color }}
                          >
                            {plant.category}
                          </span>
                          <span className="text-[11px] text-[#6b7260]">
                            {plant.points === 0.25 ? "\u00BCpt" : `${plant.points}pt`}
                          </span>
                          {!plant.matched && (
                            <span className="text-[10px] text-[#6b7260]/60 italic">
                              custom
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Log button */}
              <button
                onClick={handleLog}
                disabled={selectedCount === 0}
                className={`w-full rounded-xl px-4 py-3 text-sm font-semibold text-white transition-colors ${
                  selectedCount > 0
                    ? "bg-[#22c55e] hover:bg-[#1ea34d]"
                    : "bg-[#22c55e]/30 cursor-not-allowed"
                }`}
              >
                {selectedCount > 0
                  ? `Log ${selectedCount} Plant${selectedCount !== 1 ? "s" : ""}`
                  : "Select plants to log"}
              </button>
            </>
          )}

          {/* Empty state after recognition */}
          {results.length === 0 && !loading && preview && !error && (
            <div className="text-center py-6">
              <p className="text-sm text-[#6b7260]">
                No plant-based foods detected. Try a different photo.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
```

**Step 2: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 3: Commit**

```bash
git add src/components/PhotoRecognitionModal.tsx
git commit -m "feat: add PhotoRecognitionModal for AI plant review"
```

---

### Task 5: Wire up the Add Plant page

**Files:**
- Modify: `src/app/(protected)/add/page.tsx`

**Step 1: Add imports (after existing imports, line 26)**

Add these imports:

```typescript
import PhotoRecognitionModal from "@/components/PhotoRecognitionModal";
import { Camera } from "lucide-react";
```

Note: `Camera` needs to be added to the existing lucide-react import block (lines 10-24).

**Step 2: Add state and handler**

Inside `AddPlantPage()`, after line 78 (`const [showCustom, setShowCustom] = useState(false);`), add:

```typescript
const [showCamera, setShowCamera] = useState(false);
```

Add a batch log handler after the `logCustomPlant` function (after line 131):

```typescript
async function logRecognizedPlants(
  plants: { name: string; category: string; points: number }[]
) {
  if (!activeMember) return;
  const inserts = plants
    .filter((p) => !loggedNames.has(p.name))
    .map((p) => ({
      member_id: activeMember.id,
      plant_name: p.name,
      category: p.category,
      points: p.points,
      week_start: weekStart,
    }));
  if (inserts.length === 0) return;
  const { error } = await supabase.from("plant_log").insert(inserts);
  if (!error) {
    setLoggedNames((prev) => {
      const next = new Set(prev);
      inserts.forEach((i) => next.add(i.plant_name));
      return next;
    });
  }
}
```

**Step 3: Add camera button to the header**

In the header section, next to the search bar (around line 174), add a camera button. Replace the search bar `<div className="relative mb-2">` block with:

```tsx
<div className="relative mb-2 flex gap-2">
  <div className="relative flex-1">
    <Search
      size={16}
      className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#f5f0e8]/30"
    />
    <input
      type="text"
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search plants..."
      className="w-full rounded-xl bg-[#f5f0e8]/10 py-2.5 pl-10 pr-3 text-sm text-[#f5f0e8] placeholder:text-[#f5f0e8]/30 focus:bg-[#f5f0e8]/15 focus:outline-none transition-colors"
    />
    {search && (
      <button
        onClick={() => setSearch("")}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-[#f5f0e8]/30 hover:text-[#f5f0e8]"
      >
        <X size={16} />
      </button>
    )}
  </div>
  <button
    onClick={() => setShowCamera(true)}
    className="flex h-[42px] w-[42px] shrink-0 items-center justify-center rounded-xl bg-[#22c55e] text-white hover:bg-[#1ea34d] active:scale-95 transition-all"
    title="Snap to log"
  >
    <Camera size={18} strokeWidth={2} />
  </button>
</div>
```

**Step 4: Add the modal before the closing `</>`**

Before the final `</>` (line 404), add:

```tsx
<PhotoRecognitionModal
  open={showCamera}
  onClose={() => setShowCamera(false)}
  loggedNames={loggedNames}
  onLogPlants={logRecognizedPlants}
/>
```

**Step 5: Type-check**

Run: `npx tsc --noEmit`
Expected: No errors.

**Step 6: Commit**

```bash
git add src/app/(protected)/add/page.tsx
git commit -m "feat: wire camera button and recognition modal into Add Plant page"
```

---

### Task 6: Verify full build

**Step 1: Run build**

Run: `npx next build`
Expected: Build succeeds with no errors.

**Step 2: Manual smoke test**

Run: `npx next dev`
Verify:
- Add Plant page loads
- Green camera button visible next to search bar
- Tapping camera button opens the modal
- Taking/uploading a photo triggers recognition
- Results appear with checkboxes
- Logging works and plants appear on Home page

**Step 3: Final commit if any fixes needed**

---

### Task 7: Push branch to remote

**Step 1: Push**

```bash
git push -u origin feature/ai-features
```
