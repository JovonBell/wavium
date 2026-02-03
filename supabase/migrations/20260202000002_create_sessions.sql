-- Migration: Create sessions table
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
