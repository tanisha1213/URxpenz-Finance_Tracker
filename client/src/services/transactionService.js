import API from './api'
import {
  isOnline,
  enqueueOfflineTransaction,
  cacheTransactions,
  getCachedTransactions
} from './offlineSyncService'

export const getTransactions = async (params) => {
  if (!isOnline()) {
    const cached = getCachedTransactions()
    return {
      data: {
        success: true,
        offline: true,
        data: cached,
        pagination: { page: 1, limit: 50, total: cached.length, pages: 1 }
      }
    }
  }

  try {
    const response = await API.get('/transactions', { params })
    if (response.data?.data) {
      cacheTransactions(response.data.data)
    }
    return response
  } catch (error) {
    // If network connection dropped mid-request, gracefully fall back to cache
    if (!error.response || !isOnline()) {
      const cached = getCachedTransactions()
      return {
        data: {
          success: true,
          offline: true,
          data: cached,
          pagination: { page: 1, limit: 50, total: cached.length, pages: 1 }
        }
      }
    }
    throw error
  }
}

export const createTransaction = async (data) => {
  if (!isOnline()) {
    const offlineTx = enqueueOfflineTransaction(data)
    return {
      data: {
        success: true,
        offline: true,
        data: offlineTx,
        message: 'Saved offline. It will automatically sync to your cloud account once reconnected.'
      }
    }
  }

  try {
    const response = await API.post('/transactions', data)
    return response
  } catch (error) {
    // If request failed due to loss of network connection, enqueue offline instead of throwing
    if (!error.response || !isOnline()) {
      const offlineTx = enqueueOfflineTransaction(data)
      return {
        data: {
          success: true,
          offline: true,
          data: offlineTx,
          message: 'Network issue detected. Saved offline and queued for auto-sync.'
        }
      }
    }
    throw error
  }
}

export const updateTransaction = (id, data) => API.put(`/transactions/${id}`, data)
export const deleteTransaction = (id) => API.delete(`/transactions/${id}`)

