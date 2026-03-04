# Coding Workflow Playbook (OpenClaw + Codex)

This is the default operating model for Plantmaxxing coding work.

## 0) Core principle
Use **one default path** for most work, and only escalate when needed.

- Default: direct task run + manual status checkpoints
- Escalation: subagent for long/parallel tasks

Avoid mixing 3+ orchestration styles in one task.

---

## 1) Task modes

### Mode A — Direct (default)
Use for:
- small/medium scoped changes
- single feature slice
- expected duration under ~15 minutes

Status contract (assistant must send):
1. started
2. first meaningful progress
3. validation result
4. done / blocked

### Mode B — Subagent (escalation)
Use for:
- expected duration >15–20 minutes
- broad refactors
- parallel independent tracks (A/B/C)
- heavy research + implementation bundle

Subagent contract:
- explicit task id + deliverables
- max runtime
- required checks
- final structured report

---

## 2) Notification policy (DM-first)
All coding updates should go to DM only.

Minimum updates:
- start
- every 5–10 minutes if still running
- completion with changed files + checks

No background broadcast loops.

---

## 3) Retry policy
Retry only transient failures (tool startup/network/session issues).

- max retries: 2
- backoff: 30s, then 90s
- always include failure reason in update
- do not retry logic/test failures blindly

---

## 4) Validation policy

### Required on code changes
- `npx tsc --noEmit`

### Preferred test lanes
- **Gate lane (blocking):** stable targeted tests for touched area
- **Quarantine lane (non-blocking):** known flaky specs tracked separately
- **iOS simulator lane (manual/assisted):** xcodebuildMCP verification for Safari-only UX

#### Playwright gate lane (blocking in CI/pre-push)
Run only stable specs in the blocking lane:
- `e2e/tests/auth.spec.ts`
- `e2e/tests/navigation.spec.ts`
- `e2e/tests/home.spec.ts`
- `e2e/tests/add-plant.spec.ts`
- `e2e/tests/circles.spec.ts`
- `e2e/tests/circle-settings.spec.ts`
- `e2e/tests/learn.spec.ts`
- `e2e/tests/recognize.spec.ts`

#### Playwright quarantine lane (non-blocking)
Known flaky or environment-sensitive specs:
- `e2e/tests/circle-detail.spec.ts` (empty leaderboard for new circle)
- `e2e/tests/profile.spec.ts` (delete kid flow)

Use for local investigation and stabilization work. Do not block push/merge on these until stabilized.

#### xcodebuildMCP iOS smoke lane (required for risky mobile UI changes)
When a task touches sheets/modals, keyboard behavior, safe areas, or bottom nav overlap, run simulator smoke checks:
1. Open target flow in iOS Simulator Safari.
2. Verify keyboard-up state.
3. Verify primary action is visible and tappable.
4. Verify close/dismiss works (backdrop, close button, Escape when applicable).
5. Capture screenshot evidence for each key state.

---

## 5) Standard task brief template

Use this for every task request:

- Goal:
- Scope (files/routes):
- Constraints:
- Acceptance criteria:
- Validation commands:
- Output required:

Example:

```text
Goal: Add X behavior.
Scope: src/a.ts, src/b.tsx
Constraints: mobile-first, minimal refactor
Acceptance: Y and Z are true
Validation: npx tsc --noEmit; npm run test:e2e -- e2e/tests/home.spec.ts
Output: files changed + summary + risks
```

---

## 6) Subagent command template (assistant-side)

When escalating, use this structure:

```text
Spawn subagent for task <task-id>.
Deliverables:
1) ...
2) ...
Constraints:
- minimal refactor
- no unrelated files
Validation:
- npx tsc --noEmit
- targeted tests: ...
Report back with:
- files changed
- checks run
- open risks/blockers
Timeout: 45m
```

---

## 7) Operational guardrails
- No silent infra/config changes mid-task.
- No broad branch churn for narrow tasks.
- Keep one active coding task unless explicitly parallelized.
- If user asks for collaboration on UI, stop and present options before implementation.

## 7.1) Haptics interaction policy
- New interactive components must use semantic controls (`button`, `a`, submit controls) whenever possible.
- If a component is intentionally non-semantic (for example, clickable overlay/container), it must declare haptics intent via `data-haptic`.
- Default intent for new actions is `data-haptic="light"` unless a stronger semantic intent applies:
  - selection/toggle/tab interactions: `data-haptic="selection"`
  - destructive actions (delete/remove/sign out/revoke): `data-haptic="warning"`
- Intentional no-haptics interactions must opt out explicitly with `data-haptic="off"`.
- New haptic pattern overrides must use `data-haptic-pattern="<preset-or-pattern-name>"` and include a short PR note explaining why.

---

## 8) Done definition for each task
A task is only done when response includes:
1. what changed
2. where changed (files)
3. what passed/failed (checks)
4. what remains (if anything)

---

## 9) Telegram-safe execution mode (ACP reliability policy)

### Default for Telegram
Use **direct acpx relay** for Codex/Claude-style coding tasks in Telegram DMs.

