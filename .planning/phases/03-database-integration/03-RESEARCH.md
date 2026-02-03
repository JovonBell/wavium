# Phase 3: Database Integration - Research

**Researched:** 2026-02-02
**Domain:** Supabase Database (Schema Design, RLS Policies, Realtime, Sync)
**Confidence:** HIGH

## Summary

Phase 3 integrates user data persistence with Supabase PostgreSQL, enabling subliminal library management, session tracking, streak calculations, and Mindi state persistence. The research confirms that **Supabase RLS (Row-Level Security) is mandatory** for multi-tenant data isolation, and the existing `@supabase/supabase-js` client already supports realtime subscriptions for cross-device sync.

Key findings: (1) RLS must be enabled on EVERY table with explicit policies - this is the #1 cause of Supabase security vulnerabilities, (2) For MVP, a "remote-primary with local cache" pattern using Zustand + MMKV is sufficient - no need for complex offline-first frameworks like PowerSync, (3) Streak calculations should use PostgreSQL functions (RPC) rather than client-side computation for consistency, and (4) Supabase migrations via CLI provide versioned schema changes that should be committed to git.

**Primary recommendation:** Create four tables (subliminals, sessions, mindi_state, user_streaks) with strict RLS policies using `auth.uid()`, implement a simple sync pattern where Supabase is the source of truth with MMKV as read cache, use database functions for streak calculations, and leverage Realtime subscriptions for cross-device sync.

## Standard Stack

The established libraries/tools for this domain:

### Core - Database
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase PostgreSQL | Managed | Primary data store | Already configured for auth, provides RLS, Realtime, and RPC |
| Supabase CLI | ^2.x | Schema migrations | Version-controlled migrations, local development |

### Core - Frontend (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.x | Database client | Already configured for auth, includes Realtime |
| react-native-mmkv | ^4.1.0 | Local cache | Fast encrypted storage, already in project |
| Zustand | 5.0.9 | State management | Already used, persist middleware available |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^3.x | Date manipulation | Streak calculations, date formatting |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Simple sync (Zustand + Supabase) | PowerSync | PowerSync is production-grade offline-first but adds complexity; overkill for MVP |
| Simple sync | WatermelonDB | WatermelonDB requires building sync backend; more work than Supabase Realtime |
| RPC functions | Client-side calculation | Server-side is authoritative, prevents tampering, consistent across devices |
| Individual queries | Supabase Views | Views can simplify complex queries but add schema complexity |

**Installation:**
```bash
# Frontend (already installed via Phase 2)
# No new packages needed - @supabase/supabase-js already includes realtime

# Backend - Supabase CLI for migrations
npm install -g supabase
# Or via npx: npx supabase migration new [name]

# Optional: date library for date handling
cd wavium && npm install date-fns
```

## Architecture Patterns

### Recommended Project Structure
```
wavium/
├── src/
│   ├── lib/
│   │   └── supabase.ts           # Already exists (Phase 2)
│   ├── services/
│   │   ├── subliminalService.ts  # CRUD for subliminals
│   │   ├── sessionService.ts     # Session recording
│   │   └── mindiService.ts       # Mindi state & streaks
│   ├── stores/
│   │   └── useMindiStore.ts      # Update to sync with Supabase
│   └── hooks/
│       └── useSyncedLibrary.ts   # Realtime-synced library

supabase/
├── migrations/
│   ├── 20260202000001_create_subliminals.sql
│   ├── 20260202000002_create_sessions.sql
│   ├── 20260202000003_create_mindi_state.sql
│   └── 20260202000004_create_streak_function.sql
└── seed.sql                      # Development seed data
```

