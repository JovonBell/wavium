-- Migration: Create get_user_streak RPC function
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
