-- Fix the auth trigger to not interfere with application profile creation
-- The trigger should only create a profile if one doesn't exist AND the app hasn't created one yet

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- Only create a basic profile if the application hasn't already created one
  -- This allows the application to set display_name and other fields properly
  INSERT INTO public.profiles (id, email, role)
  VALUES (new.id, new.email, 'warden')
  ON CONFLICT (id) DO UPDATE SET
    email = COALESCE(EXCLUDED.email, public.profiles.email),
    role = COALESCE(NULLIF(public.profiles.role, ''), EXCLUDED.role);
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;