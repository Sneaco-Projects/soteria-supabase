import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Dimensions,
  Linking,
} from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Send, Navigation, MapPin, ArrowLeft } from 'lucide-react-native';
import { useEventStore } from '@/store/eventStore';
import { SMSService } from '@/services/SMSService';

const { width, height } = Dimensions.get('window');

export default function MapScreen() {
  const { events } = useEventStore();
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [mapRegion, setMapRegion] = useState({
    latitude: 14.5995,
    longitude: 120.9842,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  });

  const sosEvents = events.filter(e => e.type === 'SOS' && e.coordinates);

  useEffect(() => {
    if (sosEvents.length > 0) {
      const latestSOS = sosEvents[0];
      setMapRegion({
        latitude: latestSOS.coordinates.lat,
        longitude: latestSOS.coordinates.lng,
        latitudeDelta: 0.01,
        longitudeDelta: 0.01,
      });
      setSelectedEvent(latestSOS);
    }
  }, [sosEvents]);

  const sendOTW = async (phoneNumber: string) => {
    try {
      const success = await SMSService.sendSMS(phoneNumber, 'OTW');
      if (success) {
        Alert.alert('Success', 'OTW message sent successfully');
      } else {
        Alert.alert('Error', 'Failed to send OTW message');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to send OTW message');
    }
  };

  const openInGoogleMaps = (lat: number, lng: number) => {
    const url = `https://maps.google.com/maps?q=${lat},${lng}`;
    Linking.openURL(url);
  };

  const getDirections = (lat: number, lng: number) => {
    const url = `https://maps.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
    Linking.openURL(url);
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        region={mapRegion}
        onRegionChangeComplete={setMapRegion}
        showsUserLocation
        showsMyLocationButton
      >
        {sosEvents.map((event) => (
          <Marker
            key={event.id}
            coordinate={{
              latitude: event.coordinates.lat,
              longitude: event.coordinates.lng,
            }}
            title="SOS Alert"
            description={`${new Date(event.timestamp).toLocaleString()}`}
            pinColor="#dc2626"
            onPress={() => setSelectedEvent(event)}
          />
        ))}
      </MapView>

      {sosEvents.length === 0 && (
        <View style={styles.emptyOverlay}>
          <View style={styles.emptyCard}>
            <MapPin size={48} color="#9ca3af" />
            <Text style={styles.emptyTitle}>No SOS Events</Text>
            <Text style={styles.emptyText}>
              SOS alerts with location data will appear on the map
            </Text>
          </View>
        </View>
      )}

      {selectedEvent && (
        <View style={styles.eventDetails}>
          <View style={styles.eventHeader}>
            <View>
              <Text style={styles.eventTitle}>SOS Alert</Text>
              <Text style={styles.eventTime}>
                {new Date(selectedEvent.timestamp).toLocaleString()}
              </Text>
              <Text style={styles.eventPhone}>{selectedEvent.phoneNumber}</Text>
            </View>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setSelectedEvent(null)}
            >
              <ArrowLeft size={20} color="#6b7280" />
            </TouchableOpacity>
          </View>

          <Text style={styles.eventContent}>{selectedEvent.content}</Text>

          <View style={styles.actionButtons}>
            <TouchableOpacity
              style={[styles.actionButton, styles.otwButton]}
              onPress={() => sendOTW(selectedEvent.phoneNumber)}
            >
              <Send size={18} color="white" />
              <Text style={styles.otwButtonText}>Send OTW</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.directionsButton]}
              onPress={() => 
                getDirections(selectedEvent.coordinates.lat, selectedEvent.coordinates.lng)
              }
            >
              <Navigation size={18} color="#059669" />
              <Text style={styles.directionsButtonText}>Directions</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.mapsButton]}
              onPress={() => 
                openInGoogleMaps(selectedEvent.coordinates.lat, selectedEvent.coordinates.lng)
              }
            >
              <MapPin size={18} color="#2563eb" />
              <Text style={styles.mapsButtonText}>Open in Maps</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {sosEvents.length > 1 && (
        <View style={styles.eventsList}>
          <Text style={styles.eventsListTitle}>Recent SOS Events</Text>
          {sosEvents.slice(0, 3).map((event) => (
            <TouchableOpacity
              key={event.id}
              style={[
                styles.eventItem,
                selectedEvent?.id === event.id && styles.eventItemSelected
              ]}
              onPress={() => {
                setSelectedEvent(event);
                setMapRegion({
                  latitude: event.coordinates.lat,
                  longitude: event.coordinates.lng,
                  latitudeDelta: 0.01,
                  longitudeDelta: 0.01,
                });
              }}
            >
              <Text style={styles.eventItemTime}>
                {new Date(event.timestamp).toLocaleTimeString()}
              </Text>
              <Text style={styles.eventItemLocation}>
                {event.coordinates.lat.toFixed(4)}, {event.coordinates.lng.toFixed(4)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    flex: 1,
  },
  emptyOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyCard: {
    backgroundColor: 'white',
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
    marginHorizontal: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyText: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 20,
  },
  eventDetails: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    maxHeight: height * 0.4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  eventTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#dc2626',
  },
  eventTime: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  eventPhone: {
    fontSize: 14,
    color: '#374151',
    marginTop: 2,
  },
  closeButton: {
    padding: 8,
  },
  eventContent: {
    fontSize: 16,
    color: '#374151',
    lineHeight: 24,
    marginBottom: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  otwButton: {
    backgroundColor: '#059669',
  },
  otwButtonText: {
    color: 'white',
    fontWeight: '600',
  },
  directionsButton: {
    backgroundColor: '#d1fae5',
  },
  directionsButtonText: {
    color: '#059669',
    fontWeight: '600',
  },
  mapsButton: {
    backgroundColor: '#dbeafe',
  },
  mapsButtonText: {
    color: '#2563eb',
    fontWeight: '600',
  },
  eventsList: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
    maxWidth: 200,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  eventsListTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
  },
  eventItem: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  eventItemSelected: {
    backgroundColor: '#d1fae5',
  },
  eventItemTime: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  eventItemLocation: {
    fontSize: 11,
    color: '#6b7280',
    marginTop: 2,
  },
});