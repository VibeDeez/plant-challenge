# Circles v1 ("Crop Circles") Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add persistent social groups ("Crop Circles") with invite codes, weekly/all-time leaderboards, activity feeds with emoji reactions, admin controls, and ghost handling.

**Architecture:** Server-side aggregation via Supabase. New tables (`circle`, `circle_member`, `circle_activity`, `circle_activity_reaction`) with SQL views for leaderboard scoring and database triggers for automatic feed event generation. All data refreshes on page load (no realtime). Competitive mode only.

**Tech Stack:** Next.js 14 App Router, Supabase (PostgreSQL + RLS + RPC), TypeScript, Tailwind CSS, Lucide React icons.

**Design doc:** `docs/plans/2026-02-23-circles-v1-design.md`

---

## Task 1: Database Migration — Tables

**Files:**
- Create migration via Supabase MCP `apply_migration`

**Step 1: Apply the tables migration**

Use the Supabase MCP `apply_migration` tool with name `create_circles_tables` and this SQL:

```sql
-- Circle
create table circle (
  id              uuid primary key default gen_random_uuid(),
  name            text not null check (char_length(name) <= 50),
  invite_code     text unique not null check (char_length(invite_code) = 6),
  admin_id        uuid not null references member(id),
  week_start_day  smallint not null default 1 check (week_start_day between 0 and 6),
  created_at      timestamptz not null default now()
);

-- Circle membership
create table circle_member (
  id              uuid primary key default gen_random_uuid(),
  circle_id       uuid not null references circle(id) on delete cascade,
  member_id       uuid not null references member(id) on delete cascade,
  joined_at       timestamptz not null default now(),
  last_active_at  timestamptz,
  unique(circle_id, member_id)
);

-- Activity feed
create table circle_activity (
  id              uuid primary key default gen_random_uuid(),
  circle_id       uuid not null references circle(id) on delete cascade,
  member_id       uuid references member(id) on delete set null,
  event_type      text not null check (event_type in ('hit_30', 'new_lifetime_plant', 'streak_milestone', 'member_joined')),
  payload         jsonb default '{}',
  created_at      timestamptz not null default now()
);

-- Emoji reactions on activity events
create table circle_activity_reaction (
  id              uuid primary key default gen_random_uuid(),
  activity_id     uuid not null references circle_activity(id) on delete cascade,
  member_id       uuid not null references member(id) on delete cascade,
  emoji           text not null check (emoji in ('fire', 'clap', 'flex', 'seedling', 'party', 'heart')),
  created_at      timestamptz not null default now(),
  unique(activity_id, member_id)
);

-- Streak columns on member
alter table member add column current_streak integer not null default 0;
alter table member add column best_streak integer not null default 0;

-- Indexes
create index idx_circle_invite_code on circle(invite_code);
create index idx_circle_member_circle on circle_member(circle_id);
create index idx_circle_member_member on circle_member(member_id);
create index idx_circle_activity_circle on circle_activity(circle_id, created_at desc);
create index idx_circle_activity_reaction_activity on circle_activity_reaction(activity_id);
```

**Step 2: Verify migration applied**

Use Supabase MCP `list_tables` to confirm all four new tables exist in the `public` schema.

**Step 3: Commit**

```bash
git commit --allow-empty -m "feat(db): create circles tables, activity feed, reactions, streak columns"
```

---

## Task 2: Database Migration — Views

**Step 1: Apply the views migration**

Use `apply_migration` with name `create_circles_views`:

