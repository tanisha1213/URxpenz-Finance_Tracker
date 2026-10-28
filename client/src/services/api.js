import axios from 'axios'

export const PROD_API_URL = 'https://urxpenz-finance-tracker.vercel.app/api'

const getBaseURL = () => {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL
  }

  // Native Capacitor Android / iOS APK detection
  const isNativeApp = 
    typeof window !== 'undefined' && (
      window.Capacitor || 
      window.location.protocol === 'capacitor:' || 
      window.location.protocol === 'file:' ||
      (window.location.hostname === 'localhost' && window.location.port !== '5173' && window.location.port !== '4173')
    )

  if (isNativeApp) {
    return PROD_API_URL
  }

  // In any browser environment (whether hosted on Vercel or running locally), use relative '/api'
  // Relative '/api' stays on the exact same origin, completely preventing any CORS preflight or cross-origin blocks
  if (typeof window !== 'undefined' && window.location && window.location.origin) {
    return '/api'
  }

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

    // Failover for local development ONLY: if local port 5000 is not running, retry against production backend
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
