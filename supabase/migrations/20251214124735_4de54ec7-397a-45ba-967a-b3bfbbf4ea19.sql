-- Create a secure helper function to expose only booking date ranges per vehicle
CREATE OR REPLACE FUNCTION public.get_public_vehicle_bookings(
  _vehicle_id uuid
)
RETURNS TABLE (
  start_date date,
  end_date date,
  status public.booking_status
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    (b.start_date AT TIME ZONE 'UTC')::date AS start_date,
    (b.end_date AT TIME ZONE 'UTC')::date   AS end_date,
    b.status
  FROM public.bookings b
  WHERE
    b.vehicle_id = _vehicle_id
    AND b.status IN ('pending', 'confirmed', 'in_progress');
END;
$$ LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public;

-- Allow anonymous and authenticated clients to call this function
GRANT EXECUTE ON FUNCTION public.get_public_vehicle_bookings(uuid) TO anon, authenticated;