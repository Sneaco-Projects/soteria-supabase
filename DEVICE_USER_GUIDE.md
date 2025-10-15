# 📱 Soteria ESP32 Device User Guide

## 🔧 Device Overview

The Soteria ESP32 device is an emergency response system that combines GPS tracking, SMS communication, and real-time dashboard integration to provide comprehensive safety monitoring.

### Hardware Components
- **ESP32 Microcontroller**: Main processing unit
- **A7670 GSM Module**: SMS communication and cellular connectivity  
- **RGB LED**: Status indication (Red/Green/Blue/Yellow/White)
- **Vibration Motor**: Haptic feedback for user interactions
- **Emergency Button**: Main user interface for alerts
- **WiFi Module**: Internet connectivity for dashboard integration

---

## 🚨 Emergency Button Functions

### Short Press (50ms - 1.5 seconds)
- **Action**: Send emergency alert to guardian
- **LED Sequence**: 
  1. White flashing (200ms ON, 200ms OFF) during event (500ms total)
  2. Green rapid flashing (50ms ON/OFF × 10) during SMS send
  3. Blue (300ms) if SMS successful
- **Haptic Sequence**:
  1. **Immediate**: 2× short vibrations (120ms ON, 170ms pause, 120ms ON)
  2. **If SMS Success**: 1× long vibration (600ms) after 300ms delay
  3. **If SMS Failed**: 3× short vibrations (120ms ON, 170ms pause each)
- **SMS Sent**: `🚨 Sentinel is Asking for HELP! LAT: [coordinates], LNG: [coordinates]`
- **Dashboard**: Creates `BTN_SHORT` event with location

### Long Press (≥ 2 seconds) 
- **Action**: Send SOS emergency alert
- **LED Sequence**:
  1. White rapid flashing (50ms ON, 50ms OFF) during event (4000ms total)
  2. Green rapid flashing during SMS send
  3. Blue (300ms) if SMS successful
- **Haptic Sequence**:
  1. **At 2s mark**: Long-Short-Long-Short pattern:
     - 600ms ON, 650ms pause
     - 120ms ON, 170ms pause  
     - 600ms ON, 650ms pause
     - 120ms ON
  2. **SMS result feedback** (same as short press)
- **SMS Sent**: `🚨 EMERGENCY SOS! LAT: [coordinates], LNG: [coordinates]`
- **Dashboard**: Creates `SOS` event with location

---

## 💬 SMS Commands Reference

Send any of these commands via SMS to your device's phone number:

### Basic Commands

#### `TEST`
- **Purpose**: Verify SMS communication is working
- **Response**: `✅ Test response from ESP32`
- **Use Case**: Check if device can receive and respond to SMS

#### `PING` or `STATUS` 
- **Purpose**: Get current device status and health
- **Response**: `✅ PONG - Status OK. Battery: 87.5%, Signal: 18, Location: LAT: 14.823506, LNG: 120.279089`
- **Includes**: Battery level, signal strength, GPS coordinates

#### `VIB`
- **Purpose**: Test vibration motor functionality
- **Response**: `✅ Vibration test executed`
- **Haptic**: Medium vibration pulse
- **Use Case**: Verify haptic feedback is working

#### `INFO`
- **Purpose**: Print detailed modem diagnostics to serial console
- **Response**: `✅ Modem info printed to serial`
- **Use Case**: Technical troubleshooting (requires serial monitor access)

### Device Pairing

#### `PAIR <code>`
- **Purpose**: Connect device to Supabase dashboard
- **Format**: `PAIR ABC123XY` (replace with actual pairing code from dashboard)
- **Requirements**: Device must have WiFi connection
- **Success Response**: `✅ SUCCESS: Device paired! Guardian: +1234567890`
- **Failure Responses**: 
  - `❌ ERROR: No WiFi connection. Please connect device to WiFi and retry pairing.`
  - `❌ ERROR: No pairing code provided. Send 'PAIR <code>' format.`
  - `❌ ERROR: Pairing failed. Check code and try again.`
- **Haptic**: Success = Short-Medium-Long, Failure = Short-Short-Short-Long

### Emergency Response

#### `OTW`
- **Purpose**: Acknowledge emergency and indicate "On The Way"
- **Response**: None (silent acknowledgment)
- **LED**: Solid blue for 5 seconds
- **Haptic**: Medium-Long vibration pattern
- **Dashboard**: Creates `OTW` event with location
- **Use Case**: Guardian responds to emergency alert

### Device Management

#### `UNPAIR`
- **Purpose**: Disconnect device from current guardian (guardian only)
- **Authorization**: Only works from the paired guardian's phone number
- **Success Response**: `✅ Device unpaired successfully. Reverting to admin-only mode.`
- **Unauthorized Response**: `❌ ERROR: Not authorized to unpair this device.`
- **Haptic**: Success = Medium-Medium, Denied = 5x Short vibrations

---

## 🚦 LED Status Indicators

