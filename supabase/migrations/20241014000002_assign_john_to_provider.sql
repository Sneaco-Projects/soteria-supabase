-- Ensure john@gmail.com is assigned to a provider so the sample data is visible
-- This will create the provider assignment needed to see the sentinel data

DO $$
DECLARE
    john_user_id uuid;
    provider_user_id uuid;
    architect_user_id uuid;
BEGIN
    -- Get john@gmail.com's user ID
    SELECT id INTO john_user_id 
    FROM auth.users 
    WHERE email = 'john@gmail.com';
    
    -- Get a provider user ID (use provider@soteria.io if it exists)
    SELECT id INTO provider_user_id 
    FROM auth.users 
    WHERE email = 'provider@soteria.io'
    LIMIT 1;
    
    -- Get an architect user ID (use architect@soteria.io if it exists)
    SELECT id INTO architect_user_id 
    FROM auth.users 
    WHERE email = 'architect@soteria.io'
    LIMIT 1;
    
    -- Create assignment if all users exist
    IF john_user_id IS NOT NULL AND provider_user_id IS NOT NULL AND architect_user_id IS NOT NULL THEN
        
        -- Insert warden-provider assignment
        INSERT INTO public.warden_provider_assignments (warden_id, provider_id, assigned_by, notes, active)
        VALUES (john_user_id, provider_user_id, architect_user_id, 'Sample assignment for testing sentinel display', true)
        ON CONFLICT (warden_id, provider_id) DO UPDATE SET
            active = true,
            notes = 'Sample assignment for testing sentinel display',
            updated_at = now();
            
        RAISE NOTICE 'Created provider assignment: john@gmail.com -> provider@soteria.io';
        
    ELSE
        RAISE NOTICE 'Missing users - john: %, provider: %, architect: %', 
            CASE WHEN john_user_id IS NOT NULL THEN 'found' ELSE 'missing' END,
            CASE WHEN provider_user_id IS NOT NULL THEN 'found' ELSE 'missing' END,
            CASE WHEN architect_user_id IS NOT NULL THEN 'found' ELSE 'missing' END;
    END IF;
    
END $$;