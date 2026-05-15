import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

export const SESSION_EXPIRY_EVENT = 'hub-session-expired';

const encodeData = (data: any) => {
  try {
    const json = JSON.stringify(data);
    // Use btoa safely with unescape/encodeURIComponent for UTF-8 support
    return btoa(unescape(encodeURIComponent(json)));
  } catch (e) {
    return JSON.stringify(data);
  }
};

const decodeData = (encoded: string | null) => {
  if (!encoded) return null;
  try {
    if (encoded.startsWith('{')) return JSON.parse(encoded);
    // Use atob safely with decodeURIComponent/escape for UTF-8 support
    const decoded = decodeURIComponent(escape(atob(encoded)));
    return JSON.parse(decoded);
  } catch (e) {
    try { return JSON.parse(encoded); } catch(ee) { return null; }
  }
};

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || '/api',
  withCredentials: true, // Crucial pour les cookies sécurisés et CSRF
});

// ─── Request Interceptor: attach access token & CSRF ──────────────────────────
api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('hub-auth');
  const decoded = decodeData(auth);
  let token = decoded ? decoded.token : null;
  
  if (!token) {
    token = localStorage.getItem('token');
  }

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
      const stored = localStorage.getItem('hub-auth');
      const decoded = decodeData(stored);
      if (!decoded) throw new Error('No auth');
      
      const { refreshToken } = decoded;
      if (!refreshToken) throw new Error('No refresh token');

      // Call refresh endpoint with credentials (cookie) or body
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        { refreshToken },
        { withCredentials: true }
      );

      // Persist new tokens with safe encoding
      const updated = { ...decoded, token: data.token, refreshToken: data.refreshToken };
      localStorage.setItem('hub-auth', encodeData(updated));
      localStorage.setItem('token', data.token);

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