### Pattern 1: Database Schema with RLS
**What:** Tables with user_id foreign key and RLS policies
**When to use:** All user-owned data
**Example:**
```sql
-- supabase/migrations/20260202000001_create_subliminals.sql
-- Source: Supabase RLS documentation

-- Subliminals table
create table if not exists public.subliminals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  intention text not null,
  affirmations text[] not null,
  track text not null,
  audio_url text not null,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

-- Enable RLS (CRITICAL - without this, data is exposed!)
alter table public.subliminals enable row level security;

-- Index for RLS performance (auth.uid() = user_id queries)
create index idx_subliminals_user_id on public.subliminals(user_id);

-- Policies: Users can only access their own subliminals
create policy "Users can view own subliminals"
  on public.subliminals for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own subliminals"
  on public.subliminals for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own subliminals"
  on public.subliminals for update
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Users can delete own subliminals"
  on public.subliminals for delete
  using ((select auth.uid()) = user_id);

-- Updated_at trigger
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger subliminals_updated_at
  before update on public.subliminals
  for each row execute function update_updated_at();
```

### Pattern 2: Sessions Table for Listening History
**What:** Track listening sessions with duration and completion
**When to use:** Recording user activity for streaks
**Example:**
```sql
-- supabase/migrations/20260202000002_create_sessions.sql

create table if not exists public.sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  subliminal_id uuid references public.subliminals(id) on delete set null,
  started_at timestamptz default now() not null,
  ended_at timestamptz,
  duration_seconds integer default 0,
  completed boolean default false,
  created_at timestamptz default now() not null
);

alter table public.sessions enable row level security;

create index idx_sessions_user_id on public.sessions(user_id);
create index idx_sessions_started_at on public.sessions(started_at);

-- Policies
create policy "Users can view own sessions"
  on public.sessions for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own sessions"
  on public.sessions for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own sessions"
  on public.sessions for update
  using ((select auth.uid()) = user_id);
```

### Pattern 3: Mindi State Persistence
**What:** Store evolution state (XP, glow level) per user
**When to use:** Persisting character progression
**Example:**
```sql
-- supabase/migrations/20260202000003_create_mindi_state.sql

create table if not exists public.mindi_state (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null unique,
  name text not null default 'Mindi',
  xp integer not null default 0,
  glow_level integer not null default 1,
  total_sessions integer not null default 0,
  total_minutes integer not null default 0,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

alter table public.mindi_state enable row level security;

-- Unique index (only one mindi_state per user)
create unique index idx_mindi_state_user_id on public.mindi_state(user_id);

-- Policies
create policy "Users can view own mindi state"
  on public.mindi_state for select
  using ((select auth.uid()) = user_id);

create policy "Users can insert own mindi state"
  on public.mindi_state for insert
  with check ((select auth.uid()) = user_id);

create policy "Users can update own mindi state"
  on public.mindi_state for update
  using ((select auth.uid()) = user_id);

-- Auto-create mindi_state on user signup via trigger
create or replace function create_mindi_state_for_new_user()
returns trigger as $$
begin
  insert into public.mindi_state (user_id)
  values (new.id);
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function create_mindi_state_for_new_user();
```

### Pattern 4: Streak Calculation Function (RPC)
**What:** Server-side streak calculation for consistency
**When to use:** Calculating consecutive days from sessions
**Example:**
```sql
-- supabase/migrations/20260202000004_create_streak_function.sql
-- Source: PostgreSQL streak calculation patterns

create or replace function get_user_streak(p_user_id uuid)
returns table (
  current_streak integer,
  longest_streak integer,
  last_session_date date
) as $$
with session_dates as (
  -- Get distinct dates when user completed sessions
  select distinct date_trunc('day', started_at)::date as session_date
  from public.sessions
  where user_id = p_user_id
    and completed = true
),
grouped as (
  -- Assign streak groups using the row_number trick
  select
    session_date,
    session_date - (row_number() over (order by session_date))::integer as grp
  from session_dates
),
streak_lengths as (
  select
    grp,
    count(*) as streak_length,
    max(session_date) as streak_end
  from grouped
  group by grp
)
select
  -- Current streak: streak that includes today or yesterday
  coalesce(
    (select streak_length::integer
     from streak_lengths
     where streak_end >= current_date - 1
     order by streak_end desc
     limit 1),
    0
  ) as current_streak,
  -- Longest streak ever
  coalesce((select max(streak_length)::integer from streak_lengths), 0) as longest_streak,
  -- Last session date
  (select max(session_date) from session_dates) as last_session_date;
$$ language sql security definer;

-- Grant execute to authenticated users
grant execute on function get_user_streak(uuid) to authenticated;
```

