# Circles Integrity Hardening (Tasks 9-12)

Date: 2026-02-28

## What changed

- Added leaderboard discrepancy detection in `src/lib/circles.ts` and wired it into circles detail page logging.
- Added membership integrity guard helper and enforced it before member removal in circle settings.
- Added activity feed sanitization for malformed/orphaned activity + reaction rows before rendering.
- Hardened join flow with strict invite-code format check and deterministic failure message mapping for invalid, expired, reused, and already-member cases.

## Test coverage added

`src/lib/circles.test.mjs` now includes edge-case coverage for:

- invalid invite code format
- join payload mapping for invalid/expired/reused codes
- leaderboard duplicate/non-member/sort-drift detection
- membership integrity checks (invalid join/remove)
- activity feed orphan and duplicate reaction sanitization

## Operational note

Integrity checks currently log discrepancies via `console.warn` with structured context (`circleId`, discrepancy list) to make drift visible without blocking normal reads.
