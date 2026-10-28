import { useState, useEffect, useMemo } from 'react'
import {
  getSubscriptions,
  createSubscription,
  updateSubscription,
  deleteSubscription,
  triggerDeductionNow
} from '../services/subscriptionService'
import { getAccounts } from '../services/accountService'
import { formatCurrency, formatDate } from '../utils/format'
import { useSubscription } from '../context/SubscriptionContext'
import {
  FiPlus, FiRepeat, FiPlay, FiTrash2, FiEdit2, FiSearch,
  FiClock, FiCheckCircle, FiPauseCircle, FiCalendar,
  FiX, FiDollarSign, FiCreditCard, FiZap
} from 'react-icons/fi'

const CATEGORIES = [
  'Subscriptions',
  'Entertainment',
  'Software & Tools',
  'Utilities & Bills',
  'Health & Fitness',
  'Education & Learning',
  'Gaming',
  'News & Media',
  'Other'
]

const BILLING_CYCLES = [
  { value: 'monthly', label: 'Monthly' },
  { value: 'quarterly', label: 'Quarterly' },
  { value: 'yearly', label: 'Yearly (Annual Plan)' }
]

const emptyForm = {
  title: '',
  category: 'Subscriptions',
  billingCycle: 'monthly',
  amount: '',
  nextBillingDate: new Date().toISOString().split('T')[0],
  accountId: '',
  autoDeduct: true,
  description: ''
}

