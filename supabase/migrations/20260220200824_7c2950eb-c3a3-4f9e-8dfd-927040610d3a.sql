
CREATE OR REPLACE FUNCTION public.get_owner_balance(_owner_id uuid)
 RETURNS TABLE(total_earnings numeric, platform_fees numeric, total_withdrawn numeric, pending_withdrawals numeric, available_balance numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_rental_amount NUMERIC;
  v_platform_fees NUMERIC;
  v_net_earnings NUMERIC;
  v_total_withdrawn NUMERIC;
  v_pending_withdrawals NUMERIC;
BEGIN
  -- Calculate rental amount (daily_rate * total_days + extra_hours_charge) from completed bookings
  -- This excludes insurance (R$20/day) which is retained by the platform
  SELECT COALESCE(SUM(
    (b.daily_rate * b.total_days) + COALESCE(b.extra_hours_charge, 0)
  ), 0) INTO v_rental_amount
  FROM public.bookings b
  WHERE b.owner_id = _owner_id
    AND b.status = 'completed';

  -- Platform fee is 15% of rental amount (diárias + horas extras)
  v_platform_fees := v_rental_amount * 0.15;
  
  -- Net earnings = rental amount - platform fees (what the owner actually receives)
  v_net_earnings := v_rental_amount - v_platform_fees;

  -- Already withdrawn (completed)
  SELECT COALESCE(SUM(w.net_amount), 0) INTO v_total_withdrawn
  FROM public.withdrawals w
  WHERE w.owner_id = _owner_id
    AND w.status = 'completed';

  -- Pending/approved/processing withdrawals
  SELECT COALESCE(SUM(w.net_amount), 0) INTO v_pending_withdrawals
  FROM public.withdrawals w
  WHERE w.owner_id = _owner_id
    AND w.status IN ('pending', 'approved', 'processing');

  RETURN QUERY SELECT
    v_net_earnings AS total_earnings,
    v_platform_fees,
    v_total_withdrawn,
    v_pending_withdrawals,
    (v_net_earnings - v_total_withdrawn - v_pending_withdrawals) AS available_balance;
END;
$function$;
