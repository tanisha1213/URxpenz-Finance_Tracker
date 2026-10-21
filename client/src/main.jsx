import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { Provider } from 'react-redux'
import store from './redux/store.js'
import { ThemeProvider } from './context/ThemeContext.jsx'
import { LanguageProvider } from './context/LanguageContext.jsx'
import { NotificationProvider } from './context/NotificationContext.jsx'
import { registerSW } from 'virtual:pwa-register'

// Register Service Worker immediately for background push notifications
registerSW({ immediate: true })

// Automatically reload page if a dynamic import fails due to a new deployment update
window.addEventListener('vite:preloadError', () => {
  window.location.reload()
})

// Recover from 404 on old CSS files when a new version is deployed
window.addEventListener('error', (e) => {
  if (e.target && e.target.tagName === 'LINK' && e.target.rel === 'stylesheet') {
    const reloaded = sessionStorage.getItem('xpenz_css_reloaded')
    if (!reloaded) {
      sessionStorage.setItem('xpenz_css_reloaded', 'true')
      window.location.reload()
    }
  }
}, true)

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <LanguageProvider>
          <NotificationProvider>
            <App />
          </NotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </Provider>
  </React.StrictMode>,
)