### Pattern 5: Realtime Subscription for Cross-Device Sync
**What:** Listen to database changes and update local state
**When to use:** Sync library across devices logged into same account
**Example:**
```typescript
// src/hooks/useSyncedLibrary.ts
// Source: Supabase Realtime documentation
import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase"
import type { Subliminal } from "@/stores/useMindiStore"

export function useSyncedLibrary(userId: string | null) {
  const [subliminals, setSubliminals] = useState<Subliminal[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    if (!userId) {
      setSubliminals([])
      setLoading(false)
      return
    }

    // Initial fetch
    const fetchSubliminals = async () => {
      try {
        const { data, error } = await supabase
          .from("subliminals")
          .select("*")
          .order("created_at", { ascending: false })

        if (error) throw error
        setSubliminals(data || [])
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchSubliminals()

    // Subscribe to realtime changes
    const channel = supabase
      .channel(`subliminals:user:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "subliminals",
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === "INSERT") {
            setSubliminals((prev) => [payload.new as Subliminal, ...prev])
          } else if (payload.eventType === "UPDATE") {
            setSubliminals((prev) =>
              prev.map((s) =>
                s.id === payload.new.id ? (payload.new as Subliminal) : s
              )
            )
          } else if (payload.eventType === "DELETE") {
            setSubliminals((prev) =>
              prev.filter((s) => s.id !== payload.old.id)
            )
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId])

  return { subliminals, loading, error }
}
```

### Pattern 6: Service Layer with Optimistic Updates
**What:** CRUD operations with local-first UI updates
**When to use:** All database write operations
**Example:**
```typescript
// src/services/subliminalService.ts
import { supabase } from "@/lib/supabase"

interface CreateSubliminalInput {
  title: string
  intention: string
  affirmations: string[]
  track: string
  audioUrl: string
}

