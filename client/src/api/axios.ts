import axios from 'axios';

const api = axios.create({
  baseURL: (import.meta as any).env.VITE_API_BASE_URL || 'http://localhost:5000/api',
});

// Add a request interceptor to add the JWT token to headers
api.interceptors.request.use((config) => {
  const auth = localStorage.getItem('hub-auth');
  if (auth) {
    const { token } = JSON.parse(auth);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export default api;
