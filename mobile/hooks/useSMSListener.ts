import { useEffect } from 'react';
import { PermissionsAndroid, Platform } from 'react-native';
import { SMSReceiver } from '@/services/SMSReceiver';
import { NotificationService } from '@/services/NotificationService';

export function useSMSListener() {
  useEffect(() => {
    const initializeServices = async () => {
      if (Platform.OS === 'android') {
        // Request SMS permissions
        try {
          const permissions = [
            PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
            PermissionsAndroid.PERMISSIONS.READ_SMS,
            PermissionsAndroid.PERMISSIONS.SEND_SMS,
          ];

          const granted = await PermissionsAndroid.requestMultiple(permissions);
          
          const allPermissionsGranted = Object.values(granted).every(
            permission => permission === PermissionsAndroid.RESULTS.GRANTED
          );

          if (allPermissionsGranted) {
            SMSReceiver.startListening();
          } else {
            console.warn('SMS permissions not granted');
          }
        } catch (error) {
          console.error('Error requesting SMS permissions:', error);
        }
      }

      // Setup notifications
      await NotificationService.requestPermissions();
      await NotificationService.setupNotificationCategories();
    };

    initializeServices();

    return () => {
      SMSReceiver.stopListening();
    };
  }, []);
}