# 2026-03-02 Profile Security Follow-Ups

Context: deferred work after PR #38 (`[codex] add production profile security and privacy management`).

## Open TODOs

### 1) Implement automatic hard-delete for auth users
Status: `todo`
Priority: `high`

Problem:
Current deletion flow creates a deletion request and signs the user out, but does not fully remove auth credentials automatically.

Definition of done:
- Add protected backend path using `SUPABASE_SERVICE_ROLE_KEY` on server only.
- Perform full account deletion workflow (DB records + auth user removal) safely and atomically where possible.
- Ensure user-facing confirmation and error handling for partial failure/retry.
- Add audit event for completed hard-delete.

### 2) Add true multi-device session tracking/listing
Status: `todo`
Priority: `medium`

Problem:
Current sessions UI supports revoke actions and current-session info, but does not show a full list of devices/sessions.

Definition of done:
- Add server-backed session/device tracking model.
- Show list of active/recent sessions in `/profile/security/sessions`.
- Support per-session revoke plus revoke-all-other semantics.
- Ensure privacy-safe metadata display (no sensitive token data exposed).

### 3) Replace in-memory rate limiting with durable/distributed limiter
Status: `todo`
Priority: `high`

Problem:
Rate limiting currently uses in-memory process state and does not scale reliably across instances/restarts.

Definition of done:
- Move rate limiting to shared durable store (for example Redis or Postgres-based limiter).
- Apply limits to all `/api/account/*` sensitive endpoints.
- Return consistent 429 + `Retry-After` behavior across instances.
- Add monitoring/alerts for abuse spikes.

### 4) Run and stabilize E2E coverage for new profile/account flows
Status: `todo`
Priority: `medium`

Problem:
Current validation used TypeScript checks; no dedicated E2E lane yet for new security/privacy routes.

Definition of done:
- Add E2E specs for password reset request, email change request, session revoke actions, data export, and deletion request.
- Cover mobile viewport behavior at ~375px for each new settings surface.
- Ensure CI execution path is stable and documented.

### 5) Add repo-level migration source-of-truth for DB schema changes
Status: `todo`
Priority: `medium`

Problem:
DB migration was applied directly in Supabase, but this repo currently lacks a local migration history path for replay/audit.

Definition of done:
- Establish and document local migration workflow/path for this repo.
- Backfill migration SQL for account-security tables/policies into repo history.
- Validate reproducibility in non-prod environment.

## Suggested execution order
1. Durable/distributed rate limiter.
2. Hard-delete service-role workflow.
3. Multi-device session tracking.
4. E2E expansion and stabilization.
5. Migration source-of-truth backfill (or do this first if standardizing DB workflow immediately).
