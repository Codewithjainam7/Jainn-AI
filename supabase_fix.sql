-- 1. Fix USERS table
-- The app expects 'display_name' and 'avatar_url' which are missing in your schema
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- 2. Fix CHAT_SESSIONS table
-- The app uses string IDs like 'session_123456789', so we must change id from UUID to TEXT
ALTER TABLE public.chat_sessions ALTER COLUMN id TYPE TEXT;

-- Remove constraint on mode if it exists, to prevent errors with new modes in the future
ALTER TABLE public.chat_sessions DROP CONSTRAINT IF EXISTS chat_sessions_mode_check;

-- Ensure RLS is enabled (idempotent)
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Note: Policies already exist, so we don't recreate them to avoid error 42710
