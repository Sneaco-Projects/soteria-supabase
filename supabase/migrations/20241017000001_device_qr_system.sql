-- Migration: Device QR Code System
-- Handles QR code generation and device activation via QR scanning

-- Create device_qr_codes table
CREATE TABLE IF NOT EXISTS device_qr_codes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    imei text NOT NULL UNIQUE,
    sim_number text NOT NULL,
    qr_code text NOT NULL UNIQUE, -- The QR code string/URL
    device_model text,
    notes text,
    
    -- Status and tracking
    generated_at timestamp with time zone NOT NULL DEFAULT now(),
    generated_by uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    activated_at timestamp with time zone,
    activated_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
    device_id uuid REFERENCES devices(id) ON DELETE SET NULL,
    
    -- Metadata
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_device_qr_codes_imei ON device_qr_codes(imei);
CREATE INDEX IF NOT EXISTS idx_device_qr_codes_qr_code ON device_qr_codes(qr_code);
CREATE INDEX IF NOT EXISTS idx_device_qr_codes_generated_by ON device_qr_codes(generated_by);
CREATE INDEX IF NOT EXISTS idx_device_qr_codes_activated_by ON device_qr_codes(activated_by);

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

-- Users can only see QR codes they've activated (for reference)
CREATE POLICY "qr_codes_user_activated" ON device_qr_codes 
FOR SELECT TO authenticated 
USING (activated_by = auth.uid());

-- Public access for QR code activation (needed for scanning)
CREATE POLICY "qr_codes_public_activate" ON device_qr_codes 
FOR SELECT TO authenticated 
USING (activated_at IS NULL); -- Only unactivated codes

-- Create view for architect dashboard
CREATE OR REPLACE VIEW v_architect_qr_overview AS
SELECT 
    qr.id,
    qr.imei,
    qr.sim_number,
    qr.qr_code,
    qr.device_model,
    qr.notes,
    qr.generated_at,
    qr.activated_at,
    qr.device_id,
    
    -- Generator info
    gen.email as generated_by_email,
    gen.display_name as generated_by_name,
    
    -- Activator info
    act.email as activated_by_email,
    act.display_name as activated_by_name,
    
    -- Device info if activated
    d.sentinel_id,
    s.full_name as sentinel_name,
    
    CASE 
        WHEN qr.activated_at IS NULL THEN 'pending'
        WHEN qr.activated_at IS NOT NULL AND d.sentinel_id IS NULL THEN 'activated'
        WHEN qr.activated_at IS NOT NULL AND d.sentinel_id IS NOT NULL THEN 'paired'
        ELSE 'unknown'
    END as status

FROM device_qr_codes qr
LEFT JOIN profiles gen ON gen.id = qr.generated_by
LEFT JOIN profiles act ON act.id = qr.activated_by
LEFT JOIN devices d ON d.id = qr.device_id
LEFT JOIN sentinels s ON s.id = d.sentinel_id
ORDER BY qr.generated_at DESC;

-- Grant permissions
GRANT ALL ON device_qr_codes TO authenticated;
GRANT SELECT ON v_architect_qr_overview TO authenticated;

-- Update trigger for updated_at
CREATE OR REPLACE TRIGGER trg_device_qr_codes_updated_at
    BEFORE UPDATE ON device_qr_codes
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Comments
COMMENT ON TABLE device_qr_codes IS 'Stores QR code generation data for device activation';
COMMENT ON COLUMN device_qr_codes.qr_code IS 'Unique QR code string that encodes activation URL';
COMMENT ON COLUMN device_qr_codes.imei IS 'Device IMEI/HW_UID for hardware identification';
COMMENT ON COLUMN device_qr_codes.sim_number IS 'SIM card number for cellular connectivity';