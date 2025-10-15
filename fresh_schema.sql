-- ============================================
-- SOTERIA FRESH SCHEMA
-- Complete database schema for local testing
-- ============================================

-- Create custom types first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'device_event_type') THEN
        CREATE TYPE public.device_event_type AS ENUM (
            'PAIR_OK',
            'UNPAIR_OK', 
            'UNPAIR_DENY',
            'BTN_SHORT',
            'SOS',
            'OTW',
            'IN_SMS',
            'HEALTH'
        );
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role') THEN
        CREATE TYPE public.user_role AS ENUM (
            'warden',
            'provider', 
            'architect'
        );
    END IF;
END
$$;

-- Helper functions
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_availability_on_assignment()
RETURNS TRIGGER AS $$
BEGIN
    -- Set available = false when sentinel_id is assigned
    IF NEW.sentinel_id IS NOT NULL AND OLD.sentinel_id IS NULL THEN
        NEW.available = false;
    END IF;
    -- Set available = true when sentinel_id is cleared
    IF NEW.sentinel_id IS NULL AND OLD.sentinel_id IS NOT NULL THEN
        NEW.available = true;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.touch_device_last_seen()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.devices 
    SET last_seen_at = NOW()
    WHERE id = NEW.device_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION public.set_sentinel_owner_from_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- This would normally get owner from auth context
    -- For local testing, we'll just use the provided owner_guardian_id
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create profiles table (simplified for local testing)
CREATE TABLE IF NOT EXISTS public.profiles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    email text NULL,
    display_name text NULL,
    role public.user_role NOT NULL DEFAULT 'warden'::user_role,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT profiles_pkey PRIMARY KEY (id),
    CONSTRAINT profiles_email_key UNIQUE (email)
);

