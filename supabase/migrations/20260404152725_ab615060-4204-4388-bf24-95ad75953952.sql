CREATE TABLE public.didit_verification_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  session_id text NOT NULL UNIQUE,
  session_token text,
  session_url text,
  workflow_id text,
  status text NOT NULL DEFAULT 'Not Started',
  decision jsonb,
  vendor_data text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_didit_sessions_user_id ON public.didit_verification_sessions(user_id);
CREATE INDEX idx_didit_sessions_session_id ON public.didit_verification_sessions(session_id);

CREATE TRIGGER update_didit_sessions_updated_at
  BEFORE UPDATE ON public.didit_verification_sessions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.didit_verification_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own verification sessions"
  ON public.didit_verification_sessions FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage verification sessions"
  ON public.didit_verification_sessions FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);