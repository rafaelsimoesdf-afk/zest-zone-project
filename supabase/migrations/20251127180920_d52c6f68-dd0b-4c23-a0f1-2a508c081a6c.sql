-- Function to add admin role to a user by email
CREATE OR REPLACE FUNCTION public.add_admin_role_by_email(_email text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id uuid;
BEGIN
  -- Get user_id from profiles table by email
  SELECT id INTO _user_id FROM public.profiles WHERE email = _email;
  
  IF _user_id IS NULL THEN
    RAISE EXCEPTION 'User with email % not found', _email;
  END IF;
  
  -- Insert admin role if it doesn't exist
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_user_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;
END;
$$;

-- Add admin role to the specified email
-- Note: User must sign up first before running this
DO $$
BEGIN
  -- Check if user exists before adding admin role
  IF EXISTS (SELECT 1 FROM public.profiles WHERE email = 'rafaelsimoes.df@gmail.com') THEN
    PERFORM public.add_admin_role_by_email('rafaelsimoes.df@gmail.com');
  END IF;
END $$;

-- Create RLS policy to allow admins to manage user roles
CREATE POLICY "Admins can insert roles"
ON public.user_roles
FOR INSERT
TO authenticated
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Admins can delete roles"
ON public.user_roles
FOR DELETE
TO authenticated
USING (
  has_role(auth.uid(), 'admin'::app_role)
);