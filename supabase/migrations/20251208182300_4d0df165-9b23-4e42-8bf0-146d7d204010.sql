-- Adicionar campos para horários e horas extras na tabela bookings
ALTER TABLE public.bookings
ADD COLUMN IF NOT EXISTS start_time text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS end_time text DEFAULT NULL,
ADD COLUMN IF NOT EXISTS extra_hours numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS extra_hours_charge numeric DEFAULT 0;