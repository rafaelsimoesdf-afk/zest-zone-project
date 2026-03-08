
-- Create listing status enum
CREATE TYPE public.listing_status AS ENUM ('active', 'sold', 'paused', 'expired');

-- Create vehicle_listings table for classified ads
CREATE TABLE public.vehicle_listings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vehicle_id UUID REFERENCES public.vehicles(id) ON DELETE SET NULL,
  -- Vehicle data (can be from existing vehicle or manual)
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  color TEXT NOT NULL,
  mileage INTEGER NOT NULL,
  vehicle_type TEXT NOT NULL,
  transmission_type TEXT NOT NULL,
  fuel_type TEXT NOT NULL,
  doors INTEGER NOT NULL DEFAULT 4,
  seats INTEGER NOT NULL DEFAULT 5,
  has_air_conditioning BOOLEAN NOT NULL DEFAULT false,
  -- Sale-specific fields
  sale_price NUMERIC NOT NULL,
  description TEXT,
  condition TEXT NOT NULL DEFAULT 'used', -- 'new', 'used', 'semi-new'
  accepts_trade BOOLEAN NOT NULL DEFAULT false,
  license_plate TEXT,
  city TEXT,
  state TEXT,
  -- Contact info
  whatsapp_number TEXT,
  show_phone BOOLEAN NOT NULL DEFAULT true,
  allow_chat BOOLEAN NOT NULL DEFAULT true,
  -- Status
  status listing_status NOT NULL DEFAULT 'active',
  views_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_listings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Anyone can view active listings"
  ON public.vehicle_listings FOR SELECT
  USING (status = 'active' OR seller_id = auth.uid());

CREATE POLICY "Authenticated users can create listings"
  ON public.vehicle_listings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update their own listings"
  ON public.vehicle_listings FOR UPDATE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete their own listings"
  ON public.vehicle_listings FOR DELETE
  TO authenticated
  USING (auth.uid() = seller_id);

CREATE POLICY "Admins can manage all listings"
  ON public.vehicle_listings FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- Create listing_images table
CREATE TABLE public.listing_images (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.vehicle_listings(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  is_primary BOOLEAN NOT NULL DEFAULT false,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view listing images"
  ON public.listing_images FOR SELECT
  USING (true);

CREATE POLICY "Sellers can manage their listing images"
  ON public.listing_images FOR ALL
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.vehicle_listings 
    WHERE id = listing_images.listing_id AND seller_id = auth.uid()
  ));

-- Create listing_messages table for buyer-seller chat
CREATE TABLE public.listing_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  listing_id UUID NOT NULL REFERENCES public.vehicle_listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.listing_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own listing messages"
  ON public.listing_messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send listing messages"
  ON public.listing_messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark messages as read"
  ON public.listing_messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = receiver_id);

-- Updated_at trigger
CREATE TRIGGER update_vehicle_listings_updated_at
  BEFORE UPDATE ON public.vehicle_listings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
