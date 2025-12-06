-- Create verification status enum
CREATE TYPE public.verification_status AS ENUM ('pending', 'approved', 'rejected');

-- Create CNH category enum
CREATE TYPE public.cnh_category AS ENUM ('A', 'B', 'C', 'D', 'E', 'AB', 'AC', 'AD', 'AE');

-- Create proof of residence type enum
CREATE TYPE public.proof_of_residence_type AS ENUM ('conta_luz', 'conta_agua', 'conta_gas', 'conta_internet', 'conta_telefone', 'fatura_cartao', 'extrato_bancario', 'outro');

-- Add verification columns to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_status public.verification_status DEFAULT 'pending',
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS verification_validated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS terms_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS lgpd_accepted BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS data_accuracy_declared BOOLEAN DEFAULT false;

-- Create CNH details table
CREATE TABLE public.cnh_details (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  cnh_number TEXT NOT NULL,
  category public.cnh_category NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  front_image_url TEXT NOT NULL,
  back_image_url TEXT NOT NULL,
  is_valid BOOLEAN DEFAULT true,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create identity documents table (RG/CNH as ID)
CREATE TABLE public.identity_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  document_type TEXT NOT NULL CHECK (document_type IN ('rg', 'cnh')),
  front_image_url TEXT NOT NULL,
  back_image_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create selfie verification table
CREATE TABLE public.selfie_verifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  selfie_url TEXT NOT NULL,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create proof of residence table
CREATE TABLE public.proof_of_residence (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  document_type public.proof_of_residence_type NOT NULL,
  document_url TEXT NOT NULL,
  issue_date DATE,
  verified BOOLEAN DEFAULT false,
  verified_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.cnh_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identity_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.selfie_verifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.proof_of_residence ENABLE ROW LEVEL SECURITY;

-- RLS Policies for cnh_details
CREATE POLICY "Users can view their own CNH" ON public.cnh_details
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own CNH" ON public.cnh_details
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own CNH" ON public.cnh_details
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all CNH" ON public.cnh_details
FOR SELECT USING (has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all CNH" ON public.cnh_details
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for identity_documents
CREATE POLICY "Users can view their own identity documents" ON public.identity_documents
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own identity documents" ON public.identity_documents
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own identity documents" ON public.identity_documents
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all identity documents" ON public.identity_documents
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for selfie_verifications
CREATE POLICY "Users can view their own selfie" ON public.selfie_verifications
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own selfie" ON public.selfie_verifications
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own selfie" ON public.selfie_verifications
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all selfies" ON public.selfie_verifications
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for proof_of_residence
CREATE POLICY "Users can view their own proof of residence" ON public.proof_of_residence
FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own proof of residence" ON public.proof_of_residence
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own proof of residence" ON public.proof_of_residence
FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all proof of residence" ON public.proof_of_residence
FOR ALL USING (has_role(auth.uid(), 'admin'));

-- Create storage bucket for user verification documents
INSERT INTO storage.buckets (id, name, public) 
VALUES ('user-documents', 'user-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for user-documents bucket
CREATE POLICY "Users can view their own documents" ON storage.objects
FOR SELECT USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can upload their own documents" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own documents" ON storage.objects
FOR UPDATE USING (bucket_id = 'user-documents' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Admins can view all documents" ON storage.objects
FOR SELECT USING (bucket_id = 'user-documents' AND has_role(auth.uid(), 'admin'));

-- Create updated_at triggers for new tables
CREATE TRIGGER update_cnh_details_updated_at
BEFORE UPDATE ON public.cnh_details
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_identity_documents_updated_at
BEFORE UPDATE ON public.identity_documents
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_selfie_verifications_updated_at
BEFORE UPDATE ON public.selfie_verifications
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_proof_of_residence_updated_at
BEFORE UPDATE ON public.proof_of_residence
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();