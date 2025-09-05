import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface EventData {
  id: string;
  type: 'SOS' | 'BUTTON_PRESS' | 'OTW_SENT';
  phoneNumber: string;
  timestamp: number;
  content: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  isRead?: boolean;
}

interface EventStore {
  events: EventData[];
  addEvent: (event: EventData) => void;
  markAsRead: (eventId: string) => void;
  clearEvents: () => void;
  exportEvents: () => Promise<void>;
}

export const useEventStore = create<EventStore>()(
  persist(
    (set, get) => ({
      events: [],
      
      addEvent: (event: EventData) => {
        set((state) => ({
          events: [event, ...state.events].slice(0, 100) // Keep only last 100 events
        }));
      },
      
      markAsRead: (eventId: string) => {
        set((state) => ({
          events: state.events.map(event =>
            event.id === eventId ? { ...event, isRead: true } : event
          )
        }));
      },
      
      clearEvents: () => {
        set({ events: [] });
      },
      
      exportEvents: async () => {
        const { events } = get();
        // In a real app, you'd implement CSV export or share functionality
        console.log('Exporting events:', events);
      }
    }),
    {
      name: 'event-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);