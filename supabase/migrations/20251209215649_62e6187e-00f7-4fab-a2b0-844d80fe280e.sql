-- Update user-documents bucket to be public so admins can view documents
UPDATE storage.buckets SET public = true WHERE id = 'user-documents';