-- Migration: Create subliminals table
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
