import axios from 'axios';
import { getMemoryToken, setMemoryToken, useAuthStore } from '../store/useAuthStore';

export const SESSION_EXPIRY_EVENT = 'lumo-session-expired';

const getToken = (): string | null => {
  return getMemoryToken();
};

const setToken = (token: string | null) => {
  setMemoryToken(token);
};

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || '/api',
  timeout:30000,
  withCredentials: true, // Crucial pour les cookies sécurisés et CSRF
});

// ─── Request Interceptor: attach access token & CSRF ──────────────────────────
api.interceptors.request.use((config) => {
  const token = getToken();
  if(!['get','head','options'].includes(String(config.method||'get').toLowerCase()))config.headers['X-Lumo-Client']='1';
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Anti-cache strict pour les données ERP en temps réel
  config.headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
  config.headers['Pragma'] = 'no-cache';
  config.headers['Expires'] = '0';

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
    if(!originalRequest||originalRequest.signal?.aborted)return Promise.reject(error);

    // Only intercept 401 TOKEN_EXPIRED errors (not login errors)
    const isTokenExpired =
      error.response?.status === 401 &&
      error.response?.data?.code === 'TOKEN_EXPIRED' &&
      !originalRequest._retry;

    if (!isTokenExpired) return Promise.reject(error);

    originalRequest._retry = true;
    if (isRefreshing) {
      // Queue this request until refresh completes
      return new Promise((resolve, reject) => {
        failedQueue.push({ resolve, reject });
      }).then((newToken) => {
        if(originalRequest.signal?.aborted)return Promise.reject(error);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return api(originalRequest);
      });
    }

    isRefreshing = true;
    const previousToken=getToken();

    try {
      // SECURITY: refresh token is stored in an httpOnly cookie (not accessible
      // to JS). The refresh call relies on the cookie via withCredentials.
      const { data } = await axios.post(
        `${api.defaults.baseURL}/auth/refresh`,
        {},
        { withCredentials: true,timeout:12000,headers:{'X-Lumo-Client':'1'} }
      );

      if (!data.token) throw new Error('No token returned');
      if(getToken()!==previousToken){const e=new Error('Session changed during refresh');processQueue(e);return Promise.reject(e)}

      // Keep the access token in memory only. The refresh token remains in the
      // httpOnly cookie and is not readable by JavaScript.
      setToken(data.token);

      processQueue(null, data.token);

      // Retry original request with new token
      originalRequest.headers.Authorization = `Bearer ${data.token}`;
      return api(originalRequest);
    } catch (refreshError: any) {
      processQueue(refreshError, null);

      // Session fully expired — clear store and dispatch event
      if(getToken()===previousToken){setToken(null);useAuthStore.setState({token:null,user:null,exchangeRate:0,enabledModules:[]});window.dispatchEvent(new CustomEvent(SESSION_EXPIRY_EVENT));}
      // window.location.href = '/login?expired=true'; // Modal will handle redirect or warning
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export default api;
