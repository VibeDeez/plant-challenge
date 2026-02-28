# Architecture Bible - Plant Challenge

Last updated: 2026-02-28

This is a high-signal onboarding map from user journeys to UI, API, and data interactions.

## Auth
Key files:
- `src/app/auth/page.tsx`
- `src/app/auth/callback/route.ts`
- `src/lib/supabase/middleware.ts`
- `src/components/ProtectedLayout.tsx`
Data operations inferred:
- `member` -> `select`

## Home Dashboard
Key files:
- `src/app/(protected)/page.tsx`
- `src/components/ProgressBar.tsx`
- `src/components/PlantCard.tsx`
Data operations inferred:
- `circle_member` -> `select`
- `plant` -> `select`
- `plant_log` -> `delete`
- `plant_log` -> `select`

## Add Plant
Key files:
- `src/app/(protected)/add/page.tsx`
- `src/components/PhotoRecognitionModal.tsx`
- `src/app/api/recognize/route.ts`
Client -> API calls:
- `/api/recognize`
Data operations inferred:
- `circle_member` -> `select`
- `plant` -> `select`
- `plant_log` -> `insert`
- `plant_log` -> `select`

## Circles
Key files:
- `src/app/(protected)/circles/page.tsx`
- `src/app/(protected)/circles/[id]/page.tsx`
- `src/app/(protected)/circles/create/page.tsx`
- `src/app/(protected)/circles/[id]/settings/page.tsx`
- `src/lib/circles.ts`
Data operations inferred:
- `circle` -> `delete`
- `circle` -> `insert`
- `circle` -> `select`
- `circle` -> `update`
- `circle_activity` -> `select`
- `circle_activity_reaction` -> `delete`
- `circle_activity_reaction` -> `insert`
- `circle_activity_reaction` -> `select`
- `circle_alltime_score` -> `select`
- `circle_member` -> `delete`
- `circle_member` -> `insert`
- `circle_member` -> `select`
- `circle_weekly_score` -> `select`
- `rpc:join_circle` -> `call`

## Sage Assistant
Key files:
- `src/app/(protected)/sage/page.tsx`
- `src/components/SageChat.tsx`
- `src/app/api/sage/route.ts`
- `src/lib/ai/sageRules.ts`
Client -> API calls:
- `/api/sage`
Data operations inferred:
- `plant_log` -> `select`

## Profile & Members
Key files:
- `src/app/(protected)/profile/page.tsx`
- `src/components/MemberSwitcher.tsx`
- `src/components/AddKidModal.tsx`
- `src/components/ProtectedLayout.tsx`
Data operations inferred:
- `member` -> `delete`
- `member` -> `insert`
- `member` -> `select`
- `member` -> `update`

## API Contract Index (quick)
- `src/app/api/e2e/cleanup/route.ts` | methods: POST | status codes: 207, 401, 404 | env: E2E_TEST, NODE_ENV
- `src/app/api/e2e/login/route.ts` | methods: GET | status codes: 401, 404, 500 | env: E2E_TEST, E2E_TEST_EMAIL, E2E_TEST_PASSWORD, NODE_ENV
- `src/app/api/recognize/route.ts` | methods: POST | status codes: n/a | env: OPENROUTER_API_KEY
- `src/app/api/sage/route.ts` | methods: POST | status codes: n/a | env: OPENROUTER_API_KEY, SAGE_DETERMINISTIC_ONLY, SAGE_OPENROUTER_MODEL, SAGE_OPENROUTER_TIMEOUT_MS
