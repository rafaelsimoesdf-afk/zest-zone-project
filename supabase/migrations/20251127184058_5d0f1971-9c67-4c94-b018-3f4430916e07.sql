-- Add admin policies for vehicles management
CREATE POLICY "Admins can manage all vehicles"
ON public.vehicles
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));

-- Add admin policies for vehicle images management
CREATE POLICY "Admins can manage all vehicle images"
ON public.vehicle_images
FOR ALL
USING (has_role(auth.uid(), 'admin'))
WITH CHECK (has_role(auth.uid(), 'admin'));