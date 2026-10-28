import { useEffect, useMemo, useState } from 'react'
import {
  getInvestments,
  addInvestment,
  updateInvestment,
  deleteInvestment
} from '../services/investmentService'
import { formatCurrency, formatDate } from '../utils/format'
import { useSubscription } from '../context/SubscriptionContext'
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw, FiBriefcase, FiCalendar, FiChevronLeft, FiChevronRight, FiZap
} from 'react-icons/fi'

const INVESTMENT_TYPES = [
  { value: 'mutual_fund', label: 'Mutual Fund' },
  { value: 'stock', label: 'Stock' },
  { value: 'fixed_deposit', label: 'Fixed Deposit' },
  { value: 'recurring_deposit', label: 'Recurring Deposit' },
  { value: 'gold', label: 'Gold' },
  { value: 'ppf', label: 'PPF' },
  { value: 'epf', label: 'EPF' },
  { value: 'nps', label: 'NPS' },
  { value: 'crypto', label: 'Crypto' },
  { value: 'other', label: 'Other' }
]

const SUGGESTIONS_BY_TYPE = {
  mutual_fund: [
    'SBI Bluechip Fund',
    'HDFC Balanced Advantage Fund',
    'ICICI Prudential Bluechip Fund',
    'Parag Parikh Flexi Cap Fund',
    'Axis Small Cap Fund',
    'Nippon India Small Cap Fund',
    'Mirae Asset Large Cap Fund',
    'Quant Active Fund',
    'UTI Nifty 55 Index Fund',
    'Kotak Emerging Equity Fund',
    'Tata Digital India Fund',
    'DSP BlackRock Top 100 Fund'
  ],
  stock: [
    'Reliance Industries (RELIANCE)',
    'Tata Consultancy Services (TCS)',
    'HDFC Bank (HDFCBANK)',
    'ICICI Bank (ICICIBANK)',
    'Infosys (INFY)',
    'State Bank of India (SBIN)',
    'Bharti Airtel (BHARTIALRT)',
    'ITC Limited (ITC)',
    'Larsen & Toubro (LT)',
    'Tata Motors (TATAMOTORS)',
    'Hindustan Unilever (HINDUNILVR)',
    'Kotak Mahindra Bank (KOTAKBANK)',
    'Axis Bank (AXISBANK)',
    'Wipro (WIPRO)',
    'Maruti Suzuki (MARUTI)'
  ],
  fixed_deposit: [
    'State Bank of India (SBI) FD',
    'HDFC Bank FD',
    'ICICI Bank FD',
    'Axis Bank FD',
    'Kotak Mahindra Bank FD',
    'Punjab National Bank (PNB) FD',
    'Bank of Baroda FD',
    'Post Office Term Deposit'
  ],
  recurring_deposit: [
    'State Bank of India (SBI) RD',
    'HDFC Bank RD',
    'ICICI Bank RD',
    'Axis Bank RD',
    'Kotak Mahindra Bank RD',
    'Post Office Recurring Deposit'
  ],
  ppf: [
    'State Bank of India (SBI) PPF',
    'HDFC Bank PPF',
    'ICICI Bank PPF',
    'Post Office PPF'
  ]
}

