-- Create table for selfie upload sessions
CREATE TABLE public.selfie_upload_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_token TEXT NOT NULL UNIQUE,
  selfie_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'expired')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (now() + interval '15 minutes'),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS
ALTER TABLE public.selfie_upload_sessions ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view and create their own sessions
CREATE POLICY "Users can manage their own selfie sessions"
ON public.selfie_upload_sessions
FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Policy: Anyone can update a session by token (for mobile upload)
CREATE POLICY "Anyone can update session by token"
ON public.selfie_upload_sessions
FOR UPDATE
USING (true)
WITH CHECK (true);

-- Policy: Anyone can read session by token (for mobile page)
CREATE POLICY "Anyone can read session by token"
ON public.selfie_upload_sessions
FOR SELECT
USING (true);

-- Enable realtime for this table
ALTER PUBLICATION supabase_realtime ADD TABLE public.selfie_upload_sessions;