-- ============================================
-- SOTERIA DATABASE RESET SCRIPT
-- Use this to clear all events and start fresh testing
-- ============================================

-- For Local Docker Database:
-- docker exec -i supabase_db_Soteria-Supabase psql -U postgres -d postgres -c "DELETE FROM device_events; DELETE FROM events; DELETE FROM device_claims WHERE used_at IS NOT NULL;"

-- 1. Delete all events (this will cascade and clean event data)
DELETE FROM device_events;
DELETE FROM events;

-- 2. Clear used device claims (keep unused ones for testing)
DELETE FROM device_claims WHERE used_at IS NOT NULL;

-- 3. Reset device assignments (make devices available again)
UPDATE devices SET sentinel_id = NULL, device_token = NULL, available = true WHERE sentinel_id IS NOT NULL;

-- 4. Reset sequences for clean IDs
ALTER SEQUENCE device_events_id_seq RESTART WITH 1;
ALTER SEQUENCE events_id_seq RESTART WITH 1;

-- 5. Verify all data is cleared
SELECT 'device_events' as table_name, COUNT(*) as record_count FROM device_events
UNION ALL
SELECT 'events', COUNT(*) FROM events
UNION ALL  
SELECT 'used_claims', COUNT(*) FROM device_claims WHERE used_at IS NOT NULL
UNION ALL
SELECT 'assigned_devices', COUNT(*) FROM devices WHERE sentinel_id IS NOT NULL;

-- This should return 0 for all tables after running the deletes above