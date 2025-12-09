-- Insert missing profile for Google OAuth user
INSERT INTO public.profiles (id, email, first_name, last_name, status, is_email_verified)
VALUES (
  '404b0b55-998d-4572-8915-c04234ad2ea9',
  'beathriz0508@gmail.com',
  'Beathriz',
  'Marongio',
  'pending',
  true
)
ON CONFLICT (id) DO NOTHING;