```sql
-- Weekly leaderboard view
create or replace view circle_weekly_score as
select
  cm.circle_id,
  cm.member_id,
  m.display_name,
  m.avatar_emoji,
  pl.week_start,
  coalesce(sum(pl.points), 0) as total_points,
  cm.last_active_at,
  (cm.last_active_at is null or cm.last_active_at < now() - interval '14 days') as is_ghost
from circle_member cm
join member m on m.id = cm.member_id
left join plant_log pl on pl.member_id = cm.member_id
group by cm.circle_id, cm.member_id, m.display_name, m.avatar_emoji, pl.week_start, cm.last_active_at;

-- All-time leaderboard view
create or replace view circle_alltime_score as
select
  cm.circle_id,
  cm.member_id,
  m.display_name,
  m.avatar_emoji,
  coalesce(sum(pl.points), 0) as total_points,
  count(distinct pl.week_start) as weeks_active,
  case when count(distinct pl.week_start) > 0
    then round(coalesce(sum(pl.points), 0)::numeric / count(distinct pl.week_start), 1)
    else 0
  end as avg_weekly,
  cm.last_active_at,
  (cm.last_active_at is null or cm.last_active_at < now() - interval '14 days') as is_ghost
from circle_member cm
join member m on m.id = cm.member_id
left join plant_log pl on pl.member_id = cm.member_id
group by cm.circle_id, cm.member_id, m.display_name, m.avatar_emoji, cm.last_active_at;
```

**Step 2: Verify views**

Use `execute_sql` to run: `select * from circle_weekly_score limit 1;` and `select * from circle_alltime_score limit 1;` — both should return empty results (no circles yet) without error.

**Step 3: Commit**

```bash
git commit --allow-empty -m "feat(db): add circle weekly and all-time leaderboard views"
```

---

## Task 3: Database Migration — Triggers, RPC, and RLS

**Step 1: Apply triggers migration**

Use `apply_migration` with name `create_circles_triggers_rpc_rls`:

