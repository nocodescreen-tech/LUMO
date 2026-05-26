import { create } from 'zustand';
import api from '../api/axios';

/** M5 Fix: Centralized currency normalizer – maps legacy 'FC' to canonical 'CDF' */
const normalizeCurrency = (raw: string | undefined | null): 'USD' | 'CDF' => {
  if (raw === 'FC' || raw === 'CDF') return 'CDF';
  if (raw === 'USD') return 'USD';
  return 'CDF';
};

interface EntrepriseInfo {
  nom?: string;
  devise?: string;
  adresse?: string;
  logo?: string;
}

interface UserPreferences {
  theme?: 'light' | 'dark';
  language?: 'fr' | 'en';
  enabledModules?: string[];
  currency?: 'USD' | 'CDF';
  exchangeRate?: number;
  autoBackupEnabled?: boolean;
  backupTime?: string;
  notificationSoundEnabled?: boolean;
}

interface User {
  id: number;
  nom: string;
  email: string;
  role: string;
  avatar?: string;
  telephone?: string;
  typeActivite?: string;
  entreprise?: EntrepriseInfo;
  preferences?: UserPreferences;
  twoFactorEnabled?: boolean;
  permissions?: string[];
}

interface AuthState {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  language: 'fr' | 'en';
  currency: 'USD' | 'CDF';
  exchangeRate: number;
  enabledModules: string[];
  setAuth: (user: User, token: string, refreshToken?: string) => void;
  logout: (shouldRedirect?: boolean) => void;
  checkAuth: (shouldRedirect?: boolean) => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  setCurrency: (curr: 'USD' | 'CDF') => void;
  setExchangeRate: (rate: number) => void;
  toggleModule: (moduleId: string) => void;
  syncPreferencesToServer: (prefs: Partial<UserPreferences>) => Promise<void>;
}

export const encodeData = (data: any) => {
  try {
    const json = JSON.stringify(data);
    // Safe UTF-8 Base64 encoding
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    return JSON.stringify(data);
  }
};

export const decodeData = (encoded: string | null) => {
  if (!encoded) return null;
  try {
    if (encoded.startsWith('{')) return JSON.parse(encoded);
    // Safe UTF-8 Base64 decoding
    const decoded = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(decoded);
  } catch (e) {
    try { return JSON.parse(encoded); } catch(ee) { return null; }
  }
};

const loadInitialAuth = () => {
  const stored = localStorage.getItem('lumo-auth');
  const decoded = decodeData(stored);
  if (decoded) {
    return {
      user: (decoded.user || null) as User | null,
      token: (decoded.token || null) as string | null,
    };
  }
  return { user: null, token: localStorage.getItem('token') };
};

