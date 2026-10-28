import axios from 'axios'

const PROD_API_URL = 'https://xpenz-finance-tracker-advance.vercel.app/api'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }
  // Native Capacitor Android / iOS APK detection
  const isNativeApp = 
    window.Capacitor || 
    window.location.protocol === 'capacitor:' || 
    window.location.protocol === 'file:' ||
    (window.location.hostname === 'localhost' && window.location.port !== '5173' && window.location.port !== '4173')

  if (isNativeApp) {
    return PROD_API_URL
  }

  // If running in browser locally or on any Vercel domain
  if (typeof window !== 'undefined') {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return '/api'
    }
    if (window.location.hostname.endsWith('.vercel.app') || window.location.origin) {
      return '/api'
    }
  }

  // Fallback production URL
  return PROD_API_URL
}

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
  async (error) => {
    const originalRequest = error.config

    // Failover for local development: if request to local /api fails with connection error (port 5000 offline), retry to production backend
    if (
      originalRequest &&
      !originalRequest._retry &&
      (!error.response || error.response.status >= 502) &&
      typeof window !== 'undefined' &&
      (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') &&
      !originalRequest.url?.startsWith('http')
    ) {
      originalRequest._retry = true
      originalRequest.baseURL = PROD_API_URL
      try {
        return await axios(originalRequest)
      } catch (retryErr) {
        return Promise.reject(retryErr)
      }
    }

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
