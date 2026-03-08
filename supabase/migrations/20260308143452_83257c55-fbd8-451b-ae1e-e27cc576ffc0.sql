
-- Service listings table
CREATE TABLE public.service_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL,
  custom_category TEXT,
  price_range TEXT,
  city TEXT,
  state TEXT,
  whatsapp_number TEXT,
  show_phone BOOLEAN NOT NULL DEFAULT true,
  allow_chat BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'active',
  views_count INTEGER NOT NULL DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_listings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active services" ON public.service_listings
  FOR SELECT USING (status = 'active' OR provider_id = auth.uid());

CREATE POLICY "Authenticated users can create services" ON public.service_listings
  FOR INSERT WITH CHECK (auth.uid() = provider_id);

CREATE POLICY "Providers can update their own services" ON public.service_listings
  FOR UPDATE USING (auth.uid() = provider_id);

CREATE POLICY "Providers can delete their own services" ON public.service_listings
  FOR DELETE USING (auth.uid() = provider_id);

CREATE POLICY "Admins can manage all services" ON public.service_listings
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Service messages table
CREATE TABLE public.service_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.service_listings(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id),
  receiver_id UUID NOT NULL REFERENCES public.profiles(id),
  content TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.service_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own service messages" ON public.service_messages
  FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Authenticated users can send service messages" ON public.service_messages
  FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Receivers can mark messages as read" ON public.service_messages
  FOR UPDATE USING (auth.uid() = receiver_id);

-- Trigger for updated_at
CREATE TRIGGER update_service_listings_updated_at
  BEFORE UPDATE ON public.service_listings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
