import { create } from 'zustand';
import api from '../api/axios';

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
}

interface AuthState {
  user: User | null;
  token: string | null;
  theme: 'light' | 'dark';
  language: 'fr' | 'en';
  currency: 'USD' | 'CDF';
  enabledModules: string[];
  setAuth: (user: User, token: string) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
  setTheme: (theme: 'light' | 'dark') => void;
  setLanguage: (lang: 'fr' | 'en') => void;
  setCurrency: (curr: 'USD' | 'CDF') => void;
  toggleModule: (moduleId: string) => void;
}

const loadInitialAuth = () => {
  try {
    const stored = localStorage.getItem('hub-auth');
    if (stored) {
      const parsed = JSON.parse(stored);
      return {
        user: (parsed.user || null) as User | null,
        token: (parsed.token || null) as string | null,
      };
    }
  } catch {
    // ignore
  }
  return { user: null, token: localStorage.getItem('token') };
};

const initialAuth = loadInitialAuth();

export const useAuthStore = create<AuthState>((set) => ({
  user: initialAuth.user,
  token: initialAuth.token,
  theme: (localStorage.getItem('theme') as 'light' | 'dark') || 'light',
  language: (localStorage.getItem('language') as 'fr' | 'en') || 'fr',
  currency: (localStorage.getItem('currency') as 'USD' | 'CDF') || 'CDF',
  enabledModules: JSON.parse(localStorage.getItem('enabledModules') || '[]'),

  setAuth: (user, token) => {
    localStorage.setItem('hub-auth', JSON.stringify({ user, token }));
    localStorage.setItem('token', token);
    
    const prefs = user.preferences || {};
    const theme = prefs.theme || 'dark';
    const lang = prefs.language || 'fr';
    const modules = prefs.enabledModules || [];
    const curr = prefs.currency || 'CDF';

    localStorage.setItem('theme', theme);
    localStorage.setItem('language', lang);
    localStorage.setItem('currency', curr);
    localStorage.setItem('enabledModules', JSON.stringify(modules));
    document.documentElement.setAttribute('data-theme', theme);

    set({ 
        user, 
        token, 
        theme: theme as any, 
        language: lang as any, 
        enabledModules: modules,
        currency: curr as any 
    });
  },

  logout: () => {
    localStorage.removeItem('hub-auth');
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },

  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const { data } = await api.get('/auth/profile');
      const user = data.user || data;
      const prefs = user.preferences || {};
      
      // Update local storage to match server preferences if they exist
      if (prefs.theme) localStorage.setItem('theme', prefs.theme);
      if (prefs.language) localStorage.setItem('language', prefs.language);
      if (prefs.enabledModules) localStorage.setItem('enabledModules', JSON.stringify(prefs.enabledModules));
      if (prefs.currency) localStorage.setItem('currency', prefs.currency);

      set({ 
        user, 
        token, 
        theme: prefs.theme || (localStorage.getItem('theme') as any) || 'dark',
        language: prefs.language || (localStorage.getItem('language') as any) || 'fr',
        enabledModules: prefs.enabledModules || JSON.parse(localStorage.getItem('enabledModules') || '[]'),
        currency: prefs.currency || (localStorage.getItem('currency') as any) || 'CDF'
      });
      
      document.documentElement.setAttribute('data-theme', prefs.theme || localStorage.getItem('theme') || 'dark');
    } catch (err) {
      // Token probably invalid
      localStorage.removeItem('hub-auth');
      localStorage.removeItem('token');
      set({ token: null, user: null });
    }
  },

  updateUser: (data) => set((state) => {
    if (!state.user) return { user: null };
    const updated = { ...state.user, ...data };
    localStorage.setItem('hub-auth', JSON.stringify({ user: updated, token: state.token }));
    return { user: updated };
  }),

  syncPreferencesToServer: async (prefs: any) => {
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
      } catch (e) {}
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
      localStorage.setItem('hub-auth', JSON.stringify({ user: updatedUser, token: state.token }));
      // Fire and forget sync to backend
      (useAuthStore.getState() as any).syncPreferencesToServer({ theme });
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
      localStorage.setItem('hub-auth', JSON.stringify({ user: updatedUser, token: state.token }));
      (useAuthStore.getState() as any).syncPreferencesToServer({ language });
    }
    return { language, user: updatedUser };
  }),

  setCurrency: (currency) => set((state) => {
    localStorage.setItem('currency', currency);
    
    let updatedUser = state.user;
    if (state.user) {
      updatedUser = {
        ...state.user,
        preferences: { ...state.user.preferences, currency }
      };
      localStorage.setItem('hub-auth', JSON.stringify({ user: updatedUser, token: state.token }));
      (useAuthStore.getState() as any).syncPreferencesToServer({ currency });
    }
    return { currency, user: updatedUser };
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
      localStorage.setItem('hub-auth', JSON.stringify({ user: updatedUser, token: state.token }));
      (useAuthStore.getState() as any).syncPreferencesToServer({ enabledModules: updated });
    }

    return { enabledModules: updated, user: updatedUser };
  }),
}));

