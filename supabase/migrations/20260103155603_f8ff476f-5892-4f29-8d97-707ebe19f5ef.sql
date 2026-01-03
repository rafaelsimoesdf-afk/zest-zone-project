-- Adicionar colunas city e state diretamente na tabela vehicles
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text;

-- Popular os valores existentes a partir dos endereços relacionados
UPDATE public.vehicles v
SET 
  city = a.city,
  state = a.state
FROM public.addresses a
WHERE v.address_id = a.id
  AND v.city IS NULL;