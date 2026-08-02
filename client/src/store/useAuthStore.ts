import { create } from 'zustand';
import api from '../api/axios';

/** M5 Fix: Centralized currency normalizer – maps legacy 'FC' to canonical 'CDF' */
const normalizeCurrency = (raw: string | undefined | null): 'USD' | 'CDF' => {
  if (raw === 'FC' || raw === 'CDF') return 'CDF';
  if (raw === 'USD') return 'USD';
  return 'CDF';
};

const normalizeModules = (mods: string[] = []) => {
  // Keep module IDs as-is — no remapping needed
  return Array.from(new Set(mods));
};

interface EntrepriseInfo {
  nom?: string;
  devise?: string;
  adresse?: string;
  logo?: string;
  telephone?: string;
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

// ─── SECURITY: localStorage stores ONLY the access token ─────────────────────
// The full user object (email, phone, enterprise info, preferences) is kept in
// memory (Zustand store) only and re-fetched from the server on page reload.
// This prevents sensitive PII from being readable in DevTools localStorage.
const TOKEN_KEY = 'lumo-token';

const getStoredToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const setStoredToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const loadInitialAuth = () => {
  return { user: null as User | null, token: getStoredToken() };
};

const initialAuth = loadInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  theme: 'light',
  language: 'fr',
  currency: 'CDF',
  exchangeRate: 0,
  enabledModules: [],

  setAuth: (user, token, refreshToken) => {
    // SECURITY: persist ONLY the access token. The user object (with PII) stays
    // in memory and is re-fetched from the server on reload via checkAuth().
    setStoredToken(token);

    const prefs = user.preferences || {};
    const theme = prefs.theme || 'dark';
    const lang = prefs.language || 'fr';
    const modules = prefs.enabledModules || [];
    const curr = normalizeCurrency((prefs.currency as any) || (user.entreprise?.devise as any));
    const rate = Number(prefs.exchangeRate || 0);

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

    // SECURITY: clear ALL localStorage (removes token + any legacy sensitive data)
    localStorage.clear();

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
    const token = getStoredToken();
    if (!token) return;

    try {
      // Ajout d'un cache-buster (?t=...) pour forcer le réseau et ignorer le cache PWA/Navigateur
      const { data } = await api.get(`/auth/profile?t=${Date.now()}`);
      const user = data.user || data;
      const prefs = user.preferences || {};

      const curr = normalizeCurrency((prefs.currency as any) || (user.entreprise?.devise as any));
      const theme = prefs.theme || 'dark';
      const lang = prefs.language || 'fr';
      const modules = normalizeModules(prefs.enabledModules || []);
      const rate = Number(prefs.exchangeRate || 0);

      // SECURITY: user object is kept in memory only — NOT persisted to localStorage.
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
      setStoredToken(null);
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
    // SECURITY: user object stays in memory only.
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
    document.documentElement.setAttribute('data-theme', theme);

    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, theme }
      };
      // Fire and forget sync to backend
      useAuthStore.getState().syncPreferencesToServer({ theme });
    }
    return { theme, user: updatedUser };
  }),

  setLanguage: (language) => set((state) => {
    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, language }
      };
      useAuthStore.getState().syncPreferencesToServer({ language });
    }
    return { language, user: updatedUser };
  }),

  setCurrency: (currency) => set((state) => {
    let curr = normalizeCurrency(currency as any);

    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, currency: curr }
      };
      useAuthStore.getState().syncPreferencesToServer({ currency: curr });
    }
    return { currency: curr, user: updatedUser };
  }),

  setExchangeRate: (rate) => set((state) => {
    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, exchangeRate: rate }
      };
      useAuthStore.getState().syncPreferencesToServer({ exchangeRate: rate });
    }
    return { exchangeRate: rate, user: updatedUser };
  }),

  toggleModule: (moduleId) => set((state) => {
    const updated = state.enabledModules.includes(moduleId)
      ? state.enabledModules.filter(m => m !== moduleId)
      : [...state.enabledModules, moduleId];

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
      useAuthStore.getState().syncPreferencesToServer({ enabledModules: updated });
    }

    return { enabledModules: updated, user: updatedUser };
  }),
}));
