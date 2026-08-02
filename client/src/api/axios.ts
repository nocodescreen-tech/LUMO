import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const SESSION_EXPIRY_EVENT = 'lumo-session-expired';

// SECURITY: access token is stored in a single dedicated key (no PII).
const TOKEN_KEY = 'lumo-token';

const getToken = (): string | null => {
  return localStorage.getItem(TOKEN_KEY);
};

const setToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(TOKEN_KEY, token);
  } else {
    localStorage.removeItem(TOKEN_KEY);
  }
};

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // Crucial pour les cookies sécurisés et CSRF
});

// ─── Request Interceptor: attach access token & CSRF ──────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Anti-cache strict pour les données ERP en temps réel
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';

  // Ajout automatique du jeton CSRF s'il est stocké en session (optionnel selon implémentation)
  const csrfToken = document.cookie.split('; ').find(row => row.startsWith('XSRF-TOKEN='))?.split('=')[1];
  if (csrfToken) {
    config.headers['X-XSRF-TOKEN'] = decodeURIComponent(csrfToken);
  }

  return config;
});

// ─── Response Interceptor: silent token refresh ─────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) reject(error);
    else resolve(token);
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // Only intercept 401 TOKEN_EXPIRED errors (not login errors)
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry;

    if (!isTokenExpired) return Promise.reject(error);

    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      // SECURITY: refresh token is stored in an httpOnly cookie (not accessible
      // to JS). The refresh call relies on the cookie via withCredentials.
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true }
      );

      if (!data.token) throw new Error('No token returned');

      // Persist only the new access token (no PII).
      setToken(data.token);

      processQueue(null, data.token);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, null);

      // Session fully expired — clear store and dispatch event
      useAuthStore.getState().logout(false);
      window.dispatchEvent(new CustomEvent(SESSION_EXPIRY_EVENT));
      // window.location.href = '/login?expired=true'; // Modal will handle redirect or warning
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
