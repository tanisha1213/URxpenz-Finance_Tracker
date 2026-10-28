import { useEffect, useState } from 'react'
import { getAccounts, addBankAccount, updateAccount, deleteBankAccount } from '../services/accountService'
import { formatCurrency } from '../utils/format'
import { FiPlus, FiEdit2, FiTrash2, FiCreditCard, FiDollarSign, FiCheck, FiX, FiInfo } from 'react-icons/fi'
import { useLanguage } from '../context/LanguageContext'
import { useSubscription } from '../context/SubscriptionContext'

const POPULAR_BANKS = [
  'State Bank of India (SBI)',
  'HDFC Bank',
  'ICICI Bank',
  'Axis Bank',
  'Kotak Mahindra Bank',
  'Bank of Baroda',
  'Punjab National Bank (PNB)',
  'Union Bank of India',
  'Canara Bank',
  'Bank of India',
  'Bank of Maharashtra',
  'Yes Bank',
  'IndusInd Bank',
  'Federal Bank',
  'IDBI Bank',
  'Central Bank of India',
  'Indian Bank',
  'UCO Bank',
  'IDFC First Bank',
  'Other (Type Below)'
]

function Balance() {
  const { t } = useLanguage()
  const { isPro, openUpgradeModal } = useSubscription()
  const [accounts, setAccounts] = useState(() => {
    try {
      const cached = localStorage.getItem('xpenz_cached_accounts')
      if (cached) {
        const parsed = JSON.parse(cached)
        if (Array.isArray(parsed) && parsed.length > 0) return parsed
      }
    } catch (e) {
      console.warn('Failed to parse cached accounts:', e)
    }
    return [
      { _id: 'default-cash', type: 'cash', name: 'Cash', balance: 0 },
      { _id: 'default-bank', type: 'bank', name: 'State Bank of India', balance: 0 }
    ]
  })
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  // Modal / Form states
  const [modalType, setModalType] = useState(null) // 'add' | 'edit' | 'delete'
  const [selectedAccount, setSelectedAccount] = useState(null)
  const [isCustomBank, setIsCustomBank] = useState(false)
  
  // Form fields
  const [formData, setFormData] = useState({ name: '', balance: '' })

  const fetchAccounts = async (silent = false) => {
    try {
      if (!silent && accounts.length === 0) setLoading(true)
      const response = await getAccounts()
      if (response?.data?.data && Array.isArray(response.data.data)) {
        setAccounts(response.data.data)
        localStorage.setItem('xpenz_cached_accounts', JSON.stringify(response.data.data))
        setError('')
      }
    } catch (err) {
      console.warn('Failed to fetch accounts:', err)
      const cached = localStorage.getItem('xpenz_cached_accounts')
      if (cached) {
        try {
          const parsed = JSON.parse(cached)
          if (Array.isArray(parsed) && parsed.length > 0) {
            setAccounts(parsed)
            setError('')
            return
          }
        } catch (e) {
          // ignore
        }
      }
      setError(err.response?.data?.message || 'Unable to connect to server. Working with saved balances.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAccounts(true)
    const handleSyncComplete = () => fetchAccounts(true)
    window.addEventListener('xpenz-offline-synced', handleSyncComplete)
    return () => window.removeEventListener('xpenz-offline-synced', handleSyncComplete)
  }, [])

  const handleOpenAdd = () => {
    const bankAccounts = accounts.filter(a => a.type === 'bank')
    if (!isPro && bankAccounts.length >= 1) {
      openUpgradeModal('accounts')
      return
    }
    setFormData({ name: '', balance: '0' })
    setModalType('add')
  }

  const handleOpenEdit = (account) => {
    setSelectedAccount(account)
    setFormData({ name: account.name, balance: account.balance.toString() })
    const isCustom = account.type === 'bank' && !POPULAR_BANKS.includes(account.name)
    setIsCustomBank(isCustom)
    setModalType('edit')
  }

  const handleOpenDelete = (account) => {
    setSelectedAccount(account)
    setModalType('delete')
  }

  const handleCloseModal = () => {
    setModalType(null)
    setSelectedAccount(null)
    setFormData({ name: '', balance: '' })
    setIsCustomBank(false)
  }

  const handleAddSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      const res = await addBankAccount({
        name: formData.name,
        balance: Number(formData.balance) || 0
      })
      setMessage('Bank account added successfully.')
      if (res?.data?.data) {
        setAccounts((prev) => {
          const updated = [...prev, res.data.data]
          localStorage.setItem('xpenz_cached_accounts', JSON.stringify(updated))
          return updated
        })
      }
      fetchAccounts(true)
      handleCloseModal()
    } catch (err) {
      if (err.response?.data?.code === 'LIMIT_REACHED') {
        handleCloseModal()
        openUpgradeModal('accounts')
      } else {
        setError(err.response?.data?.message || 'Failed to add bank account.')
      }
    }
  }

  const handleEditSubmit = async (e) => {
    e.preventDefault()
    setMessage('')
    setError('')
    try {
      await updateAccount(selectedAccount._id, {
        name: formData.name,
        balance: Number(formData.balance) || 0
      })
      setMessage('Account updated successfully.')
      setAccounts((prev) => {
        const updated = prev.map((a) =>
          a._id === selectedAccount._id
            ? { ...a, name: formData.name, balance: Number(formData.balance) || 0 }
            : a
        )
        localStorage.setItem('xpenz_cached_accounts', JSON.stringify(updated))
        return updated
      })
      fetchAccounts(true)
      handleCloseModal()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update account.')
    }
  }

  const handleDeleteSubmit = async () => {
    setMessage('')
    setError('')
    try {
      await deleteBankAccount(selectedAccount._id)
      setMessage('Bank account and all associated transactions deleted successfully.')
      setAccounts((prev) => {
        const updated = prev.filter((a) => a._id !== selectedAccount._id)
        localStorage.setItem('xpenz_cached_accounts', JSON.stringify(updated))
        return updated
      })
      fetchAccounts(true)
      handleCloseModal()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete bank account.')
    }
  }

  const totalBalance = accounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0)
  const cashAccounts = accounts.filter(a => a.type === 'cash')
  const bankAccounts = accounts.filter(a => a.type === 'bank')
  const primaryCash = cashAccounts[0] || { _id: 'default-cash', type: 'cash', name: 'Cash', balance: 0 }

  const existingAccountNames = accounts.map(a => a.name.toLowerCase().trim())
  const availableBanks = POPULAR_BANKS.filter(bank => {
    if (bank === 'Other (Type Below)') return true
    if (modalType === 'edit' && selectedAccount && selectedAccount.name.toLowerCase().trim() === bank.toLowerCase().trim()) return true
    return !existingAccountNames.includes(bank.toLowerCase().trim())
  })

  if (loading && accounts.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600 dark:border-purple-500"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 pb-10">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">{t('accountsAndBalances')}</h2>
          <p className="text-slate-400 dark:text-dark-text-muted text-sm mt-0.5">{t('accountsSubtitle')}</p>
        </div>
        <button
          id="add-account-btn-tour"
          onClick={handleOpenAdd}
          className="flex items-center gap-1.5 rounded-xl bg-secondary dark:bg-purple-600 px-4 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-700 transition-colors shadow-md shadow-secondary/15 cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          {t('addAccount')}
        </button>
      </div>

      {/* Messages */}
      {message && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/50 dark:bg-emerald-950/5 p-3 text-sm text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
          <FiCheck className="w-4 h-4 flex-shrink-0" />
          <span>{message}</span>
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/5 p-3 text-sm text-rose-700 dark:text-rose-400 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FiX className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => { setError(''); fetchAccounts(); }}
            className="px-2.5 py-1 text-xs font-bold rounded-lg bg-rose-600 text-white hover:bg-rose-700 transition-colors cursor-pointer shrink-0"
          >
            Retry
          </button>
        </div>
      )}

      {/* Total Balance Card */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-100 dark:border-dark-border bg-gradient-to-br from-slate-900 to-indigo-950 p-6 sm:p-8 text-white shadow-premium">
        <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-40 h-40 rounded-full bg-indigo-500/10 blur-2xl"></div>
        <div className="absolute left-1/3 bottom-0 w-32 h-32 rounded-full bg-purple-500/10 blur-2xl"></div>
        
        <div className="relative z-10 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">{t('totalFunds')}</span>
            <h3 className="text-3xl sm:text-4xl font-black tracking-tight">{formatCurrency(totalBalance)}</h3>
          </div>
          <div className="flex gap-3 sm:gap-4 w-full sm:w-auto">
            <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-1 sm:flex-initial min-w-0">
              <span className="block text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{t('cashBalance')}</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-200 block truncate">
                {formatCurrency(cashAccounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0))}
              </span>
            </div>
            <div className="px-2.5 py-1.5 sm:px-4 sm:py-2 bg-white/5 backdrop-blur-md rounded-xl border border-white/10 flex-1 sm:flex-initial min-w-0">
              <span className="block text-[9px] sm:text-[10px] text-slate-400 font-bold uppercase tracking-wider truncate">{t('bankBalance')}</span>
              <span className="text-sm sm:text-base font-extrabold text-slate-200 block truncate">
                {formatCurrency(bankAccounts.reduce((acc, curr) => acc + (Number(curr.balance) || 0), 0))}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Cash Account Card */}
        <section id="cash-wallet-card-tour" className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-premium flex flex-col justify-between min-h-[180px]">
          <div>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">{t('cashBalance')}</h3>
                  <span className="text-xs text-slate-400 dark:text-dark-text-muted">Physical cash wallet</span>
                </div>
              </div>
              <button
                onClick={() => handleOpenEdit(primaryCash)}
                className="p-2 text-slate-400 hover:text-indigo-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-border transition-all cursor-pointer"
                title="Adjust Balance"
              >
                <FiEdit2 className="w-4 h-4" />
              </button>
            </div>
            <div className="mt-6">
              <span className="block text-[10px] text-slate-400 dark:text-dark-text-muted font-bold uppercase tracking-wider">{t('totalBalance')}</span>
              <span className="text-2xl font-black text-slate-800 dark:text-white">
                {formatCurrency(primaryCash.balance || 0)}
              </span>
            </div>
          </div>
        </section>

        {/* Bank Accounts Grid */}
        <div className="space-y-6 md:col-span-2">
          <div>
            <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">{t('accounts')}</h3>
            <p className="text-slate-400 dark:text-dark-text-muted text-xs mt-0.5">Manage bank account balances and linked card transactions.</p>
          </div>
          
          <div id="bank-accounts-grid-tour" className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {bankAccounts.map((account) => (
              <div
                key={account._id}
                className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-premium flex flex-col justify-between min-h-[180px] hover:border-indigo-100 dark:hover:border-purple-950/40 transition-all duration-200 group"
              >
                <div>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-purple-400">
                        <FiCreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-800 dark:text-white text-base line-clamp-1">{account.name}</h4>
                        <span className="text-xs text-slate-400 dark:text-dark-text-muted">Saving/Current Account</span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleOpenEdit(account)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 dark:hover:text-purple-400 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-border transition-all cursor-pointer"
                        title="Edit Account"
                      >
                        <FiEdit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleOpenDelete(account)}
                        className="p-1.5 text-slate-400 hover:text-rose-500 dark:hover:text-rose-450 rounded-lg hover:bg-slate-50 dark:hover:bg-dark-border transition-all cursor-pointer"
                        title="Delete Account"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-6">
                    <span className="block text-[10px] text-slate-400 dark:text-dark-text-muted font-bold uppercase tracking-wider">{t('totalBalance')}</span>
                    <span className="text-2xl font-black text-slate-800 dark:text-white">
                      {formatCurrency(account.balance)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals / Overlays */}
      {modalType && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-2xl p-6 relative overflow-hidden transition-all duration-300">
            <button
              onClick={handleCloseModal}
              className="absolute right-4 top-4 p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-lg hover:bg-slate-50 dark:hover:bg-dark-border transition-all cursor-pointer"
            >
              <FiX className="w-5 h-5" />
            </button>

            {modalType === 'add' && (
              <form onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">{t('addAccount')}</h3>
                  <p className="text-slate-400 dark:text-dark-text-muted text-xs mt-0.5">Link a new bank account to record your savings.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase">Select Bank</label>
                    <div className="space-y-2">
                      <select
                        value={isCustomBank ? 'Other (Type Below)' : formData.name}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === 'Other (Type Below)') {
                            setIsCustomBank(true)
                            setFormData({ ...formData, name: '' })
                          } else {
                            setIsCustomBank(false)
                            setFormData({ ...formData, name: val })
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                        required
                      >
                        <option value="" disabled>Select a bank...</option>
                        {availableBanks.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                      {isCustomBank && (
                        <input
                          type="text"
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Type your bank name here..."
                          className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                          required
                        />
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase">{t('initialBalance')}</label>
                    <input
                      type="number"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-dark-border transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-secondary dark:bg-purple-650 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 transition-colors shadow-md shadow-secondary/15 cursor-pointer"
                  >
                    <FiCheck className="w-4 h-4" />
                    {t('addAccount')}
                  </button>
                </div>
              </form>
            )}

            {modalType === 'edit' && (
              <form onSubmit={handleEditSubmit} className="space-y-4">
                <div>
                  <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">{t('editAccount')}</h3>
                  <p className="text-slate-400 dark:text-dark-text-muted text-xs mt-0.5">Modify account descriptors and adjust balances.</p>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase">{t('accountName')}</label>
                    {selectedAccount?.type === 'cash' ? (
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={true}
                        className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-900"
                        required
                      />
                    ) : (
                      <div className="space-y-2">
                        <select
                          value={isCustomBank ? 'Other (Type Below)' : formData.name}
                          onChange={(e) => {
                            const val = e.target.value
                            if (val === 'Other (Type Below)') {
                              setIsCustomBank(true)
                              setFormData({ ...formData, name: '' })
                            } else {
                              setIsCustomBank(false)
                              setFormData({ ...formData, name: val })
                            }
                          }}
                          className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          required
                        >
                          <option value="" disabled>Select a bank...</option>
                          {availableBanks.map(bank => (
                            <option key={bank} value={bank}>{bank}</option>
                          ))}
                        </select>
                        {isCustomBank && (
                          <input
                            type="text"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Type your bank name here..."
                            className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                            required
                          />
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase">{t('totalBalance')}</label>
                    <input
                      type="number"
                      value={formData.balance}
                      onChange={(e) => setFormData({ ...formData, balance: e.target.value })}
                      className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-dark-border transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="submit"
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-secondary dark:bg-purple-650 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 transition-colors shadow-md shadow-secondary/15 cursor-pointer"
                  >
                    <FiCheck className="w-4 h-4" />
                    {t('saveChanges')}
                  </button>
                </div>
              </form>
            )}

            {modalType === 'delete' && (
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-rose-50 dark:bg-rose-950/20 text-rose-500 dark:text-rose-450 mt-1 flex-shrink-0">
                    <FiInfo className="w-6 h-6 animate-pulse" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-800 dark:text-white text-lg">Delete Account</h3>
                    <p className="text-slate-505 dark:text-dark-text-muted text-sm mt-1">
                      Are you sure you want to delete <span className="font-bold text-slate-800 dark:text-white">{selectedAccount?.name}</span>?
                    </p>
                  </div>
                </div>
                
                <div className="rounded-xl border border-amber-100 dark:border-amber-950/20 bg-amber-50/50 dark:bg-amber-950/5 p-3.5 text-xs text-amber-700 dark:text-amber-400 leading-relaxed">
                  <strong>Warning:</strong> Deleting this bank account will perform a cascade delete. All transactions associated with this account will also be permanently removed.
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-300 font-semibold text-sm hover:bg-slate-50 dark:hover:bg-dark-border transition-colors cursor-pointer"
                  >
                    {t('cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteSubmit}
                    className="flex items-center gap-1 px-4 py-2.5 rounded-xl bg-rose-500 hover:bg-rose-600 font-bold text-white text-sm transition-colors shadow-md shadow-rose-500/15 cursor-pointer"
                  >
                    <FiTrash2 className="w-4 h-4" />
                    Delete Permanently
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Balance
