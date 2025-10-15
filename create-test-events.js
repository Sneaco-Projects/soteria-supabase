// Create test events with location data
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://jzcqjxdieiecsmmxihkl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Y3FqeGRpZWllY3NtbXhpaGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjI3MDUsImV4cCI6MjA3MzMzODcwNX0.4lIFfcKVcz4z0K_u_H8IycO-bcxztSstSYgvZD0tV7A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTestEvents() {
  console.log('🎯 Creating test events with location data...');
  
  // Get device ID
  const { data: devices, error: deviceError } = await supabase
    .from('devices')
    .select('id, sentinel_id')
    .limit(1);
    
  if (deviceError || !devices || devices.length === 0) {
    console.error('❌ No devices found. Make sure you have a device in the database.');
    return;
  }
  
  const device = devices[0];
  console.log(`📱 Using device: ${device.id}`);
  
  // Test events with location data (Philippines coordinates)
  const testEvents = [
    {
      device_id: device.id,
      sentinel_id: device.sentinel_id,
      event_type: 'SOS',
      payload: {
        message: 'Test SOS Emergency',
        lat: 14.823506,
        lng: 120.279089,
        battery_level: 87.5,
        signal_strength: 18
      }
    },
    {
      device_id: device.id,
      sentinel_id: device.sentinel_id,
      event_type: 'BTN_SHORT',
      payload: {
        message: 'Test button press',
        lat: 14.823506,
        lng: 120.279089,
        battery_level: 85.2,
        signal_strength: 20
      }
    },
    {
      device_id: device.id,
      sentinel_id: device.sentinel_id,
      event_type: 'HEALTH',
      payload: {
        message: 'Test status ping',
        lat: 14.823506,
        lng: 120.279089,
        battery_level: 82.1,
        signal_strength: 16
      }
    },
    {
      device_id: device.id,
      sentinel_id: device.sentinel_id,
      event_type: 'OTW',
      payload: {
        message: 'Guardian responding - test',
        lat: 14.823506,
        lng: 120.279089
      }
    },
    {
      device_id: device.id,
      sentinel_id: device.sentinel_id,
      event_type: 'HEALTH',
      payload: {
        message: 'Regular health check - no location'
        // No lat/lng - this won't have "Open in Maps" button
      }
    }
  ];
  
  console.log(`📊 Inserting ${testEvents.length} test events...`);
  
  const { data, error } = await supabase
    .from('device_events')
    .insert(testEvents)
    .select();
    
  if (error) {
    console.error('❌ Error creating test events:', error);
    return;
  }
  
  console.log(`✅ Created ${data?.length || 0} test events successfully!`);
  console.log('\n🎉 Now check your provider dashboard Events tab:');
  console.log('   - Events with coordinates will show "Open in Maps" buttons');
  console.log('   - Events without coordinates will show only the event details');
  console.log('\n🗺️ Expected "Open in Maps" buttons for:');
  console.log('   - SOS event (14.823506, 120.279089)');
  console.log('   - BTN_SHORT event (14.823506, 120.279089)'); 
  console.log('   - HEALTH event with status ping (14.823506, 120.279089)');
  console.log('   - OTW event (14.823506, 120.279089)');
  console.log('\n📍 No "Open in Maps" button for:');
  console.log('   - HEALTH event without location data');
}

createTestEvents().catch(console.error);