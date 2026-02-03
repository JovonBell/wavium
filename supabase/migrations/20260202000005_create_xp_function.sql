-- Migration: Create add_session_xp RPC function
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
