import API from './api'

const QUEUE_STORAGE_KEY = 'xpenz_offline_queue'
const CACHE_STORAGE_KEY = 'xpenz_cached_transactions'

// Helper to safely parse JSON from localStorage
const getStoredArray = (key) => {
  try {
    const raw = localStorage.getItem(key)
    return raw ? JSON.parse(raw) : []
  } catch (err) {
    console.warn(`Error reading ${key} from storage:`, err)
    return []
  }
}

// Helper to safely write JSON to localStorage
const setStoredArray = (key, data) => {
  try {
    localStorage.setItem(key, JSON.stringify(data))
  } catch (err) {
    console.warn(`Error writing ${key} to storage:`, err)
  }
}

/**
 * Check if the browser currently has network connectivity
 */
export const isOnline = () => {
  return typeof navigator !== 'undefined' ? navigator.onLine : true
}

/**
 * Get current list of pending offline transactions
 */
export const getOfflineQueue = () => {
  return getStoredArray(QUEUE_STORAGE_KEY)
}

/**
 * Save recent transactions to local cache for offline browsing
 */
export const cacheTransactions = (transactions) => {
  if (!Array.isArray(transactions)) return
  // Cache the most recent 150 items to keep storage lightweight
  setStoredArray(CACHE_STORAGE_KEY, transactions.slice(0, 150))
}

/**
 * Retrieve cached transactions combined with pending offline transactions
 */
export const getCachedTransactions = () => {
  const cached = getStoredArray(CACHE_STORAGE_KEY)
  const queue = getStoredArray(QUEUE_STORAGE_KEY)

  // Format queued items as synthetic transactions
  const pendingTxs = queue.map((item) => ({
    _id: item.tempId,
    id: item.tempId,
    title: item.data.title || 'Untitled Expense',
    amount: Number(item.data.amount) || 0,
    type: item.data.type || 'expense',
    category: item.data.category || 'Other',
    paymentMethod: item.data.paymentMethod || 'cash',
    transactionDate: item.data.transactionDate || new Date().toISOString(),
    description: item.data.description || '',
    isOfflinePending: true,
    createdAt: item.createdAt || new Date().toISOString()
  }))

  // Deduplicate and place pending items on top
  const combined = [...pendingTxs, ...cached.filter((c) => !queue.some((q) => q.tempId === c._id))]
  return combined
}

/**
 * Add a new transaction to the offline queue
 */
export const enqueueOfflineTransaction = (transactionData) => {
  const tempId = `offline_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`
  const queue = getOfflineQueue()

  const queueItem = {
    tempId,
    data: {
      ...transactionData,
      amount: Number(transactionData.amount) || 0
    },
    createdAt: new Date().toISOString()
  }

  queue.push(queueItem)
  setStoredArray(QUEUE_STORAGE_KEY, queue)

  const syntheticTx = {
    _id: tempId,
    id: tempId,
    ...queueItem.data,
    isOfflinePending: true,
    createdAt: queueItem.createdAt
  }

  // Update cached list with this pending item
  const cached = getStoredArray(CACHE_STORAGE_KEY)
  setStoredArray(CACHE_STORAGE_KEY, [syntheticTx, ...cached.slice(0, 149)])

  // Emit event so UI components can react
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('xpenz-offline-queue-updated', {
        detail: { count: queue.length, item: syntheticTx }
      })
    )
  }

  return syntheticTx
}

let isSyncing = false

/**
 * Process the offline queue and upload each transaction to Supabase / Backend
 */
export const syncOfflineQueue = async (onProgress = null) => {
  if (isSyncing || !isOnline()) return { synced: 0, failed: 0, remaining: getOfflineQueue().length }

  const queue = getOfflineQueue()
  if (queue.length === 0) return { synced: 0, failed: 0, remaining: 0 }

  isSyncing = true
  let syncedCount = 0
  let failedCount = 0
  const remainingQueue = []

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('xpenz-sync-started', { detail: { total: queue.length } }))
  }

  for (let i = 0; i < queue.length; i++) {
    const item = queue[i]
    try {
      if (onProgress) onProgress(i + 1, queue.length)
      const res = await API.post('/transactions', item.data)
      const serverTx = res.data?.data || res.data

      // Replace tempId in cached transactions with real server transaction
      const cached = getStoredArray(CACHE_STORAGE_KEY)
      const updatedCache = cached.map((c) => (c._id === item.tempId ? serverTx : c))
      setStoredArray(CACHE_STORAGE_KEY, updatedCache)

      syncedCount++
    } catch (err) {
      console.error(`Failed to sync offline transaction ${item.tempId}:`, err)
      // Keep in queue to retry on next connectivity cycle
      remainingQueue.push(item)
      failedCount++
    }
  }

  setStoredArray(QUEUE_STORAGE_KEY, remainingQueue)
  isSyncing = false

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('xpenz-offline-synced', {
        detail: {
          synced: syncedCount,
          failed: failedCount,
          remaining: remainingQueue.length
        }
      })
    )
    window.dispatchEvent(
      new CustomEvent('xpenz-offline-queue-updated', {
        detail: { count: remainingQueue.length }
      })
    )
  }

  return { synced: syncedCount, failed: failedCount, remaining: remainingQueue.length }
}

/**
 * Initialize automatic sync listeners on window online events
 */
export const initOfflineSyncListener = () => {
  if (typeof window === 'undefined') return

  // Automatically trigger sync when back online
  window.addEventListener('online', () => {
    console.log('[OfflineSync] Connection restored. Synchronizing pending transactions...')
    window.dispatchEvent(new CustomEvent('xpenz-connection-restored'))
    syncOfflineQueue()
  })

  window.addEventListener('offline', () => {
    console.log('[OfflineSync] App is offline. Offline queue activated.')
    window.dispatchEvent(new CustomEvent('xpenz-connection-lost'))
  })

  // Check immediately on startup if online and pending items exist
  if (isOnline()) {
    const queue = getOfflineQueue()
    if (queue.length > 0) {
      setTimeout(() => {
        syncOfflineQueue()
      }, 1500)
    }
  }
}
