# Sage API (v1)

Endpoint: `POST /api/sage`

## Purpose
- Deterministic rule answers first (no model call)
- OpenRouter fallback for gray-area processing questions

## Environment
- `OPENROUTER_API_KEY` (required for gray-area fallback)
- `SAGE_OPENROUTER_MODEL` (optional, default: `x-ai/grok-4-fast`)
- `SAGE_OPENROUTER_TIMEOUT_MS` (optional, default: `12000`, clamped to `1000..60000`)

## Request
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
- `question` max length: `500` chars
- `context.alreadyLoggedThisWeek` max items: `100`
- `context.recognizedPlants` max items: `100`
- Context string fields max length: `120` chars per item/value
- Exceeding limits returns `400` with a clear validation error

## Response
```json
{
  "answer": "Coffee counts as 0.25 points.",
  "verdict": "counts",
  "points": 0.25,
  "reason": "Deterministic rule: coffee counts as 0.25 points.",
  "confidence": 1
}
```

`verdict` is one of:
- `counts`
- `partial`
- `does_not_count`
- `duplicate_week`
- `uncertain`

## Deterministic hard rules (v1)
1. Coffee = 0.25
2. Tea = 0.25
3. Bell pepper color variants are one species
4. Duplicate species in same week add no new unique point

Bell pepper matching is intentionally strict. Ambiguous phrases like `"red pepper"` do not trigger the bell pepper deterministic rule unless bell pepper intent is explicit.

## Notes
- Deterministic matches bypass OpenRouter.
- Gray-area answers are model-generated and schema-validated.
- Malformed model outputs return a safe uncertain fallback.
