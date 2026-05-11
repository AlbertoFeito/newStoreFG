import { create } from 'zustand';
import { MMKV } from 'react-native-mmkv';
import { createJSONStorage, persist } from 'zustand/middleware';
import { AppSettings, Currency } from '@/types';
import { getDatabase } from '@/hooks/useDatabase';
import { getSettings, updateSettings } from '@/db/operations';

const storage = new MMKV({ id: 'mitienda-storage' });

const zustandStorage = createJSONStorage(() => ({
  getItem: (name: string) => {
    const value = storage.getString(name);
    return value ?? null;
  },
  setItem: (name: string, value: string) => {
    storage.set(name, value);
  },
  removeItem: (name: string) => {
    storage.delete(name);
  },
}));

interface AppStore {
  settings: AppSettings | null;
  isLoading: boolean;

  loadSettings: () => Promise<void>;
  updateStoreSettings: (settings: Partial<AppSettings>) => Promise<void>;
  updateRates: (usd: number, eur: number, mlc: number) => Promise<void>;
  convertToCUP: (amount: number, currency: Currency) => number;
  formatPrice: (amount: number, currency: Currency) => string;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      settings: null,
      isLoading: false,

      loadSettings: async () => {
        set({ isLoading: true });
        try {
          const db = getDatabase();
          const settings = await getSettings(db);
          set({ settings, isLoading: false });
        } catch (error) {
          console.error('Error loading settings:', error);
          set({ isLoading: false });
        }
      },

      updateStoreSettings: async (newSettings) => {
        try {
          const db = getDatabase();
          await updateSettings(db, newSettings);
          const settings = await getSettings(db);
          set({ settings });
        } catch (error) {
          console.error('Error updating settings:', error);
        }
      },

      updateRates: async (usd, eur, mlc) => {
        await get().updateStoreSettings({ usdRate: usd, eurRate: eur, mlcRate: mlc });
      },

      convertToCUP: (amount, currency) => {
        const { settings } = get();
        if (!settings) return amount;
        if (currency === 'CUP') return amount;
        if (currency === 'USD') return amount * settings.usdRate;
        if (currency === 'EUR') return amount * settings.eurRate;
        if (currency === 'MLC') return amount * settings.mlcRate;
        return amount;
      },

      formatPrice: (amount, currency) => {
        return `${amount.toFixed(2)} ${currency}`;
      },
    }),
    {
      name: 'app-store',
      storage: zustandStorage,
      partialize: (state) => ({ settings: state.settings }),
    }
  )
);