### Network Status (Base Status When No Events Active)
- **🔴 Red (Solid)**: No network connection - modem offline or no SIM
- **🟡 Yellow (1000ms ON/OFF)**: SIM card locked, PIN required, or not ready
- **🟢 Green (Solid)**: Network connected and ready - normal operation
- **🔴🟡 Red/Yellow (500ms Red, 500ms Yellow)**: Searching for network signal

### Event Status (Overrides Network Status)
- **⚪ White (200ms ON/OFF)**: Button alert active (500ms duration)
- **⚪ White (50ms ON/OFF)**: SOS emergency active (4000ms duration) 
- **🔵 Blue (200ms ON, 400ms OFF)**: Incoming SMS notification (1200ms duration)
- **🔵 Blue (Solid 5000ms)**: OTW acknowledgment received
- **🟢 Green (50ms ON/OFF × 10)**: SMS transmission in progress

### Special Sequences
- **🔴 Red (300ms)**: SMS send failed - error indication
- **💡 All OFF**: Device initializing, power issue, or motor test mode

### LED Priority System
1. **Highest**: Active events (Button, SOS, SMS, OTW)
2. **Medium**: SMS transmission status  
3. **Lowest**: Network status display

**Note**: Events always override base network status. Network status returns when event completes.

---

## 📳 Haptic Feedback Patterns

**Vibration Constants**: Short=120ms, Medium=300ms, Long=600ms, Short Pause=150ms, Long Pause=300ms

### Button Actions
- **Button Alert**: 
  - Pattern: Short + 170ms pause + Short
  - Timing: 120ms ON, 170ms OFF, 120ms ON
  - Purpose: Immediate acknowledgment of button press
- **SMS Success**: 
  - Pattern: 300ms pause + Long
  - Timing: 300ms delay, then 600ms ON
  - Purpose: Confirms SMS was sent successfully
- **SMS Failure**: 
  - Pattern: Short + pause + Short + pause + Short
  - Timing: 120ms ON, 170ms OFF, 120ms ON, 170ms OFF, 120ms ON
  - Purpose: Indicates SMS transmission failed
- **SOS Emergency**: 
  - Pattern: Long + pause + Short + pause + Long + pause + Short
  - Timing: 600ms ON, 650ms OFF, 120ms ON, 170ms OFF, 600ms ON, 650ms OFF, 120ms ON
  - Purpose: Dramatic alert pattern for emergency activation

### Communication
- **Incoming SMS**: 
  - Pattern: Short + pause + Short + pause + Short
  - Timing: 120ms ON, 170ms OFF, 120ms ON, 170ms OFF, 120ms ON
  - Purpose: Notification of received SMS message
- **OTW Response**: 
  - Pattern: Medium + pause + Long  
  - Timing: 300ms ON, 350ms OFF, 600ms ON
  - Purpose: Acknowledgment that guardian is "On The Way"
- **Status Ping**: 
  - Pattern: Short + 150ms pause + Short
  - Timing: 120ms ON, 150ms OFF, 120ms ON
  - Purpose: Confirmation of status request response

### Pairing & Device Management
- **Pair Success**: 
  - Pattern: Short + pause + Medium + pause + Long
  - Timing: 120ms ON, 170ms OFF, 300ms ON, 350ms OFF, 600ms ON
  - Purpose: Celebrates successful device pairing
- **Pair Failed**: 
  - Pattern: Short + pause + Short + pause + Short + pause + Long
  - Timing: 120ms ON, 170ms OFF, 120ms ON, 170ms OFF, 120ms ON, 170ms OFF, 600ms ON
  - Purpose: Indicates pairing attempt failed
- **Unpair Success**: 
  - Pattern: Medium + pause + Medium
  - Timing: 300ms ON, 350ms OFF, 300ms ON
  - Purpose: Confirms successful device unpairing
- **Unpair Denied**: 
  - Pattern: 5× Short with minimal pause
  - Timing: 120ms ON, 150ms OFF (repeated 5 times)
  - Purpose: Indicates unauthorized unpair attempt

### Testing & Diagnostics
- **VIB Command**: 
  - Pattern: Medium
  - Timing: 300ms ON
  - Purpose: Simple vibration test for functionality check
- **Motor Test Pattern**: 
  - Sequence: Short → Medium → Long (with 500ms between each)
  - Timing: 120ms, pause, 300ms, pause, 600ms
  - Purpose: Startup diagnostics to verify motor operation

### Pattern Recognition Tips
- **Single vibrations**: Status confirmations, simple tests
- **Double vibrations**: Button acknowledgments, ping responses  
- **Triple vibrations**: Notifications, failures, SMS alerts
- **Long sequences**: Emergencies, pairing operations
- **Increasing intensity**: Success progressions (Short→Medium→Long)
- **Repetitive short**: Failures, denials, errors

---

## 🔧 Device Setup & Pairing Process

### Step 1: Initial Setup
1. Ensure device has power and SIM card installed
2. Verify device connects to cellular network (green LED)
3. Connect device to WiFi network (required for dashboard integration)

