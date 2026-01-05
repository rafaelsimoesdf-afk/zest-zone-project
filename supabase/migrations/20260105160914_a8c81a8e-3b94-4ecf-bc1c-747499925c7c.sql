-- Add action_url column to notifications table for clickable notifications
ALTER TABLE public.notifications 
ADD COLUMN action_url text;

-- Add comment for documentation
COMMENT ON COLUMN public.notifications.action_url IS 'URL to navigate when user clicks the notification';