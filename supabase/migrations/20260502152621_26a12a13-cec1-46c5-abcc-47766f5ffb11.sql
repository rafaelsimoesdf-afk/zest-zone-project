
-- 1) Adiciona campos da subconta Asaas no perfil de cada owner
ALTER TABLE public.asaas_customers
  ADD COLUMN IF NOT EXISTS asaas_wallet_id text,
  ADD COLUMN IF NOT EXISTS asaas_subaccount_api_key text,
  ADD COLUMN IF NOT EXISTS is_subaccount boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_asaas_customers_wallet ON public.asaas_customers(asaas_wallet_id);

-- 2) Registra o split aplicado em cada cobrança (auditoria)
ALTER TABLE public.asaas_charges
  ADD COLUMN IF NOT EXISTS split_owner_amount numeric,
  ADD COLUMN IF NOT EXISTS split_platform_amount numeric,
  ADD COLUMN IF NOT EXISTS split_wallet_id text;

-- 3) Marca quando o saque automático já foi disparado para uma reserva concluída
ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS auto_withdraw_triggered_at timestamp with time zone;
