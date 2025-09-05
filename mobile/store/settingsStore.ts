import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AppSettings {
  notificationsEnabled: boolean;
  sosAlertsOnly: boolean;
  mapProvider: 'google' | 'mapbox';
  autoSendOTW: boolean;
}

interface SettingsStore {
  settings: AppSettings;
  updateSettings: (updates: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      settings: {
        notificationsEnabled: true,
        sosAlertsOnly: false,
        mapProvider: 'google',
        autoSendOTW: false,
      },
      
      updateSettings: (updates: Partial<AppSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...updates }
        }));
      }
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);