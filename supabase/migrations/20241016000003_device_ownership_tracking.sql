-- Migration: Add device ownership tracking
-- This links devices to users for better tracking and management

-- Add owner_id column to devices table to track who purchased/owns the device
ALTER TABLE devices ADD COLUMN IF NOT EXISTS owner_id uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_devices_owner_id ON devices(owner_id);

-- Update RLS policies to allow owners to see their devices
CREATE POLICY "devices_read_owner_direct" ON devices FOR SELECT TO authenticated 
USING (owner_id = auth.uid());

-- Update RLS policies to allow owners to manage their devices
CREATE POLICY "devices_update_owner_direct" ON devices FOR UPDATE TO authenticated 
USING (owner_id = auth.uid()) WITH CHECK (owner_id = auth.uid());

-- Create view for user device ownership
CREATE OR REPLACE VIEW v_user_devices AS
SELECT 
    d.id,
    d.hw_uid,
    d.model,
    d.available,
    d.sentinel_id,
    s.full_name as sentinel_name,
    d.last_seen_at,
    d.created_at,
    d.owner_id,
    p.email as owner_email,
    p.display_name as owner_name,
    dr.status as registration_status,
    dr.customer_name,
    dr.purchase_order
FROM devices d
LEFT JOIN profiles p ON p.id = d.owner_id
LEFT JOIN sentinels s ON s.id = d.sentinel_id
LEFT JOIN device_registrations dr ON dr.imei = d.hw_uid
ORDER BY d.created_at DESC;

-- Grant access to the view
GRANT SELECT ON v_user_devices TO authenticated;

-- RLS for the view (inherits from underlying tables)
ALTER VIEW v_user_devices OWNER TO postgres;