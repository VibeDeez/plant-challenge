# Voice Log PRD + OpenRouter Audio Integration Plan

Date: 2026-03-01
Owner: Product
Status: Draft v0.2 (ready for engineering review)

## 1) Feature Summary

Add a new **Voice Log** option on Home (alongside Snap to Log) so users can speak what they ate in natural language and quickly confirm recognized plants.

Primary objective: **reduce logging friction** for users who dislike manual entry and improve retention through faster, lower-effort logging.

---

## 2) Product Decisions (locked)

1. Recording interaction: **Tap-to-toggle** (tap once start, tap again stop).
2. Quantity handling: **Out of MVP scope** (app scoring is unique plants, not amount).
3. Low-confidence handling: **Warning-only, never blocking**.
4. Review controls: users can **check/uncheck suggestions** and **add missed plants**.
5. Multi-clip recording in one attempt: **Not in MVP** (single clip only).
6. Draft recovery: **Required in MVP**.
7. Analytics funnel instrumentation: **Required in MVP**.

---

## 3) Problem Statement

Manual plant logging creates repetitive input overhead (search/select/add for each item), especially for meals with many ingredients. This friction reduces completion and habit consistency.

---

## 4) Goals / Non-Goals

### Goals
- Reduce time and effort to log plants.
- Increase successful logs among users who avoid manual entry.
- Keep trust high with transparent review before submit.

### Non-Goals (MVP)
- Quantity accuracy optimization.
- Conversational diet coaching.
- Multi-language expansion beyond current app language.
- Multi-clip append flow.

---

## 5) User Experience

### Entry Point
- Add Home CTA: **Voice Log** (similar visual prominence to Snap to Log).

### MVP Flow
1. User taps Voice Log.
2. Recording sheet opens; user taps to start/stop.
3. Audio is transcribed.
4. Transcript is parsed into candidate plants (+ confidence).
5. Review list appears with checkboxes + warning states.
6. User can uncheck incorrect items and add missing plants.
7. User confirms to persist entries.
8. Success feedback shown.

### Interruption Behavior
- If user dismisses mid-flow, preserve draft and offer resume prompt.

---

## 6) Functional Requirements

- **FR-1** Home includes Voice Log CTA.
- **FR-2** Recording UI supports tap-to-toggle + clear active recording state.
- **FR-3** Audio -> transcript conversion.
- **FR-4** Transcript -> candidate plants with confidence.
- **FR-5** Review list with checkboxes, confidence warnings, manual add.
- **FR-6** Non-blocking low-confidence warnings.
- **FR-7** Confirm persists selected entries with `source=voice_log`.
- **FR-8** Draft save/recovery for interrupted sessions.
- **FR-9** Structured error handling (permission denied, timeout, provider failure).

---

## 7) OpenRouter Audio Guide Findings (implementation-critical)

Source reviewed: https://openrouter.ai/docs/guides/overview/multimodal/audio

### Required request patterns
- Use `POST /api/v1/chat/completions`.
- Send audio as message content type `input_audio`.
- Audio must be **base64-encoded** in request body.
- Audio input object includes:
  - `data`: base64 payload
  - `format`: e.g. `wav`, `mp3`, `m4a`, `ogg`, etc (model-dependent support)
- For transcription-style tasks, include paired text instruction in content array (e.g., “transcribe this audio, then extract unique plants”).

### Important constraints
- Direct audio URLs are **not supported** for input audio.
- Supported formats are model/provider dependent; do not assume all formats across all models.
- Audio output (`modalities: ["text", "audio"]`) requires `stream: true` + SSE parsing. (Not required for MVP Voice Log unless we add spoken readback.)

### Integration implication for this feature
For MVP Voice Log, request **text output only** from audio input (transcript + parsed candidates), which keeps complexity lower than audio-output streaming.

---

## 8) Reuse Strategy (avoid duplicate OpenRouter code)

Existing project already has OpenRouter integration and guardrails. Reuse these patterns:

### Existing files to reuse
- `src/lib/ai/openRouterPolicy.ts`
  - `fetchWithPolicy(...)`
  - timeout/retry semantics
  - max payload policy pattern
- `src/lib/api/errors.ts`
  - standard API error response formatting
- `src/lib/api/telemetry.ts`
  - API telemetry tracking pattern
- `src/lib/analytics/events.ts`
  - analytics event schema + tracking utility