```sql
-- ============================================================
-- TRIGGER: on plant_log insert — update last_active, fire feed events, update streaks
-- ============================================================
create or replace function handle_plant_log_insert()
returns trigger as $$
declare
  _circle record;
  _week_total numeric;
  _prev_count bigint;
  _prev_week text;
  _prev_week_total numeric;
  _new_streak integer;
begin
  -- Update last_active_at for all circles this member belongs to
  update circle_member
  set last_active_at = now()
  where member_id = NEW.member_id;

  -- For each circle the member is in, check milestones
  for _circle in
    select circle_id from circle_member where member_id = NEW.member_id
  loop
    -- Check if weekly total just crossed 30
    select coalesce(sum(points), 0) into _week_total
    from plant_log
    where member_id = NEW.member_id and week_start = NEW.week_start;

    if _week_total >= 30 and (_week_total - NEW.points) < 30 then
      -- Deduplicate: only insert if not already fired this week
      if not exists (
        select 1 from circle_activity
        where circle_id = _circle.circle_id
          and member_id = NEW.member_id
          and event_type = 'hit_30'
          and payload->>'week_start' = NEW.week_start
      ) then
        insert into circle_activity (circle_id, member_id, event_type, payload)
        values (_circle.circle_id, NEW.member_id, 'hit_30',
          jsonb_build_object('week_start', NEW.week_start, 'total_points', _week_total));
      end if;
    end if;

    -- Check if this is a new lifetime plant for this member
    select count(*) into _prev_count
    from plant_log
    where member_id = NEW.member_id
      and plant_name = NEW.plant_name
      and id != NEW.id;

    if _prev_count = 0 then
      insert into circle_activity (circle_id, member_id, event_type, payload)
      values (_circle.circle_id, NEW.member_id, 'new_lifetime_plant',
        jsonb_build_object('plant_name', NEW.plant_name, 'category', NEW.category));
    end if;
  end loop;

  -- Streak handling: on first log of a new week, evaluate previous week
  -- Check if this is the first log for this week
  select count(*) into _prev_count
  from plant_log
  where member_id = NEW.member_id
    and week_start = NEW.week_start
    and id != NEW.id;

  if _prev_count = 0 then
    -- First log of a new week — check previous week
    _prev_week := to_char(
      (NEW.week_start::date - interval '7 days'), 'YYYY-MM-DD'
    );

    select coalesce(sum(points), 0) into _prev_week_total
    from plant_log
    where member_id = NEW.member_id and week_start = _prev_week;

    if _prev_week_total >= 30 then
      -- Increment streak
      update member
      set current_streak = current_streak + 1,
          best_streak = greatest(best_streak, current_streak + 1)
      where id = NEW.member_id;

      select current_streak into _new_streak from member where id = NEW.member_id;

      -- Fire streak milestone if at threshold
      if _new_streak in (4, 8, 12, 26, 52) then
        for _circle in
          select circle_id from circle_member where member_id = NEW.member_id
        loop
          insert into circle_activity (circle_id, member_id, event_type, payload)
          values (_circle.circle_id, NEW.member_id, 'streak_milestone',
            jsonb_build_object('streak_count', _new_streak));
        end loop;
      end if;
    else
      -- Reset streak
      update member set current_streak = 0 where id = NEW.member_id;
    end if;
  end if;

  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_plant_log_insert
  after insert on plant_log
  for each row execute function handle_plant_log_insert();

-- ============================================================
-- TRIGGER: on circle_member insert — fire member_joined event
-- ============================================================
create or replace function handle_circle_member_insert()
returns trigger as $$
begin
  insert into circle_activity (circle_id, member_id, event_type, payload)
  values (NEW.circle_id, NEW.member_id, 'member_joined', '{}');
  return NEW;
end;
$$ language plpgsql security definer;

create trigger on_circle_member_insert
  after insert on circle_member
  for each row execute function handle_circle_member_insert();

-- ============================================================
-- RPC: join_circle — validates code, checks cap, inserts member
-- ============================================================
create or replace function join_circle(p_invite_code text, p_member_id uuid)
returns jsonb as $$
declare
  _circle record;
  _member_count integer;
  _already_member boolean;
begin
  -- Find circle
  select * into _circle from circle where invite_code = upper(p_invite_code);
  if _circle is null then
    return jsonb_build_object('error', 'Invalid invite code');
  end if;

  -- Check if already a member
  select exists(
    select 1 from circle_member
    where circle_id = _circle.id and member_id = p_member_id
  ) into _already_member;
  if _already_member then
    return jsonb_build_object('error', 'Already a member', 'circle_id', _circle.id);
  end if;

  -- Check cap
  select count(*) into _member_count
  from circle_member where circle_id = _circle.id;
  if _member_count >= 30 then
    return jsonb_build_object('error', 'Circle is full (30 members max)');
  end if;

  -- Insert membership
  insert into circle_member (circle_id, member_id)
  values (_circle.id, p_member_id);

  return jsonb_build_object(
    'success', true,
    'circle_id', _circle.id,
    'circle_name', _circle.name
  );
end;
$$ language plpgsql security definer;

-- ============================================================
-- RLS POLICIES
-- ============================================================

alter table circle enable row level security;
alter table circle_member enable row level security;
alter table circle_activity enable row level security;
alter table circle_activity_reaction enable row level security;

-- circle: readable by members
create policy "circle_select" on circle for select using (
  exists (
    select 1 from circle_member cm
    join member m on m.id = cm.member_id
    where cm.circle_id = circle.id and m.user_id = auth.uid()
  )
);

-- circle: insertable by authenticated users
create policy "circle_insert" on circle for insert
  with check (auth.uid() is not null);

-- circle: updatable by admin
create policy "circle_update" on circle for update using (
  exists (
    select 1 from member m
    where m.id = circle.admin_id and m.user_id = auth.uid()
  )
);

-- circle: deletable by admin
create policy "circle_delete" on circle for delete using (
  exists (
    select 1 from member m
    where m.id = circle.admin_id and m.user_id = auth.uid()
  )
);

-- circle_member: readable by members of same circle
create policy "circle_member_select" on circle_member for select using (
  exists (
    select 1 from circle_member cm2
    join member m on m.id = cm2.member_id
    where cm2.circle_id = circle_member.circle_id and m.user_id = auth.uid()
  )
);

-- circle_member: insertable (join via RPC handles validation)
create policy "circle_member_insert" on circle_member for insert
  with check (auth.uid() is not null);

-- circle_member: deletable by circle admin or self
create policy "circle_member_delete" on circle_member for delete using (
  exists (
    select 1 from member m where m.id = circle_member.member_id and m.user_id = auth.uid()
  )
  or exists (
    select 1 from circle c
    join member m on m.id = c.admin_id
    where c.id = circle_member.circle_id and m.user_id = auth.uid()
  )
);

-- circle_activity: readable by members of the circle
create policy "circle_activity_select" on circle_activity for select using (
  exists (
    select 1 from circle_member cm
    join member m on m.id = cm.member_id
    where cm.circle_id = circle_activity.circle_id and m.user_id = auth.uid()
  )
);

-- circle_activity_reaction: readable by members of the circle
create policy "reaction_select" on circle_activity_reaction for select using (
  exists (
    select 1 from circle_activity ca
    join circle_member cm on cm.circle_id = ca.circle_id
    join member m on m.id = cm.member_id
    where ca.id = circle_activity_reaction.activity_id and m.user_id = auth.uid()
  )
);

-- circle_activity_reaction: insertable/deletable by self
create policy "reaction_insert" on circle_activity_reaction for insert
  with check (
    exists (select 1 from member m where m.id = circle_activity_reaction.member_id and m.user_id = auth.uid())
  );

create policy "reaction_delete" on circle_activity_reaction for delete using (
  exists (select 1 from member m where m.id = circle_activity_reaction.member_id and m.user_id = auth.uid())
);
```

