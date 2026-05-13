import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface SettingsState {
  theme: 'light' | 'dark';
  language: 'fr' | 'en';
  currency: 'USD' | 'CDF';
  modules: {
    fournisseurs: boolean;
    dettes: boolean;
  };
  barcodeScannerEnabled: boolean;
  toggleTheme: () => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  setCurrency: (curr: 'USD' | 'CDF') => void;
  toggleModule: (module: 'fournisseurs' | 'dettes') => void;
  toggleBarcodeScanner: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'fr',
      currency: 'CDF',
      modules: {
        fournisseurs: true,
        dettes: true,
      },
      barcodeScannerEnabled: false,
      toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
      setLanguage: (language) => set({ language }),
      setCurrency: (currency) => set({ currency }),
      toggleModule: (module) => set((state) => ({
        modules: { ...state.modules, [module]: !state.modules[module] }
      })),
      toggleBarcodeScanner: () => set((state) => ({ barcodeScannerEnabled: !state.barcodeScannerEnabled })),
    }),
    {
      name: 'lumo-settings',
    }
  )
);
