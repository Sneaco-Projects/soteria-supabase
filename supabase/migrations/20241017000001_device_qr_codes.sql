-- Migration: Device QR Code System
-- Creates QR code generation and activation tracking for devices

-- Create device_qr_codes table
CREATE TABLE IF NOT EXISTS device_qr_codes (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    imei text NOT NULL,
    sim_number text NOT NULL,
    qr_code text, -- QR code identifier (matches existing code)
    qr_token text NOT NULL UNIQUE, -- Unique token embedded in QR code
    qr_url text, -- Full QR code URL/data
    device_model text, -- Device model info
    generated_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    activated_at timestamp with time zone,
    activated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
    status text NOT NULL DEFAULT 'generated' CHECK (status IN ('generated', 'activated', 'expired')),
    expires_at timestamp with time zone NOT NULL DEFAULT (now() + interval '30 days'),
    notes text,
    
    CONSTRAINT device_qr_codes_pkey PRIMARY KEY (id)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_qr_codes_imei ON device_qr_codes(imei);
CREATE INDEX IF NOT EXISTS idx_device_qr_codes_qr_token ON device_qr_codes(qr_token);
CREATE INDEX IF NOT EXISTS idx_device_qr_codes_status ON device_qr_codes(status);
CREATE INDEX IF NOT EXISTS idx_device_qr_codes_created_by ON device_qr_codes(created_by);

-- Create view for architect dashboard (matching existing code structure)
CREATE OR REPLACE VIEW v_architect_qr_overview AS
SELECT 
    qr.id,
    qr.imei,
    qr.sim_number,
    qr.qr_token as qr_code,
    qr.imei as device_model, -- Use IMEI as model for now
    qr.notes,
    qr.created_at as generated_at,
    qr.activated_at,
    qr.device_id,
    creator.display_name as generated_by_name,
    activator.display_name as activated_by_name,
    s.full_name as sentinel_name,
    CASE 
        WHEN qr.status = 'activated' AND d.sentinel_id IS NOT NULL THEN 'paired'
        WHEN qr.status = 'activated' THEN 'activated'
        ELSE 'pending'
    END as status
FROM device_qr_codes qr
LEFT JOIN profiles creator ON creator.id = qr.generated_by
LEFT JOIN profiles activator ON activator.id = qr.activated_by
LEFT JOIN devices d ON d.id = qr.device_id
LEFT JOIN sentinels s ON s.id = d.sentinel_id
ORDER BY qr.created_at DESC;

-- RLS Policies
ALTER TABLE device_qr_codes ENABLE ROW LEVEL SECURITY;

-- Architects can manage all QR codes
CREATE POLICY "qr_codes_architect_all" ON device_qr_codes 
FOR ALL TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.role = 'architect'
    )
);

-- Users can only see QR codes they activated
CREATE POLICY "qr_codes_user_activated" ON device_qr_codes 
FOR SELECT TO authenticated 
USING (activated_by = auth.uid());

-- View permissions
GRANT SELECT ON v_device_qr_overview TO authenticated;
ALTER VIEW v_device_qr_overview OWNER TO postgres;

-- Function to generate unique QR token
CREATE OR REPLACE FUNCTION generate_qr_token()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
    token text;
    exists_check boolean;
BEGIN
    LOOP
        -- Generate a random token (8 characters, alphanumeric)
        token := upper(substring(replace(gen_random_uuid()::text, '-', ''), 1, 8));
        
        -- Check if token already exists
        SELECT EXISTS(SELECT 1 FROM device_qr_codes WHERE qr_token = token) INTO exists_check;
        
        -- Exit loop if token is unique
        IF NOT exists_check THEN
            EXIT;
        END IF;
    END LOOP;
    
    RETURN token;
END;
$$;

-- Function to auto-expire old QR codes
CREATE OR REPLACE FUNCTION expire_old_qr_codes()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
    UPDATE device_qr_codes 
    SET status = 'expired'
    WHERE status = 'generated' 
    AND expires_at < now();
END;
$$;