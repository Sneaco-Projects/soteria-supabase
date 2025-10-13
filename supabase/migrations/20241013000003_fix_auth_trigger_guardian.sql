-- Fix the auto-profile creation function to use 'warden' instead of 'guardian'
-- This function runs automatically when users sign up via Supabase Auth

-- First, find and update the profile creation function
-- The function is likely called something like handle_new_user() or similar
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'warden')  -- Changed from 'guardian' to 'warden'
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Update any existing profiles that still have 'guardian' role to 'warden'
UPDATE public.profiles 
SET role = 'warden' 
WHERE role = 'guardian';

-- Update the is_warden function to check for 'warden' instead of 'guardian'
CREATE OR REPLACE FUNCTION public.is_warden()
RETURNS boolean
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('request.jwt.claim.sub', true)::uuid
         = ANY(SELECT id FROM public.profiles WHERE role = 'warden');
$$;