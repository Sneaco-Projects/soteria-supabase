// Test script to check events with location data
const { createClient } = require('@supabase/supabase-js');

// Your Supabase credentials
const supabaseUrl = 'https://jzcqjxdieiecsmmxihkl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6Y3FqeGRpZWllY3NtbXhpaGtsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc3NjI3MDUsImV4cCI6MjA3MzMzODcwNX0.4lIFfcKVcz4z0K_u_H8IycO-bcxztSstSYgvZD0tV7A';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEventsWithLocation() {
  console.log('🔍 Checking events for location data...');
  
  // Get recent events from device_events (not events table)
  const { data: events, error } = await supabase
    .from('device_events')
    .select('id, event_type, payload, created_at')
    .order('created_at', { ascending: false })
    .limit(10);
    
  // Also check the legacy events table
  const { data: legacyEvents, error: legacyError } = await supabase
    .from('events')
    .select('id, type, lat, lng, message, extras, created_at')
    .order('created_at', { ascending: false })
    .limit(5);
    
  // Check if the button event went to legacy table
  console.log('\n🔍 Checking for button events in legacy events table...');
    
  if (error) {
    console.error('❌ Error fetching events:', error);
    return;
  }
  
  console.log(`📊 Found ${events?.length || 0} recent device_events`);
  console.log(`📊 Found ${legacyEvents?.length || 0} recent legacy events`);
  
  if (legacyEvents && legacyEvents.length > 0) {
    console.log('\n📋 Legacy events table (direct lat/lng columns):');
    legacyEvents.forEach((event, index) => {
      console.log(`   ${index + 1}. Type: ${event.type}, Location: ${event.lat ? `${event.lat}, ${event.lng}` : 'None'}`);
    });
  }
  
  if (!events || events.length === 0) {
    console.log('⚠️ No device_events found. Try generating some events first:');
    console.log('   - Send "STATUS" SMS to device (creates device_events with JSONB payload)');
    console.log('   - Press button on ESP32 device (creates device_events with JSONB payload)'); 
    console.log('   - Send "OTW" SMS to device (creates device_events with JSONB payload)');
    return;
  }
  
  let eventsWithLocation = 0;
  
  events.forEach((event, index) => {
    console.log(`\n📅 Event ${index + 1}:`);
    console.log(`   Type: ${event.event_type}`);
    console.log(`   Created: ${event.created_at}`);
    console.log(`   Payload:`, event.payload);
    
    const payload = event.payload || {};
    const hasLocation = payload.lat && payload.lon;
    
    if (hasLocation) {
      eventsWithLocation++;
      console.log(`   🗺️ HAS LOCATION: ${payload.lat}, ${payload.lon}`);
      console.log('   ✅ "Open in Maps" button SHOULD appear for this event');
    } else {
      console.log('   📍 No location data - "Open in Maps" button will NOT appear');
    }
  });
  
  console.log(`\n📈 Summary:`);
  console.log(`   Total events: ${events.length}`);
  console.log(`   Events with location: ${eventsWithLocation}`);
  console.log(`   Events without location: ${events.length - eventsWithLocation}`);
  
  if (eventsWithLocation === 0) {
    console.log('\n🎯 To see "Open in Maps" buttons, generate location events:');
    console.log('   1. Send "STATUS" SMS to device (includes coordinates)');
    console.log('   2. Press device button (BTN_SHORT with coordinates)');
    console.log('   3. Long press device button (SOS with coordinates)');
    console.log('   4. Send "OTW" SMS to device (includes coordinates)');
  }
}

checkEventsWithLocation().catch(console.error);