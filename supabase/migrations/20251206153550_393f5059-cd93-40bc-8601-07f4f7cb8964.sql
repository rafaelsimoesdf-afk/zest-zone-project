-- Add new columns to vehicles table for extended vehicle registration

-- Basic information fields
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS versao text,
ADD COLUMN IF NOT EXISTS ano_fabricacao integer,
ADD COLUMN IF NOT EXISTS ano_modelo integer,
ADD COLUMN IF NOT EXISTS motor text,
ADD COLUMN IF NOT EXISTS direcao text;

-- Financial fields
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS caucao numeric DEFAULT 0;

-- Documentation/Status fields
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS chassi_mascarado text,
ADD COLUMN IF NOT EXISTS situacao_veiculo text DEFAULT 'regular';

-- Owner rules
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS regras text;

-- SECURITY accessories (boolean fields)
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS airbag_frontal boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS airbag_lateral boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS freios_abs boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS controle_tracao boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS controle_estabilidade boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS camera_re boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sensor_estacionamento boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS alarme boolean DEFAULT false;

-- COMFORT accessories (boolean fields)
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS ar_digital boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS direcao_hidraulica boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS direcao_eletrica boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS vidros_eletricos boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS retrovisores_eletricos boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banco_couro boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS banco_eletrico boolean DEFAULT false;

-- TECHNOLOGY accessories (boolean fields)
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS multimidia boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS bluetooth boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS android_auto boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS apple_carplay boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS gps boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS wifi boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS entrada_usb boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS carregador_inducao boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS piloto_automatico boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS start_stop boolean DEFAULT false;

-- EXTERIOR accessories (boolean fields)
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS rodas_liga_leve boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS farol_led boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS farol_milha boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS rack_teto boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS engate boolean DEFAULT false;

-- OTHER accessories (boolean fields)
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS chave_reserva boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS manual_veiculo boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sensor_chuva boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS sensor_crepuscular boolean DEFAULT false;