### Step 2: Get Pairing Code
1. Log into Soteria dashboard as Guardian/Warden
2. Navigate to device management section
3. Click "Add New Device" or "Pair Device"
4. Copy the generated 8-character pairing code (e.g., `ABC123XY`)

### Step 3: Pair Device
1. Send SMS: `PAIR ABC123XY` (replace with your actual code)
2. Wait for confirmation SMS from device
3. Device should now appear in your dashboard
4. Test functionality with `TEST` command

### Step 4: Verification
1. Send `STATUS` command to verify all systems
2. Test emergency button (short press first)
3. Verify events appear in dashboard
4. Test `OTW` response workflow

---

## 🛠️ Troubleshooting Guide

### Device Not Responding to SMS
- **Check**: SIM card properly inserted and activated
- **Check**: Cellular signal strength (send `STATUS` for signal info)
- **Try**: Power cycle device (disconnect/reconnect power)
- **Check**: SMS center configuration with carrier

### Pairing Failed
- **Check**: WiFi connection active (device needs internet)
- **Check**: Pairing code is correct and not expired
- **Check**: Dashboard shows pairing code as unused
- **Try**: Generate new pairing code from dashboard

### Emergency Button Not Working
- **Check**: LED responds to button press (white flashing)
- **Check**: Haptic feedback occurs (vibration)
- **Send**: `VIB` command to test motor
- **Check**: Dashboard for event creation

### SMS Not Sending
- **Send**: `STATUS` command to check signal strength
- **Check**: SIM card has SMS credits/plan
- **Check**: Phone number format is correct (+country code)
- **Send**: `INFO` command for detailed diagnostics

### Dashboard Not Updating
- **Check**: WiFi connection active
- **Check**: Device properly paired (has valid token)
- **Send**: `STATUS` to verify connection
- **Check**: Dashboard events tab for activity

---

## 📞 Emergency Contacts & Commands

### Quick Reference Card
Print and keep with device:

```
🚨 EMERGENCY BUTTON:
Short Press = Help Alert
Long Press (2s) = SOS Emergency

📱 SMS COMMANDS:
TEST - Check communication
STATUS - Get device info  
VIB - Test vibration
OTW - Acknowledge emergency
PAIR <code> - Connect to dashboard
UNPAIR - Disconnect device

🚦 LED STATUS:
Green = Ready
Red = No network
Blue = Message received
White flashing = Alert active
```

### Admin Contact
- **Default Admin Number**: `+639451458138`
- **Purpose**: Receives alerts when device not paired to guardian
- **Access**: Can perform pairing and basic commands

---

## ⚙️ Technical Specifications

### Communication
- **GSM Module**: A7670 (2G/4G LTE)
- **WiFi**: 802.11 b/g/n
- **SMS Response Time**: < 30 seconds typical
- **Dashboard Update**: Real-time via WiFi

### Power & Battery
- **Operating Voltage**: 3.3V - 5V
- **Battery Monitor**: Voltage-based estimation
- **Power Consumption**: ~150mA active, ~50mA standby

### Environmental
- **Operating Temperature**: -10°C to +60°C
- **Humidity**: Up to 90% non-condensing
- **Enclosure Rating**: IP54 (splash resistant)

### GPS & Location
- **Coordinates**: Fixed high-precision GPS coordinates
- **Accuracy**: ±3 meters typical
- **Update Rate**: Real-time with events
- **Maps Integration**: Google Maps links in dashboard

---

## 📋 Maintenance & Care

### Daily Checks
- Verify green LED (network ready)
- Test button response (haptic feedback)
- Check physical condition and mounting

### Weekly Checks  
- Send `STATUS` command for full system check
- Verify dashboard connectivity
- Test emergency workflow with guardian

### Monthly Maintenance
- Clean device exterior
- Check SIM card and connections
- Verify backup contacts updated
- Review event logs in dashboard

### Battery Care
- Monitor battery levels via `STATUS` command
- Replace/recharge when levels drop below 20%
- Keep device connected to power when possible

---

## 🆘 Emergency Procedures

### If Device Stops Responding
1. Check power connection and LED status
2. Try SMS commands: `TEST`, `STATUS`, `INFO`
3. Power cycle device (disconnect 10 seconds)
4. Contact technical support with error details

### Lost or Stolen Device
1. Log into dashboard immediately
2. Review recent event history and locations
3. Send `UNPAIR` command if device still responsive
4. Report to local authorities if necessary
5. Contact admin to disable device remotely

### False Emergency Alerts
1. Guardian sends `OTW` to acknowledge
2. Follow up with phone call to verify status
3. Review alert triggers and device sensitivity
4. Document incident in dashboard notes

### Network Outages
- Device stores events locally during outages
- SMS may still work on cellular network
- Events sync to dashboard when connectivity restored
- Use alternative communication methods as backup

---

*This guide covers Soteria ESP32 firmware version with full Supabase integration. For technical support or additional features, contact your system administrator.*