export default function Subscriptions() {
  const { isPro, openUpgradeModal } = useSubscription()
  const [subscriptions, setSubscriptions] = useState([])
  const [stats, setStats] = useState({
    totalCount: 0,
    activeCount: 0,
    totalMonthlyCommitment: 0,
    totalYearlyCommitment: 0
  })
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [filterCycle, setFilterCycle] = useState('all')

  // Modal State
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [modalMessage, setModalMessage] = useState('')
  const [actionLoadingId, setActionLoadingId] = useState(null)

  const loadData = async () => {
    setLoading(true)
    setError('')
    try {
      const [subRes, accRes] = await Promise.all([
        getSubscriptions(),
        getAccounts().catch(() => ({ data: { data: [] } }))
      ])

      if (subRes.data?.data) {
        setSubscriptions(subRes.data.data.subscriptions || [])
        setStats(subRes.data.data.stats || {})
      }
      const fetchedAccounts = Array.isArray(accRes.data?.data) 
        ? accRes.data.data 
        : (Array.isArray(accRes.data) ? accRes.data : [])
      setAccounts(fetchedAccounts)
    } catch (err) {
      console.error('Failed to load subscriptions:', err)
      setError(err.response?.data?.message || 'Failed to load subscription plans.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const handleOpenAdd = () => {
    const activeSubs = subscriptions.filter(s => s.status === 'active')
    if (!isPro && activeSubs.length >= 2) {
      openUpgradeModal('subscriptions')
      return
    }
    setEditingId(null)
    const firstAccId = accounts.length > 0 ? (accounts[0]._id || accounts[0].id) : ''
    setForm({
      ...emptyForm,
      nextBillingDate: new Date().toISOString().split('T')[0],
      accountId: firstAccId
    })
    setModalMessage('')
    setShowModal(true)
  }

  const handleOpenEdit = (sub) => {
    setEditingId(sub._id || sub.id)
    const accId = typeof sub.accountId === 'object' ? (sub.accountId?._id || sub.accountId?.id) : (sub.accountId || '')
    setForm({
      title: sub.title || '',
      category: sub.category || 'Subscriptions',
      billingCycle: sub.billingCycle || 'monthly',
      amount: sub.amount || '',
      nextBillingDate: sub.nextBillingDate ? new Date(sub.nextBillingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      accountId: accId || (accounts[0]?._id || accounts[0]?.id || ''),
      autoDeduct: sub.autoDeduct !== false,
      description: sub.description || ''
    })
    setModalMessage('')
    setShowModal(true)
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setModalMessage('')
    setFormLoading(true)

    try {
      if (editingId) {
        await updateSubscription(editingId, form)
      } else {
        await createSubscription(form)
      }
      setShowModal(false)
      loadData()
    } catch (err) {
      if (err.response?.data?.code === 'LIMIT_REACHED') {
        setShowModal(false)
        openUpgradeModal('subscriptions')
      } else {
        setModalMessage(err.response?.data?.message || 'Failed to save subscription')
      }
    } finally {
      setFormLoading(false)
    }
  }

  const handleToggleAutoDeduct = async (sub) => {
    const subId = sub._id || sub.id
    setActionLoadingId(subId)
    try {
      await updateSubscription(subId, { autoDeduct: !sub.autoDeduct })
      await loadData()
    } catch (err) {
      console.error('Failed to toggle auto deduct:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleToggleStatus = async (sub) => {
    const subId = sub._id || sub.id
    const newStatus = sub.status === 'active' ? 'paused' : 'active'
    setActionLoadingId(subId)
    try {
      await updateSubscription(subId, { status: newStatus })
      await loadData()
    } catch (err) {
      console.error('Failed to update status:', err)
    } finally {
      setActionLoadingId(null)
    }
  }

  const handlePayNow = async (sub) => {
    const subId = sub._id || sub.id
    setActionLoadingId(subId)
    try {
      await triggerDeductionNow(subId)
      await loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to process payment')
    } finally {
      setActionLoadingId(null)
    }
  }

  const handleDelete = async (subId) => {
    if (!window.confirm('Are you sure you want to delete this subscription plan?')) return
    setActionLoadingId(subId)
    try {
      await deleteSubscription(subId)
      await loadData()
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete subscription')
    } finally {
      setActionLoadingId(null)
    }
  }

  const filteredSubs = useMemo(() => {
    return subscriptions.filter(sub => {
      const matchesSearch = sub.title.toLowerCase().includes(search.toLowerCase()) ||
                            sub.category.toLowerCase().includes(search.toLowerCase())
      const matchesCycle = filterCycle === 'all' || sub.billingCycle === filterCycle
      return matchesSearch && matchesCycle
    })
  }, [subscriptions, search, filterCycle])

  return (
    <div className="space-y-6 pb-12">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2.5">
            <FiRepeat className="w-5 h-5 text-indigo-500" />
            <span>Recurring subscriptions</span>
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Track monthly and annual commitments with automated balance deduction.
          </p>
        </div>

        <button
          id="add-subscription-btn-tour"
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition-colors cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          <span>Add subscription</span>
        </button>
      </div>

      {/* Hero Stats Section */}
      <div id="subscriptions-stats-grid-tour" className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500">
              Monthly commitment
            </span>
            <FiRepeat className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(stats.totalMonthlyCommitment || 0)} <span className="text-xs font-normal text-slate-400">/ mo</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Across active recurring plans
          </p>
        </div>

        <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500">
              Active plans
            </span>
            <FiPlay className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
            {stats.activeCount || 0} <span className="text-xs font-normal text-slate-400">/ {stats.totalCount || 0} total</span>
          </p>
          <p className="text-[11px] text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
            <FiZap className="w-3 h-3" /> Auto-deductions enabled
          </p>
        </div>

        <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] p-4 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500">
              Yearly commitment
            </span>
            <FiCalendar className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
            {formatCurrency(stats.totalYearlyCommitment || 0)} <span className="text-xs font-normal text-slate-400">/ yr</span>
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Annual commitment total
          </p>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] p-3 rounded-xl flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-3.5 h-3.5" />
          <input
            type="text"
            placeholder="Search subscriptions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-[#181a24] border border-slate-200 dark:border-[#222634] rounded-lg text-xs focus:outline-none focus:border-indigo-500 text-slate-800 dark:text-slate-100"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
          {['all', 'monthly', 'quarterly', 'yearly'].map((cycle) => (
            <button
              key={cycle}
              onClick={() => setFilterCycle(cycle)}
              className={`px-3 py-1 rounded text-xs font-medium capitalize transition-colors cursor-pointer ${
                filterCycle === cycle
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-100 dark:bg-[#181a24] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {cycle}
            </button>
          ))}
        </div>
      </div>

      {/* Content Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[240px]">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-500 border-t-transparent"></div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-950/40 p-4 rounded-xl text-rose-600 dark:text-rose-400 text-xs text-center">
          {error}
        </div>
      ) : filteredSubs.length === 0 ? (
        <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] rounded-xl p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#181a24] border border-slate-200 dark:border-[#222634] text-slate-400 flex items-center justify-center mx-auto text-xl">
            <FiRepeat />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-white">No recurring subscriptions</h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Add monthly memberships or annual software plans to track and automate bill deductions.
            </p>
          </div>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-medium text-xs transition-colors cursor-pointer"
          >
            + Add subscription
          </button>
        </div>
      ) : (
        <div id="subscriptions-list-tour" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubs.map((sub) => {
            const isPaused = sub.status === 'paused'
            const nextDate = new Date(sub.nextBillingDate)
            const today = new Date()
            const daysLeft = Math.ceil((nextDate - today) / (1000 * 60 * 60 * 24))
            const isDueSoon = daysLeft <= 3
            const accountObj = typeof sub.accountId === 'object' ? sub.accountId : null

            return (
              <div
                key={sub._id || sub.id}
                className={`bg-white dark:bg-[#14161f] border rounded-xl p-4 space-y-3 transition-colors ${
                  isPaused
                    ? 'border-slate-200/60 dark:border-[#222634]/60 opacity-70'
                    : 'border-slate-200 dark:border-[#222634]'
                }`}
              >
                {/* Top Row: Category & Status */}
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-slate-600 dark:text-slate-400 bg-slate-100 dark:bg-[#181a24] px-2 py-0.5 rounded border border-slate-200 dark:border-[#222634]">
                    {sub.category || 'Subscriptions'}
                  </span>

                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                      sub.billingCycle === 'yearly'
                        ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                        : sub.billingCycle === 'quarterly'
                          ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                          : 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 dark:text-purple-400'
                    }`}>
                      {sub.billingCycle}
                    </span>

                    <button
                      onClick={() => handleToggleStatus(sub)}
                      disabled={actionLoadingId === (sub._id || sub.id)}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                        isPaused
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/30'
                          : 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/30'
                      }`}
                      title={isPaused ? 'Resume Plan' : 'Pause Plan'}
                    >
                      {isPaused ? <FiPauseCircle className="w-4 h-4" /> : <FiCheckCircle className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Plan Info */}
                <div className="space-y-1">
                  <h3 className="font-extrabold text-base text-slate-900 dark:text-white truncate">
                    {sub.title}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      {formatCurrency(sub.amount)}
                    </span>
                    <span className="text-xs font-semibold text-slate-400">
                      / {sub.billingCycle === 'yearly' ? 'year' : sub.billingCycle === 'quarterly' ? '3 mos' : 'month'}
                    </span>
                  </div>
                </div>

                {/* Account & Auto Deduct Row */}
                <div className="pt-3 border-t border-slate-100 dark:border-dark-border space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <FiCreditCard className="w-3.5 h-3.5" /> Payment Account
                    </span>
                    <span className="font-bold text-slate-700 dark:text-slate-200">
                      {accountObj?.name || 'Bank Account'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <FiZap className="w-3.5 h-3.5 text-amber-400" /> Auto-Deduct
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={sub.autoDeduct !== false}
                        onChange={() => handleToggleAutoDeduct(sub)}
                        disabled={actionLoadingId === (sub._id || sub.id)}
                        className="sr-only peer"
                      />
                      <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-800 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-secondary dark:peer-checked:bg-purple-650"></div>
                    </label>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-1">
                    <span className="text-slate-400 font-semibold flex items-center gap-1">
                      <FiClock className="w-3.5 h-3.5" /> Next Billing
                    </span>
                    <span className={`font-bold ${isDueSoon ? 'text-rose-500' : 'text-slate-700 dark:text-slate-200'}`}>
                      {formatDate(sub.nextBillingDate)} ({daysLeft <= 0 ? 'Due Today' : `${daysLeft}d left`})
                    </span>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-2 flex items-center justify-between gap-2 border-t border-slate-100 dark:border-dark-border">
                  <button
                    onClick={() => handlePayNow(sub)}
                    disabled={actionLoadingId === (sub._id || sub.id)}
                    className="flex-1 py-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1"
                  >
                    <FiDollarSign className="w-3.5 h-3.5" /> Pay Now
                  </button>

                  <button
                    onClick={() => handleOpenEdit(sub)}
                    className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Edit Plan"
                  >
                    <FiEdit2 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => handleDelete(sub._id || sub.id)}
                    disabled={actionLoadingId === (sub._id || sub.id)}
                    className="p-2 text-rose-400 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors cursor-pointer"
                    title="Delete Plan"
                  >
                    <FiTrash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Add / Edit Subscription Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[1000] flex items-center justify-center p-4">
          <div className="bg-white dark:bg-[#131522] border border-slate-200 dark:border-slate-800 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-5 text-slate-800 dark:text-slate-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <h3 className="text-lg font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
                <FiRepeat className="w-5 h-5 text-secondary dark:text-purple-400" />
                {editingId ? 'Edit Subscription Plan' : 'Add Subscription Plan'}
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white p-1 rounded-lg"
              >
                <FiX className="w-5 h-5" />
              </button>
            </div>

            {modalMessage && (
              <div className="bg-rose-500/10 border border-rose-500/20 p-3 rounded-2xl text-rose-500 text-xs font-semibold">
                {modalMessage}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4 text-xs font-medium">
              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                  Subscription / Plan Title *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Netflix Premium, Amazon Prime, Gym"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/50 text-slate-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                    Amount (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    placeholder="499"
                    required
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/50 text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                    Billing Cycle
                  </label>
                  <select
                    value={form.billingCycle}
                    onChange={(e) => setForm({ ...form, billingCycle: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/50 text-slate-900 dark:text-white"
                  >
                    {BILLING_CYCLES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                    Category
                  </label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/50 text-slate-900 dark:text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-slate-500 dark:text-slate-400 font-bold mb-1">
                    Payment Account
                  </label>
                  <select
                    value={form.accountId}
                    onChange={(e) => setForm({ ...form, accountId: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/50 text-slate-900 dark:text-white"
                  >
                    {accounts.length === 0 ? (
                      <option value="">Default Bank / Cash Account</option>
                    ) : (
                      accounts.map(acc => (
                        <option key={acc._id || acc.id} value={acc._id || acc.id}>
                          {acc.name} ({acc.type === 'cash' ? 'Cash' : 'Bank'}) - ₹{acc.balance}
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-slate-500 dark:text-slate-400 font-bold mb-0.5">
                  Monthly Auto-Debit Day / Start Date *
                </label>
                <span className="text-[10px] text-slate-400 block mb-1">
                  Auto-debits on the same day every month automatically
                </span>
                <input
                  type="date"
                  required
                  value={form.nextBillingDate}
                  onChange={(e) => setForm({ ...form, nextBillingDate: e.target.value })}
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl font-semibold focus:outline-none focus:ring-2 focus:ring-secondary/50 text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
                <div>
                  <span className="font-bold text-slate-800 dark:text-white block">Auto-Deduct Balance</span>
                  <span className="text-[11px] text-slate-400 font-normal">Automatically log expense & deduct account when due</span>
                </div>
                <input
                  type="checkbox"
                  checked={form.autoDeduct}
                  onChange={(e) => setForm({ ...form, autoDeduct: e.target.checked })}
                  className="w-4 h-4 accent-secondary cursor-pointer"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="px-5 py-2 bg-secondary hover:bg-indigo-700 dark:bg-purple-650 text-white font-bold rounded-xl shadow-md transition-all cursor-pointer"
                >
                  {formLoading ? 'Saving...' : editingId ? 'Update Subscription' : 'Create Subscription'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
