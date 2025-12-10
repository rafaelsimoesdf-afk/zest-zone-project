-- Add vehicle document URL column to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS document_url text,
ADD COLUMN IF NOT EXISTS document_verified boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS document_verified_at timestamp with time zone;