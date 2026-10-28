import { createContext, useContext, useState, useEffect, useRef } from 'react'
import {
  getVapidPublicKey,
  subscribeToPush,
  unsubscribeFromPush,
  sendTestPush,
  checkReminders
} from '../services/notificationService'

const NotificationContext = createContext()

// Helper to convert VAPID base64 string to Uint8Array for PushManager
function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  const outputArray = new Uint8Array(rawData.length)
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i)
  }
  return outputArray
}

export function NotificationProvider({ children }) {
  const [popupEnabled, setPopupEnabledState] = useState(() => {
    const saved = localStorage.getItem('xpenz_popup_notifications')
    return saved === null ? true : saved === 'true'
  })

  const [popups, setPopups] = useState([])
  const [isPushSupported, setIsPushSupported] = useState(false)
  const [pushPermission, setPushPermission] = useState('default')
  const [isPushSubscribed, setIsPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const seenIdsRef = useRef(new Set())

  // Check initial push support and permission
  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
    setIsPushSupported(supported)

    if (supported) {
      setPushPermission(Notification.permission)
      checkExistingPushSubscription()
    }
  }, [])

  // Check if browser is already subscribed to push
  const checkExistingPushSubscription = async () => {
    try {
      if (!('serviceWorker' in navigator)) return
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      setIsPushSubscribed(!!subscription)
    } catch (err) {
      console.warn('[Push] Error checking subscription:', err)
    }
  }

  const setPopupEnabled = (enabled) => {
    setPopupEnabledState(enabled)
    localStorage.setItem('xpenz_popup_notifications', enabled ? 'true' : 'false')
  }

  const dismissPopup = (id) => {
    setPopups((prev) => prev.filter((p) => p.id !== id))
  }

  /**
   * Subscribe user device to OS-level Web Push notifications (works even when app is closed)
   */
  const enablePushNotifications = async () => {
    if (!isPushSupported) {
      throw new Error('Push notifications are not supported by this browser.')
    }

    setPushLoading(true)
    try {
      // 1. Request notification permission
      const permission = await Notification.requestPermission()
      setPushPermission(permission)

      if (permission !== 'granted') {
        throw new Error('Notification permission was not granted. Please allow notifications in your browser settings.')
      }

      // 2. Fetch server VAPID public key with robust fallback
      const DEFAULT_VAPID_PUBLIC_KEY = 'BPHC8vieuheJ9exGTTlIxzzADsWEEfr_WivQERM5PD9jMLGdM05grEC9wjg4QWtu-pMreMUXZzPJ5WLD452VdT0'
      let publicKey = DEFAULT_VAPID_PUBLIC_KEY

      try {
        const keyRes = await getVapidPublicKey()
        if (keyRes.data && keyRes.data.publicKey) {
          publicKey = keyRes.data.publicKey
        }
      } catch (keyErr) {
        console.warn('[Push] Using fallback VAPID key due to server notice:', keyErr.message)
      }

      // 3. Register push subscription with browser service worker
      let registration = await navigator.serviceWorker.getRegistration()
      if (!registration) {
        registration = await navigator.serviceWorker.register('/sw.js')
      }
      registration = await navigator.serviceWorker.ready

      let subscription = await registration.pushManager.getSubscription()

      if (!subscription) {
        subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey)
        })
      }

      // 4. Send subscription to server
      try {
        await subscribeToPush(subscription, navigator.userAgent)
      } catch (subErr) {
        console.warn('[Push] Server sync notice:', subErr.message)
      }

      setIsPushSubscribed(true)
      return subscription
    } catch (err) {
      console.error('[Push Subscription Error]:', err)
      throw err
    } finally {
      setPushLoading(false)
    }
  }

  /**
   * Unsubscribe from OS-level push notifications
   */
  const disablePushNotifications = async () => {
    setPushLoading(true)
    try {
      const registration = await navigator.serviceWorker.ready
      const subscription = await registration.pushManager.getSubscription()
      if (subscription) {
        try {
          await unsubscribeFromPush(subscription.endpoint)
        } catch (e) {
          // ignore
        }
        await subscription.unsubscribe()
      }
      setIsPushSubscribed(false)
    } catch (err) {
      console.error('[Push Unsubscribe Error]:', err)
      throw err
    } finally {
      setPushLoading(false)
    }
  }

  /**
   * Send a test push notification to verify OS-level notification pops up on screen
   */
  const triggerTestPush = async () => {
    setPushLoading(true)
    try {
      // 1. Immediately trigger an OS-level notification via the service worker
      if ('serviceWorker' in navigator && 'Notification' in window && Notification.permission === 'granted') {
        try {
          const reg = await navigator.serviceWorker.ready
          if (reg && reg.showNotification) {
            reg.showNotification('Xpenz Desktop & Mobile Alert 🚀', {
              body: 'Native OS notifications are active! You will now receive loan due and EMI alerts even when the app is completely closed.',
              icon: '/pwa-192x192.png',
              badge: '/pwa-192x192.png',
              vibrate: [200, 100, 200],
              data: { url: '/dashboard' }
            }).catch(() => {})
          }
        } catch (swErr) {
          console.warn('[Push] ServiceWorker local notification notice:', swErr)
        }
      }

      // 2. Also dispatch from server Web Push
      let resData = { success: true, message: 'Test notification sent! Check your system screen or notification tray.' }
      try {
        const res = await sendTestPush()
        if (res && res.data) {
          resData = res.data
        }
      } catch (netErr) {
        console.warn('[Push] Remote test push notice:', netErr.message)
      }

      return resData
    } catch (err) {
      console.error('[Trigger Test Push Error]:', err)
      throw err
    } finally {
      setPushLoading(false)
    }
  }

  const triggerPopup = ({ id, title, message, time = 'Just now', type = 'info' }) => {
    if (!popupEnabled) return

    const popupId = id || `popup-${title}-${message}`
    
    // Deduplicate: prevent firing the exact same notification multiple times in one session
    if (seenIdsRef.current.has(popupId)) return
    seenIdsRef.current.add(popupId)

    // Keep max 2 visible floating banners inside app
    setPopups((prev) => {
      if (prev.some((p) => p.id === popupId)) return prev
      const updated = [...prev, { id: popupId, title, message, time, type }]
      return updated.slice(-2)
    })

    // If ServiceWorker is ready and permission granted, also fire persistent notification
    if ('Notification' in window && Notification.permission === 'granted') {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((reg) => {
          reg.showNotification(title, {
            body: message,
            icon: '/pwa-192x192.png',
            badge: '/pwa-192x192.png',
            vibrate: [200, 100, 200]
          }).catch(() => {
            // Fallback to window Notification
            new Notification(title, { body: message, icon: '/pwa-192x192.png' })
          })
        }).catch(() => {
          new Notification(title, { body: message, icon: '/pwa-192x192.png' })
        })
      } else {
        new Notification(title, { body: message, icon: '/pwa-192x192.png' })
      }
    }

    // Auto dismiss after 5 seconds
    setTimeout(() => {
      dismissPopup(popupId)
    }, 5000)
  }

  return (
    <NotificationContext.Provider
      value={{
        popupEnabled,
        setPopupEnabled,
        popups,
        triggerPopup,
        dismissPopup,
        isPushSupported,
        pushPermission,
        isPushSubscribed,
        pushLoading,
        enablePushNotifications,
        disablePushNotifications,
        triggerTestPush,
        checkReminders
      }}
    >
      {children}
    </NotificationContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export const useNotification = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider')
  }
  return context
}

export default NotificationContext
