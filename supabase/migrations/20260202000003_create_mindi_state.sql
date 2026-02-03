-- Migration: Create mindi_state table with auto-creation trigger
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
