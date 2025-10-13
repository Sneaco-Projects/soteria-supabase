-- Update any profiles that don't have a display_name to use a generated one from email
UPDATE public.profiles 
SET display_name = COALESCE(
  NULLIF(display_name, ''),
  INITCAP(SPLIT_PART(email, '@', 1))
)
WHERE display_name IS NULL 
   OR display_name = '' 
   OR display_name = 'Unknown Warden';