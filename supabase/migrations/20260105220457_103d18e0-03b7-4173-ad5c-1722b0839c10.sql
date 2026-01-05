-- Create table to store booking policy acceptances for legal compliance
CREATE TABLE public.booking_acceptances (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  owner_rules_accepted BOOLEAN NOT NULL DEFAULT false,
  owner_rules_accepted_at TIMESTAMP WITH TIME ZONE,
  basic_rules_accepted BOOLEAN NOT NULL DEFAULT false,
  basic_rules_accepted_at TIMESTAMP WITH TIME ZONE,
  cancellation_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  cancellation_policy_accepted_at TIMESTAMP WITH TIME ZONE,
  terms_of_service_accepted BOOLEAN NOT NULL DEFAULT false,
  terms_of_service_accepted_at TIMESTAMP WITH TIME ZONE,
  privacy_policy_accepted BOOLEAN NOT NULL DEFAULT false,
  privacy_policy_accepted_at TIMESTAMP WITH TIME ZONE,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.booking_acceptances ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own acceptances
CREATE POLICY "Users can view their own acceptances"
ON public.booking_acceptances
FOR SELECT
USING (auth.uid() = user_id);

-- Policy: Users can insert their own acceptances
CREATE POLICY "Users can insert their own acceptances"
ON public.booking_acceptances
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Policy: Admins can view all acceptances
CREATE POLICY "Admins can view all acceptances"
ON public.booking_acceptances
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add trigger for updated_at
CREATE TRIGGER update_booking_acceptances_updated_at
BEFORE UPDATE ON public.booking_acceptances
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX idx_booking_acceptances_booking_id ON public.booking_acceptances(booking_id);
CREATE INDEX idx_booking_acceptances_user_id ON public.booking_acceptances(user_id);