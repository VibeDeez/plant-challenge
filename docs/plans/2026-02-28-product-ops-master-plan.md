# Plant Challenge - Product and Ops Master Plan

Status: Draft for execution
Scope: Full plan covering reliability, core loop, circles integrity, analytics, documentation rigor, and cost governance

## Execution model
- Work task-by-task in priority order.
- Complete each task to acceptance criteria before opening dependent tasks.
- For each completed task, update architecture docs via:
  - `python3 scripts/refresh-architecture-docs.py`

---

## Task 1 - Add API telemetry for `/api/recognize` and `/api/sage`
### Goal
Capture reliability and performance signals needed for product and engineering decisions.

### Deliverables
- Structured logging for both endpoints with fields:
  - endpoint
  - status code
  - latency ms
  - timeout boolean
  - fallback_used boolean
  - parse_failed boolean
  - request_size_bucket
- Shared helper for telemetry event formatting.
- Short docs section in `docs/api-contracts-deep.md` for telemetry semantics.

### Acceptance criteria
- Logs emitted on success and failure paths for both endpoints.
- Timeout events are explicitly tagged.
- No sensitive payloads are logged.

### Validation
- `npx tsc --noEmit`
- Route-level manual checks for success, timeout, and malformed responses.

---

## Task 2 - Add production hard block for `/api/e2e/*`
### Goal
Prevent accidental production exposure of test-only endpoints.

### Deliverables
- Runtime guard that denies e2e routes in production.
- Consistent 404 or 403 behavior for blocked access.
- Test coverage for prod-block logic.

### Acceptance criteria
- In production mode, e2e routes cannot execute login/cleanup logic.
- In test mode, existing e2e behavior still works.

### Validation
- `npx tsc --noEmit`
- Route tests for production blocked and test allowed paths.

---

## Task 3 - Add structured error taxonomy
### Goal
Make failures consistent for UI handling and diagnostics.

### Deliverables
- Error code catalog for API responses (for example: `RECOGNIZE_TIMEOUT`, `SAGE_INVALID_CONTEXT`).
- Shared API error response helper.
- Mapped current errors in recognize and sage routes.

### Acceptance criteria
- All non-2xx responses from target endpoints include stable error code.
- UI can branch on code without string matching.

### Validation
- `npx tsc --noEmit`
- Endpoint response snapshots for representative error cases.

---

## Task 4 - Add schema drift guard in CI
### Goal
Detect code/database contract breaks before merge.

### Deliverables
- CI step that verifies all referenced tables/RPCs in `docs/db-access-matrix.csv` are expected.
- Baseline allowlist file for known tables/RPCs.
- Clear failure message when drift is detected.

### Acceptance criteria
- CI fails when unknown table/RPC usage appears.
- CI passes for current known references.

### Validation
- Run CI workflow locally where possible.
- Verify intentional bad reference fails check.

---

## Task 5 - Optimize photo recognition flow
### Goal
Reduce friction from capture to successful log.

### Deliverables
- UI flow pass on add page and recognition modal.
- Fewer clicks between image upload and confirm.
- Better loading and error state transitions.

### Acceptance criteria
- User can complete photo log with fewer interactions than current baseline.
- No regressions for manual logging path.

### Validation
- `npx tsc --noEmit`
- Targeted e2e for add flow.

---

## Task 6 - Add confidence-aware review step for uncertain recognition
### Goal
Handle uncertain model output safely while keeping speed.

### Deliverables
- Confidence threshold policy.
- Review UI for uncertain matches.
- One-tap correction affordances.

### Acceptance criteria
- Low-confidence predictions trigger review state.
- Corrected selection persists and logs correctly.

### Validation
- Unit test for confidence threshold logic.
- E2E path: uncertain prediction to corrected successful log.

---

## Task 7 - Improve post-log feedback
### Goal
Increase motivation by showing immediate outcome after logging.

### Deliverables
- Confirmation panel with:
  - points added
  - duplicate or unique effect
  - updated progress
