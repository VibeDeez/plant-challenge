# Workflow Hardening (Post-Session Retro)

## Why this exists
This document captures concrete process improvements from the latest UI + CI cycle to reduce:
- flaky CI failures,
- slow push loops,
- avoidable no-verify pushes,
- and unreproducible QA states.

---

## 1) Two-tier validation: Fast Local vs Full CI

### Fast local gate (default before push)
Run only:
- typecheck
- lint
- docs refresh check
- targeted tests for changed areas

**Example**
```bash
npm run docs:refresh
npx tsc --noEmit
npm run lint
npx playwright test e2e/tests/add-plant.spec.ts e2e/tests/circle-detail.spec.ts
```

### Full gate (CI + optional local)
Run full suite in CI (and optionally local when needed):
```bash
npm run test:e2e
```

**Policy**
- Don’t block every push on full E2E by default.
- Keep full E2E as required CI signal.

---

## 2) Deterministic docs generation (timezone-safe)

### Standard
Generated docs must be stable across machines/timezones.

### Rule
- Use UTC date/time in generators.
- Avoid local `today()` semantics.

### Verification
```bash
npm run docs:refresh
git diff --exit-code docs/repo-deep-index.md docs/repo-deep-index.json docs/db-access-matrix.csv docs/api-contracts-deep.md docs/api-contracts-deep.json docs/architecture-bible.md docs/sequence-diagrams.md docs/sequence-diagrams.mmd
```

---

## 3) Ship script for repeatability

Add a single command for consistent PR prep:

```bash
npm run ship:pr
```

Suggested behavior:
1. Refresh docs
2. Typecheck
3. Run targeted tests
4. Print commit/PR checklist

Optional override:
- `npm run ship:pr -- --allow-no-verify` (explicit + logged)

---

## 4) Flake reduction policy for E2E

### Problem class
Custom plant modal flow timeout.

### Rules
- Prefer semantic waits (`expect(dialog).toBeVisible()`, success toast text, URL/state assertions)
- Avoid blind sleeps
- Use stable selectors (`data-testid`) for key interactions
- Keep retries only at known flaky boundaries

### Action
Create/patch test:
- `e2e/tests/add-plant.spec.ts` custom plant flow to assert:
  - modal opens,
  - input fill works,
  - submit closes modal,
  - logged state visible.

---

## 5) Persistent QA seed states

Add scripted seed commands for reusable demos:

- `npm run qa:seed:leaderboard`
- `npm run qa:seed:mobile`

Seed should create:
- test members (e.g., Kid One, Kid Two),
- a shared test circle,
- known score distribution (non-zero + rank changes).

**Policy**
- Keep these users for QA unless explicitly cleaned up.

---

## 6) UI PR evidence standard

For all UI-affecting PRs, include:
1. Before/after screenshot (mobile)
2. Modal open state (if applicable)
3. Keyboard-interaction state (if applicable)
4. Data-filled state (non-empty realistic content)

---

## 7) Runtime/tool readiness check

At task start, confirm required tools are available (e.g., mobile simulator MCP).
If unavailable:
- declare fallback path immediately (browser mobile harness),
- continue without blocking.

---

## 8) Branch hygiene

### Rules
- Keep generated-doc changes in same PR only if related.
- Keep policy/process doc edits separate unless intentionally part of change.
- Exclude local agent-only artifacts from repo tracking.

---

## 9) No-verify push policy

Allowed only when:
- urgency is explicit,
- blocker is known/non-critical for change scope,
- follow-up issue/task is created to restore green path.

PR must include:
- what failed,
- why bypass was used,
- planned remediation.

---

## 10) Session close checklist

Before handing off:
- [ ] branch pushed
- [ ] PR opened
- [ ] CI status checked
- [ ] known failures triaged
- [ ] screenshots attached
- [ ] follow-ups listed