**Step 2: Verify**

Use `execute_sql` to run `select join_circle('XXXXXX', gen_random_uuid());` — should return `{"error": "Invalid invite code"}`.

**Step 3: Commit**

```bash
git commit --allow-empty -m "feat(db): add triggers, join_circle RPC, and RLS policies"
```

---

## Task 4: TypeScript Types and Supabase Helpers

**Files:**
- Create: `src/lib/types/circle.ts`
- Create: `src/lib/circles.ts`
- Modify: `src/lib/constants.ts`

**Step 1: Create Circle types**

Create `src/lib/types/circle.ts`:

```typescript
export type Circle = {
  id: string;
  name: string;
  invite_code: string;
  admin_id: string;
  week_start_day: number;
  created_at: string;
};

export type CircleMember = {
  id: string;
  circle_id: string;
  member_id: string;
  joined_at: string;
  last_active_at: string | null;
};

export type CircleWeeklyScore = {
  circle_id: string;
  member_id: string;
  display_name: string;
  avatar_emoji: string;
  week_start: string;
  total_points: number;
  last_active_at: string | null;
  is_ghost: boolean;
};

export type CircleAlltimeScore = {
  circle_id: string;
  member_id: string;
  display_name: string;
  avatar_emoji: string;
  total_points: number;
  weeks_active: number;
  avg_weekly: number;
  last_active_at: string | null;
  is_ghost: boolean;
};

export type CircleActivity = {
  id: string;
  circle_id: string;
  member_id: string | null;
  event_type: "hit_30" | "new_lifetime_plant" | "streak_milestone" | "member_joined";
  payload: Record<string, unknown>;
  created_at: string;
  // Joined fields
  display_name?: string;
  avatar_emoji?: string;
};

export type CircleActivityReaction = {
  id: string;
  activity_id: string;
  member_id: string;
  emoji: ReactionEmoji;
  created_at: string;
};

export type ReactionEmoji = "fire" | "clap" | "flex" | "seedling" | "party" | "heart";

export const REACTION_EMOJIS: { key: ReactionEmoji; display: string }[] = [
  { key: "fire", display: "🔥" },
  { key: "clap", display: "👏" },
  { key: "flex", display: "💪" },
  { key: "seedling", display: "🌱" },
  { key: "party", display: "🎉" },
  { key: "heart", display: "❤️" },
];
```

**Step 2: Create Circle helper functions**

Create `src/lib/circles.ts`:

```typescript
const INVITE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no 0/O/1/I/L

export function generateInviteCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += INVITE_CHARSET[Math.floor(Math.random() * INVITE_CHARSET.length)];
  }
  return code;
}

export function getShareUrl(inviteCode: string): string {
  const base =
    process.env.NEXT_PUBLIC_SITE_URL || "https://plant-challenge.onrender.com";
  return `${base}/join/${inviteCode}`;
}

export function formatActivityEvent(
  eventType: string,
  displayName: string,
  payload: Record<string, unknown>
): string {
  switch (eventType) {
    case "hit_30":
      return `${displayName} hit 30 this week!`;
    case "new_lifetime_plant":
      return `${displayName} tried ${payload.plant_name} for the first time`;
    case "streak_milestone":
      return `${displayName} is on a ${payload.streak_count}-week streak!`;
    case "member_joined":
      return `${displayName} joined the circle`;
    default:
      return `${displayName} did something`;
  }
}

export function getActivityIcon(eventType: string): string {
  switch (eventType) {
    case "hit_30":
      return "🎯";
    case "new_lifetime_plant":
      return "🌱";
    case "streak_milestone":
      return "🔥";
    case "member_joined":
      return "👋";
    default:
      return "📌";
  }
}

export function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
```

