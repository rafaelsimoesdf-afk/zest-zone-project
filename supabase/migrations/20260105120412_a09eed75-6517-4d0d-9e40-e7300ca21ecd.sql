-- Allow booking participants to see each other's profiles
-- This is needed so owners can see customer data and vice versa
CREATE POLICY "Booking participants can view each other's profiles"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE (
      (bookings.owner_id = auth.uid() AND bookings.customer_id = profiles.id)
      OR
      (bookings.customer_id = auth.uid() AND bookings.owner_id = profiles.id)
    )
  )
);