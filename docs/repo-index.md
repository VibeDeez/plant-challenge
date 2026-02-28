# Repo Index - Plant Challenge

Last updated: 2026-02-28

## 1) Stack snapshot
- Framework: Next.js 14 (App Router), React 18, TypeScript
- Styling: Tailwind CSS 4 + custom theme tokens in `globals.css`
- Auth + DB: Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- AI services:
  - Vision food recognition via OpenRouter in `src/app/api/recognize/route.ts`
  - Sage Q&A via OpenRouter fallback + deterministic rules in `src/app/api/sage/route.ts`
- Deployment: Render (`render.yaml`), Next standalone output (`next.config.mjs`)
- Testing: Playwright e2e + focused route/lib tests (`*.test.mjs`)

## 2) Top-level architecture
- `src/app/*`: Route-level UI + API routes
- `src/components/*`: Reusable UI + app shell (auth-protected layout, nav, modals, cards)
- `src/lib/*`: Domain logic (circles helpers, week utils, constants, AI rules, Supabase clients)
- `docs/*`: Plans, workflow playbook, API notes
- `scripts/*`: task/check/prune automation + pre-push hook support

## 3) Route map (App Router)

### Public/auth routes
- `src/app/auth/page.tsx` - auth entry
- `src/app/auth/reset-password/page.tsx`
- `src/app/auth/callback/route.ts` + `redirect.ts`

### Protected app routes (`src/app/(protected)`)
- `page.tsx` - main weekly dashboard (plant logs, category breakdown, CTA)
- `add/page.tsx` - add/log plants
- `circles/page.tsx` - circles UI
- `learn/page.tsx` - education content
- `profile/page.tsx` - profile/members
- `sage/page.tsx` - Sage assistant UI
- `layout.tsx` - wraps all protected routes in `ProtectedLayout`

### API routes
- `src/app/api/recognize/route.ts`
  - Auth required
  - Accepts base64 image data URL
  - Calls OpenRouter vision model
  - Maps recognized plants against `plant` table
- `src/app/api/sage/route.ts`
  - Auth required
  - Enforces request limits and context shape
  - Applies deterministic hard rules first
  - Falls back to OpenRouter JSON response for gray areas

## 4) Auth/session flow
- Global middleware: `src/middleware.ts` -> `src/lib/supabase/middleware.ts`
- Behavior:
  - Unauthed users redirected to `/auth`
  - Authed users redirected away from `/auth` to `/`
  - Preserves join-code via query when redirecting from `/join/:code`
  - E2E exception for `/api/e2e/*` when `E2E_TEST=true`

## 5) Inferred data model (from live code usage)
Likely core tables used by app code:
- `member`
  - fields used: `id`, `user_id`, `display_name`, `avatar_emoji`, `is_owner`, `created_at`
- `plant`
  - fields used: `name`, `category`, `points`, `gut_health_blurb`
- `plant_log`
  - fields used: `id`, `member_id`, `plant_name`, `category`, `points`, `logged_at`, `week_start`
- `circle_member`
  - fields used: `id`, `member_id` (+ likely circle references)
- RPC/data contract hints:
  - join circle payload includes `success`, `circle_id`, `message`, `error`

## 6) Feature ownership by file
- App shell/context:
  - `src/components/ProtectedLayout.tsx`
  - `src/components/BottomNav.tsx`
  - `src/components/MemberSwitcher.tsx`
- Weekly progress + logging UX:
  - `src/app/(protected)/page.tsx`
  - `src/components/ProgressBar.tsx`
  - `src/components/PlantCard.tsx`
- Circles:
  - `src/app/(protected)/circles/page.tsx`
  - `src/lib/circles.ts`
  - `src/lib/types/circle.ts`
- Sage:
  - `src/app/(protected)/sage/page.tsx`
  - `src/components/SageChat.tsx`
  - `src/lib/ai/sageRules.ts`
  - `src/app/api/sage/route.ts`
- Photo recognition:
  - `src/components/PhotoRecognitionModal.tsx`
  - `src/app/api/recognize/route.ts`

## 7) Deployment/runtime
- Render service config in `render.yaml`
- Required env:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `OPENROUTER_API_KEY` (for AI endpoints)
  - optional Sage tuning vars (`SAGE_OPENROUTER_MODEL`, `SAGE_OPENROUTER_TIMEOUT_MS`)
- Next config: `output: "standalone"`

## 8) Quick orientation checklist
1. Read `AGENTS.md` and `docs/coding-workflow-playbook.md`
2. Review protected dashboard: `src/app/(protected)/page.tsx`
3. Review auth/session boundaries: middleware + `ProtectedLayout`
4. Review AI paths: `api/recognize` and `api/sage`
5. Validate with:
   - `npm run lint`
   - `npx tsc --noEmit`
   - `npm run test:e2e` (if env + test user configured)

## 9) Gaps to fill next (for a true DeepWiki-equivalent local index)
- Add explicit schema docs from Supabase migrations (not present in repo)
- Add per-route request/response contract docs for all write paths
- Add architectural decision log for deterministic vs model-driven Sage behavior
- Auto-generate this index on commit via script (optional)