**Step 3: Verify types compile**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/lib/types/circle.ts src/lib/circles.ts
git commit -m "feat: add Circle types and helper functions"
```

---

## Task 5: Update Bottom Nav and Middleware

**Files:**
- Modify: `src/components/BottomNav.tsx` (line 8: change leaderboard tab)
- Modify: `src/middleware.ts` (add /join to excluded routes)

**Step 1: Update BottomNav**

In `src/components/BottomNav.tsx`, change the tabs array (line 7-12). Replace the leaderboard entry:

```typescript
// Old:
{ href: "/leaderboard", label: "Board", icon: Trophy },
// New:
{ href: "/circles", label: "Circles", icon: Trophy },
```

Also update the import at the top — `Trophy` is already imported from `lucide-react`, no change needed.

**Step 2: Update middleware to allow /join route without auth redirect**

In `src/middleware.ts`, the `/join/[code]` route should still go through auth middleware (we want unauthenticated users redirected to `/auth?join={code}`), so no middleware change is needed here. The join page itself will handle the redirect with the preserved code.

Actually — we need the `/join` page to be accessible to read the code, then redirect to auth if needed. The current middleware redirects unauthenticated users to `/auth` without preserving the invite code. We need to modify the middleware to preserve the `join` parameter.

In `src/lib/supabase/middleware.ts`, modify the unauthenticated redirect block (around line 35-39):

```typescript
// Old:
if (
  !user &&
  !request.nextUrl.pathname.startsWith("/auth")
) {
  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  return NextResponse.redirect(url);
}

