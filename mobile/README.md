# SentryGuardian - ESP32 SMS Integration App

A React Native application that integrates with ESP32 + A7670 firmware for real-time SOS monitoring and emergency response.

## Features

- **Real-time SMS monitoring** for SOS alerts and device events
- **Interactive map display** with SOS coordinates and location tracking
- **Push notifications** with deep linking to relevant screens
- **Event timeline** with persistent storage and search functionality
- **Whitelist management** for trusted device numbers
- **One-click OTW response** to acknowledge emergency situations

## Architecture

- **React Native + Expo** for cross-platform mobile development
- **Zustand** for state management with persistence
- **React Native Maps** for location visualization
- **Expo Notifications** for push notification handling
- **AsyncStorage** for local data persistence

## Setup Instructions

### Prerequisites

1. Node.js 18+ and npm/yarn
2. Expo CLI: `npm install -g expo-cli`
3. Android device or emulator (iOS has SMS limitations)
4. Google Maps API key for map functionality

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Configure Google Maps:
   - Get a Google Maps API key from Google Cloud Console
   - Add the key to your environment variables

4. Run the development server:
   ```bash
   npm run dev
   ```

### Android Permissions

The app requires these permissions for full functionality:
- `RECEIVE_SMS` - Listen for incoming SMS messages
- `READ_SMS` - Read SMS content for parsing
- `SEND_SMS` - Send OTW response messages
- `READ_PHONE_STATE` - Access phone number information
- `ACCESS_FINE_LOCATION` - Location services for maps

### Testing

#### Test Scenarios

1. **Valid SOS with coordinates**
   ```
   From: +639451458138
   Content: "SOS! I need help at my current location: https://maps.google.com/maps?q=14.5995,120.9842"
   Expected: Event logged, notification sent, coordinates parsed
   ```

2. **SOS without location**
   ```
   From: +639451458138  
   Content: "SOS! My location is not yet available."
   Expected: Event logged, notification sent, no coordinates
   ```

3. **Button press event**
   ```
   From: +639451458138
   Content: "Button pressed!"
   Expected: Event logged, notification sent (if enabled)
   ```

4. **Non-whitelisted SOS**
   ```
   From: +639999999999
   Content: "SOS! I need help at my current location: https://maps.google.com/maps?q=14.5995,120.9842"
   Expected: Event ignored, warning logged
   ```

5. **Malformed SOS**
   ```
   From: +639451458138
   Content: "SOS! Invalid message format"
   Expected: Event ignored or handled gracefully
   ```

#### Manual Testing Steps

1. Add your ESP32 device number to the whitelist in Settings
2. Send test SMS messages from the device
3. Verify notifications appear correctly
4. Test map functionality with coordinate extraction
5. Test OTW response functionality
6. Verify event timeline persistence

### Deployment

For Android APK build:
```bash
expo build:android
```

For development builds:
```bash
expo install --fix
expo run:android
```

## Project Structure

```
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx      # Home dashboard
│   │   ├── map.tsx        # SOS map view
│   │   ├── timeline.tsx   # Event history
│   │   └── settings.tsx   # App configuration
│   └── _layout.tsx        # Root layout
├── services/
│   ├── SMSService.ts      # SMS parsing and sending
│   ├── NotificationService.ts # Push notifications
│   └── SMSReceiver.ts     # SMS background listener
├── store/
│   ├── eventStore.ts      # Event data management
│   ├── whitelistStore.ts  # Trusted contacts
│   └── settingsStore.ts   # App preferences
├── hooks/
│   └── useSMSListener.ts  # SMS permission and setup
└── android/
    └── app/src/main/java/ # Native SMS receiver
```

## Integration with ESP32 Firmware

This app is designed to work with the provided ESP32 + A7670 firmware that:
- Sends "Button pressed!" on short button press
- Sends SOS alerts with Google Maps links on long press  
- Responds to "OTW" SMS with device feedback

The app automatically parses these message formats and provides appropriate UI responses.

## Limitations

- **iOS**: Cannot access SMS inbox, requires manual message handling
- **Android 12+**: Background SMS restrictions may affect functionality
- **Battery**: Continuous SMS monitoring may impact battery life
- **Network**: Requires cellular connectivity for SMS functionality

## Contributing

1. Follow TypeScript best practices
2. Use the established component patterns
3. Test on both Android device and emulator
4. Update documentation for new features

## License

MIT License - see LICENSE file for details.