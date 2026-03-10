
-- Create enums for support system
CREATE TYPE public.ticket_priority AS ENUM ('low', 'medium', 'high', 'emergency');
CREATE TYPE public.ticket_category AS ENUM ('account', 'payment', 'booking', 'vehicle_issue', 'owner_issue', 'renter_issue', 'accident', 'technical', 'other');
CREATE TYPE public.ticket_status AS ENUM ('open', 'in_progress', 'waiting_customer', 'resolved', 'closed');

-- Add new columns to support_tickets
ALTER TABLE public.support_tickets 
  ALTER COLUMN status SET DEFAULT 'open',
  ADD COLUMN IF NOT EXISTS ticket_number TEXT UNIQUE,
  ADD COLUMN IF NOT EXISTS category ticket_category NOT NULL DEFAULT 'other',
  ADD COLUMN IF NOT EXISTS priority ticket_priority NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assigned_to UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS sla_deadline TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP WITH TIME ZONE;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_number INT;
BEGIN
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 4) AS INT)), 100000) + 1
  INTO v_number
  FROM public.support_tickets
  WHERE ticket_number IS NOT NULL;
  
  NEW.ticket_number := 'ID-' || v_number;
  
  -- Set SLA deadline based on priority
  IF NEW.sla_deadline IS NULL THEN
    CASE NEW.priority
      WHEN 'emergency' THEN NEW.sla_deadline := NOW() + INTERVAL '5 minutes';
      WHEN 'high' THEN NEW.sla_deadline := NOW() + INTERVAL '30 minutes';
      WHEN 'medium' THEN NEW.sla_deadline := NOW() + INTERVAL '2 hours';
      WHEN 'low' THEN NEW.sla_deadline := NOW() + INTERVAL '24 hours';
    END CASE;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_number();

-- Ticket messages table
CREATE TABLE public.ticket_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_from_support BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view messages of their tickets"
  ON public.ticket_messages FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can send messages to their tickets"
  ON public.ticket_messages FOR INSERT
  WITH CHECK (
    auth.uid() = sender_id AND (
      EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_messages.ticket_id AND user_id = auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Ticket attachments
CREATE TABLE public.ticket_attachments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  message_id UUID REFERENCES public.ticket_messages(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_type TEXT,
  uploaded_by UUID NOT NULL REFERENCES public.profiles(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_attachments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view attachments of their tickets"
  ON public.ticket_attachments FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_attachments.ticket_id AND user_id = auth.uid())
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "Users can upload attachments to their tickets"
  ON public.ticket_attachments FOR INSERT
  WITH CHECK (
    auth.uid() = uploaded_by AND (
      EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_attachments.ticket_id AND user_id = auth.uid())
      OR has_role(auth.uid(), 'admin'::app_role)
    )
  );

-- Ticket ratings
CREATE TABLE public.ticket_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE UNIQUE,
  user_id UUID NOT NULL REFERENCES public.profiles(id),
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  resolved_problem TEXT CHECK (resolved_problem IN ('yes', 'partially', 'no')),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can rate their own tickets"
  ON public.ticket_ratings FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM public.support_tickets WHERE id = ticket_ratings.ticket_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view their own ratings"
  ON public.ticket_ratings FOR SELECT
  USING (auth.uid() = user_id OR has_role(auth.uid(), 'admin'::app_role));

-- FAQ articles
CREATE TABLE public.faq_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category ticket_category NOT NULL DEFAULT 'other',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  keywords TEXT[] DEFAULT '{}',
  display_order INTEGER NOT NULL DEFAULT 0,
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view published FAQ articles"
  ON public.faq_articles FOR SELECT
  USING (is_published = true OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can manage FAQ articles"
  ON public.faq_articles FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Ticket audit log
CREATE TABLE public.ticket_audit_log (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  action TEXT NOT NULL,
  performed_by UUID REFERENCES public.profiles(id),
  old_value TEXT,
  new_value TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.ticket_audit_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.ticket_audit_log FOR SELECT
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert audit logs"
  ON public.ticket_audit_log FOR INSERT
  WITH CHECK (true);

-- Update admin policies on support_tickets for new functionality
CREATE POLICY "Admins can update all tickets"
  ON public.support_tickets FOR UPDATE
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can update their own tickets"
  ON public.support_tickets FOR UPDATE
  USING (auth.uid() = user_id);

-- Storage bucket for ticket attachments
INSERT INTO storage.buckets (id, name, public) VALUES ('ticket-attachments', 'ticket-attachments', false)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Users can upload ticket attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');

CREATE POLICY "Users can view their ticket attachments"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'ticket-attachments' AND auth.role() = 'authenticated');

-- Enable realtime for ticket messages
ALTER PUBLICATION supabase_realtime ADD TABLE public.ticket_messages;
