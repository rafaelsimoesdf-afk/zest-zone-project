-- Drop existing policies and recreate with correct syntax
DROP POLICY IF EXISTS "Allow anonymous selfie uploads via session token" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous selfie updates via session token" ON storage.objects;

-- Recreate INSERT policy with correct check
CREATE POLICY "Allow anonymous selfie uploads via session token"
ON storage.objects
FOR INSERT
TO anon, public
WITH CHECK (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.selfie_upload_sessions
    WHERE user_id::text = (storage.foldername(name))[1]
    AND status = 'pending'
    AND expires_at > now()
  )
);

-- Recreate UPDATE policy with both USING and WITH CHECK
CREATE POLICY "Allow anonymous selfie updates via session token"
ON storage.objects
FOR UPDATE
TO anon, public
USING (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.selfie_upload_sessions
    WHERE user_id::text = (storage.foldername(name))[1]
    AND status = 'pending'
    AND expires_at > now()
  )
)
WITH CHECK (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.selfie_upload_sessions
    WHERE user_id::text = (storage.foldername(name))[1]
    AND status = 'pending'
    AND expires_at > now()
  )
);