export async function createSubliminal(input: CreateSubliminalInput) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("subliminals")
    .insert({
      user_id: user.id,
      title: input.title,
      intention: input.intention,
      affirmations: input.affirmations,
      track: input.track,
      audio_url: input.audioUrl,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteSubliminal(id: string) {
  const { error } = await supabase
    .from("subliminals")
    .delete()
    .eq("id", id)

  if (error) throw error
}

export async function getUserSubliminals() {
  const { data, error } = await supabase
    .from("subliminals")
    .select("*")
    .order("created_at", { ascending: false })

  if (error) throw error
  return data
}
```

### Pattern 7: Session Recording
**What:** Record listening sessions for streak calculation
**When to use:** Player start/stop events
**Example:**
```typescript
// src/services/sessionService.ts
import { supabase } from "@/lib/supabase"

let activeSessionId: string | null = null

export async function startSession(subliminalId: string) {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase
    .from("sessions")
    .insert({
      user_id: user.id,
      subliminal_id: subliminalId,
      started_at: new Date().toISOString(),
    })
    .select()
    .single()

  if (error) throw error
  activeSessionId = data.id
  return data
}

export async function endSession(completed: boolean, durationSeconds: number) {
  if (!activeSessionId) return

  const { error } = await supabase
    .from("sessions")
    .update({
      ended_at: new Date().toISOString(),
      duration_seconds: durationSeconds,
      completed,
    })
    .eq("id", activeSessionId)

  if (error) throw error
  activeSessionId = null
}

export async function getUserStreak() {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const { data, error } = await supabase.rpc("get_user_streak", {
    p_user_id: user.id,
  })

  if (error) throw error
  return data
}
```

### Anti-Patterns to Avoid
- **Disabling RLS or using service_role on client:** 83% of Supabase security issues are RLS misconfigurations; always enable RLS
- **Not indexing user_id columns:** RLS policies using `auth.uid() = user_id` become O(n) without index
- **Calculating streaks client-side:** Users can manipulate local time; server-side is authoritative
- **Using realtime without RLS:** Realtime respects RLS policies; without them, users see all data
- **Storing sessions without ended_at:** Orphaned sessions (app crash) need cleanup strategy
- **Syncing entire library on every change:** Use Realtime incremental updates, not full refetch

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Streak calculation | Client-side date math | PostgreSQL RPC function | Server is authoritative, handles timezone edge cases, prevents tampering |
| User data isolation | Manual user_id filtering | Supabase RLS policies | RLS is enforced at database level, can't be bypassed by client bugs |
| Cross-device sync | Polling or manual refresh | Supabase Realtime | WebSocket-based, instant updates, handles reconnection |
| Offline queue | Custom queue logic | For MVP: fail gracefully | Complex offline-first (PowerSync) is overkill for MVP |
| Schema versioning | Manual SQL files | Supabase CLI migrations | Timestamp-ordered, tracks applied migrations |
| UUID generation | Client-side UUID | Database gen_random_uuid() | Consistent, cryptographically secure |

**Key insight:** Supabase provides a complete backend-as-a-service. For MVP, leverage its built-in features (RLS, Realtime, RPC, migrations) rather than building custom solutions. Only add complexity (PowerSync, WatermelonDB) if offline-first becomes a validated user requirement.

## Common Pitfalls

### Pitfall 1: Forgetting to Enable RLS
**What goes wrong:** All users can see/modify all data; major security vulnerability
**Why it happens:** RLS is disabled by default when creating tables
**How to avoid:**
1. ALWAYS add `alter table enable row level security;` after creating tables
2. Create at least one policy per table per operation (SELECT, INSERT, UPDATE, DELETE)
3. Test by querying as different users
**Warning signs:** Any user can see other users' subliminals; data appears in dashboard for all users

### Pitfall 2: RLS Policy Performance Issues
**What goes wrong:** Slow queries, timeouts, especially with large datasets
**Why it happens:** Missing indexes on columns used in RLS policies
**How to avoid:**
1. Create index on `user_id` for every table with RLS
2. Wrap `auth.uid()` in `(select auth.uid())` to enable query caching
3. Avoid joins in RLS policies; use `IN` with subqueries instead
**Warning signs:** Queries taking >100ms, performance degrading as data grows

### Pitfall 3: Realtime Not Receiving Updates
**What goes wrong:** Changes don't appear on other devices
**Why it happens:** RLS blocks realtime events, or wrong filter syntax
**How to avoid:**
1. Ensure authenticated user has SELECT policy on table
2. Use correct filter syntax: `filter: 'user_id=eq.${userId}'`
3. Verify Realtime is enabled for table in Supabase dashboard
**Warning signs:** Initial fetch works but no updates; works in SQL Editor but not in app

### Pitfall 4: Orphaned Sessions from App Crashes
**What goes wrong:** Sessions without `ended_at` pollute streak calculations
**Why it happens:** App crashes or force-closes before calling endSession
**How to avoid:**
1. Add cleanup logic on app foreground: check for sessions >24h old without ended_at
2. Exclude incomplete sessions from streak calculations (use `completed = true`)
3. Consider session timeout (e.g., auto-complete after 2 hours)
**Warning signs:** Streak shows wrong values; sessions table grows with null ended_at

### Pitfall 5: Zustand Store Conflicts with Supabase
**What goes wrong:** Local store and remote database get out of sync
**Why it happens:** Both storing subliminals; no clear source of truth
**How to avoid:**
1. Make Supabase the source of truth for subliminals
2. Use Zustand only for local UI state (current creation, Mindi animation state)
3. Fetch from Supabase on app start; use Realtime for updates
**Warning signs:** Different subliminals on different devices; duplicates appearing

### Pitfall 6: Migration Order Dependencies
**What goes wrong:** Migrations fail because tables don't exist yet
**Why it happens:** Foreign key references table that's created in later migration
**How to avoid:**
1. Use timestamp-based naming (migrations run in order)
2. Create tables without foreign keys first, add constraints later
3. Test migrations locally with `supabase db reset`
**Warning signs:** "relation does not exist" errors, migrations fail on fresh database

## Code Examples

Verified patterns from official sources:

### Complete Subliminal Save Flow
```typescript
// src/services/subliminalService.ts
// Source: Supabase JavaScript documentation
import { supabase } from "@/lib/supabase"
import type { Subliminal } from "@/stores/useMindiStore"

export async function saveSubliminal(
  title: string,
  intention: string,
  affirmations: string[],
  track: string,
  audioUrl: string
): Promise<Subliminal> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Must be authenticated to save subliminals")

  const { data, error } = await supabase
    .from("subliminals")
    .insert({
      user_id: user.id,
      title,
      intention,
      affirmations,
      track,
      audio_url: audioUrl,
    })
    .select()
    .single()

  if (error) {
    console.error("Failed to save subliminal:", error)
    throw new Error(`Failed to save subliminal: ${error.message}`)
  }

  // Transform to app's Subliminal type
  return {
    id: data.id,
    title: data.title,
    intention: data.intention,
    affirmations: data.affirmations,
    track: data.track,
    audioUrl: data.audio_url,
    createdAt: data.created_at,
  }
}
```

### Mindi State Sync
```typescript
// src/services/mindiService.ts
// Source: Supabase upsert documentation
import { supabase } from "@/lib/supabase"

interface MindiState {
  name: string
  xp: number
  glowLevel: number
  totalSessions: number
  totalMinutes: number
}

export async function getMindiState(): Promise<MindiState | null> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from("mindi_state")
    .select("*")
    .eq("user_id", user.id)
    .single()

  if (error) {
    // May not exist yet for new users (trigger should create it)
    if (error.code === "PGRST116") return null
    throw error
  }

  return {
    name: data.name,
    xp: data.xp,
    glowLevel: data.glow_level,
    totalSessions: data.total_sessions,
    totalMinutes: data.total_minutes,
  }
}

