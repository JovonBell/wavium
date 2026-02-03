-- =============================================================================
-- WAVIUM DATABASE MIGRATIONS - COMBINED FOR SUPABASE SQL EDITOR
-- =============================================================================
-- Generated: 2026-02-03
-- Contains all 5 migration files in order
--
-- Instructions:
-- 1. Open Supabase Dashboard
-- 2. Go to SQL Editor
-- 3. Paste this entire file
-- 4. Click "Run" to execute
-- 5. Verify no errors in the output
-- =============================================================================

-- =============================================================================
-- MIGRATION 1: CREATE SUBLIMINALS TABLE (20260202000001)
-- =============================================================================
-- Purpose: Store user-created subliminal audio configurations
-- Dependencies: auth.users (Supabase Auth)

-- Create subliminals table
CREATE TABLE public.subliminals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  intention TEXT NOT NULL,
  affirmations TEXT[] NOT NULL,
  track TEXT NOT NULL,
  audio_url TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on user_id for RLS performance
CREATE INDEX idx_subliminals_user_id ON public.subliminals(user_id);

-- Enable Row Level Security (CRITICAL for multi-tenant isolation)
ALTER TABLE public.subliminals ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Using (select auth.uid()) for query plan optimization per Supabase best practices

-- SELECT: Users can only read their own subliminals
CREATE POLICY "Users can view own subliminals"
  ON public.subliminals
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- INSERT: Users can only create subliminals for themselves
CREATE POLICY "Users can create own subliminals"
  ON public.subliminals
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own subliminals
CREATE POLICY "Users can update own subliminals"
  ON public.subliminals
  FOR UPDATE
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- DELETE: Users can only delete their own subliminals
CREATE POLICY "Users can delete own subliminals"
  ON public.subliminals
  FOR DELETE
  USING ((select auth.uid()) = user_id);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER subliminals_updated_at
  BEFORE UPDATE ON public.subliminals
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions to authenticated users
GRANT ALL ON public.subliminals TO authenticated;


-- =============================================================================
-- MIGRATION 2: CREATE SESSIONS TABLE (20260202000002)
-- =============================================================================
-- Purpose: Track listening history and session data for streak/progress features
-- Dependencies: auth.users (Supabase Auth), subliminals table

