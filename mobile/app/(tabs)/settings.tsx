import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Switch,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { 
  Plus, 
  Trash2, 
  Bell, 
  Map, 
  Download, 
  Shield,
  Phone,
  User
} from 'lucide-react-native';
import { useWhitelistStore } from '@/store/whitelistStore';
import { useSettingsStore } from '@/store/settingsStore';

export default function SettingsScreen() {
  const { contacts, addContact, removeContact } = useWhitelistStore();
  const { settings, updateSettings } = useSettingsStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newContactName, setNewContactName] = useState('');
  const [newContactPhone, setNewContactPhone] = useState('');

  const handleAddContact = () => {
    if (!newContactName.trim() || !newContactPhone.trim()) {
      Alert.alert('Error', 'Please fill in both name and phone number');
      return;
    }

    addContact({
      id: Date.now().toString(),
      name: newContactName.trim(),
      phoneNumber: newContactPhone.trim(),
      isActive: true,
    });

    setNewContactName('');
    setNewContactPhone('');
    setShowAddForm(false);
    Alert.alert('Success', 'Contact added to whitelist');
  };

  const handleRemoveContact = (contactId: string) => {
    Alert.alert(
      'Remove Contact',
      'Are you sure you want to remove this contact from the whitelist?',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeContact(contactId) }
      ]
    );
  };

  const formatPhoneNumber = (phone: string) => {
    // Simple formatting for display
    if (phone.startsWith('+63')) {
      return phone.replace('+63', '+63 ');
    }
    return phone;
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#ecfdf5', '#d1fae5', '#a7f3d0']}
        style={styles.gradient}
      >
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.headerTitle}>Settings</Text>
            <View style={styles.headerIcon}>
              <Shield size={24} color="#059669" />
            </View>
          </View>

          {/* Notifications Section */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notifications</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color="#059669" />
                <Text style={styles.settingLabel}>Push Notifications</Text>
              </View>
              <Switch
                value={settings.notificationsEnabled}
                onValueChange={(value) => updateSettings({ notificationsEnabled: value })}
                trackColor={{ false: '#e5e7eb', true: '#d1fae5' }}
                thumbColor={settings.notificationsEnabled ? '#059669' : '#9ca3af'}
              />
            </View>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Bell size={20} color="#059669" />
                <Text style={styles.settingLabel}>SOS Alerts Only</Text>
              </View>
              <Switch
                value={settings.sosAlertsOnly}
                onValueChange={(value) => updateSettings({ sosAlertsOnly: value })}
                trackColor={{ false: '#e5e7eb', true: '#d1fae5' }}
                thumbColor={settings.sosAlertsOnly ? '#059669' : '#9ca3af'}
                disabled={!settings.notificationsEnabled}
              />
            </View>
          </View>

          {/* Map Settings */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Map Settings</Text>
            <View style={styles.settingItem}>
              <View style={styles.settingInfo}>
                <Map size={20} color="#059669" />
                <Text style={styles.settingLabel}>Map Provider</Text>
              </View>
              <Text style={styles.settingValue}>Google Maps</Text>
            </View>
          </View>

          {/* Whitelist Management */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Trusted Devices</Text>
              <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddForm(true)}
              >
                <Plus size={16} color="white" />
              </TouchableOpacity>
            </View>

            {contacts.length === 0 ? (
              <View style={styles.emptyWhitelist}>
                <Phone size={32} color="#9ca3af" />
                <Text style={styles.emptyWhitelistText}>No trusted devices</Text>
                <Text style={styles.emptyWhitelistSubtext}>
                  Add device numbers to receive alerts
                </Text>
              </View>
            ) : (
              <View style={styles.contactsList}>
                {contacts.map((contact) => (
                  <View key={contact.id} style={styles.contactItem}>
                    <View style={styles.contactInfo}>
                      <View style={styles.contactIcon}>
                        <User size={16} color="#059669" />
                      </View>
                      <View style={styles.contactDetails}>
                        <Text style={styles.contactName}>{contact.name}</Text>
                        <Text style={styles.contactPhone}>
                          {formatPhoneNumber(contact.phoneNumber)}
                        </Text>
                      </View>
                    </View>
                    <TouchableOpacity
                      style={styles.removeButton}
                      onPress={() => handleRemoveContact(contact.id)}
                    >
                      <Trash2 size={16} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            )}
          </View>

          {/* Data Export */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Data Export</Text>
            <TouchableOpacity style={styles.exportButton}>
              <Download size={20} color="#059669" />
              <Text style={styles.exportButtonText}>Export Event History</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>

        {/* Add Contact Modal */}
        {showAddForm && (
          <View style={styles.modalOverlay}>
            <View style={styles.addFormContainer}>
              <Text style={styles.addFormTitle}>Add Trusted Device</Text>
              
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Device Name</Text>
                <TextInput
                  style={styles.textInput}
                  value={newContactName}
                  onChangeText={setNewContactName}
                  placeholder="e.g. Family Member, Security Device"
                />
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Phone Number</Text>
                <TextInput
                  style={styles.textInput}
                  value={newContactPhone}
                  onChangeText={setNewContactPhone}
                  placeholder="+639451458138"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.addFormButtons}>
                <TouchableOpacity
                  style={[styles.formButton, styles.cancelButton]}
                  onPress={() => {
                    setShowAddForm(false);
                    setNewContactName('');
                    setNewContactPhone('');
                  }}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.formButton, styles.saveButton]}
                  onPress={handleAddContact}
                >
                  <Text style={styles.saveButtonText}>Add Device</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}
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
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#1f2937',
  },
  headerIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  section: {
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
  },
  addButton: {
    backgroundColor: '#059669',
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  settingInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  settingLabel: {
    fontSize: 16,
    color: '#374151',
  },
  settingValue: {
    fontSize: 16,
    color: '#6b7280',
  },
  emptyWhitelist: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 40,
    borderRadius: 16,
    alignItems: 'center',
  },
  emptyWhitelistText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#374151',
    marginTop: 16,
  },
  emptyWhitelistSubtext: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    marginTop: 8,
  },
  contactsList: {
    gap: 8,
  },
  contactItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
  },
  contactInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  contactIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  contactDetails: {
    flex: 1,
  },
  contactName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
  },
  contactPhone: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  removeButton: {
    padding: 8,
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  exportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#059669',
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  addFormContainer: {
    backgroundColor: 'white',
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
  },
  addFormTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#374151',
  },
  addFormButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
  },
  formButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f3f4f6',
  },
  cancelButtonText: {
    color: '#6b7280',
    fontWeight: '600',
  },
  saveButton: {
    backgroundColor: '#059669',
  },
  saveButtonText: {
    color: 'white',
    fontWeight: '600',
  },
});