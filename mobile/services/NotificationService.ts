import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { EventData } from '@/store/eventStore';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export class NotificationService {
  static async requestPermissions() {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('sos-alerts', {
        name: 'SOS Alerts',
        importance: Notifications.AndroidImportance.MAX,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    return finalStatus === 'granted';
  }

  static async sendLocalNotification(event: EventData) {
    try {
      let title = '';
      let body = '';
      
      switch (event.type) {
        case 'SOS':
          title = `🚨 SOS Alert from ${event.phoneNumber}`;
          body = event.coordinates 
            ? `Location: ${event.coordinates.lat.toFixed(4)}, ${event.coordinates.lng.toFixed(4)}`
            : 'Location not available';
          break;
        case 'BUTTON_PRESS':
          title = `📱 Button Press from ${event.phoneNumber}`;
          body = 'Device button was pressed';
          break;
        default:
          return;
      }

      await Notifications.scheduleNotificationAsync({
        content: {
          title,
          body,
          data: { 
            eventId: event.id,
            type: event.type,
            phoneNumber: event.phoneNumber,
            coordinates: event.coordinates,
          },
          categoryIdentifier: event.type === 'SOS' ? 'sos-alert' : 'button-press',
        },
        trigger: null,
      });
    } catch (error) {
      console.error('Error sending notification:', error);
    }
  }

  static async setupNotificationCategories() {
    await Notifications.setNotificationCategoryAsync('sos-alert', [
      {
        identifier: 'send-otw',
        buttonTitle: 'Send OTW',
        options: { opensAppToForeground: false },
      },
      {
        identifier: 'view-map',
        buttonTitle: 'View Map',
        options: { opensAppToForeground: true },
      },
    ]);
  }
}