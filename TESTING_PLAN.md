# 🧪 SOTERIA COMPLETE SYSTEM TESTING PLAN

## 🏗️ **PHASE 1: Architect Setup (Dashboard)**

### Step 1.1: Access Architect Dashboard
1. Open browser: `http://localhost:54323` (Supabase Studio)
2. Navigate to your deployed dashboard (or local Next.js if running)
3. Login as **Architect** role

### Step 1.2: Create Physical Device Inventory
1. Go to **Device Management** → **Add New Device**
2. Create device entry:
   - **HW UID**: `soteria-device-001` (matches ESP32 firmware)
   - **Model**: `ESP32+A7670+WiFi`
   - **Status**: `Available`
   - **Phone**: (leave blank for now)
3. **Save Device** - Device should appear in inventory as "Available"

### Step 1.3: Create/Verify Provider
1. Go to **Provider Management** → **Add Provider** 
2. Create provider account:
   - **Name**: `Emergency Response Provider`
   - **Email**: `provider@emergency.com`
   - **Status**: `Active`
3. **Save Provider**

### Step 1.4: Assign Device to Provider
1. Go to **Device Assignments**
2. Select device `soteria-device-001`
3. **Assign to Provider**: `Emergency Response Provider` 
4. **Confirm Assignment**
5. Device status should change to "Assigned to Provider"

## 🚑 **PHASE 2: Provider Setup (Dashboard)**

### Step 2.1: Access Provider Dashboard  
1. Login as **Provider** role (`provider@emergency.com`)
2. Should see assigned devices in inventory

### Step 2.2: Verify Device Inventory
1. Go to **My Devices** or **Inventory**
2. Should see `soteria-device-001` listed as "Available for Assignment"
3. Device should show as ready for warden assignment

## 👨‍💼 **PHASE 3: Warden/Guardian Setup (Dashboard)**

### Step 3.1: Create Warden Account
1. **As Architect**: Go to **User Management** → **Add Warden**
2. Create warden:
   - **Name**: `John Guardian` 
   - **Email**: `john@guardian.com`
   - **Phone**: `+639451458138` (or your test number)
   - **Role**: `Warden`
3. **Save Warden**

### Step 3.2: Assign Provider to Warden
1. **As Architect**: Go to **Provider Assignments**
2. **Assign Provider** `Emergency Response Provider` **to Warden** `John Guardian`
3. This allows the provider to monitor John's sentinels

### Step 3.3: Create Sentinel Profile
1. **As Warden** (`john@guardian.com`): Login to dashboard
2. Go to **My Sentinels** → **Add New Sentinel**
3. Create sentinel:
   - **Full Name**: `Test Sentinel`
   - **Relationship**: `Family Member`
   - **Phone**: (optional)
   - **Notes**: `Test device for emergency response`
4. **Save Sentinel** - Note the Sentinel ID for device pairing

## 🔧 **PHASE 4: Device Preparation & Pairing**

### Step 4.1: Flash ESP32 Firmware
1. **Flash Firmware**: Upload `esp32_debug_version.ino` to ESP32
2. **Check Serial Monitor** for startup sequence:
   ```
   ╔══════════════════════════════════════╗
   ║      SOTERIA ESP32 FIRMWARE         ║  
   ╚══════════════════════════════════════╝
   ```
3. **Verify Haptic Test**: Should see motor test patterns (short, medium, long)
4. **Confirm Connectivity**: WiFi + Cellular network connection
5. **Test SMS**: Automatic test SMS should be sent to admin number

### Step 4.2: Generate Pairing Code
1. **As Warden**: In dashboard, go to **Device Pairing**
2. **Select Sentinel**: `Test Sentinel`
3. **Select Device HW**: `soteria-device-001` (should be available)
4. **Generate Pairing Code** - You'll get an 8-character code (e.g., `ABC123XY`)
5. **Code expires in 10 minutes** - note the expiration time

### Step 4.3: Pair Device via SMS
1. **Send SMS to ESP32**: `PAIR ABC123XY` (use your actual code)
2. **Expected Response**:
   - **Haptic**: Short-Medium-Long pattern 
   - **SMS Reply**: `✅ SUCCESS: Device paired! Guardian: +639451458138`
   - **Dashboard**: Device should show as "Assigned to Sentinel"
   - **ESP32 Serial**: Should show pairing success

## 🧪 **PHASE 5: System Function Tests**

### Test 5.1: 🔘 Emergency Button Tests

**Short Press (Alert):**
1. **Quick press/release** button (< 1.5 seconds)
2. **Expected Haptic**: Short-Short → *pause 300ms* → Long (after SMS)
3. **Expected SMS**: `🚨 Button pressed! LAT: 14.823506, LNG: 120.279089`
4. **Dashboard Check**: New emergency event should appear with location
5. **Provider Alert**: Provider dashboard should show new alert

