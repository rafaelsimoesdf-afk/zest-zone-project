-- Allow authenticated users to insert notifications (for message notifications)
CREATE POLICY "System can insert notifications"
  ON public.notifications
  FOR INSERT
  WITH CHECK (true);