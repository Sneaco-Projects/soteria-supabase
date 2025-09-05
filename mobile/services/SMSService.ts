import { SMS } from 'expo-sms';
import { Alert, Platform } from 'react-native';

export class SMSService {
  static async sendSMS(phoneNumber: string, message: string): Promise<boolean> {
    try {
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'SMS functionality is not available on this device');
        return false;
      }

      const result = await SMS.sendSMSAsync([phoneNumber], message);
      return result.result === 'sent';
    } catch (error) {
      console.error('Error sending SMS:', error);
      return false;
    }
  }

  static normalizePhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle Philippine numbers
    if (cleaned.startsWith('0')) {
      cleaned = '+63' + cleaned.substring(1);
    } else if (cleaned.startsWith('63') && cleaned.length === 12) {
      cleaned = '+' + cleaned;
    } else if (!cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    
    return cleaned;
  }

  static extractCoordinatesFromSMS(message: string): { lat: number; lng: number } | null {
    // Look for Google Maps URL pattern
    const mapsPattern = /maps\.google\.com\/maps\?q=(-?\d+\.?\d*),(-?\d+\.?\d*)/;
    const match = message.match(mapsPattern);
    
    if (match) {
      const lat = parseFloat(match[1]);
      const lng = parseFloat(match[2]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    // Look for direct coordinate pattern
    const coordPattern = /(-?\d+\.?\d*),\s*(-?\d+\.?\d*)/;
    const coordMatch = message.match(coordPattern);
    
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lng = parseFloat(coordMatch[2]);
      
      if (!isNaN(lat) && !isNaN(lng)) {
        return { lat, lng };
      }
    }
    
    return null;
  }

  static parseSMSMessage(phoneNumber: string, message: string) {
    const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
    const timestamp = Date.now();
    
    // Check for SOS message
    if (message.includes('SOS!')) {
      const coordinates = this.extractCoordinatesFromSMS(message);
      return {
        type: 'SOS' as const,
        phoneNumber: normalizedPhone,
        timestamp,
        content: message,
        coordinates,
      };
    }
    
    // Check for button press message
    if (message.includes('Button pressed!') || message.toLowerCase().includes('button pressed')) {
      return {
        type: 'BUTTON_PRESS' as const,
        phoneNumber: normalizedPhone,
        timestamp,
        content: message,
      };
    }
    
    return null;
  }
}