- `src/app/api/recognize/route.ts`
  - OpenRouter call shape, payload-size validation, parse-fallback pattern
- `src/app/api/sage/route.ts`
  - robust model response validation, fallback behavior, policy-driven request handling

### Implementation rule
Do **not** introduce a new bespoke OpenRouter HTTP utility for Voice Log. Use `fetchWithPolicy` and follow existing error/telemetry conventions from recognize/sage routes.

### Recommended minimal additions
1. Add `VOICE_OPENROUTER_POLICY` to `src/lib/ai/openRouterPolicy.ts` (or reuse `RECOGNIZE_OPENROUTER_POLICY` if limits fit).
2. Add new route: `src/app/api/voice-log/route.ts`.
3. Keep env var reuse simple:
   - Reuse `OPENROUTER_API_KEY`
   - Add optional `VOICE_OPENROUTER_MODEL` (default pinned in server code)
   - Add optional `VOICE_OPENROUTER_TIMEOUT_MS` if needed

---

## 9) Proposed API Contract (app-internal)

### `POST /api/voice-log`

Request:
```json
{
  "audioBase64": "<base64>",
  "format": "m4a",
  "locale": "en-US",
  "timestamp": "2026-03-01T12:00:00-06:00"
}
```

Response:
```json
{
  "transcript": "for lunch i had spinach tomato onion and arugula",
  "candidates": [
    { "name": "Spinach", "confidence": 0.98 },
    { "name": "Tomato", "confidence": 0.95 },
    { "name": "Onion", "confidence": 0.92 },
    { "name": "Arugula", "confidence": 0.90 }
  ],
  "warnings": [
    { "name": "Arugula", "reason": "low_confidence" }
  ]
}
```

Behavior:
- Return parse-safe shape even if model response is imperfect.
- If parse fails, return transcript + empty candidates + warning, do not hard-crash flow.

---

## 10) Error Handling Requirements

- Missing key -> 500 (configuration error code).
- Oversized payload -> 413.
- Invalid body/format -> 400.
- Provider timeout -> 504.
- Provider non-OK -> 502.
- Parse malformed model output -> 200 with fallback payload (plus internal telemetry flag).

Align codes with current recognize/sage style (`*_TIMEOUT`, `*_PROVIDER_FAILURE`, etc.).

---

## 11) Analytics Events (MVP)

- `voice_log_opened`
- `voice_log_recording_started`
- `voice_log_recording_stopped`
- `voice_log_transcription_succeeded`
- `voice_log_transcription_failed`
- `voice_log_parse_succeeded`
- `voice_log_parse_failed`
- `voice_log_review_shown`
- `voice_log_item_unchecked`
- `voice_log_item_checked`
- `voice_log_item_added_manual`
- `voice_log_confirmed`
- `voice_log_draft_resumed`
- `voice_log_abandoned`

---

## 12) Privacy / Retention

- Show explicit mic permission rationale in UI.
- Minimize raw audio retention; retain only what is required for feature operation/debug policy.
- Ensure server-only use of `OPENROUTER_API_KEY` (no client exposure).
- Document retention behavior in app policy notes before broad rollout.

---

## 13) Acceptance Criteria (MVP)

1. Voice Log is available from Home.
2. Tap-to-toggle recording works.
3. Audio request reaches OpenRouter using `input_audio` with base64 payload.
4. User gets transcript + candidate plant list.
5. User can check/uncheck and manually add plants.
6. Low-confidence entries warn but do not block submit.
7. Confirm persists selected plants.
8. Draft recovery works after interruption.
9. Telemetry + analytics events fire across funnel steps.

---

## 14) Engineering Checklist

- [ ] Create `voice-log` API route using existing API structure conventions.
- [ ] Reuse `fetchWithPolicy` from `src/lib/ai/openRouterPolicy.ts`.
- [ ] Add policy/model env handling for Voice Log (without duplicating client code).
- [ ] Implement strict request validation (base64 present, format allowed, size limits).
- [ ] Implement robust model response parsing + safe fallback payload.
- [ ] Add analytics events to shared event definitions if needed.
- [ ] Build Home CTA + recording/review UI states.
- [ ] Add draft persistence + resume prompt.
- [ ] Add tests: request validation, timeout path, parse fallback, happy path.

---

## 15) Post-MVP Candidates

- Multi-clip append in one review session.
- Personalized alias correction learning.
- Optional spoken readback using audio output streaming.
- Meal auto-segmentation from long speech.