-- Create sessions table for tracking listening history
CREATE TABLE public.sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subliminal_id UUID REFERENCES public.subliminals(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  duration_seconds INTEGER DEFAULT 0,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create index on user_id for RLS performance
CREATE INDEX idx_sessions_user_id ON public.sessions(user_id);

-- Create index on started_at for streak queries
CREATE INDEX idx_sessions_started_at ON public.sessions(started_at);

-- Enable Row Level Security
ALTER TABLE public.sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Using (select auth.uid()) for query plan optimization per Supabase best practices
-- No DELETE policy - sessions are historical records that should not be deleted

-- SELECT: Users can only read their own sessions
CREATE POLICY "Users can view own sessions"
  ON public.sessions
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- INSERT: Users can only create sessions for themselves
CREATE POLICY "Users can create own sessions"
  ON public.sessions
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own sessions (e.g., set ended_at, completed)
CREATE POLICY "Users can update own sessions"
  ON public.sessions
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Grant permissions to authenticated users
GRANT ALL ON public.sessions TO authenticated;


-- =============================================================================
-- MIGRATION 3: CREATE MINDI_STATE TABLE (20260202000003)
-- =============================================================================
-- Purpose: Store Mindi character progression (XP, glow level, stats)
-- Dependencies: auth.users (Supabase Auth)

-- Create mindi_state table for character progression
CREATE TABLE public.mindi_state (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL DEFAULT 'Mindi',
  xp INTEGER NOT NULL DEFAULT 0,
  glow_level INTEGER NOT NULL DEFAULT 1,
  total_sessions INTEGER NOT NULL DEFAULT 0,
  total_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create unique index on user_id (only one mindi_state per user)
CREATE UNIQUE INDEX idx_mindi_state_user_id ON public.mindi_state(user_id);

-- Enable Row Level Security
ALTER TABLE public.mindi_state ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Note: Using (select auth.uid()) for query plan optimization per Supabase best practices
-- No DELETE policy - mindi_state is permanent

-- SELECT: Users can only read their own mindi_state
CREATE POLICY "Users can view own mindi_state"
  ON public.mindi_state
  FOR SELECT
  USING ((select auth.uid()) = user_id);

-- INSERT: Users can only create mindi_state for themselves
CREATE POLICY "Users can create own mindi_state"
  ON public.mindi_state
  FOR INSERT
  WITH CHECK ((select auth.uid()) = user_id);

-- UPDATE: Users can only update their own mindi_state
CREATE POLICY "Users can update own mindi_state"
  ON public.mindi_state
  FOR UPDATE
  USING ((select auth.uid()) = user_id);

-- Trigger function to auto-create mindi_state for new users
-- Uses SECURITY DEFINER to bypass RLS during trigger execution
CREATE OR REPLACE FUNCTION public.create_mindi_state_for_new_user()
RETURNS TRIGGER
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.mindi_state (user_id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger that fires after new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.create_mindi_state_for_new_user();

-- Reuse handle_updated_at function from subliminals migration
-- Create trigger to auto-update updated_at
CREATE TRIGGER mindi_state_updated_at
  BEFORE UPDATE ON public.mindi_state
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Grant permissions to authenticated users
GRANT ALL ON public.mindi_state TO authenticated;


-- =============================================================================
-- MIGRATION 4: CREATE GET_USER_STREAK FUNCTION (20260202000004)
-- =============================================================================
-- Purpose: Calculate user's current and longest listening streaks server-side
-- Note: SECURITY DEFINER ensures consistent execution regardless of caller's role

-- Drop function if exists (for idempotent migrations)
DROP FUNCTION IF EXISTS get_user_streak(UUID);

/**
 * get_user_streak - Calculate user's listening streak
 *
 * Uses CTE pattern with row_number trick to identify consecutive date groups:
 * - session_date - row_number gives same value for consecutive dates
 * - This allows grouping consecutive days into streak periods
 *
 * Returns:
 * - current_streak: Active streak (includes today or yesterday)
 * - longest_streak: Maximum streak ever achieved
 * - last_session_date: Most recent completed session date
 */
CREATE OR REPLACE FUNCTION get_user_streak(p_user_id UUID)
RETURNS TABLE (
  current_streak INTEGER,
  longest_streak INTEGER,
  last_session_date DATE
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current_streak INTEGER := 0;
  v_longest_streak INTEGER := 0;
  v_last_session DATE;
BEGIN
  -- Get all unique session dates for completed sessions
  WITH session_dates AS (
    SELECT DISTINCT date_trunc('day', started_at)::date AS session_date
    FROM sessions
    WHERE user_id = p_user_id
      AND completed = true
    ORDER BY session_date
  ),
  -- Assign streak groups: consecutive dates will have same group value
  -- (session_date - row_number gives constant for consecutive dates)
  grouped AS (
    SELECT
      session_date,
      session_date - (ROW_NUMBER() OVER (ORDER BY session_date))::integer AS grp
    FROM session_dates
  ),
  -- Calculate length of each streak period
  streak_lengths AS (
    SELECT
      grp,
      COUNT(*)::integer AS streak_length,
      MIN(session_date) AS streak_start,
      MAX(session_date) AS streak_end
    FROM grouped
    GROUP BY grp
  )
  SELECT
    -- Current streak: must include today or yesterday to be "active"
    COALESCE(
      (SELECT streak_length
       FROM streak_lengths
       WHERE streak_end >= CURRENT_DATE - 1
       ORDER BY streak_end DESC
       LIMIT 1
      ),
      0
    ),
    -- Longest streak ever
    COALESCE((SELECT MAX(streak_length) FROM streak_lengths), 0),
    -- Most recent session date
    (SELECT MAX(session_date) FROM session_dates)
  INTO v_current_streak, v_longest_streak, v_last_session;

  RETURN QUERY SELECT v_current_streak, v_longest_streak, v_last_session;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_streak(UUID) TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION get_user_streak(UUID) IS
  'Calculate user listening streak. Returns current_streak (active if includes today/yesterday), longest_streak, and last_session_date.';


-- =============================================================================
-- MIGRATION 5: CREATE ADD_SESSION_XP FUNCTION (20260202000005)
-- =============================================================================
-- Purpose: Atomically update user XP, session count, and glow level after completing a session
-- Note: SECURITY DEFINER ensures consistent execution regardless of caller's role

-- Drop function if exists (for idempotent migrations)
DROP FUNCTION IF EXISTS add_session_xp(UUID, INTEGER, INTEGER);

/**
 * add_session_xp - Award XP and update user stats after session completion
 *
 * Updates mindi_state atomically:
 * - Adds XP to total
 * - Increments session count
 * - Adds minutes listened
 * - Recalculates glow_level based on total XP thresholds
 *
 * Glow levels (Mindi's visual evolution):
 * - Level 1: 0-49 XP (default)
 * - Level 2: 50-199 XP
 * - Level 3: 200-499 XP
 * - Level 4: 500-999 XP
 * - Level 5: 1000+ XP (max)
 *
 * Parameters:
 * - p_user_id: User's UUID
 * - p_xp: XP to award for this session
 * - p_minutes: Minutes listened in this session
 */
CREATE OR REPLACE FUNCTION add_session_xp(
  p_user_id UUID,
  p_xp INTEGER,
  p_minutes INTEGER
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_xp INTEGER;
  v_new_glow_level INTEGER;
BEGIN
  -- Update stats and calculate new totals
  UPDATE mindi_state
  SET
    xp = xp + p_xp,
    total_sessions = total_sessions + 1,
    total_minutes = total_minutes + p_minutes,
    updated_at = now()
  WHERE user_id = p_user_id
  RETURNING xp INTO v_new_xp;

  -- If no row was updated, user doesn't have mindi_state (shouldn't happen with trigger)
  IF NOT FOUND THEN
    RAISE EXCEPTION 'User % does not have mindi_state record', p_user_id;
  END IF;

  -- Calculate new glow level based on total XP thresholds
  v_new_glow_level := CASE
    WHEN v_new_xp >= 1000 THEN 5
    WHEN v_new_xp >= 500 THEN 4
    WHEN v_new_xp >= 200 THEN 3
    WHEN v_new_xp >= 50 THEN 2
    ELSE 1
  END;

  -- Update glow level if changed
  UPDATE mindi_state
  SET glow_level = v_new_glow_level
  WHERE user_id = p_user_id
    AND glow_level != v_new_glow_level;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION add_session_xp(UUID, INTEGER, INTEGER) TO authenticated;

-- Add function comment for documentation
COMMENT ON FUNCTION add_session_xp(UUID, INTEGER, INTEGER) IS
  'Award XP after session completion. Updates xp, total_sessions, total_minutes, and recalculates glow_level based on XP thresholds.';


-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- Tables created:
--   - subliminals (user audio configurations)
--   - sessions (listening history)
--   - mindi_state (character progression)
--
-- Functions created:
--   - handle_updated_at() - auto-update timestamps
--   - create_mindi_state_for_new_user() - auto-create mindi state on signup
--   - get_user_streak(UUID) - calculate listening streaks
--   - add_session_xp(UUID, INTEGER, INTEGER) - award XP after sessions
--
-- RLS enabled on all tables with user-isolation policies
-- =============================================================================
