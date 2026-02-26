# Sage Chat Plan (Plantmaxxing)

Date: 2026-02-25
Owner: Henry
Status: Draft (pending NotebookLM policy output)

## Product direction
- Keep **Snap to Log** as the fast action lane.
- Add **Sage chat** as an information lane for rules/edge-case clarity.
- Do not force chat into logging flow; optional entry from key screens.

## Primary user jobs
1. "Does this count?"
2. "How many points is this?"
3. "Why doesn't this count?"
4. "What should I eat to reach 30 this week?"

## MVP scope (v1)

### Backend
- Add `POST /api/sage` endpoint.
- Input:
  - `question` (string)
  - optional context: `recognizedPlants`, `alreadyLoggedThisWeek`, `weekProgress`
- Output (structured):
  - `answer`
  - `verdict` (`counts | partial | does_not_count | duplicate_week | uncertain`)
  - `points` (number | null)
  - `reason`
  - `confidence` (0-1)
  - `followUpQuestion` (optional)

### Prompting
- System prompt grounded in Plantmaxxing rules + NotebookLM policy.
- Deterministic mode (low temperature), strict format instructions.
- No medical diagnosis/treatment claims.

### Frontend
- Add `Sage` entry point from Home/Add (small button or help link).
- Chat panel with:
  - starter chips (Does this count? / How many points? / Why not count?)
  - compact, answer-first responses
  - optional "Use in Snap review" context handoff later

### Telemetry
- Log anonymous event fields:
  - question type
  - verdict
  - confidence bucket
  - thumbs up/down
- Add unresolved queue (`uncertain` + negative feedback) for weekly rules updates.

## Non-goals (v1)
- No autonomous logging actions from chat.
- No multi-persona character selector yet.
- No image upload in chat (Snap already covers image path).

## API contract draft

```ts
// Request
{
  question: string;
  context?: {
    recognizedPlants?: Array<{name: string; category?: string; points?: number}>;
    alreadyLoggedThisWeek?: string[];
    weekProgress?: { points: number; uniquePlants: number; target?: number };
  }
}

// Response
{
  answer: string;
  verdict: "counts" | "partial" | "does_not_count" | "duplicate_week" | "uncertain";
  points: number | null;
  reason: string;
  confidence: number;
  followUpQuestion?: string;
}
```

## Implementation PR slices

### PR1 — Backend scaffolding
- `src/app/api/sage/route.ts`
- `src/lib/ai/sagePrompt.ts`
- `src/lib/ai/sageSchema.ts`
- env checks for OpenRouter key/model
- unit tests for schema validation + error handling

### PR2 — UI shell
- `src/components/SageChat.tsx`
- entry points in Home/Add
- starter prompt chips
- render structured response fields cleanly

### PR3 — Telemetry + quality
- event logging and feedback capture
- unresolved edge-case queue
- basic moderation/length/rate limiting

## Risks + mitigations
- **Risk:** Hallucinated scoring rules
  - Mitigation: strict response schema, answer bounded to provided rules, uncertainty path.
- **Risk:** Confusing overlap with Snap-to-Log
  - Mitigation: UI copy clarifies "Sage explains rules; Snap logs food".
- **Risk:** Cost creep
  - Mitigation: low token limits, concise response format, optional caching by normalized question.

## Open decisions
1. Exact placement of Sage entry point (Home only vs Home + Add + Profile).
2. Whether to show confidence to end users or keep internal.
3. Whether `duplicate_week` should always return `points: 0` explicitly.
4. How aggressively to suggest alternatives when uncertain.

## Ready-to-run engineering checklist
- [ ] finalize Sage policy from NotebookLM output
- [ ] lock response schema + zod validation
- [ ] implement `/api/sage`
- [ ] add chat UI + starter prompts
- [ ] add telemetry + feedback events
- [ ] test edge-case fixtures (15 cases)
- [ ] add docs for rule updates workflow
