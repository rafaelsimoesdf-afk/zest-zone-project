-- Add digital_image_url column to cnh_details table
ALTER TABLE public.cnh_details 
ADD COLUMN IF NOT EXISTS digital_image_url text;