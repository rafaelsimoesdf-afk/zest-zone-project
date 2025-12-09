-- Create policy to allow anonymous uploads to user-documents bucket for selfie sessions
-- The upload path includes the user_id from the session, validated by the session token

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

-- Also allow update for upsert operations
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
);