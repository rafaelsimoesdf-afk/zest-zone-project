-- ============================================
-- ASAAS WEBHOOK LOGS
-- ============================================
CREATE TABLE public.asaas_webhook_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event TEXT,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processing_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_webhook_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view webhook logs"
ON public.asaas_webhook_logs FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_asaas_webhook_logs_event ON public.asaas_webhook_logs(event);
CREATE INDEX idx_asaas_webhook_logs_created_at ON public.asaas_webhook_logs(created_at DESC);

-- ============================================
-- ASAAS CUSTOMERS (mapeamento user -> customer Asaas)
-- ============================================
CREATE TABLE public.asaas_customers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asaas_customer_id TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'sandbox' CHECK (environment IN ('sandbox', 'production')),
  cpf_cnpj TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, environment)
);

ALTER TABLE public.asaas_customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own asaas customer"
ON public.asaas_customers FOR SELECT
USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_asaas_customers_user ON public.asaas_customers(user_id);
CREATE INDEX idx_asaas_customers_asaas_id ON public.asaas_customers(asaas_customer_id);

CREATE TRIGGER update_asaas_customers_updated_at
BEFORE UPDATE ON public.asaas_customers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ASAAS CHARGES (cobranças de reserva)
-- ============================================
CREATE TABLE public.asaas_charges (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asaas_payment_id TEXT NOT NULL UNIQUE,
  asaas_customer_id TEXT NOT NULL,
  billing_type TEXT NOT NULL CHECK (billing_type IN ('PIX', 'BOLETO', 'CREDIT_CARD', 'UNDEFINED')),
  status TEXT NOT NULL DEFAULT 'PENDING',
  value NUMERIC(10,2) NOT NULL,
  net_value NUMERIC(10,2),
  due_date DATE NOT NULL,
  description TEXT,
  invoice_url TEXT,
  bank_slip_url TEXT,
  pix_qr_code TEXT,
  pix_copy_paste TEXT,
  pix_expiration_date TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Customer can view own charges"
ON public.asaas_charges FOR SELECT
USING (auth.uid() = customer_id);

CREATE POLICY "Owner can view charges of their bookings"
ON public.asaas_charges FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b
    WHERE b.id = asaas_charges.booking_id AND b.owner_id = auth.uid()
  )
);

CREATE POLICY "Admins can view all charges"
ON public.asaas_charges FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_asaas_charges_booking ON public.asaas_charges(booking_id);
CREATE INDEX idx_asaas_charges_customer ON public.asaas_charges(customer_id);
CREATE INDEX idx_asaas_charges_status ON public.asaas_charges(status);
CREATE INDEX idx_asaas_charges_payment_id ON public.asaas_charges(asaas_payment_id);

CREATE TRIGGER update_asaas_charges_updated_at
BEFORE UPDATE ON public.asaas_charges
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ASAAS TRANSFERS (saques PIX para proprietários)
-- ============================================
CREATE TABLE public.asaas_transfers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  withdrawal_id UUID REFERENCES public.withdrawals(id) ON DELETE SET NULL,
  owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asaas_transfer_id TEXT UNIQUE,
  status TEXT NOT NULL DEFAULT 'PENDING',
  value NUMERIC(10,2) NOT NULL,
  net_value NUMERIC(10,2),
  pix_key TEXT,
  pix_key_type TEXT,
  transfer_fee NUMERIC(10,2) DEFAULT 0,
  scheduled_date DATE,
  effective_date DATE,
  failure_reason TEXT,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_transfers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner can view own transfers"
ON public.asaas_transfers FOR SELECT
USING (auth.uid() = owner_id);

CREATE POLICY "Admins can view all transfers"
ON public.asaas_transfers FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_asaas_transfers_withdrawal ON public.asaas_transfers(withdrawal_id);
CREATE INDEX idx_asaas_transfers_owner ON public.asaas_transfers(owner_id);
CREATE INDEX idx_asaas_transfers_status ON public.asaas_transfers(status);

CREATE TRIGGER update_asaas_transfers_updated_at
BEFORE UPDATE ON public.asaas_transfers
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- ASAAS SUBSCRIPTIONS (assinaturas de serviços)
-- ============================================
CREATE TABLE public.asaas_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  asaas_subscription_id TEXT NOT NULL UNIQUE,
  asaas_customer_id TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE',
  value NUMERIC(10,2) NOT NULL,
  cycle TEXT NOT NULL DEFAULT 'MONTHLY',
  billing_type TEXT NOT NULL DEFAULT 'PIX',
  next_due_date DATE,
  description TEXT,
  plan_type TEXT NOT NULL DEFAULT 'service_provider',
  environment TEXT NOT NULL DEFAULT 'sandbox',
  cancelled_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "User can view own subscription"
ON public.asaas_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all subscriptions"
ON public.asaas_subscriptions FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX idx_asaas_subscriptions_user ON public.asaas_subscriptions(user_id);
CREATE INDEX idx_asaas_subscriptions_status ON public.asaas_subscriptions(status);

CREATE TRIGGER update_asaas_subscriptions_updated_at
BEFORE UPDATE ON public.asaas_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();