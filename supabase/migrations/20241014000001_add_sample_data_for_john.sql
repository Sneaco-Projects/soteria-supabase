-- Add sample sentinel data for john@gmail.com to demonstrate the provider dashboard
-- This will show how the system displays full names and phone numbers

-- Insert sample sentinels for john@gmail.com if the user exists
INSERT INTO public.sentinels (owner_guardian_id, full_name, phone, notes, created_at)
SELECT 
    u.id,
    sentinel_data.full_name,
    sentinel_data.phone,
    sentinel_data.notes,
    sentinel_data.created_at
FROM auth.users u
CROSS JOIN (
    VALUES 
        ('Sarah Johnson', '+1-555-123-4567', 'Elderly mother with heart condition', now() - interval '5 days'),
        ('Michael Davis', '+1-555-987-6543', 'Father with mobility issues', now() - interval '3 days')
) AS sentinel_data(full_name, phone, notes, created_at)
WHERE u.email = 'john@gmail.com'
  AND NOT EXISTS (
    SELECT 1 FROM public.sentinels s 
    WHERE s.owner_guardian_id = u.id 
    AND s.full_name = sentinel_data.full_name
  );

-- Insert sample devices for the sentinels we just created
INSERT INTO public.devices (hw_uid, model, sentinel_id, last_seen_at, available, created_at)
SELECT 
    device_data.hw_uid,
    device_data.model,
    s.id,
    device_data.last_seen_at,
    false,
    device_data.created_at
FROM public.sentinels s
JOIN auth.users u ON u.id = s.owner_guardian_id
CROSS JOIN (
    VALUES 
        ('DEV001', 'SoteriaWatch Pro', 'Sarah Johnson', now() - interval '2 hours', now() - interval '4 days'),
        ('DEV002', 'SoteriaWatch Lite', 'Sarah Johnson', now() - interval '1 hour', now() - interval '4 days'),
        ('DEV003', 'SoteriaWatch Pro', 'Michael Davis', now() - interval '30 minutes', now() - interval '2 days')
) AS device_data(hw_uid, model, sentinel_name, last_seen_at, created_at)
WHERE u.email = 'john@gmail.com'
  AND s.full_name = device_data.sentinel_name
  AND NOT EXISTS (
    SELECT 1 FROM public.devices d 
    WHERE d.hw_uid = device_data.hw_uid
  );