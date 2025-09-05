import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  FlatList,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Search, Filter, TriangleAlert as AlertTriangle, Phone, Send, MapPin, Calendar, Download } from 'lucide-react-native';
import { useEventStore } from '@/store/eventStore';

export default function TimelineScreen() {
  const { events, exportEvents } = useEventStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState('all');

  const filteredEvents = events.filter(event => {
    const matchesSearch = searchQuery === '' || 
      event.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
      event.phoneNumber.includes(searchQuery);
    
    const matchesFilter = filterType === 'all' || event.type === filterType;
    
    return matchesSearch && matchesFilter;
  });

  const getEventIcon = (type: string) => {
    switch (type) {
      case 'SOS': return <AlertTriangle size={20} color="#dc2626" />;
      case 'BUTTON_PRESS': return <Phone size={20} color="#2563eb" />;
      case 'OTW_SENT': return <Send size={20} color="#059669" />;
      default: return <Phone size={20} color="#6b7280" />;
    }
  };

  const getEventTypeDisplay = (type: string) => {
    switch (type) {
      case 'SOS': return 'SOS Alert';
      case 'BUTTON_PRESS': return 'Button Press';
      case 'OTW_SENT': return 'OTW Sent';
      default: return type;
    }
  };

  const getEventColor = (type: string) => {
    switch (type) {
      case 'SOS': return '#fef2f2';
      case 'BUTTON_PRESS': return '#eff6ff';
      case 'OTW_SENT': return '#f0fdf4';
      default: return '#f9fafb';
    }
  };

  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  const groupEventsByDate = () => {
    const grouped = {};
    filteredEvents.forEach(event => {
      const dateKey = formatDate(event.timestamp);
      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });
    return grouped;
  };

  const groupedEvents = groupEventsByDate();

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5', '#a7f3d0']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Event Timeline</Text>
          <TouchableOpacity
            style={styles.exportButton}
            onPress={exportEvents}
          >
            <Download size={16} color="#059669" />
          </TouchableOpacity>
        </View>

        {/* Search and Filter */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInput}>
            <Search size={20} color="#6b7280" />
            <TextInput
              placeholder="Search events..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              style={styles.textInput}
            />
          </View>
        </View>

        <View style={styles.filterContainer}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['all', 'SOS', 'BUTTON_PRESS', 'OTW_SENT'].map(type => (
              <TouchableOpacity
                key={type}
                style={[
                  styles.filterButton,
                  filterType === type && styles.filterButtonActive
                ]}
                onPress={() => setFilterType(type)}
              >
                <Text style={[
                  styles.filterButtonText,
                  filterType === type && styles.filterButtonTextActive
                ]}>
                  {type === 'all' ? 'All Events' : getEventTypeDisplay(type)}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Timeline */}
        <ScrollView style={styles.timeline} showsVerticalScrollIndicator={false}>
          {Object.keys(groupedEvents).length === 0 ? (
            <View style={styles.emptyState}>
              <Calendar size={48} color="#9ca3af" />
              <Text style={styles.emptyStateText}>No events found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search or filter criteria
              </Text>
            </View>
          ) : (
            Object.entries(groupedEvents).map(([date, events]) => (
              <View key={date} style={styles.dateGroup}>
                <Text style={styles.dateHeader}>{date}</Text>
                {events.map((event, index) => (
                  <View key={event.id} style={styles.eventItem}>
                    <View style={styles.eventTimeline}>
                      <View style={styles.eventDot} />
                      {index < events.length - 1 && <View style={styles.eventLine} />}
                    </View>
                    <View style={[styles.eventCard, { backgroundColor: getEventColor(event.type) }]}>
                      <View style={styles.eventHeader}>
                        <View style={styles.eventIcon}>
                          {getEventIcon(event.type)}
                        </View>
                        <View style={styles.eventInfo}>
                          <Text style={styles.eventType}>
                            {getEventTypeDisplay(event.type)}
                          </Text>
                          <Text style={styles.eventTime}>
                            {new Date(event.timestamp).toLocaleTimeString()}
                          </Text>
                        </View>
                        <Text style={styles.eventPhone}>{event.phoneNumber}</Text>
                      </View>
                      <Text style={styles.eventContent}>{event.content}</Text>
                      {event.coordinates && (
                        <View style={styles.locationInfo}>
                          <MapPin size={14} color="#059669" />
                          <Text style={styles.locationText}>
                            {event.coordinates.lat.toFixed(6)}, {event.coordinates.lng.toFixed(6)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
              </View>
            ))
          )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  exportButton: {
    padding: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 8,
  },
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  searchInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: '#374151',
  },
  filterContainer: {
    paddingLeft: 20,
    marginBottom: 20,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    marginRight: 8,
  },
  filterButtonActive: {
    backgroundColor: '#059669',
  },
  filterButtonText: {
    fontSize: 14,
    color: '#6b7280',
    fontWeight: '500',
  },
  filterButtonTextActive: {
    color: 'white',
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 20,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
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
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 12,
    marginLeft: 32,
  },
  eventItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  eventTimeline: {
    alignItems: 'center',
    marginRight: 16,
  },
  eventDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#059669',
  },
  eventLine: {
    width: 2,
    flex: 1,
    backgroundColor: '#d1d5db',
    marginTop: 8,
  },
  eventCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#059669',
  },
  eventHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  eventIcon: {
    marginRight: 12,
  },
  eventInfo: {
    flex: 1,
  },
  eventType: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  eventTime: {
    fontSize: 12,
    color: '#6b7280',
    marginTop: 2,
  },
  eventPhone: {
    fontSize: 12,
    color: '#6b7280',
  },
  eventContent: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
  },
  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e5e7eb',
  },
  locationText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 6,
    fontWeight: '500',
  },
});