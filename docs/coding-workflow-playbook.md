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

Current known flaky tests to isolate/fix:
- `e2e/tests/circle-detail.spec.ts` (empty leaderboard for new circle)
- `e2e/tests/profile.spec.ts` (delete kid)

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
