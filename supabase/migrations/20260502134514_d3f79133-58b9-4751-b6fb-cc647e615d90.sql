
CREATE OR REPLACE FUNCTION public.notify_booking_participant(
  _booking_id uuid,
  _receiver_id uuid,
  _title text,
  _message text,
  _notification_type notification_type
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_notification_id uuid;
BEGIN
  IF v_caller IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  -- Validate inputs
  IF _title IS NULL OR length(trim(_title)) = 0 OR length(_title) > 200 THEN
    RAISE EXCEPTION 'Invalid title';
  END IF;
  IF _message IS NULL OR length(trim(_message)) = 0 OR length(_message) > 500 THEN
    RAISE EXCEPTION 'Invalid message';
  END IF;

  -- Verify caller and receiver are the two parties on this booking
  IF NOT EXISTS (
    SELECT 1 FROM bookings b
    WHERE b.id = _booking_id
      AND (
        (b.customer_id = v_caller AND b.owner_id = _receiver_id)
        OR (b.owner_id = v_caller AND b.customer_id = _receiver_id)
      )
      AND b.status IN ('pending','confirmed','in_progress','completed','disputed')
  ) THEN
    RAISE EXCEPTION 'Unauthorized booking access';
  END IF;

  INSERT INTO notifications (user_id, title, message, notification_type, action_url)
  VALUES (
    _receiver_id,
    _title,
    _message,
    _notification_type,
    '/messages?booking=' || _booking_id::text
  )
  RETURNING id INTO v_notification_id;

  RETURN v_notification_id;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.notify_booking_participant(uuid, uuid, text, text, notification_type) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.notify_booking_participant(uuid, uuid, text, text, notification_type) TO authenticated;
