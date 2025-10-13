-- Add sample device events/incidents that look realistic
-- These will appear as if they came from the actual devices

DO $$
DECLARE
    john_user_id UUID;
    sarah_sentinel_id UUID;
    michael_sentinel_id UUID;
    sarah_dev1_id UUID;
    sarah_dev2_id UUID;
    michael_dev_id UUID;
BEGIN
    -- Get john's user ID
    SELECT id INTO john_user_id FROM auth.users WHERE email = 'john@gmail.com';
    
    IF john_user_id IS NULL THEN
        RAISE NOTICE 'User john@gmail.com not found, skipping sample incidents';
        RETURN;
    END IF;
    
    -- Get sentinel IDs
    SELECT id INTO sarah_sentinel_id FROM sentinels 
    WHERE owner_guardian_id = john_user_id AND full_name = 'Sarah Johnson';
    
    SELECT id INTO michael_sentinel_id FROM sentinels 
    WHERE owner_guardian_id = john_user_id AND full_name = 'Michael Davis';
    
    -- Get device IDs
    SELECT id INTO sarah_dev1_id FROM devices 
    WHERE hw_uid = 'DEV001' AND sentinel_id = sarah_sentinel_id;
    
    SELECT id INTO sarah_dev2_id FROM devices 
    WHERE hw_uid = 'DEV002' AND sentinel_id = sarah_sentinel_id;
    
    SELECT id INTO michael_dev_id FROM devices 
    WHERE hw_uid = 'DEV003' AND sentinel_id = michael_sentinel_id;
    
    -- Insert sample incidents/events
    
    -- Recent SOS from Sarah (2 hours ago)
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '2 hours',
        'SOS',
        jsonb_build_object(
            'button_pressed', true,
            'location', jsonb_build_object(
                'lat', 40.7589,
                'lng', -73.9851,
                'accuracy', 12,
                'address', '123 Main St, New York, NY 10001'
            ),
            'battery_level', 78,
            'signal_strength', -65
        ),
        sarah_dev1_id,
        sarah_sentinel_id
    );
    
    -- OTW response from Sarah (1.5 hours ago)
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '90 minutes',
        'OTW',
        jsonb_build_object(
            'response_to_sos', true,
            'location', jsonb_build_object(
                'lat', 40.7614,
                'lng', -73.9776,
                'accuracy', 8,
                'address', 'Central Park West, New York, NY'
            ),
            'battery_level', 76,
            'estimated_arrival', '15 minutes'
        ),
        sarah_dev1_id,
        sarah_sentinel_id
    );
    
    -- Button press from Michael (45 minutes ago) 
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '45 minutes',
        'BTN_SHORT',
        jsonb_build_object(
            'button_type', 'check_in',
            'location', jsonb_build_object(
                'lat', 40.7505,
                'lng', -73.9934,
                'accuracy', 15,
                'address', '456 Broadway, New York, NY 10013'
            ),
            'battery_level', 65,
            'signal_strength', -72
        ),
        michael_dev_id,
        michael_sentinel_id
    );
    
    -- Health check from Sarah's second device (30 minutes ago)
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '30 minutes',
        'HEALTH',
        jsonb_build_object(
            'heart_rate', 72,
            'steps_today', 8420,
            'battery_level', 82,
            'last_sync', now() - interval '5 minutes',
            'device_temp', 98.6
        ),
        sarah_dev2_id,
        sarah_sentinel_id
    );
    
    -- Recent SOS incident from Michael (15 minutes ago) - device detected issue
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '15 minutes',
        'SOS',
        jsonb_build_object(
            'alert_type', 'automatic_trigger',
            'trigger_reason', 'no_movement_detected',
            'duration_minutes', 45,
            'location', jsonb_build_object(
                'lat', 40.7449,
                'lng', -73.9897,
                'accuracy', 10,
                'address', '789 5th Avenue, New York, NY 10022'
            ),
            'battery_level', 63,
            'last_movement', now() - interval '45 minutes'
        ),
        michael_dev_id,
        michael_sentinel_id
    );
    
    -- GPS assistance request from Sarah (10 minutes ago)
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '10 minutes',
        'AGPS_BOOST',
        jsonb_build_object(
            'reason', 'weak_signal',
            'satellites_visible', 3,
            'location_accuracy', 45,
            'battery_level', 75,
            'boost_duration', '2 minutes'
        ),
        sarah_dev1_id,
        sarah_sentinel_id
    );
    
    -- Older pairing event from yesterday (for history)
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '1 day',
        'PAIR_OK',
        jsonb_build_object(
            'paired_with', 'Sarah Johnson',
            'pairing_method', 'QR_code',
            'device_model', 'SoteriaWatch Pro',
            'firmware_version', '2.1.4',
            'battery_level', 95
        ),
        sarah_dev1_id,
        sarah_sentinel_id
    );
    
    -- GPS search event from Michael (5 minutes ago)
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '5 minutes',
        'GPS_SEARCH',
        jsonb_build_object(
            'search_duration', 120,
            'satellites_found', 6,
            'accuracy_achieved', 8,
            'battery_level', 61,
            'location', jsonb_build_object(
                'lat', 40.7455,
                'lng', -73.9903,
                'accuracy', 8
            )
        ),
        michael_dev_id,
        michael_sentinel_id
    );
    
    -- Incoming SMS acknowledgment from Sarah (25 minutes ago)
    INSERT INTO device_events (created_at, event_type, payload, device_id, sentinel_id)
    VALUES (
        now() - interval '25 minutes',
        'IN_SMS',
        jsonb_build_object(
            'message_type', 'check_in_request',
            'from_number', '+1-555-0123',
            'response_sent', true,
            'battery_level', 77,
            'signal_strength', -68
        ),
        sarah_dev2_id,
        sarah_sentinel_id
    );
    
    -- Update device last_seen_at to reflect recent activity
    UPDATE devices 
    SET last_seen_at = now() - interval '10 minutes'
    WHERE id = sarah_dev1_id;
    
    UPDATE devices 
    SET last_seen_at = now() - interval '30 minutes'
    WHERE id = sarah_dev2_id;
    
    UPDATE devices 
    SET last_seen_at = now() - interval '15 minutes'
    WHERE id = michael_dev_id;
    
    RAISE NOTICE 'Successfully created sample incidents for Sarah Johnson and Michael Davis';
    
END $$;