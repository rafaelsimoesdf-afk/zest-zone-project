
-- 1. PROFILES: replace broad participant policy with restricted column access via existing function
DROP POLICY IF EXISTS "Booking participants can view limited profile data" ON public.profiles;

-- 2. RENTAL CONTRACTS: restrict insert/update to service_role
DROP POLICY IF EXISTS "System can insert contracts" ON public.rental_contracts;
DROP POLICY IF EXISTS "System can update contracts" ON public.rental_contracts;

CREATE POLICY "Service role can insert contracts"
ON public.rental_contracts FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update contracts"
ON public.rental_contracts FOR UPDATE TO service_role
USING (true) WITH CHECK (true);

-- 3. CONTRACT SIGNATURES: restrict insert/update to service_role
DROP POLICY IF EXISTS "System can insert signatures" ON public.contract_signatures;
DROP POLICY IF EXISTS "System can update signatures" ON public.contract_signatures;

CREATE POLICY "Service role can insert signatures"
ON public.contract_signatures FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Service role can update signatures"
ON public.contract_signatures FOR UPDATE TO service_role
USING (true) WITH CHECK (true);

-- 4. NOTIFICATIONS: restrict insert (service_role, or self-notifications)
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

CREATE POLICY "Service role can insert notifications"
ON public.notifications FOR INSERT TO service_role
WITH CHECK (true);

CREATE POLICY "Users can insert their own notifications"
ON public.notifications FOR INSERT TO authenticated
WITH CHECK (auth.uid() = user_id);

-- 5. TICKET AUDIT LOG: restrict insert to service_role
DROP POLICY IF EXISTS "System can insert audit logs" ON public.ticket_audit_log;

CREATE POLICY "Service role can insert audit logs"
ON public.ticket_audit_log FOR INSERT TO service_role
WITH CHECK (true);

-- 6. STORAGE: inspection-photos — restrict view to booking participants/admins
DROP POLICY IF EXISTS "Users can view inspection photos" ON storage.objects;

CREATE POLICY "Booking participants can view inspection photos"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'inspection-photos'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id::text = (storage.foldername(name))[1]
        AND (b.customer_id = auth.uid() OR b.owner_id = auth.uid())
    )
  )
);

-- Tighten upload policy to participants only
DROP POLICY IF EXISTS "Users can upload inspection photos" ON storage.objects;

CREATE POLICY "Booking participants can upload inspection photos"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'inspection-photos'
  AND EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id::text = (storage.foldername(name))[1]
      AND (b.customer_id = auth.uid() OR b.owner_id = auth.uid())
  )
);

-- 7. STORAGE: ticket-attachments — restrict view & upload to ticket owner/admins
DROP POLICY IF EXISTS "Users can view their ticket attachments" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload ticket attachments" ON storage.objects;

CREATE POLICY "Ticket owners and admins can view ticket attachments"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ticket-attachments'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id::text = (storage.foldername(name))[1]
        AND t.user_id = auth.uid()
    )
  )
);

CREATE POLICY "Ticket owners and admins can upload ticket attachments"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ticket-attachments'
  AND (
    has_role(auth.uid(), 'admin'::app_role)
    OR EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id::text = (storage.foldername(name))[1]
        AND t.user_id = auth.uid()
    )
  )
);

-- 8. STORAGE: vehicle-images — enforce ownership on upload
DROP POLICY IF EXISTS "Authenticated users can upload vehicle images" ON storage.objects;

CREATE POLICY "Users can upload vehicle images to their own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'vehicle-images'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- 9. Revoke public execute on admin-only function
REVOKE EXECUTE ON FUNCTION public.add_admin_role_by_email(text) FROM PUBLIC, anon, authenticated;