// New:
if (
  !user &&
  !request.nextUrl.pathname.startsWith("/auth")
) {
  const url = request.nextUrl.clone();
  // Preserve invite code for join flow
  if (request.nextUrl.pathname.startsWith("/join/")) {
    const code = request.nextUrl.pathname.split("/join/")[1];
    if (code) url.searchParams.set("join", code);
  }
  url.pathname = "/auth";
  return NextResponse.redirect(url);
}
```

**Step 3: Verify**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 4: Commit**

```bash
git add src/components/BottomNav.tsx src/lib/supabase/middleware.ts
git commit -m "feat: update bottom nav to Circles and preserve invite code in auth redirect"
```

---

## Task 6: Circles List Page

**Files:**
- Create: `src/app/(protected)/circles/page.tsx`

**Step 1: Create the Circles list page**

This page shows the user's circles with preview cards, plus Create and Join buttons. Empty state if no circles.

Create `src/app/(protected)/circles/page.tsx`. The page should:

1. Use `"use client"` directive
2. Import `useApp` from `@/components/ProtectedLayout`, `createClient` from `@/lib/supabase/client`, `useEffect/useState` from React
3. Fetch circles for the active member:
   - Query `circle_member` where `member_id = activeMember.id`
   - Join with `circle` table to get circle name, member count
   - Also fetch this week's score from `circle_weekly_score` for preview
4. Render:
   - Header: "Crop Circles" in Fraunces font
   - Two buttons: "Create a Circle" (link to `/circles/create`) and "Join a Circle" (opens a modal with invite code input)
   - Circle cards: name, member count badge, user's current score this week, link to `/circles/[id]`
   - Empty state: botanical illustration + "Start your first Crop Circle" message

**Design patterns to follow:**
- Page background: `min-h-screen bg-brand-cream` with `grain-light` (same as profile page)
- Cards: `bg-white/30 backdrop-blur-sm rounded-2xl border border-brand-dark/10` (glassmorphic)
- Staggered entry: `animate-fadeInUp` with `animationDelay: ${i * 0.08}s`
- Header area: `bg-brand-dark grain` with cream text (like leaderboard)
- Loading spinner: existing pattern from layout
- Join modal: bottom sheet with `animate-slideUp` backdrop `animate-fadeIn`

**Step 2: Create Join Code Modal component**

Include a `JoinCircleModal` as a component within the page file (or extract to `src/components/JoinCircleModal.tsx` if over 80 lines). The modal:
- Text input for 6-char code (auto-uppercase, max 6 chars)
- "Join" button that calls the `join_circle` RPC
- Error/success handling
- On success, redirect to `/circles/[id]`

**Step 3: Verify**

Run: `npx tsc --noEmit`
Then manually check `localhost:3001/circles` loads with empty state.

**Step 4: Commit**

```bash
git add src/app/\(protected\)/circles/
git commit -m "feat: add Circles list page with join modal"
```

---

## Task 7: Circle Create Page

**Files:**
- Create: `src/app/(protected)/circles/create/page.tsx`

**Step 1: Create the Circle creation page**

The page has:
1. A form with a single field: Circle name (text input, max 50 chars, required)
2. On submit:
   - Generate invite code via `generateInviteCode()` from `src/lib/circles.ts`
   - Insert into `circle` table: `{ name, invite_code, admin_id: activeMember.id }`
   - If insert fails with unique violation on `invite_code`, regenerate and retry (max 3 attempts)
   - Insert creator into `circle_member`: `{ circle_id, member_id: activeMember.id }`
   - On success, navigate to `/circles/[id]` and show share prompt
3. After creation success, show a share overlay:
   - Display the invite code in large monospace text
   - "Copy Link" button using `navigator.clipboard.writeText(getShareUrl(code))`
   - "Share" button using `navigator.share()` (Web Share API) with fallback to clipboard
   - "Go to Circle" link

**Design patterns:**
- Form card: glassmorphic card centered on cream background
- Input: `w-full rounded-xl border border-brand-dark/10 bg-white px-4 py-3 text-sm text-brand-dark placeholder:text-brand-muted/50 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-green` (same as auth form inputs)
- Submit button: `bg-brand-green text-white font-semibold rounded-xl` (same as auth form)
- Back navigation: `← Back` link to `/circles`

**Step 2: Verify**

Run: `npx tsc --noEmit`
Then manually test creating a circle at `localhost:3001/circles/create`.

**Step 3: Commit**

```bash
git add src/app/\(protected\)/circles/create/
git commit -m "feat: add Circle creation page with invite code sharing"
```

---

## Task 8: Join Deep Link Page

**Files:**
- Create: `src/app/(protected)/join/[code]/page.tsx`

**Step 1: Create the join handler page**

This page handles the `/join/[code]` deep link for authenticated users (unauthenticated users are redirected to `/auth?join={code}` by middleware).

The page:
1. Reads `code` from route params
2. Shows a loading state while calling `join_circle` RPC with the code and `activeMember.id`
3. On success: redirect to `/circles/[circle_id]`
4. On error ("Invalid invite code", "Circle is full", "Already a member"): show error with a link back to `/circles`
5. If "Already a member", also include a direct link to the circle

**Step 2: Update auth page to handle join param**

Modify `src/app/auth/page.tsx` to check for `?join=` query param. After successful login/signup, redirect to `/join/{code}` instead of `/` if the param exists.

In the `handleSubmit` function (around line 72), replace:
```typescript
router.push("/");
```
with:
```typescript
const joinCode = new URLSearchParams(window.location.search).get("join");
router.push(joinCode ? `/join/${joinCode}` : "/");
```

**Step 3: Verify**

Run: `npx tsc --noEmit`

**Step 4: Commit**

```bash
git add src/app/\(protected\)/join/ src/app/auth/page.tsx
git commit -m "feat: add join deep link handler and auth redirect preservation"
```

---

## Task 9: Circle Detail Page — Leaderboard Tab

**Files:**
- Create: `src/app/(protected)/circles/[id]/page.tsx`

**Step 1: Create the Circle detail page with leaderboard**

This is the primary Circle view. It has two tabs: Leaderboard (default) and Activity.

Page structure:
1. Fetch circle details: `from("circle").select("*").eq("id", circleId).single()`
2. Fetch member count: `from("circle_member").select("id", { count: "exact" }).eq("circle_id", circleId)`
3. Check if current user is admin: `circle.admin_id === activeMember.id`
4. Tab state: `"leaderboard" | "activity"` (default: `"leaderboard"`)

**Leaderboard tab:**
- Sub-tabs: "This Week" (default) and "All Time"
- Weekly view: query `circle_weekly_score` where `circle_id` and `week_start = getWeekStart()`
  - Sort: active members by `total_points` desc, then ghosts by `total_points` desc
- All-time view: query `circle_alltime_score` where `circle_id`
  - Sort: same pattern (active first, then ghosts)
- Reuse the existing `LeaderboardRow` component from `src/components/LeaderboardRow.tsx` — pass `isFamily={entry.member_id === activeMember.id}` to highlight the current user's row
- Ghost rows: add `opacity-40` wrapper and a small "inactive" text badge below the name
- Top 3 podium treatment: same as existing leaderboard (hero card for 1st, podium cards for 2nd/3rd)

**Header:**
- Circle name (Fraunces), member count badge
- Gear icon (link to `/circles/[id]/settings`) — only visible if user is admin
- Invite code display with copy button

**Tab bar:**
- Two tabs: "Leaderboard" and "Activity"
- Active tab: `border-b-2 border-brand-green text-brand-green`
- Inactive tab: `text-brand-muted`

**Step 2: Verify**

Run: `npx tsc --noEmit`
Manually test by creating a circle and navigating to it.

**Step 3: Commit**

```bash
git add src/app/\(protected\)/circles/\[id\]/
git commit -m "feat: add Circle detail page with weekly and all-time leaderboard"
```

---

## Task 10: Circle Detail Page — Activity Tab

**Files:**
- Modify: `src/app/(protected)/circles/[id]/page.tsx`
- Create: `src/components/ActivityFeed.tsx`
- Create: `src/components/ReactionPicker.tsx`

**Step 1: Create ActivityFeed component**

Create `src/components/ActivityFeed.tsx`:
- Props: `circleId: string`, `activeMemberId: string`
- Fetches last 20 activity events: `from("circle_activity").select("*, member:member_id(display_name, avatar_emoji)").eq("circle_id", circleId).order("created_at", { ascending: false }).limit(20)`
- Also fetches reactions for those events: `from("circle_activity_reaction").select("*").in("activity_id", activityIds)`
- Renders each event as a compact card:
  - Left: event icon (from `getActivityIcon`) + avatar emoji
  - Center: event text (from `formatActivityEvent`) + relative timestamp (from `timeAgo`)
  - Bottom: reaction pills showing emoji + count, plus an "add reaction" button
- Glassmorphic card style for each event
- Empty state: "No activity yet — start logging plants!"

**Step 2: Create ReactionPicker component**

Create `src/components/ReactionPicker.tsx`:
- Props: `activityId: string`, `memberId: string`, `existingReaction: ReactionEmoji | null`, `onReact: (emoji: ReactionEmoji | null) => void`
- Renders 6 emoji buttons in a row
- Tapping an already-selected emoji removes the reaction (toggle)
- Tapping a new emoji replaces the existing reaction
- Calls supabase upsert/delete accordingly

**Step 3: Wire Activity tab into Circle detail page**

In the Circle detail page, when the "Activity" tab is selected, render `<ActivityFeed circleId={circle.id} activeMemberId={activeMember.id} />`.

**Step 4: Verify**

Run: `npx tsc --noEmit`
Manually test by logging a plant (which should fire the trigger and create activity events).

**Step 5: Commit**

```bash
git add src/components/ActivityFeed.tsx src/components/ReactionPicker.tsx src/app/\(protected\)/circles/\[id\]/
git commit -m "feat: add activity feed with emoji reactions to Circle detail"
```

---

## Task 11: Circle Settings Page

**Files:**
- Create: `src/app/(protected)/circles/[id]/settings/page.tsx`

**Step 1: Create the settings page**

Only accessible to the circle admin. If the current member is not the admin, redirect to `/circles/[id]`.

Sections:
1. **Circle Name** — text input with current name, save on submit. Calls `from("circle").update({ name }).eq("id", circleId)`.
2. **Invite Code** — display code + copy link button (read-only).
3. **Members** — list all members with remove button (X icon) next to each (except self). Remove calls `from("circle_member").delete().eq("circle_id", circleId).eq("member_id", memberId)`.
4. **Transfer Admin** — dropdown/select of current members (excluding self). On confirm, calls `from("circle").update({ admin_id: newAdminId }).eq("id", circleId)`. Redirects to `/circles/[id]` after transfer.
5. **Leave Circle** — only shown to non-admins. Calls `from("circle_member").delete().eq("circle_id", circleId).eq("member_id", activeMember.id)`. Redirects to `/circles`.
6. **Delete Circle** — danger zone. Requires typing the circle name to confirm. Calls `from("circle").delete().eq("id", circleId)`. Redirects to `/circles`.

**Design patterns:**
- Sections separated by `border-b border-brand-dark/10`
- Delete section: `text-red-600` label, red-outlined confirm button
- Back link: `← Back to Circle`

**Step 2: Verify**

Run: `npx tsc --noEmit`
Manually test admin controls.

**Step 3: Commit**

```bash
git add src/app/\(protected\)/circles/\[id\]/settings/
git commit -m "feat: add Circle settings page with admin controls"
```

---

## Task 12: Onboarding Banner on Home Page

**Files:**
- Modify: `src/app/(protected)/page.tsx`

**Step 1: Add onboarding banner**

Add a dismissible banner to the home page that appears when the user has no circles and hasn't dismissed the prompt.

Logic:
1. Check localStorage for `dismissed_circle_prompt`
2. Fetch circle count: `from("circle_member").select("id", { count: "exact" }).eq("member_id", activeMember.id)`
3. If count === 0 and not dismissed, show banner

Banner design:
- Positioned above the tip card
- Glassmorphic card with `bg-brand-green/10 border border-brand-green/20 rounded-2xl`
- Text: "Start a Crop Circle" (Fraunces) + "Invite friends and compete on a weekly leaderboard" (DM Sans)
- Two buttons: "Create" (link to `/circles/create`) and "Join" (link to `/circles` which has the join modal)
- Dismiss X button in top-right corner — sets `dismissed_circle_prompt` in localStorage

**Step 2: Verify**

Run: `npx tsc --noEmit`
Manually test banner appears and dismissal persists.

**Step 3: Commit**

```bash
git add src/app/\(protected\)/page.tsx
git commit -m "feat: add Crop Circles onboarding banner to home page"
```

---

## Task 13: Remove Old Leaderboard Page

**Files:**
- Delete: `src/app/(protected)/leaderboard/page.tsx`

**Step 1: Remove the old global leaderboard**

The global leaderboard at `/leaderboard` is replaced by `/circles`. Delete the page file.

If there are any imports or references to the leaderboard page elsewhere (e.g., links), update them to point to `/circles`.

**Step 2: Verify**

Run: `npx tsc --noEmit`
Verify no broken imports.

**Step 3: Commit**

```bash
git rm src/app/\(protected\)/leaderboard/page.tsx
git commit -m "refactor: remove global leaderboard page (replaced by Circles)"
```

---

## Task 14: Final Integration and Verification

**Step 1: Full type check**

Run: `npx tsc --noEmit`
Expected: 0 errors

**Step 2: Full build**

Run: `npx next build`
Expected: Successful build with no errors

**Step 3: Manual smoke test**

1. Navigate to `/circles` — should show empty state
2. Create a circle — should generate code, show share prompt
3. Copy invite link — should contain the code
4. Navigate to circle detail — should show empty leaderboard
5. Log a plant on home page — return to circle, pull refresh, should show score
6. Check activity tab — should show "new_lifetime_plant" event
7. Test ghost handling — view leaderboard with a member who hasn't logged in 14+ days
8. Test admin settings — rename, invite code copy, delete with confirmation
9. Test onboarding banner — should show on home page, dismiss should persist
10. Test join flow — use invite code from another circle

**Step 4: Final commit and push**

```bash
git push -u origin feature/social
```

Then create a PR with `gh pr create`.
