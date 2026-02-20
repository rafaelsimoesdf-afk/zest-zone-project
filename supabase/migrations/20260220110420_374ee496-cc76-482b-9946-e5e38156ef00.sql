
-- Add stripe_account_id to profiles for Stripe Connect
ALTER TABLE public.profiles ADD COLUMN stripe_account_id text NULL;

-- Add stripe_onboarding_complete flag
ALTER TABLE public.profiles ADD COLUMN stripe_onboarding_complete boolean NOT NULL DEFAULT false;
