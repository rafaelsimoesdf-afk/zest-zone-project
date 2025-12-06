-- Allow admins to delete profiles
CREATE POLICY "Admins can delete profiles"
ON public.profiles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete addresses
CREATE POLICY "Admins can delete addresses"
ON public.addresses
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete CNH details
CREATE POLICY "Admins can delete CNH details"
ON public.cnh_details
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete identity documents
CREATE POLICY "Admins can delete identity documents"
ON public.identity_documents
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete selfie verifications
CREATE POLICY "Admins can delete selfie verifications"
ON public.selfie_verifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete proof of residence
CREATE POLICY "Admins can delete proof of residence"
ON public.proof_of_residence
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete user roles
CREATE POLICY "Admins can delete user roles"
ON public.user_roles
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete bank accounts
CREATE POLICY "Admins can delete bank accounts"
ON public.bank_accounts
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete notifications"
ON public.notifications
FOR DELETE
USING (has_role(auth.uid(), 'admin'::app_role));