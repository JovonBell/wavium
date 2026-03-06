-- Voice Profiles table for voice clone metadata
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard → SQL Editor)

CREATE TABLE IF NOT EXISTS voice_profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id TEXT NOT NULL,
    voice_id TEXT NOT NULL,
    name TEXT DEFAULT 'My Voice',
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE (user_id)
);

-- Index for fast lookups by user_id
CREATE INDEX IF NOT EXISTS idx_voice_profiles_user_id ON voice_profiles (user_id);

-- Enable RLS (Row Level Security) but allow service_role full access
ALTER TABLE voice_profiles ENABLE ROW LEVEL SECURITY;

-- Service role can do everything (backend uses service_role key)
CREATE POLICY "Service role full access" ON voice_profiles
    FOR ALL
    USING (true)
    WITH CHECK (true);

-- Create the voice-clones storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('voice-clones', 'voice-clones', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policy: service role can upload/download/delete
CREATE POLICY "Service role storage access" ON storage.objects
    FOR ALL
    USING (bucket_id = 'voice-clones')
    WITH CHECK (bucket_id = 'voice-clones');