const initialAuth = loadInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  theme: initialAuth.user?.preferences?.theme || (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  language: initialAuth.user?.preferences?.language || (localStorage.getItem('language') as 'fr' | 'en') || 'fr',
  currency: normalizeCurrency((initialAuth.user?.preferences?.currency as any) || localStorage.getItem('currency') as any),
  exchangeRate: Number(initialAuth.user?.preferences?.exchangeRate || localStorage.getItem('exchangeRate') || 0),
  enabledModules: initialAuth.user?.preferences?.enabledModules || JSON.parse(localStorage.getItem('enabledModules') || '[]'),

  setAuth: (user, token, refreshToken) => {
    const current = decodeData(localStorage.getItem('lumo-auth')) || {};
    const authData: any = { user, token };
    if (refreshToken) {
        authData.refreshToken = refreshToken;
    } else if (current.refreshToken) {
        authData.refreshToken = current.refreshToken;
    }
    localStorage.setItem('lumo-auth', encodeData(authData));
    localStorage.setItem('token', token);
    
    const prefs = user.preferences || {};
    const theme = prefs.theme || 'dark';
    const lang = prefs.language || 'fr';
    const modules = prefs.enabledModules || [];
    const curr = normalizeCurrency((prefs.currency as any) || (user.entreprise?.devise as any));
    
    const rate = Number(prefs.exchangeRate || 0);

    localStorage.setItem('theme', theme);
    localStorage.setItem('language', lang);
    localStorage.setItem('currency', curr);
    localStorage.setItem('exchangeRate', rate.toString());
    localStorage.setItem('enabledModules', JSON.stringify(modules));
    document.documentElement.setAttribute('data-theme', theme);

    set({ 
        user, 
        token, 
        theme: theme as any, 
        language: lang as any, 
        enabledModules: modules,
        currency: curr,
        exchangeRate: rate
    });
  },

  logout: async (shouldRedirect = true) => {
    try {
      await api.post('/auth/logout');
    } catch (e) {
      // Ignorer si déjà expiré ou réseau coupé
    }
    
    // Nettoyage radical pour éviter la pollution de session (Bug persistance)
    localStorage.clear();
    
    // On peut réinitialiser certaines valeurs par défaut après le clear si besoin
    localStorage.setItem('theme', 'light'); 
    
    set({ 
        token: null, 
        user: null,
        theme: 'light',
        language: 'fr',
        currency: 'CDF',
        enabledModules: []
    });
    
    if (shouldRedirect) {
      // Force un rechargement complet pour vider les caches mémoire et réinitialiser l'état axios
      window.location.replace('/login');
    }
  },

  checkAuth: async (shouldRedirect = true) => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      // Ajout d'un cache-buster (?t=...) pour forcer le réseau et ignorer le cache PWA/Navigateur
      const { data } = await api.get(`/auth/profile?t=${Date.now()}`);
      const user = data.user || data;
      const prefs = user.preferences || {};
      
      const curr = normalizeCurrency((prefs.currency as any) || (user.entreprise?.devise as any));
      const theme = prefs.theme || localStorage.getItem('theme') || 'dark';
      const lang = prefs.language || localStorage.getItem('language') || 'fr';
      // Fix: if server returns empty [], prefer localStorage to avoid erasing toggled modules
      const serverModules = prefs.enabledModules;
      const localModules = JSON.parse(localStorage.getItem('enabledModules') || '[]');
      const modules = (Array.isArray(serverModules) && serverModules.length > 0)
        ? serverModules
        : (localModules.length > 0 ? localModules : (serverModules || []));
      const rate = Number(prefs.exchangeRate || parseFloat(localStorage.getItem('exchangeRate') || '0'));

      // Update localStorage with latest server data (including nom changes)
      localStorage.setItem('theme', theme);
      localStorage.setItem('language', lang);
      localStorage.setItem('enabledModules', JSON.stringify(modules));
      localStorage.setItem('exchangeRate', rate.toString());
      
      // Persist full user object using safe encoding (handles accents/unicode)
      const currentAuth = decodeData(localStorage.getItem('lumo-auth')) || {};
      localStorage.setItem('lumo-auth', encodeData({ ...currentAuth, user, token }));

      set({ 
        user, 
        token, 
        theme: theme as any,
        language: lang as any,
        enabledModules: modules,
        currency: curr,
        exchangeRate: rate
      });
      
      document.documentElement.setAttribute('data-theme', theme);
    } catch (err) {
      // Token probably invalid
      localStorage.removeItem('lumo-auth');
      localStorage.removeItem('token');
      set({ token: null, user: null });
      if (shouldRedirect && window.location.pathname !== '/login' && window.location.pathname !== '/' && window.location.pathname !== '/register') {
          window.location.href = '/login?expired=true';
      }
      throw err;
    }
  },

  updateUser: (data) => set((state) => {
    if (!state.user) return { user: null };
    const updated = { ...state.user, ...data };
    const currentAuth = decodeData(localStorage.getItem('lumo-auth')) || {};
    localStorage.setItem('lumo-auth', encodeData({ ...currentAuth, user: updated, token: state.token }));
    return { user: updated };
  }),

  syncPreferencesToServer: async (prefs: Partial<UserPreferences>) => {
      try {
          const state = useAuthStore.getState();
          if (state.token && state.user) {
              const payload = {
                  nom: state.user.nom,
                  preferences: { 
                      ...(state.user.preferences || {}), 
                      ...prefs 
                  }
              };
              await api.put('/auth/profile', payload);
          }
      } catch (e) {
        console.error("Failed to sync preferences to server:", e);
      }
  },

  setTheme: (theme) => set((state) => {
    localStorage.setItem('theme', theme);
    document.documentElement.setAttribute('data-theme', theme);
    
    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, theme }
      };
      const currentAuth = decodeData(localStorage.getItem('lumo-auth')) || {};
      localStorage.setItem('lumo-auth', encodeData({ ...currentAuth, user: updatedUser, token: state.token }));
      // Fire and forget sync to backend
      useAuthStore.getState().syncPreferencesToServer({ theme });
    }
    return { theme, user: updatedUser };
  }),

  setLanguage: (language) => set((state) => {
    localStorage.setItem('language', language);
    
    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, language }
      };
      const currentAuth = decodeData(localStorage.getItem('lumo-auth')) || {};
      localStorage.setItem('lumo-auth', encodeData({ ...currentAuth, user: updatedUser, token: state.token }));
      useAuthStore.getState().syncPreferencesToServer({ language });
    }
    return { language, user: updatedUser };
  }),

  setCurrency: (currency) => set((state) => {
    let curr = normalizeCurrency(currency as any);
    localStorage.setItem('currency', curr);
    
    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, currency: curr }
      };
      const currentAuth = decodeData(localStorage.getItem('lumo-auth')) || {};
      localStorage.setItem('lumo-auth', encodeData({ ...currentAuth, user: updatedUser, token: state.token }));
      useAuthStore.getState().syncPreferencesToServer({ currency: curr });
    }
    return { currency: curr, user: updatedUser };
  }),

  setExchangeRate: (rate) => set((state) => {
    localStorage.setItem('exchangeRate', rate.toString());
    
    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, exchangeRate: rate }
      };
      const currentAuth = decodeData(localStorage.getItem('lumo-auth')) || {};
      localStorage.setItem('lumo-auth', encodeData({ ...currentAuth, user: updatedUser, token: state.token }));
      useAuthStore.getState().syncPreferencesToServer({ exchangeRate: rate });
    }
    return { exchangeRate: rate, user: updatedUser };
  }),

  toggleModule: (moduleId) => set((state) => {
    const updated = state.enabledModules.includes(moduleId)
      ? state.enabledModules.filter(m => m !== moduleId)
      : [...state.enabledModules, moduleId];
    
    localStorage.setItem('enabledModules', JSON.stringify(updated));
    
    // Sync with user object if exists
    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: {
          ...state.user.preferences,
          enabledModules: updated
        }
      };
      const currentAuth = decodeData(localStorage.getItem('lumo-auth')) || {};
      localStorage.setItem('lumo-auth', encodeData({ ...currentAuth, user: updatedUser, token: state.token }));
      useAuthStore.getState().syncPreferencesToServer({ enabledModules: updated });
    }

    return { enabledModules: updated, user: updatedUser };
  }),
}));

