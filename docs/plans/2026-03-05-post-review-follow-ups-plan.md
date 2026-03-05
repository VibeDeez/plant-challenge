# Post-Review Follow-Ups Plan

**Date:** March 5, 2026

**Context:** The original code-review findings from the March 5, 2026 review have been fixed. This doc captures the remaining follow-up items that surfaced during the hardening pass and final validation sweep, but were intentionally left out of the finished fix set because they are separate infrastructure or QA workstreams.

## Goal

Close the remaining Supabase advisor findings, clean up DB policy/perf hygiene, and run the end-to-end checks that were not completed in the fix session.

## Workstream 1: Security Advisor Follow-Ups

**Priority:** High

**Open items:**

- Replace or redesign the `public.circle_weekly_score` and `public.circle_alltime_score` views so they no longer require `SECURITY DEFINER`.
  - Supabase advisor reference: [lint 0010: security definer view](https://supabase.com/docs/guides/database/database-linter?lint=0010_security_definer_view)
- Add an explicit `SET search_path = 'public'` to the legacy trigger functions `public.handle_circle_member_insert` and `public.handle_plant_log_insert`.
  - Supabase advisor reference: [lint 0011: function search path mutable](https://supabase.com/docs/guides/database/database-linter?lint=0011_function_search_path_mutable)
- Enable leaked-password protection in Supabase Auth.
  - Supabase reference: [Password strength and leaked password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection)

**Definition of done:**

- Security advisor rerun shows no `SECURITY DEFINER` errors for the circle score views.
- Security advisor rerun no longer flags mutable `search_path` for the two trigger functions above.
- Auth settings have leaked-password protection enabled and verified.

## Workstream 2: Database Performance Cleanup

**Priority:** Medium

**Open items:**

- Add covering indexes for the foreign keys currently flagged by Supabase:
  - `circle.admin_id`
  - `circle_activity.member_id`
  - `circle_activity_reaction.member_id`
- Update RLS policies that repeatedly call `auth.uid()` or related auth helpers per row to use the `(select auth.uid())` pattern where safe.
  - Current advisor hits include `member`, `plant_log`, `circle`, `circle_member`, `circle_activity_reaction`, and `request_rate_limit_event`.
- Review multiple permissive `SELECT` policies on `member` and `plant_log` and consolidate if the public leaderboard requirements still allow it.
- Do not remove currently unused indexes until after real traffic confirms they are genuinely unnecessary.

**Definition of done:**

- Supabase performance advisor no longer flags the three missing foreign-key indexes.
- RLS init-plan warnings are reduced or eliminated for the touched tables.
- Any policy consolidation preserves current leaderboard/public-read behavior.

## Workstream 3: Validation Gaps

**Priority:** Medium

**Open items:**

- Run Playwright locally using the documented test-auth flow:
  1. Create the Supabase auth test user `e2e@test.local`
  2. Set `E2E_TEST_PASSWORD` in `.env.local`
  3. Start the app with `E2E_TEST=true npm run dev`
  4. Hit `/api/e2e/login` to verify authenticated test state
- Run focused E2E coverage for the flows touched in the fix pass:
  - Add page duplicate handling
  - Voice Log draft resume/discard/save
  - Menu Max review-and-log flow
  - Circle create/share/join flows
  - Missing-member recovery path
  - Learn page narrow-mobile layout
- Run mobile-state checks for the fixed modal/sheet flows and confirm:
  - correct visible state
  - no stuck overlays
  - usable controls at ~375px width

**Definition of done:**

- Relevant Playwright suites pass locally.
- The fixed flows are visually verified on mobile-width layouts.
- Any regressions found during E2E are filed or fixed in a separate pass.

## Suggested Order

1. Finish Workstream 1 first because it contains the externally facing security follow-ups.
2. Tackle Workstream 2 next while the DB changes are fresh.
3. Close Workstream 3 last so E2E runs validate the final DB and UI state together.
