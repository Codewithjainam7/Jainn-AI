-- Create chat_sessions table
CREATE TABLE IF NOT EXISTS public.chat_sessions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    mode TEXT NOT NULL,
    messages TEXT NOT NULL, -- JSON string
    last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index on user_id for faster queries
CREATE INDEX IF NOT EXISTS idx_chat_sessions_user_id 
ON public.chat_sessions(user_id);

-- Create index on last_updated for ordering
CREATE INDEX IF NOT EXISTS idx_chat_sessions_last_updated 
ON public.chat_sessions(last_updated DESC);

-- Enable Row Level Security
ALTER TABLE public.chat_sessions ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to only access their own chat sessions
CREATE POLICY "Users can view their own chat sessions" 
ON public.chat_sessions
FOR SELECT
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can insert their own chat sessions" 
ON public.chat_sessions
FOR INSERT
WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "Users can update their own chat sessions" 
ON public.chat_sessions
FOR UPDATE
USING (auth.uid()::text = user_id);

CREATE POLICY "Users can delete their own chat sessions" 
ON public.chat_sessions
FOR DELETE
USING (auth.uid()::text = user_id);

-- Add comment
COMMENT ON TABLE public.chat_sessions IS 'Stores chat session history for Jainn AI users';