- Optional circle impact snippet if user is in circles.

### Acceptance criteria
- Feedback appears on every successful log.
- Values match backend state.

### Validation
- UI snapshot/manual checks.
- Verify against `plant_log` and computed totals.

---

## Task 8 - Add duplicate-species guard UX
### Goal
Reduce confusion when duplicate entries do not add unique weekly points.

### Deliverables
- Clear duplicate messaging in add and sage contexts.
- Consistent copy aligned to deterministic rules.

### Acceptance criteria
- Duplicate case is explained before final confirm or immediately after.
- No contradictory wording across surfaces.

### Validation
- Copy and UX pass in add and sage flows.

---

## Task 9 - Add leaderboard consistency checks
### Goal
Ensure circles scoring is trustworthy.

### Deliverables
- Verification routines for weekly/all-time score consistency.
- Discrepancy detection log.

### Acceptance criteria
- Known test fixtures return expected rankings.
- Inconsistent states are detectable.

### Validation
- Targeted tests on circles score queries and rendering.

---

## Task 10 - Add membership integrity checks
### Goal
Prevent invalid or orphaned circle membership states.

### Deliverables
- Validation at membership write points.
- Defensive handling of missing member/circle relations.

### Acceptance criteria
- Invalid membership operations fail safely.
- Valid operations unchanged.

### Validation
- Tests for join, remove, and edge cases.

---

## Task 11 - Add activity feed durability checks
### Goal
Keep activity and reaction state consistent under edits/removals.

### Deliverables
- Integrity checks around activity and reaction operations.
- Safe behavior for deleted activity rows.

### Acceptance criteria
- No orphan reactions after activity deletion.
- Feed renders correctly under edge conditions.

### Validation
- Targeted circles feed tests.

---

## Task 12 - Harden join flow for invalid/expired/reused codes
### Goal
Improve resilience and clarity in join journey.

### Deliverables
- Explicit handling for invalid, expired, and already-used join attempts.
- User-facing messages mapped to specific failure reasons.

### Acceptance criteria
- Join flow returns deterministic message per failure class.
- No ambiguous generic failures for common join problems.

### Validation
- Unit tests for join payload validator and route/page behavior.

---

## Task 13 - Define canonical analytics event schema
### Goal
Standardize event structure for product insight and debugging.

### Deliverables
- Event schema doc with names and required properties.
- Initial events:
  - log_success
  - recognize_success
  - recognize_failure
  - recognize_corrected
  - join_circle
  - hit_30

### Acceptance criteria
- Event names and properties are stable and documented.
- Events emitted from intended points.

### Validation
- Instrumentation smoke checks.

---

## Task 14 - Build minimal KPI board
### Goal
Create a single place for ongoing product health signals.

### Deliverables
- KPI view or export for:
  - completion rate
  - recognition success rate
  - repeat logging behavior
- Data source and refresh notes.

### Acceptance criteria
- KPI values can be reproduced from source events.
- Stakeholder can read board without engineering context.

### Validation
- Cross-check sample periods manually.

---

## Task 15 - Add feature-level success criteria docs
### Goal
Avoid ambiguous feature completion definitions.

### Deliverables
- Success criteria section per core flow in docs.
- Pass/fail thresholds for major feature areas.

### Acceptance criteria
- New feature PRs reference relevant success criteria.
- Criteria are specific and measurable.

### Validation
- Documentation review across key flow docs.

---

## Task 16 - Add PR impact template
### Goal
Force concise risk and impact thinking in every code change.

### Deliverables
- PR template with fields:
  - user impact
  - data impact
  - risk level
  - rollback plan
  - validation evidence

### Acceptance criteria
- Template applied to all new PRs.
- Missing sections are visible and actionable.

### Validation
- Open sample PR and verify template rendering.

---

## Task 17 - Add architecture-surface change checklist
### Goal
Make architecture changes explicit and reviewable.

