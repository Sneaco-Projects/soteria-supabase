-- Fix any existing profiles with 'guardian' role to use 'warden' instead
-- This resolves redirect issues where users might be sent to /dashboard/guardian

UPDATE public.profiles 
SET role = 'warden' 
WHERE role = 'guardian';

-- Add a comment for clarity
COMMENT ON COLUMN public.profiles.role IS 'User role: architect, provider, or warden (formerly guardian)';