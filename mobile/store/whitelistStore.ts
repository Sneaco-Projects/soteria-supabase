import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface WhitelistContact {
  id: string;
  name: string;
  phoneNumber: string;
  isActive: boolean;
}

interface WhitelistStore {
  contacts: WhitelistContact[];
  addContact: (contact: WhitelistContact) => void;
  removeContact: (contactId: string) => void;
  updateContact: (contactId: string, updates: Partial<WhitelistContact>) => void;
  isWhitelisted: (phoneNumber: string) => boolean;
}

export const useWhitelistStore = create<WhitelistStore>()(
  persist(
    (set, get) => ({
      contacts: [
        {
          id: '1',
          name: 'ESP32 Device',
          phoneNumber: '+639451458138',
          isActive: true,
        }
      ],
      
      addContact: (contact: WhitelistContact) => {
        set((state) => ({
          contacts: [...state.contacts, contact]
        }));
      },
      
      removeContact: (contactId: string) => {
        set((state) => ({
          contacts: state.contacts.filter(contact => contact.id !== contactId)
        }));
      },
      
      updateContact: (contactId: string, updates: Partial<WhitelistContact>) => {
        set((state) => ({
          contacts: state.contacts.map(contact =>
            contact.id === contactId ? { ...contact, ...updates } : contact
          )
        }));
      },
      
      isWhitelisted: (phoneNumber: string) => {
        const { contacts } = get();
        const normalizedPhone = phoneNumber.replace(/\s+/g, '');
        return contacts.some(contact => {
          const normalizedContact = contact.phoneNumber.replace(/\s+/g, '');
          return normalizedContact === normalizedPhone && contact.isActive;
        });
      }
    }),
    {
      name: 'whitelist-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);