### Deliverables
- Checklist in PR template or contributing doc:
  - routes changed
  - tables/RPC changed
  - env vars changed
  - AI provider behavior changed

### Acceptance criteria
- Checklist appears in PR workflow.
- Reviewers can identify risk hotspots quickly.

### Validation
- Sample PR walkthrough.

---

## Task 18 - Add generated sequence diagrams
### Goal
Improve onboarding speed for complex multi-step flows.

### Deliverables
- Sequence diagrams for:
  - auth
  - add/log
  - circles join and scoring
  - sage query path
- Stored in docs and refreshed with architecture script where practical.

### Acceptance criteria
- Diagrams match current implementation paths.
- New agents can map flow without reading all source files first.

### Validation
- Manual review against live route/component code.

---

## Task 19 - Add risk register ownership fields
### Goal
Move risk register from static list to operational control tool.

### Deliverables
- Add fields per risk:
  - owner
  - trigger threshold
  - mitigation status
  - last reviewed

### Acceptance criteria
- Every risk has owner and review status.
- Trigger conditions are explicit.

### Validation
- `docs/risk-register.md` completeness check.

---

## Task 20 - Add model usage controls for OpenRouter calls
### Goal
Control cost and reliability during traffic spikes or provider issues.

### Deliverables
- Per-endpoint request policy:
  - timeout
  - retry policy
  - max payload
  - fallback behavior
- Optional basic rate guard.

### Acceptance criteria
- Recognize and sage routes enforce policy bounds.
- Behavior is documented in API contracts.

### Validation
- Load and failure-path checks.

---

## Task 21 - Add client-side recognition payload constraints
### Goal
Reduce avoidable backend failures and improve user experience.

### Deliverables
- Client-side compression/resize and size validation before upload.
- User guidance when image exceeds allowed thresholds.

### Acceptance criteria
- Oversized images are handled before API request.
- Lower rate of 413 responses.

### Validation
- Manual and e2e checks with large images.

---

## Task 22 - Add Sage fallback mode switch
### Goal
Maintain service quality when model reliability degrades.

### Deliverables
- Configurable deterministic-only mode for Sage.
- UI copy for fallback mode behavior.

### Acceptance criteria
- Toggle forces deterministic path and bypasses model call.
- System remains functional in fallback mode.

### Validation
- Route tests with toggle on/off.
- Manual sage flow validation.

---

## Cross-task governance requirements
Apply to every task above:
- Update impacted docs in same PR.
- Run `python3 scripts/refresh-architecture-docs.py` before push.
- Ensure generated docs are committed and CI freshness passes.
- Include rollback note for tasks touching auth, data operations, or API contracts.

## Suggested dependency order
1. 1, 2, 3, 4
2. 5, 6, 7, 8
3. 9, 10, 11, 12
4. 13, 14, 15
5. 16, 17, 18, 19
6. 20, 21, 22


---

## Execution notes - Tasks 5-8 (implemented)

### Before UX
- Photo flow required: open modal, then tap again to open picker, then review and log.
- Recognition results did not expose confidence and uncertain items looked the same as high-confidence items.
- Duplicate weekly species were only implied by disabled state, with no consistent explanatory copy across Add and Sage.
- Add success feedback was subtle (button disabled/checkmark) with no immediate summary of points and progress impact.

### After UX
- Photo flow now auto-opens image picker when Snap to Log launches, removing one tap from the common path.
- Recognition returns confidence values and low-confidence items are explicitly marked for review in the modal.
- Duplicate-species guard copy is consistent across Add and Sage surfaces.
- Add page now shows a post-log feedback panel with points added, duplicate impact, updated weekly progress, and circle impact snippet when relevant.

### Safety and regression guardrails
- Mobile-first touch targets preserved (`min-h-11` controls remain intact in new/modified actions).
- Auth/session flows untouched (all changes stay inside protected client components and existing authenticated API calls).
- Manual logging path unchanged in behavior, with added positive feedback only.
