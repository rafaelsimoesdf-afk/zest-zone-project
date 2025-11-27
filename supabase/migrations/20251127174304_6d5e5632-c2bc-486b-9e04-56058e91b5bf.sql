-- Create vehicle_brands table
CREATE TABLE IF NOT EXISTS public.vehicle_brands (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL UNIQUE,
  country text NOT NULL,
  logo_url text,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create vehicle_models table
CREATE TABLE IF NOT EXISTS public.vehicle_models (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  brand_id uuid NOT NULL REFERENCES public.vehicle_brands(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  is_popular boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(brand_id, name)
);

-- Add indexes for better query performance
CREATE INDEX idx_vehicle_models_brand_id ON public.vehicle_models(brand_id);
CREATE INDEX idx_vehicle_brands_popular ON public.vehicle_brands(is_popular) WHERE is_popular = true;
CREATE INDEX idx_vehicle_models_popular ON public.vehicle_models(is_popular) WHERE is_popular = true;

-- Add brand_id and model_id to vehicles table
ALTER TABLE public.vehicles 
ADD COLUMN IF NOT EXISTS brand_id uuid REFERENCES public.vehicle_brands(id),
ADD COLUMN IF NOT EXISTS model_id uuid REFERENCES public.vehicle_models(id);

-- Enable RLS on new tables
ALTER TABLE public.vehicle_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_models ENABLE ROW LEVEL SECURITY;

-- Create policies for brands and models (everyone can view)
CREATE POLICY "Anyone can view vehicle brands"
  ON public.vehicle_brands FOR SELECT
  USING (true);

CREATE POLICY "Anyone can view vehicle models"
  ON public.vehicle_models FOR SELECT
  USING (true);

-- Insert popular brands in Brazil
INSERT INTO public.vehicle_brands (name, country, is_popular) VALUES
  ('Chevrolet', 'EUA', true),
  ('Volkswagen', 'Alemanha', true),
  ('Fiat', 'Itália', true),
  ('Ford', 'EUA', true),
  ('Toyota', 'Japão', true),
  ('Honda', 'Japão', true),
  ('Hyundai', 'Coreia do Sul', true),
  ('Nissan', 'Japão', true),
  ('Renault', 'França', true),
  ('Jeep', 'EUA', true),
  ('Peugeot', 'França', true),
  ('Citroën', 'França', true),
  ('BMW', 'Alemanha', true),
  ('Mercedes-Benz', 'Alemanha', true),
  ('Audi', 'Alemanha', true),
  ('Mitsubishi', 'Japão', false),
  ('Kia', 'Coreia do Sul', true),
  ('Volvo', 'Suécia', false),
  ('Land Rover', 'Reino Unido', false),
  ('Porsche', 'Alemanha', false),
  ('Tesla', 'EUA', true),
  ('BYD', 'China', true),
  ('Caoa Chery', 'China', false),
  ('JAC Motors', 'China', false),
  ('Ram', 'EUA', false)
ON CONFLICT (name) DO NOTHING;

-- Insert popular models for each brand
-- Chevrolet
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Chevrolet'),
    unnest(ARRAY['Onix', 'Tracker', 'S10', 'Spin', 'Montana', 'Cruze', 'Equinox', 'Trailblazer']) as model,
    unnest(ARRAY['Hatchback', 'SUV', 'Pickup', 'Minivan', 'Pickup', 'Sedan', 'SUV', 'SUV']) as category,
    unnest(ARRAY[true, true, true, false, true, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Volkswagen
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Volkswagen'),
    unnest(ARRAY['Gol', 'Polo', 'T-Cross', 'Virtus', 'Nivus', 'Taos', 'Amarok', 'Tiguan', 'Jetta']) as model,
    unnest(ARRAY['Hatchback', 'Hatchback', 'SUV', 'Sedan', 'SUV', 'SUV', 'Pickup', 'SUV', 'Sedan']) as category,
    unnest(ARRAY[true, true, true, true, true, false, true, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Fiat
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Fiat'),
    unnest(ARRAY['Argo', 'Mobi', 'Cronos', 'Fastback', 'Pulse', 'Toro', 'Strada', 'Fiorino', 'Ducato']) as model,
    unnest(ARRAY['Hatchback', 'Hatchback', 'Sedan', 'SUV', 'SUV', 'Pickup', 'Pickup', 'Van', 'Van']) as category,
    unnest(ARRAY[true, true, true, true, true, true, true, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Ford
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Ford'),
    unnest(ARRAY['Ka', 'EcoSport', 'Ranger', 'Territory', 'Bronco Sport', 'Mustang', 'F-150']) as model,
    unnest(ARRAY['Hatchback', 'SUV', 'Pickup', 'SUV', 'SUV', 'Coupe', 'Pickup']) as category,
    unnest(ARRAY[true, true, true, false, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Toyota
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Toyota'),
    unnest(ARRAY['Corolla', 'Hilux', 'SW4', 'Yaris', 'RAV4', 'Camry', 'Corolla Cross']) as model,
    unnest(ARRAY['Sedan', 'Pickup', 'SUV', 'Hatchback', 'SUV', 'Sedan', 'SUV']) as category,
    unnest(ARRAY[true, true, true, true, false, false, true]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Honda
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Honda'),
    unnest(ARRAY['Civic', 'HR-V', 'City', 'Fit', 'CR-V', 'WR-V', 'Accord']) as model,
    unnest(ARRAY['Sedan', 'SUV', 'Sedan', 'Hatchback', 'SUV', 'SUV', 'Sedan']) as category,
    unnest(ARRAY[true, true, true, true, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Hyundai
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Hyundai'),
    unnest(ARRAY['HB20', 'Creta', 'Tucson', 'ix35', 'Santa Fe', 'Azera', 'Elantra']) as model,
    unnest(ARRAY['Hatchback', 'SUV', 'SUV', 'SUV', 'SUV', 'Sedan', 'Sedan']) as category,
    unnest(ARRAY[true, true, true, false, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Nissan
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Nissan'),
    unnest(ARRAY['Versa', 'Kicks', 'Frontier', 'Sentra', 'X-Trail', 'Leaf']) as model,
    unnest(ARRAY['Sedan', 'SUV', 'Pickup', 'Sedan', 'SUV', 'Hatchback']) as category,
    unnest(ARRAY[true, true, true, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Renault
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Renault'),
    unnest(ARRAY['Kwid', 'Sandero', 'Logan', 'Duster', 'Captur', 'Oroch', 'Kardian']) as model,
    unnest(ARRAY['Hatchback', 'Hatchback', 'Sedan', 'SUV', 'SUV', 'Pickup', 'SUV']) as category,
    unnest(ARRAY[true, true, false, true, false, false, true]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Jeep
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Jeep'),
    unnest(ARRAY['Renegade', 'Compass', 'Commander', 'Wrangler', 'Grand Cherokee']) as model,
    unnest(ARRAY['SUV', 'SUV', 'SUV', 'SUV', 'SUV']) as category,
    unnest(ARRAY[true, true, true, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Peugeot
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Peugeot'),
    unnest(ARRAY['208', '2008', '3008', '5008', 'Partner']) as model,
    unnest(ARRAY['Hatchback', 'SUV', 'SUV', 'SUV', 'Van']) as category,
    unnest(ARRAY[true, true, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- BMW
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'BMW'),
    unnest(ARRAY['320i', 'X1', 'X3', 'X5', 'Série 5', 'i4']) as model,
    unnest(ARRAY['Sedan', 'SUV', 'SUV', 'SUV', 'Sedan', 'Sedan']) as category,
    unnest(ARRAY[true, true, false, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Mercedes-Benz
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Mercedes-Benz'),
    unnest(ARRAY['Classe A', 'Classe C', 'GLA', 'GLB', 'GLC', 'EQE']) as model,
    unnest(ARRAY['Hatchback', 'Sedan', 'SUV', 'SUV', 'SUV', 'Sedan']) as category,
    unnest(ARRAY[true, true, false, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Tesla
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Tesla'),
    unnest(ARRAY['Model 3', 'Model Y', 'Model S', 'Model X']) as model,
    unnest(ARRAY['Sedan', 'SUV', 'Sedan', 'SUV']) as category,
    unnest(ARRAY[true, true, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- BYD
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'BYD'),
    unnest(ARRAY['Dolphin', 'Yuan Plus', 'Seal', 'Han', 'Song Plus']) as model,
    unnest(ARRAY['Hatchback', 'SUV', 'Sedan', 'Sedan', 'SUV']) as category,
    unnest(ARRAY[true, true, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;

-- Kia
INSERT INTO public.vehicle_models (brand_id, name, category, is_popular)
SELECT id, model, category, popular FROM (
  SELECT 
    (SELECT id FROM public.vehicle_brands WHERE name = 'Kia'),
    unnest(ARRAY['Sportage', 'Seltos', 'Sorento', 'Carnival', 'Picanto']) as model,
    unnest(ARRAY['SUV', 'SUV', 'SUV', 'Minivan', 'Hatchback']) as category,
    unnest(ARRAY[true, true, false, false, false]) as popular
) AS models(id, model, category, popular)
ON CONFLICT (brand_id, name) DO NOTHING;