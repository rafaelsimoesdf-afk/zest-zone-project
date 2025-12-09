-- Drop and recreate policies with explicit anon role
DROP POLICY IF EXISTS "Allow anonymous selfie uploads via session token" ON storage.objects;
DROP POLICY IF EXISTS "Allow anonymous selfie updates via session token" ON storage.objects;

-- Recreate INSERT policy for anon role specifically
CREATE POLICY "Allow anonymous selfie uploads via session token"
ON storage.objects
FOR INSERT
TO anon
WITH CHECK (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.selfie_upload_sessions
    WHERE user_id::text = (storage.foldername(name))[1]
    AND status = 'pending'
    AND expires_at > now()
  )
);

-- Create separate policy for public role
CREATE POLICY "Allow public selfie uploads via session token"
ON storage.objects
FOR INSERT
TO public
WITH CHECK (
  bucket_id = 'user-documents' AND
  EXISTS (
    SELECT 1 FROM public.selfie_upload_sessions
    WHERE user_id::text = (storage.foldername(name))[1]
    AND status = 'pending'
    AND expires_at > now()
  )
);

-- Recreate UPDATE policy for anon role
CREATE POLICY "Allow anonymous selfie updates via session token"
ON storage.objects
FOR UPDATE
TO anon
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

-- Create separate UPDATE policy for public role
CREATE POLICY "Allow public selfie updates via session token"
ON storage.objects
FOR UPDATE
TO public
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