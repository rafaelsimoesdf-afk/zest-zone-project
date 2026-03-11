
-- Rental Contracts table
CREATE TABLE public.rental_contracts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  inspection_id uuid REFERENCES public.vehicle_inspections(id),
  zapsign_doc_id text,
  zapsign_doc_token text,
  status text NOT NULL DEFAULT 'draft',
  signed_pdf_url text,
  audit_trail_url text,
  document_hash text,
  contract_data jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  UNIQUE(booking_id)
);

-- Contract Signatures table
CREATE TABLE public.contract_signatures (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id uuid NOT NULL REFERENCES public.rental_contracts(id) ON DELETE CASCADE,
  signer_id uuid NOT NULL REFERENCES public.profiles(id),
  signer_role text NOT NULL CHECK (signer_role IN ('renter', 'owner')),
  sign_order integer NOT NULL,
  zapsign_signer_token text,
  zapsign_sign_url text,
  status text NOT NULL DEFAULT 'pending',
  signed_at timestamptz,
  ip_address text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.rental_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contract_signatures ENABLE ROW LEVEL SECURITY;

-- RLS for rental_contracts
CREATE POLICY "Users can view contracts for their bookings" ON public.rental_contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings
      WHERE bookings.id = rental_contracts.booking_id
      AND (bookings.customer_id = auth.uid() OR bookings.owner_id = auth.uid())
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can insert contracts" ON public.rental_contracts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update contracts" ON public.rental_contracts
  FOR UPDATE USING (true);

-- RLS for contract_signatures
CREATE POLICY "Users can view their contract signatures" ON public.contract_signatures
  FOR SELECT USING (
    signer_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.rental_contracts rc
      JOIN public.bookings b ON b.id = rc.booking_id
      WHERE rc.id = contract_signatures.contract_id
      AND (b.customer_id = auth.uid() OR b.owner_id = auth.uid())
    )
    OR has_role(auth.uid(), 'admin'::app_role)
  );

CREATE POLICY "System can insert signatures" ON public.contract_signatures
  FOR INSERT WITH CHECK (true);

CREATE POLICY "System can update signatures" ON public.contract_signatures
  FOR UPDATE USING (true);

-- Triggers for updated_at
CREATE TRIGGER update_rental_contracts_updated_at
  BEFORE UPDATE ON public.rental_contracts
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_contract_signatures_updated_at
  BEFORE UPDATE ON public.contract_signatures
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for contract status updates
ALTER PUBLICATION supabase_realtime ADD TABLE public.rental_contracts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.contract_signatures;
