-- Add public read policy for user-documents bucket since it's now public
CREATE POLICY "Public can view user documents" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'user-documents');