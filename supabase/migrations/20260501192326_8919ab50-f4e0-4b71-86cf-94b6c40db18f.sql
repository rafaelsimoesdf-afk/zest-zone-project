-- Tokens de cartão salvos (Asaas tokenization) para "1-clique"
CREATE TABLE IF NOT EXISTS public.asaas_saved_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  asaas_customer_id TEXT NOT NULL,
  credit_card_token TEXT NOT NULL,
  credit_card_brand TEXT,
  credit_card_last_digits TEXT,
  holder_name TEXT,
  environment TEXT NOT NULL DEFAULT 'sandbox',
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.asaas_saved_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own saved cards"
ON public.asaas_saved_cards FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users delete own saved cards"
ON public.asaas_saved_cards FOR DELETE
USING (auth.uid() = user_id);

-- Apenas edge functions (service role) podem inserir/atualizar tokens
CREATE INDEX IF NOT EXISTS idx_asaas_saved_cards_user ON public.asaas_saved_cards(user_id, environment);

CREATE TRIGGER asaas_saved_cards_updated_at
BEFORE UPDATE ON public.asaas_saved_cards
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();