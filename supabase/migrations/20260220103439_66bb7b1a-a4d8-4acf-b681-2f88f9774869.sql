
-- Create withdrawal status enum
CREATE TYPE public.withdrawal_status AS ENUM (
  'pending',
  'approved', 
  'processing',
  'completed',
  'rejected'
);

-- Create withdrawal frequency enum
CREATE TYPE public.withdrawal_frequency AS ENUM (
  'weekly',
  'biweekly',
  'monthly'
);

-- Main withdrawals table
CREATE TABLE public.withdrawals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL,
  amount NUMERIC NOT NULL,
  platform_fee NUMERIC NOT NULL DEFAULT 0,
  net_amount NUMERIC NOT NULL,
  pix_key TEXT NOT NULL, -- CPF do usuário
  status withdrawal_status NOT NULL DEFAULT 'pending',
  auto_approved BOOLEAN NOT NULL DEFAULT false,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  reviewed_by UUID,
  completed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  admin_notes TEXT,
  transfer_proof_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Owner withdrawal settings for automatic withdrawals
CREATE TABLE public.withdrawal_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL UNIQUE,
  auto_withdraw_enabled BOOLEAN NOT NULL DEFAULT false,
  frequency withdrawal_frequency NOT NULL DEFAULT 'monthly',
  minimum_amount NUMERIC NOT NULL DEFAULT 100,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Platform withdrawal configuration (admin-managed)
CREATE TABLE public.withdrawal_config (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  auto_approval_limit NUMERIC NOT NULL DEFAULT 500, -- saques até este valor são auto-aprovados
  minimum_withdrawal NUMERIC NOT NULL DEFAULT 50,
  platform_fee_percentage NUMERIC NOT NULL DEFAULT 0, -- taxa adicional de saque se houver
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_by UUID
);

-- Insert default config
INSERT INTO public.withdrawal_config (auto_approval_limit, minimum_withdrawal, platform_fee_percentage) 
VALUES (500, 50, 0);

-- Enable RLS on all tables
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_config ENABLE ROW LEVEL SECURITY;

-- RLS: withdrawals
CREATE POLICY "Owners can view their own withdrawals"
ON public.withdrawals FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Owners can create their own withdrawals"
ON public.withdrawals FOR INSERT
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can view all withdrawals"
ON public.withdrawals FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all withdrawals"
ON public.withdrawals FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete withdrawals"
ON public.withdrawals FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: withdrawal_settings
CREATE POLICY "Owners can manage their own settings"
ON public.withdrawal_settings FOR ALL
USING (auth.uid() = owner_id)
WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Admins can view all settings"
ON public.withdrawal_settings FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS: withdrawal_config
CREATE POLICY "Anyone can view config"
ON public.withdrawal_config FOR SELECT
USING (true);

CREATE POLICY "Admins can update config"
ON public.withdrawal_config FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_withdrawals_updated_at
BEFORE UPDATE ON public.withdrawals
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_withdrawal_settings_updated_at
BEFORE UPDATE ON public.withdrawal_settings
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Database function to calculate owner available balance
CREATE OR REPLACE FUNCTION public.get_owner_balance(_owner_id UUID)
RETURNS TABLE(
  total_earnings NUMERIC,
  platform_fees NUMERIC,
  total_withdrawn NUMERIC,
  pending_withdrawals NUMERIC,
  available_balance NUMERIC
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_total_earnings NUMERIC;
  v_platform_fees NUMERIC;
  v_total_withdrawn NUMERIC;
  v_pending_withdrawals NUMERIC;
BEGIN
  -- Total from completed bookings
  SELECT COALESCE(SUM(b.total_price), 0) INTO v_total_earnings
  FROM public.bookings b
  WHERE b.owner_id = _owner_id
    AND b.status = 'completed';

  -- Platform fee (15%)
  v_platform_fees := v_total_earnings * 0.15;

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
    v_total_earnings,
    v_platform_fees,
    v_total_withdrawn,
    v_pending_withdrawals,
    (v_total_earnings - v_platform_fees - v_total_withdrawn - v_pending_withdrawals);
END;
$$;
