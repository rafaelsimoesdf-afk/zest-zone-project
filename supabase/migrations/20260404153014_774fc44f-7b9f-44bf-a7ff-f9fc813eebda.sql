CREATE OR REPLACE FUNCTION public.get_didit_session_status(_user_id uuid)
RETURNS TABLE(status text, session_url text)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  RETURN QUERY
  SELECT d.status, d.session_url
  FROM public.didit_verification_sessions d
  WHERE d.user_id = _user_id
  ORDER BY d.created_at DESC
  LIMIT 1;
END;
$$;