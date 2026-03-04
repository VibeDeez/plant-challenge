# Sage API (v2)

## Endpoints
- `POST /api/sage` — rules Q&A (deterministic-first, OpenRouter fallback)
- `POST /api/sage/menu-max` — menu analysis + top 3 picks + log candidates

## Environment
- `OPENROUTER_API_KEY` (required for model-backed paths)
- `SAGE_OPENROUTER_MODEL` (optional, default: `x-ai/grok-4-fast`)
- `SAGE_OPENROUTER_TIMEOUT_MS` (optional, default: `12000`, clamped `1000..60000`)
- `SAGE_MENU_OPENROUTER_MODEL` (optional, default: `google/gemini-2.0-flash-lite-001`)
- `SAGE_MENU_TIMEOUT_MS` (optional, default from shared timeout parser)

---

## `POST /api/sage`

### Purpose
- Deterministic rule answers first (no model call)
- OpenRouter fallback for gray-area processing questions

### Request
```json
{
  "question": "Does coffee count?",
  "context": {
    "alreadyLoggedThisWeek": ["green bell pepper"],
    "recognizedPlants": [{"name":"red bell pepper"}],
    "weekProgress": {"points": 12.5, "uniquePlants": 11, "target": 30}
  }
}
```

### Request limits
- `question` max length: `500`
- `context.alreadyLoggedThisWeek` max items: `100`
- `context.recognizedPlants` max items: `100`
- Context string fields max length: `120` per value

### Response
```json
{
  "answer": "Coffee counts as 0.25 points.",
  "verdict": "counts",
  "points": 0.25,
  "reason": "Deterministic rule: coffee counts as 0.25 points.",
  "confidence": 1
}
```

`verdict` values:
- `counts`
- `partial`
- `does_not_count`
- `duplicate_week`
- `uncertain`

### Deterministic hard rules (v1)
1. Coffee = 0.25
2. Tea = 0.25
3. Bell pepper color variants are one species
4. Duplicate species in same week add no new unique point

---

## `POST /api/sage/menu-max`

### Purpose
- Analyze menu or recipe/blog URLs, screenshots/photos, or web recipe searches
- Return top 3 high-diversity picks with explainers
- Return normalized plant candidates for review-first one-tap logging

### Request
```json
{
  "mode": "url",
  "url": "https://restaurant.com/menu",
  "context": {
    "alreadyLoggedThisWeek": ["kale", "coffee"],
    "weekProgress": {"points": 11.5, "uniquePlants": 10, "target": 30}
  }
}
```

Image mode:
```json
{
  "mode": "image",
  "imageDataUrl": "data:image/png;base64,...",
  "context": { "alreadyLoggedThisWeek": ["kale"] }
}
```

Discover mode (open-ended recipe search):
```json
{
  "mode": "discover",
  "query": "high-protein vegetarian dinner",
  "context": { "alreadyLoggedThisWeek": ["kale"] }
}
```

### Response
```json
{
  "recommendations": [
    {
      "rank": 1,
      "dishName": "Mediterranean Grain Bowl",
      "estimatedPoints": 4.25,
      "estimatedUniquePlants": 4,
      "why": "High legume + herb diversity with whole grains.",
      "sourceUrl": "https://www.example.com/recipe",
      "sourceTitle": "Example Recipe",
      "plants": [
        {
          "name": "Chickpeas",
          "category": "Legumes",
          "points": 1,
          "matched": true,
          "duplicateThisWeek": false
        }
      ]
    }
  ],
  "logCandidates": [
    {
      "name": "Chickpeas",
      "category": "Legumes",
      "points": 1,
      "matched": true,
      "duplicateThisWeek": false,
      "sourceDishes": ["Mediterranean Grain Bowl"]
    }
  ],
  "sourceNotes": [],
  "confidence": 0.82
}
```

### Notes
- URL fetch/parse failures return an error instructing users to upload/paste a screenshot/photo.
- Duplicate detection is species-aware using current-week context.
- `mode: "discover"` runs a lightweight web recipe search and analyzes top sources.
