import axios from 'axios'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  // Native Capacitor Android / iOS APK detection
  const isNativeApp = 
    window.Capacitor || 
    window.location.protocol === 'capacitor:' || 
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && window.location.port !== '5173' && window.location.port !== '4173');

  if (isNativeApp) {
    return 'https://xpenz-finance-tracker-advance.vercel.app/api';
  }

  // If running in browser locally or on any Vercel domain
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/api';
    }
    if (window.location.hostname.endsWith('.vercel.app') || window.location.origin) {
      return '/api';
    }
  }

  // Fallback production URL
  return 'https://xpenz-finance-tracker-advance.vercel.app/api';
};

const API = axios.create({
  baseURL: getBaseURL()
})

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('user')
      const path = window.location.pathname
      if (path !== '/login' && path !== '/signup' && path !== '/forgot-password' && !path.startsWith('/reset-password')) {
        window.location.href = '/login'
      }
    }

    return Promise.reject(error)
  }
)

export default API
