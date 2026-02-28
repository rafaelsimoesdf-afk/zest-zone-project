
-- Vehicle inspections table (pickup and return)
CREATE TABLE public.vehicle_inspections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  inspection_type TEXT NOT NULL CHECK (inspection_type IN ('pickup', 'return')),
  inspector_id UUID NOT NULL REFERENCES public.profiles(id),
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'disputed')),
  confirmed_by UUID REFERENCES public.profiles(id),
  confirmed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(booking_id, inspection_type)
);

-- Inspection photos table
CREATE TABLE public.vehicle_inspection_photos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  inspection_id UUID NOT NULL REFERENCES public.vehicle_inspections(id) ON DELETE CASCADE,
  photo_url TEXT NOT NULL,
  caption TEXT,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.vehicle_inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicle_inspection_photos ENABLE ROW LEVEL SECURITY;

-- RLS for vehicle_inspections: booking participants can view/manage
CREATE POLICY "Booking participants can view inspections"
ON public.vehicle_inspections FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = vehicle_inspections.booking_id
    AND (bookings.customer_id = auth.uid() OR bookings.owner_id = auth.uid())
  )
);

CREATE POLICY "Inspector can create inspection"
ON public.vehicle_inspections FOR INSERT
WITH CHECK (
  auth.uid() = inspector_id
  AND EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = vehicle_inspections.booking_id
    AND (bookings.customer_id = auth.uid() OR bookings.owner_id = auth.uid())
  )
);

CREATE POLICY "Booking participants can update inspections"
ON public.vehicle_inspections FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM bookings
    WHERE bookings.id = vehicle_inspections.booking_id
    AND (bookings.customer_id = auth.uid() OR bookings.owner_id = auth.uid())
  )
);

CREATE POLICY "Admins can manage all inspections"
ON public.vehicle_inspections FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- RLS for inspection photos
CREATE POLICY "Booking participants can view inspection photos"
ON public.vehicle_inspection_photos FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM vehicle_inspections vi
    JOIN bookings b ON b.id = vi.booking_id
    WHERE vi.id = vehicle_inspection_photos.inspection_id
    AND (b.customer_id = auth.uid() OR b.owner_id = auth.uid())
  )
);

CREATE POLICY "Inspector can add inspection photos"
ON public.vehicle_inspection_photos FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM vehicle_inspections vi
    JOIN bookings b ON b.id = vi.booking_id
    WHERE vi.id = vehicle_inspection_photos.inspection_id
    AND vi.inspector_id = auth.uid()
    AND vi.status = 'pending'
  )
);

CREATE POLICY "Admins can manage all inspection photos"
ON public.vehicle_inspection_photos FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Triggers for updated_at
CREATE TRIGGER update_vehicle_inspections_updated_at
BEFORE UPDATE ON public.vehicle_inspections
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for inspection photos
INSERT INTO storage.buckets (id, name, public) VALUES ('inspection-photos', 'inspection-photos', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for inspection photos
CREATE POLICY "Users can upload inspection photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'inspection-photos'
  AND auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view inspection photos"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'inspection-photos'
  AND auth.uid() IS NOT NULL
);