-- Create providers table
CREATE TABLE IF NOT EXISTS public.providers (
    user_id uuid NOT NULL,
    display_name text NULL,
    active boolean NOT NULL DEFAULT true,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT providers_pkey PRIMARY KEY (user_id),
    CONSTRAINT providers_user_id_fkey FOREIGN KEY (user_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Create sentinels table  
CREATE TABLE IF NOT EXISTS public.sentinels (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    owner_guardian_id uuid NOT NULL,
    full_name text NOT NULL,
    phone text NULL,
    notes text NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT sentinels_pkey PRIMARY KEY (id),
    CONSTRAINT sentinels_owner_guardian_id_fkey FOREIGN KEY (owner_guardian_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Create devices table
CREATE TABLE IF NOT EXISTS public.devices (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    hw_uid text NOT NULL,
    model text NULL,
    sentinel_id uuid NULL,
    last_seen_at timestamp with time zone NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    device_token text NULL,
    available boolean NOT NULL DEFAULT false,
    phone text NULL,
    CONSTRAINT devices_pkey PRIMARY KEY (id),
    CONSTRAINT devices_device_token_key UNIQUE (device_token),
    CONSTRAINT devices_hw_uid_key UNIQUE (hw_uid),
    CONSTRAINT devices_sentinel_id_fkey FOREIGN KEY (sentinel_id) REFERENCES sentinels (id) ON DELETE SET NULL
);

-- Create device_claims table
CREATE TABLE IF NOT EXISTS public.device_claims (
    code text NOT NULL,
    hw_uid text NULL,
    sentinel_id uuid NOT NULL,
    expires_at timestamp with time zone NOT NULL,
    used_at timestamp with time zone NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT device_claims_pkey PRIMARY KEY (code),
    CONSTRAINT device_claims_sentinel_id_fkey FOREIGN KEY (sentinel_id) REFERENCES sentinels (id) ON DELETE CASCADE
);

-- Create device_events table
CREATE TABLE IF NOT EXISTS public.device_events (
    id bigserial NOT NULL,
    device_id uuid NOT NULL,
    sentinel_id uuid NULL,
    event_type public.device_event_type NOT NULL,
    payload jsonb NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT device_events_pkey PRIMARY KEY (id),
    CONSTRAINT device_events_device_id_fkey FOREIGN KEY (device_id) REFERENCES devices (id) ON DELETE CASCADE,
    CONSTRAINT device_events_sentinel_id_fkey FOREIGN KEY (sentinel_id) REFERENCES sentinels (id) ON DELETE SET NULL
);

-- Create events table (legacy/simple events)
CREATE TABLE IF NOT EXISTS public.events (
    id bigserial NOT NULL,
    device_id text NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    type text NOT NULL,
    message text NULL,
    lat double precision NULL,
    lng double precision NULL,
    extras jsonb NULL,
    CONSTRAINT events_pkey PRIMARY KEY (id)
);

-- Create provider_assignments table
CREATE TABLE IF NOT EXISTS public.provider_assignments (
    provider_id uuid NOT NULL,
    sentinel_id uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    CONSTRAINT provider_assignments_pkey PRIMARY KEY (provider_id, sentinel_id),
    CONSTRAINT provider_assignments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers (user_id) ON DELETE CASCADE,
    CONSTRAINT provider_assignments_sentinel_id_fkey FOREIGN KEY (sentinel_id) REFERENCES sentinels (id) ON DELETE CASCADE
);

-- Create warden_provider_assignments table
CREATE TABLE IF NOT EXISTS public.warden_provider_assignments (
    warden_id uuid NOT NULL,
    provider_id uuid NOT NULL,
    assigned_by uuid NOT NULL,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    active boolean NOT NULL DEFAULT true,
    notes text NULL,
    CONSTRAINT warden_provider_assignments_pkey PRIMARY KEY (warden_id, provider_id),
    CONSTRAINT warden_provider_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES profiles (id) ON DELETE CASCADE,
    CONSTRAINT warden_provider_assignments_provider_id_fkey FOREIGN KEY (provider_id) REFERENCES providers (user_id) ON DELETE CASCADE,
    CONSTRAINT warden_provider_assignments_warden_id_fkey FOREIGN KEY (warden_id) REFERENCES profiles (id) ON DELETE CASCADE
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_claims_sentinel ON public.device_claims USING btree (sentinel_id);
CREATE INDEX IF NOT EXISTS idx_claims_expires ON public.device_claims USING btree (expires_at);
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_claims_unused_per_sentinel ON public.device_claims USING btree (sentinel_id) WHERE (used_at IS NULL);
CREATE UNIQUE INDEX IF NOT EXISTS uq_device_claims_unused_per_hw ON public.device_claims USING btree (COALESCE(hw_uid, ''::text)) WHERE (used_at IS NULL);
CREATE INDEX IF NOT EXISTS idx_claims_unused ON public.device_claims USING btree (expires_at) WHERE (used_at IS NULL);
CREATE INDEX IF NOT EXISTS device_claims_unused_idx ON public.device_claims USING btree (code) WHERE (used_at IS NULL);

CREATE INDEX IF NOT EXISTS idx_events_sentinel_created_id ON public.device_events USING btree (sentinel_id, created_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS idx_events_sentinel_type_created ON public.device_events USING btree (sentinel_id, event_type, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_events_device ON public.device_events USING btree (device_id);
CREATE INDEX IF NOT EXISTS idx_events_sentinel_created ON public.device_events USING btree (sentinel_id, created_at DESC);
CREATE INDEX IF NOT EXISTS device_events_device_id_created_at_idx ON public.device_events USING btree (device_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_devices_sentinel_id ON public.devices USING btree (sentinel_id);
CREATE INDEX IF NOT EXISTS idx_devices_hw_available ON public.devices USING btree (hw_uid, available);

CREATE INDEX IF NOT EXISTS idx_warden_provider_assignments_warden ON public.warden_provider_assignments USING btree (warden_id);
CREATE INDEX IF NOT EXISTS idx_warden_provider_assignments_provider ON public.warden_provider_assignments USING btree (provider_id);
CREATE INDEX IF NOT EXISTS idx_warden_provider_assignments_active ON public.warden_provider_assignments USING btree (active) WHERE (active = true);

-- Create triggers
DROP TRIGGER IF EXISTS trg_touch_device_last_seen ON public.device_events;
CREATE TRIGGER trg_touch_device_last_seen
    AFTER INSERT ON device_events 
    FOR EACH ROW
    EXECUTE FUNCTION touch_device_last_seen();

DROP TRIGGER IF EXISTS trg_devices_set_availability ON public.devices;
CREATE TRIGGER trg_devices_set_availability 
    BEFORE INSERT OR UPDATE ON devices 
    FOR EACH ROW
    EXECUTE FUNCTION set_availability_on_assignment();

DROP TRIGGER IF EXISTS trg_devices_updated_at ON public.devices;
CREATE TRIGGER trg_devices_updated_at 
    BEFORE UPDATE ON devices 
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_profiles_updated_at ON public.profiles;
CREATE TRIGGER trg_profiles_updated_at 
    BEFORE UPDATE ON profiles 
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_provider_assignments_updated_at ON public.provider_assignments;
CREATE TRIGGER trg_provider_assignments_updated_at 
    BEFORE UPDATE ON provider_assignments 
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_providers_updated_at ON public.providers;
CREATE TRIGGER trg_providers_updated_at 
    BEFORE UPDATE ON providers 
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_sentinels_set_owner ON public.sentinels;
CREATE TRIGGER trg_sentinels_set_owner 
    BEFORE INSERT ON sentinels 
    FOR EACH ROW
    EXECUTE FUNCTION set_sentinel_owner_from_auth();

DROP TRIGGER IF EXISTS trg_sentinels_updated_at ON public.sentinels;  
CREATE TRIGGER trg_sentinels_updated_at 
    BEFORE UPDATE ON sentinels 
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_warden_provider_assignments_updated_at ON public.warden_provider_assignments;
CREATE TRIGGER trg_warden_provider_assignments_updated_at 
    BEFORE UPDATE ON warden_provider_assignments 
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- Insert test data for local development
INSERT INTO public.profiles (id, email, display_name, role) VALUES 
    ('00000000-0000-0000-0000-000000000001', 'test@guardian.com', 'Test Guardian', 'warden'),
    ('00000000-0000-0000-0000-000000000002', 'test@provider.com', 'Test Provider', 'provider')
ON CONFLICT (id) DO NOTHING;

INSERT INTO public.sentinels (id, owner_guardian_id, full_name, phone) VALUES 
    ('11111111-1111-1111-1111-111111111111', '00000000-0000-0000-0000-000000000001', 'Test Sentinel', '+1234567890')
ON CONFLICT (id) DO NOTHING;

-- Insert a test device for pairing
INSERT INTO public.devices (hw_uid, model, available) VALUES 
    ('soteria-device-001', 'ESP32+A7670+WiFi', true)
ON CONFLICT (hw_uid) DO NOTHING;