**Long Press (SOS):**
1. **Hold button** for 2+ seconds
2. **Expected Haptic**: Long-Short-Long-Short pattern
3. **Expected SMS**: `🚨 EMERGENCY SOS! LAT: 14.823506, LNG: 120.279089`
4. **Dashboard Check**: SOS event should appear (higher priority)
5. **Provider Alert**: Critical SOS notification

### Test 5.2: 📱 SMS Command Tests

**Basic Commands:**
- `TEST` → Response SMS + no special haptic
- `VIB` → **Medium** haptic + response SMS  
- `INFO` → Modem info printed + response SMS
- `PING` → **Short-pause-Short** haptic + status SMS with battery/signal

**Advanced Commands:**
- `OTW` (from guardian phone) → **Medium-Long** haptic + dashboard event
- `UNPAIR` (from guardian) → **Medium-Medium** haptic + device unpaired
- `UNPAIR` (from other phone) → **5x Short** haptic + denied message

### Test 5.3: 🚗 Guardian Response Workflow
1. **Trigger Emergency**: Press button on device
2. **Guardian Receives**: Emergency SMS with location
3. **Guardian Responds**: Reply `OTW` to device
4. **Device Confirms**: Medium-Long haptic pattern  
5. **Dashboard Updates**: Shows "Guardian En Route" status
6. **Provider Sees**: Updated response status in monitoring dashboard

### Test 5.4: 📊 Real-Time Monitoring
1. **Provider Dashboard**: Should show live device status
2. **Health Monitoring**: Device sends heartbeat every 60 seconds
3. **Event Feed**: All button presses, SMS commands appear in real-time
4. **Location Tracking**: GPS coordinates appear on map (if enabled)
5. **Battery/Signal**: Device health metrics update automatically

## Test Sequence

## 🎯 **PHASE 6: Advanced Scenario Testing**

### Test 6.1: Multi-Device Management
1. **Add Second Device**: Repeat Phase 1 with `soteria-device-002`
2. **Assign to Different Warden**: Create new warden + sentinel
3. **Provider Monitoring**: Verify provider can monitor both devices
4. **Cross-Device Events**: Ensure events don't interfere

### Test 6.2: Network Failure Recovery
1. **Disconnect WiFi**: Unplug WiFi temporarily
2. **Test SMS Functions**: Should still work via cellular
3. **Reconnect WiFi**: Device should reconnect automatically
4. **Sync Events**: Cached events should sync to dashboard

### Test 6.3: Battery Monitoring
1. **Check Serial Output**: Look for battery percentage in heartbeats
2. **Dashboard Display**: Verify battery level appears in device status
3. **Low Battery Simulation**: (Optional) Test low battery alerts

### Test 6.4: Provider Reassignment
1. **As Architect**: Reassign device to different provider
2. **Old Provider**: Should lose access to device monitoring
3. **New Provider**: Should gain access immediately
4. **Warden Experience**: Should remain unchanged

## 🚨 **PHASE 7: Emergency Response Simulation**

### Scenario: Complete Emergency Response
1. **[T+0] Emergency Occurs**: Sentinel presses SOS button
2. **[T+5s] Guardian Notified**: SMS with location received
3. **[T+30s] Guardian Responds**: Replies `OTW` 
4. **[T+1m] Provider Monitoring**: Sees event + response in dashboard
5. **[T+5m] Status Check**: Guardian sends `PING` for device status
6. **[T+10m] Resolution**: Emergency resolved, no further action

### Success Criteria:
- ✅ All haptic patterns work as specified
- ✅ SMS delivery and responses function correctly
- ✅ Real-time dashboard updates work
- ✅ All user roles see appropriate information
- ✅ Device pairing/unpairing works correctly
- ✅ Provider can monitor assigned wardens' devices
- ✅ No debug strings appear anywhere in the system

## Expected Haptic Patterns Summary

| Action | Pattern | Duration |
|--------|---------|----------|
| Button Press | short, short | 120ms each |
| SMS Success | long | 600ms |
| SMS Fail | short, short, short | 120ms each |
| SOS | long, short, long, short | 600ms, 120ms, 600ms, 120ms |
| Incoming SMS | short, short, short | 120ms each |
| OTW Response | medium, long | 300ms, 600ms |
| Status Ping | short + pause + short | 120ms + 150ms + 120ms |
| Pair Success | short, medium, long | 120ms, 300ms, 600ms |
| Pair Failed | short, short, short, long | 120ms each + 600ms |
| Unpair Success | medium, medium | 300ms each |
| Unpair Denied | 5x short | 120ms each |

## Success Criteria
- ✅ All haptic patterns work as specified
- ✅ SMS commands trigger correct responses
- ✅ Button actions send alerts and create dashboard events  
- ✅ Device pairing/unpairing works properly
- ✅ Real-time dashboard updates show all events
- ✅ No debug strings appear in any output

## Troubleshooting
- If no vibration: Check motor wiring and MOTOR_PIN configuration
- If SMS fails: Check cellular signal and SIM card status
- If no dashboard events: Verify WiFi connection and pairing status
- If wrong haptic pattern: Check timing constants in firmware