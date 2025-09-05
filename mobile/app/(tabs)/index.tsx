import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Shield, Phone, MapPin, TriangleAlert as AlertTriangle, CircleCheck as CheckCircle2, Send } from 'lucide-react-native';
import { useEventStore } from '@/store/eventStore';
import { useWhitelistStore } from '@/store/whitelistStore';
import { SMSService } from '@/services/SMSService';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const { events, addEvent } = useEventStore();
  const { contacts } = useWhitelistStore();
  const [isListening, setIsListening] = useState(true);

  const recentEvents = events.slice(0, 3);
  const sosEvents = events.filter(e => e.type === 'SOS');
  const buttonEvents = events.filter(e => e.type === 'BUTTON_PRESS');

  const sendOTW = async (phoneNumber: string) => {
    try {
      const success = await SMSService.sendSMS(phoneNumber, 'OTW');
      if (success) {
        Alert.alert('Success', 'OTW message sent successfully');
        addEvent({
          id: Date.now().toString(),
          type: 'OTW_SENT',
          phoneNumber,
          timestamp: Date.now(),
          content: 'OTW message sent',
        });
      } else {
        Alert.alert('Error', 'Failed to send OTW message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTW message');
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5', '#a7f3d0']}
        style={styles.gradient}
      >
        {/* Background Elements */}
        <View style={styles.backgroundBlobs}>
          <View style={[styles.blob, styles.blob1]} />
          <View style={[styles.blob, styles.blob2]} />
          <View style={[styles.blob, styles.blob3]} />
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTop}>
              <View>
                <Text style={styles.headerTitle}>SentryGuardian</Text>
                <Text style={styles.headerSubtitle}>Device Monitoring Dashboard</Text>
              </View>
              <View style={[styles.statusIndicator, isListening && styles.statusActive]}>
                <Shield size={20} color={isListening ? '#059669' : '#6b7280'} />
              </View>
            </View>
          </View>

          {/* Stats Cards */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <AlertTriangle size={24} color="#dc2626" />
              </View>
              <Text style={styles.statNumber}>{sosEvents.length}</Text>
              <Text style={styles.statLabel}>SOS Alerts</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <Phone size={24} color="#2563eb" />
              </View>
              <Text style={styles.statNumber}>{buttonEvents.length}</Text>
              <Text style={styles.statLabel}>Button Presses</Text>
            </View>
            
            <View style={styles.statCard}>
              <View style={styles.statIcon}>
                <CheckCircle2 size={24} color="#059669" />
              </View>
              <Text style={styles.statNumber}>{contacts.length}</Text>
              <Text style={styles.statLabel}>Trusted Devices</Text>
            </View>
          </View>

          {/* Recent Events */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Recent Activity</Text>
            {recentEvents.length === 0 ? (
              <View style={styles.emptyState}>
                <Shield size={48} color="#9ca3af" />
                <Text style={styles.emptyStateText}>No recent activity</Text>
                <Text style={styles.emptyStateSubtext}>
                  Events from your devices will appear here
                </Text>
              </View>
            ) : (
              <View style={styles.eventsList}>
                {recentEvents.map((event) => (
                  <View key={event.id} style={styles.eventCard}>
                    <View style={styles.eventHeader}>
                      <View style={styles.eventIcon}>
                        {event.type === 'SOS' && <AlertTriangle size={20} color="#dc2626" />}
                        {event.type === 'BUTTON_PRESS' && <Phone size={20} color="#2563eb" />}
                        {event.type === 'OTW_SENT' && <Send size={20} color="#059669" />}
                      </View>
                      <View style={styles.eventDetails}>
                        <Text style={styles.eventType}>
                          {event.type === 'SOS' && 'SOS Alert'}
                          {event.type === 'BUTTON_PRESS' && 'Button Press'}
                          {event.type === 'OTW_SENT' && 'OTW Sent'}
                        </Text>
                        <Text style={styles.eventTime}>
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </Text>
                      </View>
                      {event.type === 'SOS' && (
                        <TouchableOpacity
                          style={styles.otwButton}
                          onPress={() => sendOTW(event.phoneNumber)}
                        >
                          <Text style={styles.otwButtonText}>Send OTW</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                    <Text style={styles.eventContent}>{event.content}</Text>
                    {event.coordinates && (
                      <TouchableOpacity style={styles.locationButton}>
                        <MapPin size={16} color="#059669" />
                        <Text style={styles.locationButtonText}>
                          {event.coordinates.lat.toFixed(4)}, {event.coordinates.lng.toFixed(4)}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        </ScrollView>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  backgroundBlobs: {
    position: 'absolute',
    inset: 0,
  },
  blob: {
    position: 'absolute',
    borderRadius: 200,
    opacity: 0.3,
  },
  blob1: {
    width: 320,
    height: 320,
    backgroundColor: '#10b981',
    top: -160,
    right: -160,
  },
  blob2: {
    width: 320,
    height: 320,
    backgroundColor: '#14b8a6',
    bottom: -160,
    left: -160,
  },
  blob3: {
    width: 384,
    height: 384,
    backgroundColor: '#06b6d4',
    top: '50%',
    left: '50%',
    marginTop: -192,
    marginLeft: -192,
    opacity: 0.2,
  },
  content: {
    flex: 1,
    padding: 20,
    paddingTop: 60,
  },
  header: {
    marginBottom: 30,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerSubtitle: {
    fontSize: 16,
    color: '#6b7280',
    marginTop: 4,
  },
  statusIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusActive: {
    backgroundColor: '#d1fae5',
  },
  statsGrid: {
    flexDirection: 'row',
    marginBottom: 30,
    gap: 15,
  },
  statCard: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 20,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  statIcon: {
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
  },
  section: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 16,
  },
  emptyState: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  eventsList: {
    gap: 12,
  },
  eventCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    marginRight: 12,
  },
  eventDetails: {
    flex: 1,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  eventTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  eventContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  otwButton: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  otwButtonText: {
    color: 'white',
    fontSize: 12,
    fontWeight: '600',
  },
  locationButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  locationButtonText: {
    fontSize: 14,
    color: '#059669',
    fontWeight: '500',
    marginLeft: 6,
  },
});