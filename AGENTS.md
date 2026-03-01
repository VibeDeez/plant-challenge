# AGENTS.md — Plantmaxxing (Codex/Claude shared rules)

## Project
Next.js 14 mobile-first PWA, hosted on Render, Supabase for auth/database.

## Non-negotiable: Mobile-first
Primary viewport is ~375px. Design and test for narrow mobile first.

- Prefer single-column layouts on mobile for content cards.
- Avoid cramped multi-column card grids on mobile (`grid-cols-2/3`) unless clearly safe.
- Keep text readable/untruncated at 375px.
- Touch targets must be >= 44px.
- Validate with realistic long/variable content.

## Design system
- Fonts: Fraunces (display), DM Sans (body)
- Colors: `brand-dark` `#1a3a2a`, `brand-cream` `#f5f0e8`, `brand-green` `#22c55e`, `brand-muted` `#6b7260`
- Illustration opacity classes: `illo-ghost` `0.08`, `illo-accent` `0.22`, `illo-featured` `0.40`
- Grain overlays: `.grain` (dark), `.grain-light` (light)

## Workflow
- No git worktrees for this repo.
- Always use a named branch off `main`.
- Do not work directly on `main`.
- Follow `docs/coding-workflow-playbook.md` for task mode selection (direct vs subagent), update cadence, retry policy, and done-definition.
- Mobile sheet rule: after 2 failed UX fixes or iOS keyboard/viewport instability, stop patching and refactor to shared Sheet primitive.
- iOS simulator screenshot rule: verify correct state/no error overlay/feature visible before sending.

## Subagent orchestration contract (mandatory)
- Main Plantmaxxing agent is the coordinator. Henry should not need to babysit.
- When spawning subagents, always track `runId`, `sessionKey`, owner task, and expected output.
- Poll subagents until all runs are complete, failed, or timed out. Do not wait for Henry to prompt follow-up checks.
- Pull subagent results proactively and send one consolidated update in this format:
  1. Status (`done` or `blocked`)
  2. What changed
  3. Validation results
  4. Risks/unknowns
  5. Next recommended action
- Mid-task messages are only allowed for:
  - explicit approval needed for medium/high-risk changes
  - true blockers that cannot be resolved after one recovery attempt
- For long-running background work (>10 min), send at most one concise progress update every 10-15 minutes.
- Subagent chatter stays internal. User sees coordinator summaries, not fragmented worker logs.

## Sage backend rules (current v1)
- Endpoint: `POST /api/sage`
- Deterministic rules are code-level in `src/lib/ai/sageRules.ts` and should not be overridden by prompt wording.
- Current hard rules include: coffee=0.25, tea=0.25, bell pepper color variants are one species, duplicate species in same week add no new unique point.
- Gray-area interpretation is handled via OpenRouter fallback in `src/app/api/sage/route.ts`.

## Code quality gates
- Run `npx tsc --noEmit` before commit.
- Do not use Edge runtime in routes (Render incompatibility).
- Use `@supabase/ssr` for auth middleware flows.

## Source-of-truth + legacy reconciliation
- Trust current runtime code and current DB behavior over old plan docs.
- Some older docs in `docs/plans/*` are design snapshots and can be stale.
- Important known stale area: older Circles docs reference `circle_member.last_active_at`; current behavior uses member-level activity (`member.last_active_at`) for active/inactive ghost status.
- If app behavior and plan docs conflict, follow code and add a small doc/code update in the same PR.

## E2E local testing
Prereqs:
1. Create Supabase auth test user: `e2e@test.local`
2. Set `E2E_TEST_PASSWORD` in `.env.local`

Flow:
1. Start dev server with test mode: `E2E_TEST=true npm run dev`
2. Hit `http://localhost:3000/api/e2e/login`
3. Redirect to `/` confirms authenticated session

Notes:
- `E2E_TEST=true` enables `/api/e2e/login` and middleware exemption (this is the actual env flag used in code).
- Route signs in with `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD`
- `member` row auto-created via `handle_new_user` trigger


## Repository intelligence docs (mandatory)
Before planning or coding, review these if your task touches architecture, API behavior, data flow, or risk:
- `docs/repo-index.md`
- `docs/repo-deep-index.md`
- `docs/architecture-bible.md`
- `docs/api-contracts-deep.md`
- `docs/risk-register.md`
- `docs/db-access-matrix.csv`
- `docs/architecture-graph.mmd`

Policy:
- CI enforces freshness via `.github/workflows/docs-freshness.yml`; stale generated docs will fail PR checks.
- Treat these as living docs derived from current code.
- If your PR changes routes, data access, env vars, or major flows, update the matching index docs in the same PR.
- If code and index docs disagree, code is source-of-truth and docs must be corrected before merge.

## Index maintenance automation
- Regenerate deep indexes with:
  - `python3 scripts/refresh-architecture-docs.py`
- Git hooks are configured to keep indexes fresh on commits/pushes.
- Do not bypass stale-index warnings unless the change is docs-only and no `src/` behavior changed.
