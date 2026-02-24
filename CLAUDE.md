# Placeholder — 30 Plant Point Challenge

## Project Overview
Next.js 14 PWA (mobile-first), hosted on Render, using Supabase for database and auth.

## Critical Rules

### Mobile-First PWA — Non-Negotiable
This app is primarily used as a PWA on mobile phones (~375px viewport). **Every UI component must be designed and tested for narrow mobile screens first.**

- Never use multi-column grid layouts (`grid-cols-2`, `grid-cols-3`) for content cards on mobile — they will be too cramped. Stack vertically instead.
- All text must remain readable and untruncated at 375px width.
- Touch targets must be at least 44px.
- Always consider how layouts behave with real data (long names, decimal numbers, variable-length text).
- When in doubt, use full-width single-column layouts.

### Design System
- Fonts: Fraunces (display/headings), DM Sans (body)
- Colors: `brand-dark` (#1a3a2a), `brand-cream` (#f5f0e8), `brand-green` (#22c55e), `brand-muted` (#6b7260)
- Illustration opacity tiers: `illo-ghost` (0.08), `illo-accent` (0.22), `illo-featured` (0.40)
- Grain texture overlays: `.grain` (dark sections), `.grain-light` (light sections)

### Tech Stack
- Next.js 14 with App Router, TypeScript, Tailwind CSS v4
- Supabase (auth, database, RLS, RPC functions)
- Deployed on Render (Node.js runtime — no edge runtime)

### Workflow
- **No git worktrees.** Use regular branches off main. Keep it simple.
- Always work on a named branch, not directly on main.

### Code Quality
- Run `npx tsc --noEmit` before committing
- No `edge` runtime in any route (Render incompatible)
- Use `@supabase/ssr` for auth middleware

### Local E2E Testing
**Prerequisites:**
1. Create a test user in the Supabase dashboard (Authentication > Users) with email `e2e@test.local` and a password
2. Set `E2E_TEST_PASSWORD` in `.env.local` to the password you chose

**How to test:**
1. Start the dev server: `npm run dev`
2. Authenticate by navigating to `http://localhost:3000/api/e2e/login` — this signs in with the test user and redirects to `/`
3. After redirect, the session is active and all pages work (Playwright can now interact with the full app)

**How it works:**
- `NEXT_PUBLIC_E2E_TEST=true` enables the `/api/e2e/login` route and exempts it from auth middleware
- The route signs in with `E2E_TEST_EMAIL` / `E2E_TEST_PASSWORD` using Supabase server client, setting auth cookies
- The test user gets a `member` record automatically via the `handle_new_user` trigger
