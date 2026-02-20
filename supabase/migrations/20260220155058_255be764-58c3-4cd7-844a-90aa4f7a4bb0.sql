
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_customer_id uuid,
  p_vehicle_id uuid,
  p_owner_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz,
  p_start_time text,
  p_end_time text,
  p_total_days integer,
  p_daily_rate numeric,
  p_total_price numeric,
  p_extra_hours numeric DEFAULT 0,
  p_extra_hours_charge numeric DEFAULT 0,
  p_pickup_location text DEFAULT NULL,
  p_return_location text DEFAULT NULL,
  p_notes text DEFAULT NULL
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_booking_id uuid;
BEGIN
  -- Verify caller is the customer
  IF auth.uid() != p_customer_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Cannot book own vehicle
  IF p_customer_id = p_owner_id THEN
    RAISE EXCEPTION 'Você não pode reservar seu próprio veículo';
  END IF;

  -- Advisory lock on vehicle+customer to serialize concurrent requests
  PERFORM pg_advisory_xact_lock(
    hashtext(p_vehicle_id::text || '_' || p_customer_id::text)
  );

  -- Check for existing duplicate
  IF EXISTS (
    SELECT 1 FROM bookings
    WHERE customer_id = p_customer_id
      AND vehicle_id = p_vehicle_id
      AND start_date = p_start_date
      AND end_date = p_end_date
      AND status IN ('pending', 'confirmed', 'in_progress')
  ) THEN
    RAISE EXCEPTION 'Você já possui uma reserva para este veículo neste período';
  END IF;

  -- Insert atomically
  INSERT INTO bookings (
    customer_id, vehicle_id, owner_id,
    start_date, end_date, start_time, end_time,
    total_days, daily_rate, total_price,
    extra_hours, extra_hours_charge,
    pickup_location, return_location, notes
  ) VALUES (
    p_customer_id, p_vehicle_id, p_owner_id,
    p_start_date, p_end_date, p_start_time, p_end_time,
    p_total_days, p_daily_rate, p_total_price,
    p_extra_hours, p_extra_hours_charge,
    p_pickup_location, p_return_location, p_notes
  )
  RETURNING id INTO v_booking_id;

  RETURN v_booking_id;
END;
$$;
