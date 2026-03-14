import { create } from 'zustand';
import api from '../api/axios';

interface User {
  id: number;
  nom: string;
  email: string;
  role: string;
  avatar?: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  login: (token: string, user: User) => void;
  logout: () => void;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: localStorage.getItem('token'),
  login: (token, user) => {
    localStorage.setItem('token', token);
    set({ token, user });
  },
  logout: () => {
    localStorage.removeItem('token');
    set({ token: null, user: null });
  },
  checkAuth: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const { data } = await api.get('/auth/profile');
      set({ user: data.user, token });
    } catch (error) {
      localStorage.removeItem('token');
      set({ token: null, user: null });
    }
  }
}));
