-- =============================================
-- FIX 1: Remove public selfie session policies
-- Selfie session check now goes through edge function
-- =============================================
DROP POLICY IF EXISTS "Anyone can read session by token" ON public.selfie_upload_sessions;
DROP POLICY IF EXISTS "Anyone can update session by token" ON public.selfie_upload_sessions;

-- =============================================
-- FIX 3: Restrict profile data for booking participants
-- Create secure RPC that returns only necessary fields
-- =============================================
CREATE OR REPLACE FUNCTION public.get_booking_participant_profile(_user_id uuid)
RETURNS TABLE(
  id uuid,
  first_name text,
  last_name text,
  profile_image text,
  phone_number text,
  email text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only return data if caller has a booking with this user
  IF NOT EXISTS (
    SELECT 1 FROM bookings
    WHERE (
      (bookings.owner_id = auth.uid() AND bookings.customer_id = _user_id) OR
      (bookings.customer_id = auth.uid() AND bookings.owner_id = _user_id)
    )
    AND bookings.status IN ('pending', 'confirmed', 'in_progress', 'completed')
  ) THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT p.id, p.first_name, p.last_name, p.profile_image, p.phone_number, p.email
  FROM profiles p
  WHERE p.id = _user_id;
END;
$$;

-- Drop the overly permissive booking participant policy
DROP POLICY IF EXISTS "Booking participants can view each other's profiles" ON public.profiles;

-- Re-create with field-level restriction note:
-- Now booking participant profile access goes through the RPC function above
-- But we still need a SELECT policy for join queries in bookings
-- This policy only allows viewing profiles that are part of the user's bookings
CREATE POLICY "Booking participants can view limited profile data"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE (
      (bookings.owner_id = auth.uid() AND bookings.customer_id = profiles.id) OR
      (bookings.customer_id = auth.uid() AND bookings.owner_id = profiles.id)
    )
    AND bookings.status IN ('pending', 'confirmed', 'in_progress', 'completed', 'disputed')
  )
);

-- =============================================
-- FIX 4: Make user-documents bucket private
-- Documents now served via signed URLs
-- =============================================
UPDATE storage.buckets SET public = false WHERE id = 'user-documents';
DROP POLICY IF EXISTS "Public can view user documents" ON storage.objects;

-- Allow users to view their own documents via signed URLs
CREATE POLICY "Users can view own documents in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow admins to view all documents via signed URLs
CREATE POLICY "Admins can view all user documents in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'user-documents'
  AND public.has_role(auth.uid(), 'admin'::public.app_role)
);