Why:
- avoids thread-binding assumptions (Telegram lacks built-in ACP thread binding behavior used in Discord)
- avoids async "announce back" delivery uncertainty
- keeps output synchronous in the same chat

### ACP usage boundary
Use ACP `runtime:"acp"` session/thread mode only when the active channel supports robust thread binding (e.g., Discord), or when explicitly requested by user for experimentation.

### Required heartbeat contract (long runs)
For any task expected to run >5 minutes, post:
1. started (scope + ETA)
2. heartbeat at ~2 min
3. heartbeat at ~5 min
4. every 10 min thereafter
5. done/blocked with summary

### Failure fallback rule
If no reliable completion callback is observed within heartbeat SLA:
- stop waiting on async announce path
- switch to direct acpx execution
- continue task and report in same chat

### Session visibility baseline (keep enabled)
- `tools.sessions.visibility=all`
- `tools.agentToAgent.enabled=true`

These improve observability, but they do **not** replace the Telegram default of direct acpx for delivery reliability.

### PR review/fix runbook for Telegram
1. Start direct acpx run in repo.
2. Send immediate start update (scope, ETA, validations planned).
3. Send heartbeat updates per SLA.
4. Return structured completion:
   - Plan
   - Changes
   - Validation
   - Risks
   - Decision needed
5. If pre-push/test gate blocks urgent delivery:
   - get explicit approval to use `--no-verify` push
   - open follow-up issue for test stabilization

---

## 10) Mobile sheet escalation + refactor trigger

### Refactor trigger (mandatory)
Do not keep patching fragile sheet behavior. Escalate to primitive refactor when any of these are true:
- 2 failed UX fixes on the same sheet flow in one task
- issue involves keyboard + viewport math on iOS Safari
- submit/action control is intermittently unreachable

Default refactor path:
- replace hand-rolled sheet/modal with shared Radix/shadcn-style Sheet primitive
- remove ad-hoc viewport listeners unless strictly needed

### Sheet acceptance criteria (required before done)
For mobile sheet tasks, "done" requires:
1. open state verified on iOS Simulator Safari
2. keyboard-up state verified (or explicit blocker noted)
3. primary submit/action is visible and tappable
4. close works via backdrop, close button, and Escape
5. no overlap with bottom nav/safe area

---

## 11) xcodebuildMCP screenshot/testing protocol

### Capture protocol (send gate)
Before sending any screenshot, verify all of:
1. correct route and state
2. no error overlay (404/500/Next error)
3. target feature is visible in frame
4. no blocking coachmark/system prompt obscuring target
5. include one-line caption describing expected visible state

If any check fails, recapture. Do not send.

### QA state control policy
Use deterministic, dev-only state controls for simulator capture when needed:
- allow temporary `?qa=` hooks only in non-production scope
- remove the hook immediately after capture
- rerun `npx tsc --noEmit` after cleanup

### Validation baseline for sheet/UI changes
Minimum validation set:
- `npx tsc --noEmit`
- targeted E2E for touched flow (if available)
- iOS Simulator Safari screenshot evidence for key states

---

## 12) xcodebuildMCP optimization runbook (default usage)

### Session bootstrap (first call in task)
1. `session_show_defaults`
2. If missing/incorrect, set defaults once with `session_set_defaults` (simulatorId/simulatorName, simulatorPlatform, scheme/project/workspace when relevant).
3. Prefer `simulatorId` over `simulatorName` for deterministic runs.

### Preferred simulator flow
- Use `build_run_sim` for single-step app bring-up when building native app targets.
- Use `open_sim` only when visual/manual interaction is required.
- Use `screenshot` + `snapshot_ui` together for verification (image evidence + coordinate tree).

### UI automation flow (reduce manual taps)
- Prefer structured tools over ad-hoc openurl loops:
  - `tap` (accessibility id/label first)
  - `type_text`
  - `swipe` / `gesture`
  - `button` / `key_press`
- Use `snapshot_ui` before and after major UI actions.

### Logging + debugging flow
- For flaky or timing-sensitive bugs:
  1. `start_sim_log_cap`
  2. reproduce issue
  3. `stop_sim_log_cap`
- For hard runtime bugs, use debugger tools (`debug_attach_sim`, breakpoints, stack/variables) instead of repeated blind retries.

### Reliability rules
- In simulator Safari, do not rely on `localhost`; use host LAN URL when required.
- If stateful commands behave oddly, run `doctor` and re-check defaults.
- Keep simulator target pinned during a task; avoid switching devices mid-run unless intentional.

### Workflow enablement (repo config)
If we need advanced capabilities consistently, enable workflows via `.xcodebuildmcp/config.yaml`:
- `simulator`
- `ui-automation`
- `debugging`
- `logging`
- optional: `xcode-ide` (when IDE bridge use is planned)

### Done criteria for xcodebuildMCP-driven QA
- deterministic simulator target recorded
- at least one verified screenshot per acceptance state
- logs attached for failures (when reproduced)
- no temporary QA hooks left in committed code
