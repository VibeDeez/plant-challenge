# AI Food Recognition Design

## Overview

Add photo-based plant logging to the Add Plant page. Users take or upload a photo of their meal, a vision model identifies the plant-based foods, and the user confirms which to log via a review modal with checkboxes.

## Architecture

- **Entry point:** Camera button on Add Plant page (alongside search bar)
- **API route:** `/api/recognize/route.ts` — receives base64 image, calls OpenRouter, returns identified plants
- **Vision model:** `google/gemini-2.0-flash-lite` via OpenRouter (`/api/v1/chat/completions`)
- **Review UI:** `PhotoRecognitionModal.tsx` — photo preview, loading state, results checklist, batch log

## Security

- `OPENROUTER_API_KEY` stored server-side only (no `NEXT_PUBLIC_` prefix)
- Image sent from client to our API route, never directly to OpenRouter from browser

## Data Flow

1. User taps camera button → `<input type="file" accept="image/*" capture="environment">`
2. Client resizes image to max 1024px, compresses to JPEG (~500KB max)
3. POST to `/api/recognize` with `{ image: "data:image/jpeg;base64,..." }`
4. API route sends to OpenRouter with structured prompt → returns JSON array of `{ name, category }`
5. Server cross-references against `plant` table for exact matches and point values
6. Modal displays results with checkboxes, category pills, points. Already-logged plants disabled
7. User confirms → batch insert into `plant_log`

## Prompt Design

- Ask for plant-based foods only (exclude meat, dairy, oils)
- Request strict JSON array response: `[{ "name": "...", "category": "..." }]`
- Constrain categories to: Fruits, Vegetables, Whole Grains, Legumes, Nuts, Seeds, Herbs, Spices
- Handle mixed dishes by listing individual plant components

## Components

| Component | Type | Purpose |
|-----------|------|---------|
| `/api/recognize/route.ts` | API Route | OpenRouter vision call, plant matching |
| `PhotoRecognitionModal.tsx` | Component | Photo input, loading, results review, batch log |
| `add/page.tsx` | Modified | Add camera button, wire up modal |

## UI

- Camera icon button in glassmorphic style at top of Add Plant page
- Modal: photo preview → loading spinner → results checklist → "Log X Plants" button
- Results show: checkbox, plant name, category color pill, point value
- Already-logged plants shown disabled with checkmark
