-- Insert new vehicle brands (skip existing ones)
INSERT INTO public.vehicle_brands (name, country, is_popular) VALUES
('Volkswagen', 'Brasil', true),
('Fiat', 'Brasil', true),
('Ford', 'Brasil', true),
('Toyota', 'Japão', true),
('Renault', 'França', true),
('Hyundai', 'Coreia do Sul', true),
('Honda', 'Japão', true),
('Nissan', 'Japão', false),
('Peugeot', 'França', false),
('Citroën', 'França', false),
('Dodge', 'Estados Unidos', false),
('RAM', 'Estados Unidos', false),
('BMW', 'Alemanha', false),
('Chery', 'China', false),
('Jac Motors', 'China', false),
('Jeep', 'Estados Unidos', true),
('Kia', 'Coreia do Sul', false),
('Land Rover', 'Reino Unido', false),
('Mercedes-Benz', 'Alemanha', false),
('Mitsubishi', 'Japão', false),
('Subaru', 'Japão', false),
('Volvo', 'Suécia', false),
('Audi', 'Alemanha', false),
('Gurgel', 'Brasil', false),
('Miura', 'Brasil', false),
('Puma', 'Brasil', false),
('Santa Matilde', 'Brasil', false),
('BYD', 'China', false),
('Caoa Chery', 'China', false),
('GWM', 'China', false)
ON CONFLICT (name) DO NOTHING;