export async function updateMindiState(
  updates: Partial<Omit<MindiState, "name">>
): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Not authenticated")

  const dbUpdates: Record<string, unknown> = {}
  if (updates.xp !== undefined) dbUpdates.xp = updates.xp
  if (updates.glowLevel !== undefined) dbUpdates.glow_level = updates.glowLevel
  if (updates.totalSessions !== undefined) dbUpdates.total_sessions = updates.totalSessions
  if (updates.totalMinutes !== undefined) dbUpdates.total_minutes = updates.totalMinutes

  const { error } = await supabase
    .from("mindi_state")
    .update(dbUpdates)
    .eq("user_id", user.id)

  if (error) throw error
}

export async function addSessionXP(durationMinutes: number): Promise<void> {
  // XP formula: 10 XP base + 1 XP per minute
  const xpGained = 10 + durationMinutes

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  // Use RPC for atomic increment
  const { error } = await supabase.rpc("add_session_xp", {
    p_user_id: user.id,
    p_xp: xpGained,
    p_minutes: durationMinutes,
  })

  if (error) {
    console.error("Failed to add XP:", error)
  }
}
```

### Atomic XP Increment Function
```sql
-- supabase/migrations/20260202000005_add_xp_function.sql
create or replace function add_session_xp(
  p_user_id uuid,
  p_xp integer,
  p_minutes integer
)
returns void as $$
begin
  update public.mindi_state
  set
    xp = xp + p_xp,
    total_sessions = total_sessions + 1,
    total_minutes = total_minutes + p_minutes,
    glow_level = case
      when xp + p_xp >= 1000 then 5
      when xp + p_xp >= 500 then 4
      when xp + p_xp >= 200 then 3
      when xp + p_xp >= 50 then 2
      else 1
    end,
    updated_at = now()
  where user_id = p_user_id;
end;
$$ language plpgsql security definer;

grant execute on function add_session_xp(uuid, integer, integer) to authenticated;
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Client-side user filtering | RLS policies | Always best practice | Security - can't be bypassed |
| Polling for updates | Realtime subscriptions | Supabase 2.x | Instant cross-device sync |
| Manual SQL files | Supabase CLI migrations | 2024+ | Version-controlled schema |
| Storing locally, syncing manually | Supabase as source of truth | Current pattern | Simpler architecture |
| Complex offline-first | Remote-primary with cache | For MVPs | Appropriate complexity |