export default function Investments() {
  const { isPro, openUpgradeModal } = useSubscription()
  const [investments, setInvestments] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')

  // Calendar State
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null)

  // Calendar dates generation
  const getDaysInMonth = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    const startDay = new Date(year, month, 1).getDay()
    const totalDays = new Date(year, month + 1, 0).getDate()
    
    const days = []
    for (let i = 0; i < startDay; i++) {
      days.push(null)
    }
    for (let i = 1; i <= totalDays; i++) {
      days.push(new Date(year, month, i))
    }
    return days
  }

  // Get calendar reminders for date
  const getInvestmentsForDate = (date) => {
    if (!date) return []
    const dayNum = date.getDate()
    
    return investments.filter(inv => {
      // 1. SIP check:
      if (inv.monthlySipAmount > 0 && inv.sipDueDate) {
        const sipDate = new Date(inv.sipDueDate)
        if (sipDate.getDate() === dayNum) {
          return true
        }
      }
      // 2. Maturity check:
      if (inv.maturityDate) {
        const matDate = new Date(inv.maturityDate)
        return (
          matDate.getDate() === date.getDate() &&
          matDate.getMonth() === date.getMonth() &&
          matDate.getFullYear() === date.getFullYear()
        )
      }
      return false
    })
  }

  // Modal State
  const [isOpen, setIsOpen] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [showSuggestions, setShowSuggestions] = useState(false)
  
  const [formData, setFormData] = useState({
    type: 'mutual_fund',
    title: '',
    investedAmount: '',
    currentValue: '',
    monthlySipAmount: '',
    sipDueDate: '',
    quantity: '',
    interestRate: '',
    maturityDate: '',
    notes: ''
  })

  const currentSuggestions = useMemo(() => {
    if (formData.type !== 'mutual_fund' && formData.type !== 'fixed_deposit') {
      return []
    }
    const list = SUGGESTIONS_BY_TYPE[formData.type] || []
    if (!formData.title) return list
    return list.filter(item => item.toLowerCase().includes(formData.title.toLowerCase()))
  }, [formData.type, formData.title])

  const fetchInvestments = async () => {
    try {
      setLoading(true)
      const res = await getInvestments()
      if (res.data?.success) {
        setInvestments(res.data.data)
      }
    } catch (err) {
      console.error('Failed to load investments:', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvestments()
  }, [])

  // Calculations
  const stats = useMemo(() => {
    let totalInvested = 0
    let totalCurrent = 0

    investments.forEach((inv) => {
      totalInvested += Number(inv.investedAmount || 0)
      totalCurrent += Number(inv.currentValue || 0)
    });

    const netProfit = totalCurrent - totalInvested
    const profitPct = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0

    return {
      totalInvested,
      totalCurrent,
      netProfit,
      profitPct
    }
  }, [investments])

  const filteredInvestments = useMemo(() => {
    return investments.filter((inv) => {
      const matchesSearch = inv.title.toLowerCase().includes(search.toLowerCase())
      const matchesType = typeFilter === 'all' || inv.type === typeFilter
      return matchesSearch && matchesType
    })
  }, [investments, search, typeFilter])

  const handleOpenAdd = () => {
    setEditingItem(null)
    setFormData({
      type: 'mutual_fund',
      title: '',
      investedAmount: '',
      currentValue: '',
      monthlySipAmount: '',
      sipDueDate: '',
      quantity: '',
      interestRate: '',
      maturityDate: '',
      notes: ''
    })
    setIsOpen(true)
  }

  const handleOpenEdit = (item) => {
    setEditingItem(item)
    setFormData({
      type: item.type,
      title: item.title,
      investedAmount: item.investedAmount || '',
      currentValue: item.currentValue || '',
      monthlySipAmount: item.monthlySipAmount || '',
      sipDueDate: item.sipDueDate ? item.sipDueDate.slice(0, 10) : '',
      quantity: item.quantity || '',
      interestRate: item.interestRate || '',
      maturityDate: item.maturityDate ? item.maturityDate.slice(0, 10) : '',
      notes: item.notes || ''
    })
    setIsOpen(true)
  }

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this investment?')) {
      try {
        await deleteInvestment(id)
        fetchInvestments()
      } catch (err) {
        console.error('Delete failed:', err)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      const dataPayload = {
        ...formData,
        investedAmount: Number(formData.investedAmount || 0),
        currentValue: Number(formData.currentValue || 0),
        monthlySipAmount: formData.monthlySipAmount ? Number(formData.monthlySipAmount) : 0,
        quantity: formData.quantity ? Number(formData.quantity) : 1,
        interestRate: formData.interestRate ? Number(formData.interestRate) : 0,
        sipDueDate: formData.sipDueDate ? new Date(formData.sipDueDate).toISOString() : null,
        maturityDate: formData.maturityDate ? new Date(formData.maturityDate).toISOString() : null
      }

      if (editingItem) {
        await updateInvestment(editingItem._id, dataPayload)
      } else {
        await addInvestment(dataPayload)
      }
      setIsOpen(false)
      fetchInvestments()
    } catch (err) {
      console.error('Save failed:', err)
    }
  }

  if (!isPro) {
    return (
      <div className="space-y-6 text-slate-800 dark:text-slate-100">
        <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-8 sm:p-10 text-center flex flex-col items-center justify-center">
          <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#1a1d29] border border-slate-200 dark:border-[#2b3042] flex items-center justify-center text-slate-700 dark:text-slate-300 mb-4">
            <FiBriefcase className="w-6 h-6" />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
            Pro plan feature
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Investment portfolio tracker</h2>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mt-2 leading-relaxed">
            Track mutual funds, stocks, fixed deposits, gold, and crypto assets with returns calculations and SIP schedules.
          </p>
          <button
            onClick={() => openUpgradeModal('investments')}
            className="mt-6 flex items-center gap-2 py-2.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer"
          >
            <FiZap className="w-3.5 h-3.5" />
            <span>Upgrade to Pro (from ₹45)</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 relative w-full max-w-full overflow-hidden">
      {/* Top Title Bar */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Investments</h2>
          <p className="text-slate-400 dark:text-dark-text-muted text-sm mt-0.5">Track your portfolio performance, SIP commitments, and growth.</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="flex items-center justify-center gap-2 rounded-xl bg-secondary dark:bg-purple-650 px-4 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 shadow-md transition-all w-fit cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          Add Investment
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Total Invested</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(stats.totalInvested)}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Current Value</p>
          <p className="text-2xl font-black text-slate-800 dark:text-white mt-1">{formatCurrency(stats.totalCurrent)}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-5 rounded-2xl shadow-sm">
          <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Overall Return</p>
          <div className="flex items-baseline gap-2 mt-1">
            <p className={`text-2xl font-black ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              {stats.netProfit >= 0 ? '+' : ''}{formatCurrency(stats.netProfit)}
            </p>
            <span className={`text-xs font-bold ${stats.netProfit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
              ({stats.netProfit >= 0 ? '+' : ''}{stats.profitPct.toFixed(2)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-3.5 rounded-2xl shadow-sm">
        <div className="flex bg-slate-150/40 dark:bg-slate-900/60 p-1 rounded-xl w-full md:w-auto overflow-x-auto scrollbar-none">
          {['all', 'mutual_fund', 'stock', 'fixed_deposit', 'recurring_deposit'].map((type) => (
            <button
              key={type}
              onClick={() => setTypeFilter(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                typeFilter === type
                  ? 'bg-secondary dark:bg-purple-650 text-white shadow-sm'
                  : 'text-slate-500 dark:text-dark-text hover:bg-slate-200/50 dark:hover:bg-slate-800'
              }`}
            >
              {type === 'all' ? 'All' : INVESTMENT_TYPES.find((t) => t.value === type)?.label || type}
            </button>
          ))}
        </div>

        <div className="relative w-full md:w-60">
          <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
          <input
            type="text"
            placeholder="Search investment..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none"
          />
        </div>
      </div>

      {/* 2-Column Main Layout: Investments Grid (2 cols) & Calendar (1 col) */}
      <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
        <div className="lg:col-span-2 space-y-6 min-w-0">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <FiRefreshCw className="w-8 h-8 text-secondary dark:text-purple-400 animate-spin" />
              <p className="text-slate-400 text-sm mt-3">Loading portfolio...</p>
            </div>
          ) : filteredInvestments.length === 0 ? (
            <div className="text-center py-16 bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl">
              <FiBriefcase className="w-12 h-12 text-slate-350 dark:text-slate-600 mx-auto" />
              <h3 className="text-base font-extrabold text-slate-700 dark:text-slate-200 mt-4">No Investments Logged</h3>
              <p className="text-slate-400 dark:text-dark-text-muted text-xs mt-1 max-w-xs mx-auto">Click &quot;Add Investment&quot; to start building your visual wealth portfolio.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 w-full min-w-0 overflow-hidden">
              {filteredInvestments.map((inv) => {
                const profit = Number(inv.currentValue || 0) - Number(inv.investedAmount || 0)
                const profitPct = Number(inv.investedAmount || 0) > 0 ? (profit / Number(inv.investedAmount)) * 100 : 0
                const typeLabel = INVESTMENT_TYPES.find((t) => t.value === inv.type)?.label || inv.type

                return (
                  <div
                    key={inv._id}
                    className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl shadow-sm overflow-hidden flex flex-col justify-between"
                  >
                    <div className="p-5 space-y-4">
                      {/* Top: Title & Badge */}
                      <div className="flex justify-between items-start gap-2">
                        <div className="min-w-0">
                          <h4 className="font-extrabold text-slate-800 dark:text-white text-base truncate">{inv.title}</h4>
                          <span className="inline-block mt-1 px-2.5 py-0.5 bg-secondary/10 dark:bg-purple-450/10 text-secondary dark:text-purple-400 rounded-full text-[10px] font-extrabold uppercase">
                            {typeLabel}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleOpenEdit(inv)}
                            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 dark:text-slate-500 hover:text-secondary dark:hover:text-purple-400 rounded-xl transition-all cursor-pointer"
                          >
                            <FiEdit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(inv._id)}
                            className="p-2 hover:bg-rose-50 dark:hover:bg-rose-950/20 text-slate-400 dark:text-slate-500 hover:text-rose-500 dark:hover:text-rose-400 rounded-xl transition-all cursor-pointer"
                          >
                            <FiTrash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <hr className="border-slate-100 dark:border-dark-border/40" />

                      {/* Middle Section: Display statistics by type */}
                      {inv.type === 'mutual_fund' && (
                        <div className="space-y-3.5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Invested</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{formatCurrency(inv.investedAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Current</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{formatCurrency(inv.currentValue)}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                            <span className="font-bold text-slate-400">Profit/Loss</span>
                            <span className={`font-black ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {profit >= 0 ? '+' : ''}{formatCurrency(profit)} ({profit >= 0 ? '+' : ''}{profitPct.toFixed(1)}%)
                            </span>
                          </div>
                          {inv.monthlySipAmount > 0 && (
                            <div className="space-y-2 border-t border-dashed border-slate-200 dark:border-dark-border/30 pt-2.5">
                              <div className="flex justify-between items-center text-xs text-slate-550 dark:text-slate-400">
                                <span className="font-bold">Monthly SIP</span>
                                <span className="font-black text-secondary dark:text-purple-400">{formatCurrency(inv.monthlySipAmount)}/mo</span>
                              </div>
                              {inv.sipDueDate && (
                                <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs mt-1">
                                  <span className="font-bold text-slate-400 flex items-center gap-1.5">
                                    <FiCalendar className="w-3.5 h-3.5 text-indigo-500" />
                                    Next SIP Due
                                  </span>
                                  <span className="font-black text-slate-700 dark:text-slate-200">{formatDate(inv.sipDueDate)}</span>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      )}

                      {inv.type === 'stock' && (
                        <div className="space-y-3.5">
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Qty</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{inv.quantity || 1}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Invested</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{formatCurrency(inv.investedAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Current</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{formatCurrency(inv.currentValue)}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                            <span className="font-bold text-slate-400">Gain / Loss</span>
                            <span className={`font-black ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {profit >= 0 ? '+' : ''}{profitPct.toFixed(1)}%
                            </span>
                          </div>
                        </div>
                      )}

                      {(inv.type === 'fixed_deposit' || inv.type === 'recurring_deposit') && (
                        <div className="space-y-3.5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Principal</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{formatCurrency(inv.investedAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Interest Rate</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{inv.interestRate || 0}%</p>
                            </div>
                          </div>
                          {inv.maturityDate && (
                            <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                              <span className="font-bold text-slate-400 flex items-center gap-1.5">
                                <FiCalendar className="w-3.5 h-3.5 text-indigo-500" />
                                Maturity Date
                              </span>
                              <span className="font-black text-slate-700 dark:text-slate-200">{formatDate(inv.maturityDate)}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {/* General investment details layout */}
                      {inv.type !== 'mutual_fund' && inv.type !== 'stock' && inv.type !== 'fixed_deposit' && inv.type !== 'recurring_deposit' && (
                        <div className="space-y-3.5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Invested</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{formatCurrency(inv.investedAmount)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">Current</p>
                              <p className="text-sm font-black text-slate-700 dark:text-slate-200 mt-0.5">{formatCurrency(inv.currentValue)}</p>
                            </div>
                          </div>
                          <div className="flex justify-between items-center bg-slate-50 dark:bg-slate-900/40 p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
                            <span className="font-bold text-slate-400">Net Returns</span>
                            <span className={`font-black ${profit >= 0 ? 'text-emerald-500' : 'text-rose-500'}`}>
                              {profit >= 0 ? '+' : ''}{formatCurrency(profit)}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {inv.notes && (
                      <div className="px-5 pb-5 pt-0">
                        <p className="text-[10px] text-slate-455 dark:text-dark-text-muted italic bg-slate-50 dark:bg-slate-800/40 px-3 py-2 rounded-lg border border-dashed border-slate-100 dark:border-slate-800">
                          Note: {inv.notes}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Right Side: Investment Calendar */}
        <div className="lg:col-span-1 space-y-6 text-left">
          <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl p-4 shadow-premium space-y-4">
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Investment Calendar</span>
              <div className="flex gap-1">
                <button
                  onClick={() => {
                    const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                    setCurrentMonth(prev)
                  }}
                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
                >
                  <FiChevronLeft className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-bold text-slate-700 dark:text-slate-200 min-w-[70px] text-center capitalize">
                  {currentMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                </span>
                <button
                  onClick={() => {
                    const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                    setCurrentMonth(next)
                  }}
                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-550 cursor-pointer"
                >
                  <FiChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Weekdays */}
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
              <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {getDaysInMonth(currentMonth).map((day, idx) => {
                if (!day) return <div key={`empty-${idx}`} className="h-6" />

                const dateInsts = getInvestmentsForDate(day)
                const hasMaturity = dateInsts.some(i => i.maturityDate)
                const hasSip = dateInsts.some(i => i.monthlySipAmount > 0)

                let bgClass = 'hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-full'
                let textClass = 'text-slate-700 dark:text-slate-300'
                
                if (dateInsts.length > 0) {
                  if (hasMaturity) {
                    bgClass = 'bg-purple-650 text-white rounded-full font-black shadow-sm'
                    textClass = 'text-white'
                  } else if (hasSip) {
                    bgClass = 'bg-indigo-500 text-white rounded-full font-black shadow-sm'
                    textClass = 'text-white'
                  }
                }

                const isToday = new Date().toDateString() === day.toDateString()
                const todayClass = isToday && dateInsts.length === 0 ? 'border border-indigo-505 rounded-full font-bold' : ''

                return (
                  <div
                    key={`day-${day.getDate()}`}
                    onClick={() => {
                      if (dateInsts.length > 0) {
                        setSelectedCalendarDate(day)
                      }
                    }}
                    className={`h-6 flex items-center justify-center text-[10px] font-semibold transition-all cursor-pointer ${bgClass} ${textClass} ${todayClass}`}
                  >
                    {day.getDate()}
                  </div>
                )
              })}
            </div>

            {/* Legend */}
            <div className="flex gap-2.5 justify-center text-[9px] text-slate-400 font-bold pt-1 border-t border-slate-50 dark:border-dark-border/40">
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-indigo-500 rounded-full" />
                SIP Due
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-purple-650 rounded-full" />
                Maturity
              </span>
            </div>

            {/* Selected Date Details */}
            {selectedCalendarDate && (
              <div className="bg-slate-50 dark:bg-dark-border/20 p-3 rounded-xl space-y-2.5 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>ON {selectedCalendarDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  <button onClick={() => setSelectedCalendarDate(null)} className="hover:text-slate-600 cursor-pointer">✕</button>
                </div>
                {getInvestmentsForDate(selectedCalendarDate).map((inv) => {
                  const isMaturity = inv.maturityDate && new Date(inv.maturityDate).getDate() === selectedCalendarDate.getDate()
                  return (
                    <div key={inv._id} className="text-xs space-y-1">
                      <p className="font-bold text-slate-800 dark:text-white truncate">{inv.title}</p>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-455">{isMaturity ? 'Maturity' : 'SIP Amount'}</span>
                        <span className="font-extrabold text-secondary dark:text-purple-400">
                          {isMaturity ? formatCurrency(inv.investedAmount) : formatCurrency(inv.monthlySipAmount)}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm animate-fade-in p-4">
          <div className="bg-white dark:bg-[#131522] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden max-h-[90vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 dark:border-dark-border/40 flex justify-between items-center">
              <h3 className="text-lg font-black text-slate-800 dark:text-white">
                {editingItem ? 'Edit Investment' : 'Add Investment'}
              </h3>
              <button onClick={() => setIsOpen(false)} className="text-slate-400 dark:text-slate-500 hover:text-slate-700 dark:hover:text-white cursor-pointer font-bold">Close</button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto flex-1 text-left">
              {/* Type Select */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Investment Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-secondary"
                >
                  {INVESTMENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>{t.label}</option>
                  ))}
                </select>
              </div>

              {/* Title */}
              <div className="relative">
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Investment Name / Scheme</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SBI Bluechip, TCS Share, SBI FD"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none focus:ring-1 focus:ring-secondary"
                />
                {showSuggestions && currentSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-[#131522] border border-slate-200 dark:border-dark-border rounded-xl shadow-xl max-h-48 overflow-y-auto z-20">
                    {currentSuggestions.map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => {
                          setFormData({ ...formData, title: s })
                          setShowSuggestions(false)
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs text-slate-705 dark:text-slate-200 transition-colors cursor-pointer"
                      >
                        {s}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Invested and Current Amount */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Invested Amount</label>
                  <input
                    type="number"
                    required
                    placeholder="₹ Invested"
                    value={formData.investedAmount}
                    onChange={(e) => setFormData({ ...formData, investedAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Current Value</label>
                  <input
                    type="number"
                    required
                    placeholder="₹ Current Value"
                    value={formData.currentValue}
                    onChange={(e) => setFormData({ ...formData, currentValue: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              {/* Conditional Field: Quantity (Stocks, Gold, Crypto) */}
              {(formData.type === 'stock' || formData.type === 'gold' || formData.type === 'crypto') && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Quantity / Units</label>
                  <input
                    type="number"
                    step="any"
                    placeholder="e.g. 15"
                    value={formData.quantity}
                    onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Conditional Field: Interest Rate (FD, RD) */}
              {(formData.type === 'fixed_deposit' || formData.type === 'recurring_deposit') && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 7.2"
                    value={formData.interestRate}
                    onChange={(e) => setFormData({ ...formData, interestRate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Conditional Fields: SIP Amount and SIP Due Date (Mutual Fund, Recurring Deposit) */}
              {(formData.type === 'mutual_fund' || formData.type === 'recurring_deposit') && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Monthly SIP Amount</label>
                    <input
                      type="number"
                      placeholder="₹ SIP Amount"
                      value={formData.monthlySipAmount}
                      onChange={(e) => setFormData({ ...formData, monthlySipAmount: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Next SIP Due Date</label>
                    <input
                      type="date"
                      value={formData.sipDueDate}
                      onChange={(e) => setFormData({ ...formData, sipDueDate: e.target.value })}
                      className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none"
                    />
                  </div>
                </div>
              )}

              {/* Conditional Field: Maturity Date (FD, RD) */}
              {(formData.type === 'fixed_deposit' || formData.type === 'recurring_deposit') && (
                <div>
                  <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Maturity Date</label>
                  <input
                    type="date"
                    value={formData.maturityDate}
                    onChange={(e) => setFormData({ ...formData, maturityDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              )}

              {/* Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">Notes</label>
                <textarea
                  placeholder="Optional details or folder reference..."
                  rows="2"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-[#0d0f17] text-slate-800 dark:text-slate-100 px-3.5 py-2.5 text-xs focus:outline-none"
                />
              </div>

              {/* Buttons */}
              <button
                type="submit"
                className="w-full py-3 bg-secondary dark:bg-purple-650 hover:bg-indigo-700 dark:hover:bg-purple-750 text-white rounded-xl font-bold text-sm shadow-md transition-all mt-4 cursor-pointer text-center"
              >
                {editingItem ? 'Save Changes' : 'Confirm & Log'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
