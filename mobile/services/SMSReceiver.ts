import { DeviceEventEmitter, NativeModules } from 'react-native';
import { SMSService } from './SMSService';
import { NotificationService } from './NotificationService';
import { useEventStore } from '@/store/eventStore';
import { useWhitelistStore } from '@/store/whitelistStore';
import { useSettingsStore } from '@/store/settingsStore';

export class SMSReceiver {
  private static subscription: any = null;

  static startListening() {
    if (this.subscription) {
      this.stopListening();
    }

    this.subscription = DeviceEventEmitter.addListener(
      'onSMSReceived',
      (message: { phoneNumber: string; content: string }) => {
        this.handleIncomingSMS(message.phoneNumber, message.content);
      }
    );
  }

  static stopListening() {
    if (this.subscription) {
      this.subscription.remove();
      this.subscription = null;
    }
  }

  static async handleIncomingSMS(phoneNumber: string, content: string) {
    const whitelistStore = useWhitelistStore.getState();
    const settingsStore = useSettingsStore.getState();
    const eventStore = useEventStore.getState();

    // Parse the SMS message
    const parsedEvent = SMSService.parseSMSMessage(phoneNumber, content);
    
    if (!parsedEvent) {
      return; // Not a recognized message format
    }

    // Check if sender is whitelisted
    const isWhitelisted = whitelistStore.isWhitelisted(phoneNumber);
    
    if (!isWhitelisted) {
      console.warn('SMS from non-whitelisted number:', phoneNumber);
      // You might want to store these separately for review
      return;
    }

    // Create event with unique ID
    const event = {
      ...parsedEvent,
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
    };

    // Add to event store
    eventStore.addEvent(event);

    // Send notification if enabled
    if (settingsStore.settings.notificationsEnabled) {
      if (!settingsStore.settings.sosAlertsOnly || event.type === 'SOS') {
        await NotificationService.sendLocalNotification(event);
      }
    }

    console.log('Processed SMS event:', event);
  }
}