**Deprecated/outdated:**
- **AsyncStorage for subliminals:** Use Supabase as source of truth; AsyncStorage only for UI state
- **X-User-ID headers:** Now using JWT auth.uid() from Supabase tokens
- **Manual streak counting:** Use PostgreSQL RPC functions for consistency

## Open Questions

Things that couldn't be fully resolved:

1. **Offline Session Recording**
   - What we know: Sessions need to be recorded even if offline temporarily
   - What's unclear: How long to queue failed session inserts; retry strategy
   - Recommendation: For MVP, fail gracefully with local fallback; add retry queue if users report issues

2. **Mindi State Creation Timing**
   - What we know: Trigger creates mindi_state on user signup
   - What's unclear: Does trigger fire for existing users who signed up before migration?
   - Recommendation: Add migration to backfill existing users; handle missing state gracefully in app

3. **Subliminal Audio Storage**
   - What we know: Audio URLs currently point to local backend
   - What's unclear: Will audio be on Supabase Storage or Cloudflare R2?
   - Recommendation: This is Phase 4 concern; for now, store whatever URL is generated

4. **Realtime Message Limits**
   - What we know: Supabase free tier has message quotas
   - What's unclear: Will subliminal CRUD exceed free tier limits?
   - Recommendation: Monitor usage; Realtime is cheap ($2.50/million messages) if exceeded

## Sources

### Primary (HIGH confidence)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/database/postgres/row-level-security) - Policy syntax, auth.uid(), performance tips
- [Supabase Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) - Subscription patterns, filtering
- [Supabase Database Functions](https://supabase.com/docs/guides/database/functions) - RPC creation and usage
- [Supabase Database Migrations](https://supabase.com/docs/guides/deployment/database-migrations) - CLI commands, file naming
- [Supabase RLS Performance Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv) - Indexing, query optimization

### Secondary (MEDIUM confidence)
- [PostgreSQL Streak Calculation Patterns](https://www.petergundel.de/postgresql/2023/04/23/streak-calculation-in-postgresql.html) - Row number trick for consecutive days
- [Supabase Streak Discussion](https://github.com/orgs/supabase/discussions/28462) - Community patterns for streak calculation
- [PowerSync + Supabase Guide](https://ignitecookbook.com/docs/recipes/LocalFirstDataWithPowerSync/) - Offline-first alternative (deferred for MVP)
- [Zustand Persist Documentation](https://zustand.docs.pmnd.rs/integrations/persisting-store-data) - Hydration handling

### Tertiary (LOW confidence - requires validation)
- [Simple Audit Trail for Supabase](https://medium.com/@harish.siri/simpe-audit-trail-for-supabase-database-efefcce622ff) - Trigger-based logging pattern
- [DEV.to SQL Streaks Article](https://dev.to/keyridan/sql-story-of-unbroken-chains-of-events-streaks-3lh3) - Alternative streak algorithms

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Using established Supabase patterns, no new libraries needed
- Architecture: HIGH - Patterns from official documentation and verified community recipes
- Pitfalls: HIGH - RLS issues are well-documented; performance patterns from Supabase docs
- Streak calculation: MEDIUM - Multiple valid approaches; chosen pattern is common but test thoroughly

**Research date:** 2026-02-02
**Valid until:** 2026-03-04 (30 days - Supabase patterns are stable; RLS best practices unlikely to change)

**Key findings:**
1. RLS must be enabled on EVERY table - this is non-negotiable for security
2. Index all user_id columns for RLS performance
3. Wrap auth.uid() in SELECT for query plan optimization: `(select auth.uid())`
4. Use PostgreSQL RPC functions for streak calculations - server-side is authoritative
5. Supabase Realtime handles cross-device sync; no need for polling
6. For MVP, remote-primary pattern is sufficient; defer PowerSync/WatermelonDB complexity
7. Migration files should be timestamp-named and committed to git
8. Create mindi_state via trigger on user signup for consistency