-- Insert Chevrolet models (brand already exists)
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Opala', 'Monza', 'Chevette', 'Caravan', 'Celta', 'Corsa', 'Prisma', 'Classic', 'Omega', 'Vectra', 'Astra', 'Spin', 'Tracker', 'S10', 'Blazer', 'Montana', 'Cruze', 'Equinox', 'Captiva']), false
FROM public.vehicle_brands WHERE name = 'Chevrolet'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Volkswagen models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Fusca', 'Brasília', 'SP1', 'SP2', 'Gol', 'Parati', 'Santana', 'Voyage', 'Fox', 'Polo', 'Saveiro', 'T-Cross', 'Taos', 'Nivus', 'Virtus', 'Jetta', 'Passat', 'Karmann-Ghia']), false
FROM public.vehicle_brands WHERE name = 'Volkswagen'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Fiat models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['147', 'Oggi', 'Uno', 'Palio', 'Siena', 'Strada', 'Tempra', 'Tipo', 'Marea', 'Brava', 'Brava Weekend', 'Idea', 'Punto', 'Stilo', 'Linea', 'Argo', 'Cronos', 'Mobi', 'Pulse', 'Fastback', 'Toro', 'Ducato']), false
FROM public.vehicle_brands WHERE name = 'Fiat'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Ford models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Corcel', 'Del Rey', 'Escort', 'Verona', 'Versailles', 'Fiesta', 'Ka', 'EcoSport', 'Focus', 'Fusion', 'Ranger', 'Territory', 'Edge', 'Bronco', 'Maverick']), false
FROM public.vehicle_brands WHERE name = 'Ford'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Toyota models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Corolla', 'Bandeirante', 'Hilux', 'SW4', 'Etios', 'Yaris', 'Prius', 'RAV4', 'Camry']), false
FROM public.vehicle_brands WHERE name = 'Toyota'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Renault models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Dauphine', 'Gordini', '12', 'Logan', 'Sandero', 'Stepway', 'Duster', 'Kwid', 'Captur', 'Oroch', 'Master']), false
FROM public.vehicle_brands WHERE name = 'Renault'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Hyundai models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['HB20', 'Creta', 'Tucson', 'Santa Fe', 'Elantra', 'Azera', 'i30', 'ix35']), false
FROM public.vehicle_brands WHERE name = 'Hyundai'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Honda models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Civic', 'Accord', 'Fit', 'City', 'HR-V', 'WR-V', 'CR-V']), false
FROM public.vehicle_brands WHERE name = 'Honda'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Nissan models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['March', 'Versa', 'Sentra', 'Kicks', 'Frontier', 'X-Terra']), false
FROM public.vehicle_brands WHERE name = 'Nissan'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Peugeot models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['504', '205', '206', '207', '208', '2008', '3008', '5008', 'Partner', 'Expert']), false
FROM public.vehicle_brands WHERE name = 'Peugeot'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Citroën models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['2CV', 'Dyane', 'Visa', 'Xsara', 'Xsara Picasso', 'C3', 'Aircross', 'C4', 'Cactus', 'ë-Jumpy']), false
FROM public.vehicle_brands WHERE name = 'Citroën'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Dodge models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Charger', 'Dart', 'Magnum']), false
FROM public.vehicle_brands WHERE name = 'Dodge'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert RAM models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['RAM 1500', 'RAM 2500']), false
FROM public.vehicle_brands WHERE name = 'RAM'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert BMW models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Série 3', 'Série 5', 'X1', 'X3', 'X5', 'X6']), false
FROM public.vehicle_brands WHERE name = 'BMW'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Chery models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['QQ', 'Tiggo', 'Celer', 'Arrizo']), false
FROM public.vehicle_brands WHERE name = 'Chery'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Jac Motors models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['J3', 'J5', 'T40']), false
FROM public.vehicle_brands WHERE name = 'Jac Motors'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Jeep models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Renegade', 'Compass', 'Commander', 'Wrangler', 'Grand Cherokee']), false
FROM public.vehicle_brands WHERE name = 'Jeep'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Kia models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Cerato', 'Sportage', 'Sorento', 'Soul', 'Bongo']), false
FROM public.vehicle_brands WHERE name = 'Kia'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Land Rover models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Defender', 'Discovery', 'Range Rover Evoque', 'Range Rover Sport']), false
FROM public.vehicle_brands WHERE name = 'Land Rover'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Mercedes-Benz models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Classe A', 'Classe C', 'Classe E', 'Classe G', 'SUV GLC', 'GLE', 'Sprinter']), false
FROM public.vehicle_brands WHERE name = 'Mercedes-Benz'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Mitsubishi models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Lancer', 'Pajero', 'Outlander', 'ASX']), false
FROM public.vehicle_brands WHERE name = 'Mitsubishi'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Subaru models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Impreza', 'Legacy', 'Outback', 'Forester']), false
FROM public.vehicle_brands WHERE name = 'Subaru'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Volvo models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['XC40', 'XC60', 'XC90', 'S60', 'EX30', 'EX90']), false
FROM public.vehicle_brands WHERE name = 'Volvo'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Audi models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['A1', 'A3', 'A4', 'Q3', 'Q5']), false
FROM public.vehicle_brands WHERE name = 'Audi'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Gurgel models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['BR-800', 'Xavante', 'Supermini', 'Itaipu']), false
FROM public.vehicle_brands WHERE name = 'Gurgel'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Miura models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, 'Miura', false
FROM public.vehicle_brands WHERE name = 'Miura'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Puma models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['GTB', 'GTE', 'AMV']), false
FROM public.vehicle_brands WHERE name = 'Puma'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Santa Matilde models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, 'SM4.8', false
FROM public.vehicle_brands WHERE name = 'Santa Matilde'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert BYD models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Dolphin', 'Song Plus', 'Yuan Plus', 'Han', 'Seal']), false
FROM public.vehicle_brands WHERE name = 'BYD'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert Caoa Chery models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['iCar', 'Tiggo 8 Pro']), false
FROM public.vehicle_brands WHERE name = 'Caoa Chery'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Insert GWM models
INSERT INTO public.vehicle_models (brand_id, name, is_popular) 
SELECT id, unnest(ARRAY['Haval H6', 'Poer']), false
FROM public.vehicle_brands WHERE name = 'GWM'
ON CONFLICT (brand_id, name) DO NOTHING;

-- Mark popular models
UPDATE public.vehicle_models SET is_popular = true 
WHERE name IN ('Onix', 'Tracker', 'Cruze', 'Gol', 'T-Cross', 'Polo', 'Argo', 'Toro', 'Pulse', 'Corolla', 'Hilux', 'HB20', 'Creta', 'Civic', 'HR-V', 'Renegade', 'Compass', 'Kicks', 'Duster');

-- Update Chevrolet to popular if not already
UPDATE public.vehicle_brands SET is_popular = true WHERE name = 'Chevrolet';