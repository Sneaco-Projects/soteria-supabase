-- Migration: Add device pre-registration system
-- This allows architects to pre-register devices before shipping
-- and auto-activate them when customers register

-- Create device_registrations table for pre-shipped devices
CREATE TABLE IF NOT EXISTS public.device_registrations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    hw_uid text NOT NULL UNIQUE,
    model text NOT NULL,
    batch_id text NULL,
    
    -- Shipping info
    customer_name text NOT NULL,
    customer_email text NOT NULL,
    customer_phone text NOT NULL,
    shipping_address text NOT NULL,
    
    -- Status tracking
    status text NOT NULL DEFAULT 'prepared', -- prepared, shipped, registered, activated
    prepared_at timestamp with time zone NOT NULL DEFAULT now(),
    shipped_at timestamp with time zone NULL,
    registered_at timestamp with time zone NULL,
    activated_at timestamp with time zone NULL,
    
    -- Staff tracking
    prepared_by uuid NOT NULL REFERENCES profiles(id),
    registered_by uuid NULL REFERENCES profiles(id),
    
    -- Additional info
    notes text NULL,
    tracking_number text NULL,
    
    CONSTRAINT device_registrations_pkey PRIMARY KEY (id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_registrations_hw_uid ON device_registrations(hw_uid);
CREATE INDEX IF NOT EXISTS idx_device_registrations_status ON device_registrations(status);
CREATE INDEX IF NOT EXISTS idx_device_registrations_customer_email ON device_registrations(customer_email);

-- Add RLS policies
ALTER TABLE device_registrations ENABLE ROW LEVEL SECURITY;

-- Architects can manage all device registrations
CREATE POLICY "Architects can manage device registrations" ON device_registrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'architect'
        )
    );

-- Users can view their own device registration by email
CREATE POLICY "Users can view own device registrations" ON device_registrations
    FOR SELECT USING (
        customer_email = (
            SELECT email FROM auth.users WHERE id = auth.uid()
        )
    );

-- Add foreign key to link devices with registrations
ALTER TABLE devices ADD COLUMN IF NOT EXISTS registration_id uuid REFERENCES device_registrations(id);

-- Update devices table to track registration status
ALTER TABLE devices ADD COLUMN IF NOT EXISTS auto_activated boolean DEFAULT false;

-- Create view for architect dashboard
CREATE OR REPLACE VIEW v_device_registration_overview AS
SELECT 
    dr.id,
    dr.hw_uid,
    dr.model,
    dr.customer_name,
    dr.customer_email,
    dr.customer_phone,
    dr.status,
    dr.prepared_at,
    dr.shipped_at,
    dr.registered_at,
    dr.activated_at,
    dr.tracking_number,
    dr.notes,
    p.display_name as prepared_by_name,
    p2.display_name as registered_by_name,
    d.id as device_id,
    d.available as device_available,
    d.sentinel_id as device_assigned_to
FROM device_registrations dr
LEFT JOIN profiles p ON dr.prepared_by = p.id
LEFT JOIN profiles p2 ON dr.registered_by = p2.id
LEFT JOIN devices d ON dr.id = d.registration_id
ORDER BY dr.prepared_at DESC;

-- Grant permissions on view
GRANT SELECT ON v_device_registration_overview TO authenticated;