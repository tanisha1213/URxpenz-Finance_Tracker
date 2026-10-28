import { useEffect, useMemo, useState } from 'react'
import {
  getLoans,
  addLoan,
  updateLoan,
  deleteLoan,
  getLoanInstallments,
  payInstallment,
  payLoanDirect
} from '../services/loanService'
import { getAccounts } from '../services/accountService'
import { formatCurrency } from '../utils/format'
import { useSubscription } from '../context/SubscriptionContext'
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiChevronLeft,
  FiChevronRight, FiPercent,
  FiAlertTriangle, FiBookOpen
} from 'react-icons/fi'

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
  'Other (Type Below)'
]

const emptyForm = {
  title: '',
  type: 'borrowed',
  mainCategory: 'bank',
  subCategory: 'home',
  lenderName: '',
  totalAmount: '',
  emiAmount: '',
  interestRate: '0',
  processingFee: '0',
  totalInstallments: '12',
  firstEmiDate: new Date().toISOString().slice(0, 10),
  dueDayOfMonth: '5',
  paymentFrequency: 'monthly',
  paymentSourceId: '',
  emiCategory: 'Bills',
  notes: '',
  reminder7Days: true,
  reminder3Days: true,
  reminder1Day: true,
  reminderDueDate: true,
  reminderDailyOverdue: true
}

function Loans() {
  const { isPro, openUpgradeModal } = useSubscription()
  // States
  const [loans, setLoans] = useState([])
  const [isCustomBank, setIsCustomBank] = useState(false)
  const [accounts, setAccounts] = useState([])
  const [installments, setInstallments] = useState([]) // all active installments for calendar
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [submitting, setSubmitting] = useState(false)
  
  // Modals & History expansion
  const [showAddModal, setShowAddModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editingLoanId, setEditingLoanId] = useState(null)
  const [expandedLoanId, setExpandedLoanId] = useState(null)
  const [installmentsHistory, setInstallmentsHistory] = useState([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(null)
  
  // Filters
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('all') // all, active, completed, overdue, thisMonth
  
  // Form State
  const [form, setForm] = useState(emptyForm)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  
  // Celebration effect for completed loan
  const [celebrationLoan, setCelebrationLoan] = useState(null)

  // Fetch all loans & accounts
  const loadData = async () => {
    try {
      const [loansRes, accountsRes] = await Promise.all([getLoans(), getAccounts()])
      const fetchedLoans = loansRes.data.data
      setLoans(fetchedLoans)
      setAccounts(accountsRes.data.data)
      localStorage.setItem('xpenz_cached_loans', JSON.stringify(fetchedLoans))
      setError('')
      
      // Load all installments for calendar populating
      const activeLoans = fetchedLoans.filter(l => l.status === 'active')
      const installmentPromises = activeLoans.map(l => getLoanInstallments(l._id))
      const installmentsRes = await Promise.all(installmentPromises)
      const allInst = installmentsRes.flatMap(res => res.data.data)
      setInstallments(allInst)
      localStorage.setItem('xpenz_cached_installments', JSON.stringify(allInst))
    } catch (err) {
      console.warn('Failed to load loans online, trying cached data:', err)
      const cachedLoans = localStorage.getItem('xpenz_cached_loans')
      const cachedInst = localStorage.getItem('xpenz_cached_installments')
      if (cachedLoans) {
        try { setLoans(JSON.parse(cachedLoans)) } catch (e) {}
      }
      if (cachedInst) {
        try { setInstallments(JSON.parse(cachedInst)) } catch (e) {}
      }
      // Suppress blocking error for smooth offline experience
      setError('')
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  // Open expanded history
  const handleToggleHistory = async (loanId) => {
    if (expandedLoanId === loanId) {
      setExpandedLoanId(null)
      setInstallmentsHistory([])
      return
    }
    
    setExpandedLoanId(loanId)
    setHistoryLoading(true)
    try {
      const res = await getLoanInstallments(loanId)
      setInstallmentsHistory(res.data.data)
    } catch (err) {
      console.error('Failed to fetch installments:', err)
    } finally {
      setHistoryLoading(false)
    }
  }

  // Handle Mark Paid
  const handleMarkPaid = async (loanId) => {
    try {
      setError('')
      setSuccess('')
      
      let payRes = null
      try {
        const res = await getLoanInstallments(loanId)
        const insts = res.data?.data || []
        const nextToPay = insts.find(i => i.status !== 'paid')
        if (nextToPay) {
          payRes = await payInstallment(nextToPay._id)
        }
      } catch (e) {
        console.warn('Installments lookup notice, using direct pay fallback:', e)
      }

      // Fallback to direct EMI payment engine if payInstallment was not executed
      if (!payRes) {
        payRes = await payLoanDirect(loanId)
      }

      const updatedLoan = payRes.data?.data?.loan
      if (updatedLoan && updatedLoan.status === 'completed') {
        setCelebrationLoan(updatedLoan)
        setTimeout(() => setCelebrationLoan(null), 5000)
      } else {
        setSuccess(payRes.data?.message || 'EMI payment logged & account balance updated successfully!')
      }

      await loadData()
      if (expandedLoanId === loanId) {
        try {
          const histRes = await getLoanInstallments(loanId)
          setInstallmentsHistory(histRes.data?.data || [])
        } catch (hErr) {
          console.warn('History refresh notice:', hErr)
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to pay installment.')
    }
  }

  // Handle Edit Loan Modal
  const openEditModal = (loan) => {
    setEditingLoanId(loan._id)
    const isCustom = loan.mainCategory === 'bank' && !POPULAR_BANKS.includes(loan.lenderName)
    setIsCustomBank(isCustom)
    setForm({
      title: loan.title,
      type: loan.type,
      mainCategory: loan.mainCategory || 'bank',
      subCategory: loan.subCategory || 'home',
      lenderName: loan.lenderName,
      totalAmount: loan.totalAmount.toString(),
      emiAmount: loan.emiAmount.toString(),
      interestRate: loan.interestRate?.toString() || '0',
      processingFee: loan.processingFee?.toString() || '0',
      totalInstallments: loan.totalInstallments?.toString() || '12',
      firstEmiDate: loan.firstEmiDate ? new Date(loan.firstEmiDate).getUTCFullYear() + '-' + String(new Date(loan.firstEmiDate).getUTCMonth() + 1).padStart(2, '0') + '-' + String(new Date(loan.firstEmiDate).getUTCDate()).padStart(2, '0') : new Date().toISOString().slice(0,10),
      dueDayOfMonth: loan.dueDayOfMonth?.toString() || '5',
      paymentFrequency: loan.paymentFrequency || 'monthly',
      paymentSourceId: loan.paymentSourceId || '',
      emiCategory: loan.emiCategory || 'EMI',
      notes: loan.notes || '',
      reminder7Days: loan.reminder7Days !== false,
      reminder3Days: loan.reminder3Days !== false,
      reminder1Day: loan.reminder1Day !== false,
      reminderDueDate: loan.reminderDueDate !== false,
      reminderDailyOverdue: loan.reminderDailyOverdue !== false
    })
    setShowEditModal(true)
  }

  // Handle Submit New Loan
  const handleSaveLoan = async (e) => {
    e.preventDefault()
    if (submitting) return
    setSubmitting(true)
    try {
      setError('')
      setSuccess('')
      
      const payload = {
        ...form,
        totalAmount: Number(form.totalAmount),
        emiAmount: Number(form.emiAmount),
        interestRate: Number(form.interestRate) || 0,
        processingFee: Number(form.processingFee) || 0,
        totalInstallments: Number(form.totalInstallments) || 1,
        dueDayOfMonth: Number(form.dueDayOfMonth) || 5,
        paymentSourceId: form.paymentSourceId || undefined
      }

      if (showEditModal && editingLoanId) {
        await updateLoan(editingLoanId, payload)
        setSuccess('Loan updated successfully!')
        setShowEditModal(false)
      } else {
        await addLoan(payload)
        setSuccess('Loan and installments created successfully!')
        setShowAddModal(false)
      }
      
      setForm(emptyForm)
      setEditingLoanId(null)
      loadData()
    } catch (err) {
      if (err.response?.data?.code === 'LIMIT_REACHED') {
        setShowAddModal(false)
        openUpgradeModal('loans')
      } else {
        setError(err.response?.data?.message || 'Failed to save loan.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  // Handle Delete Loan
  const handleDeleteLoan = async (loanId) => {
    const deleteTx = window.confirm('Would you like to delete all auto-generated expense transactions linked to this loan as well?\n\nClick OK to delete transactions, or CANCEL to delete ONLY the loan ledger.')
    
    if (window.confirm('Are you absolutely sure you want to delete this loan? This action is permanent.')) {
      try {
        setError('')
        setSuccess('')
        await deleteLoan(loanId, deleteTx)
        setSuccess('Loan deleted successfully.')
        loadData()
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete loan.')
      }
    }
  }

  // Overdue calculation helper
  const getOverdueDays = (dueDateStr) => {
    const diffTime = new Date() - new Date(dueDateStr)
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  // Statistics computations
  const stats = useMemo(() => {
    const active = loans.filter(l => l.status === 'active')
    const completed = loans.filter(l => l.status === 'completed' || l.status === 'paid')
    
    const totalRemaining = active.reduce((acc, curr) => acc + Number(curr.remainingAmount || 0), 0)
    const totalMonthlyEmi = active.reduce((acc, curr) => acc + Number(curr.emiAmount || 0), 0)
    
    const overdueCount = active.filter(l => l.nextDueDate && new Date(l.nextDueDate) < new Date()).length
    const todayCount = active.filter(l => {
      if (!l.nextDueDate) return false
      const due = new Date(l.nextDueDate)
      const today = new Date()
      return due.getDate() === today.getDate() && due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear()
    }).length

    return {
      activeCount: active.length,
      completedCount: completed.length,
      totalRemaining,
      totalMonthlyEmi,
      overdueCount,
      todayCount
    }
  }, [loans])

  // Filtered Loans list
  const filteredLoans = useMemo(() => {
    return loans.filter(loan => {
      const matchSearch = loan.title.toLowerCase().includes(search.toLowerCase()) ||
                          loan.lenderName.toLowerCase().includes(search.toLowerCase())
      
      if (!matchSearch) return false
      
      const isOverdue = loan.status === 'active' && loan.nextDueDate && new Date(loan.nextDueDate) < new Date()
      
      if (statusFilter === 'active') return loan.status === 'active'
      if (statusFilter === 'completed') return loan.status === 'completed' || loan.status === 'paid'
      if (statusFilter === 'overdue') return isOverdue
      
      if (statusFilter === 'thisMonth') {
        if (!loan.nextDueDate) return false
        const due = new Date(loan.nextDueDate)
        const today = new Date()
        return due.getMonth() === today.getMonth() && due.getFullYear() === today.getFullYear()
      }
      
      return true
    })
  }, [loans, search, statusFilter])

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
  const getInstallmentsForDate = (date) => {
    if (!date) return []
    return installments.filter(inst => {
      const instDate = new Date(inst.dueDate)
      return (
        instDate.getUTCDate() === date.getDate() &&
        instDate.getUTCMonth() === date.getMonth() &&
        instDate.getUTCFullYear() === date.getFullYear()
      )
    })
  }

  // Expected loan completion and forecasts
  const forecast = useMemo(() => {
    const active = loans.filter(l => l.status === 'active')
    const totalRemaining = active.reduce((acc, curr) => acc + Number(curr.remainingAmount || 0), 0)
    const monthlyEmi = active.reduce((acc, curr) => acc + Number(curr.emiAmount || 0), 0)
    
    // Total Paid Till Date
    const totalPaid = loans.reduce((acc, curr) => {
      const paid = Number(curr.totalAmount || 0) - Number(curr.remainingAmount || 0)
      return acc + Math.max(0, paid)
    }, 0)

    // Projected Debt-Free Date (farthest end date among active loans)
    let farthestDate = null
    active.forEach(loan => {
      if (loan.nextDueDate && loan.totalInstallments && loan.installmentsPaid) {
        const remaining = loan.totalInstallments - loan.installmentsPaid
        const date = new Date(loan.nextDueDate)
        date.setMonth(date.getMonth() + remaining)
        if (!farthestDate || date > farthestDate) {
          farthestDate = date
        }
      }
    })

    return {
      totalRemaining,
      monthlyEmi,
      totalPaid,
      debtFreeDate: farthestDate ? farthestDate.toLocaleDateString('en-IN', { month: 'short', year: 'numeric', timeZone: 'UTC' }) : 'N/A'
    }
  }, [loans])

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 relative w-full max-w-full overflow-hidden">
      {/* Celebration overlay */}
      {celebrationLoan && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-900/80 backdrop-blur-md animate-fade-in">
          <div className="text-center p-8 bg-white dark:bg-[#131522] border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl max-w-sm mx-4">
            <span className="text-6xl block mb-4 animate-bounce">🎉</span>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white mb-2">Congratulations!</h2>
            <p className="text-slate-500 dark:text-dark-text-muted text-sm mb-4">
              Your loan <span className="font-bold text-secondary dark:text-purple-400">&quot;{celebrationLoan.title}&quot;</span> has been successfully completed and archived.
            </p>
            <div className="inline-block px-4 py-2 bg-emerald-500/10 text-emerald-500 rounded-full font-bold text-xs uppercase tracking-wider">
              Debt Free!
            </div>
          </div>
        </div>
      )}

      {/* Page Title */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">Loans & EMIs</h2>
          <p className="text-slate-400 dark:text-dark-text-muted text-sm mt-0.5">Track your loans, payments, and see when you will be debt free.</p>
        </div>
        <button
          id="loans-add-btn-tour"
          onClick={() => {
            const activeLoans = loans.filter(l => l.status === 'active')
            if (!isPro && activeLoans.length >= 1) {
              openUpgradeModal('loans')
              return
            }
            setForm({
              ...emptyForm,
              paymentSourceId: accounts[0]?._id || ''
            })
            setShowAddModal(true)
          }}
          className="flex items-center justify-center gap-2 rounded-xl bg-secondary dark:bg-purple-650 px-4 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 shadow-md transition-all w-fit cursor-pointer"
        >
          <FiPlus className="w-4 h-4" />
          Add Loan / Debt
        </button>
      </div>

      {/* Success/Error Alerts */}
      {success && (
        <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/50 dark:bg-emerald-950/5 p-4 text-sm text-emerald-700 dark:text-emerald-400">
          {success}
        </div>
      )}
      {error && (
        <div className="rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/5 p-4 text-sm text-rose-700 dark:text-rose-400">
          {error}
        </div>
      )}

      {/* Statistics Cards Grid */}
      <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 w-full overflow-hidden" id="loans-stats-grid-tour">
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-3 sm:p-4 rounded-2xl shadow-sm min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Left to Pay</p>
          <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1 truncate">{formatCurrency(stats.totalRemaining)}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-3 sm:p-4 rounded-2xl shadow-sm min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Monthly EMI</p>
          <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1 truncate">{formatCurrency(stats.totalMonthlyEmi)}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-3 sm:p-4 rounded-2xl shadow-sm min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Active Loans</p>
          <p className="text-base sm:text-lg font-black text-slate-800 dark:text-white mt-1">{stats.activeCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-3 sm:p-4 rounded-2xl shadow-sm min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Completed</p>
          <p className="text-base sm:text-lg font-black text-emerald-600 dark:text-emerald-400 mt-1">{stats.completedCount}</p>
        </div>
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-3 sm:p-4 rounded-2xl shadow-sm min-w-0">
          <p className="text-[9px] sm:text-[10px] font-bold text-slate-400 uppercase tracking-wider truncate">Overdue EMIs</p>
          <p className={`text-base sm:text-lg font-black mt-1 ${stats.overdueCount > 0 ? 'text-rose-500' : 'text-slate-450 dark:text-slate-300'}`}>
            {stats.overdueCount}
          </p>
        </div>
      </div>

      {/* Main Two-Column Layout */}
      <div className="grid gap-6 lg:grid-cols-4 w-full overflow-hidden">
        {/* Left Side: Search, Filters, and Loans Cards list */}
        <div className="lg:col-span-3 space-y-6 min-w-0">
          {/* Forecast & Projections Banner Card */}
          <div className="bg-gradient-to-r from-[#8B5CF6]/5 via-[#4f46e5]/5 to-indigo-500/5 dark:from-[#8B5CF6]/10 dark:to-indigo-500/10 border border-[#8B5CF6]/10 rounded-2xl p-4 sm:p-5 shadow-premium min-w-0 overflow-hidden" id="loans-payoff-date-tour">
            <h3 className="text-sm font-bold text-slate-800 dark:text-white mb-3 flex items-center gap-1.5">
              <FiPercent className="text-secondary dark:text-purple-400" />
              Expected Payoff Date
            </h3>
            <div className="grid grid-cols-1 min-[400px]:grid-cols-2 sm:grid-cols-4 gap-3.5 text-xs">
              <div className="min-w-0">
                <p className="text-slate-400 font-semibold leading-tight truncate">Total Debt</p>
                <p className="font-extrabold text-slate-700 dark:text-slate-200 mt-0.5 truncate">{formatCurrency(forecast.totalRemaining + forecast.totalPaid)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 font-semibold leading-tight truncate">Total Paid</p>
                <p className="font-extrabold text-emerald-600 dark:text-emerald-400 mt-0.5 truncate">{formatCurrency(forecast.totalPaid)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 font-semibold leading-tight truncate">Left to Pay</p>
                <p className="font-extrabold text-rose-500 mt-0.5 truncate">{formatCurrency(forecast.totalRemaining)}</p>
              </div>
              <div className="min-w-0">
                <p className="text-slate-400 font-semibold leading-tight break-words">Expected Payoff Date</p>
                <p className="font-extrabold text-indigo-600 dark:text-purple-400 mt-0.5 truncate">{forecast.debtFreeDate}</p>
              </div>
            </div>
          </div>

          {/* Filters Toolbar */}
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-3.5 rounded-2xl shadow-sm w-full min-w-0 overflow-hidden" id="loans-filter-tour">
            <div className="flex bg-slate-150/40 dark:bg-slate-900/60 p-1 rounded-xl w-full max-w-full overflow-x-auto scrollbar-none">
              {['all', 'active', 'overdue', 'completed', 'thisMonth'].map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer whitespace-nowrap ${
                    statusFilter === tab
                      ? 'bg-white dark:bg-dark-border text-secondary dark:text-purple-400 shadow-sm'
                      : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
                  }`}
                >
                  {tab === 'all' && 'All'}
                  {tab === 'active' && 'Active'}
                  {tab === 'overdue' && 'Overdue'}
                  {tab === 'completed' && 'Completed'}
                  {tab === 'thisMonth' && 'Due This Month'}
                </button>
              ))}
            </div>
            
            <div className="relative w-full md:w-60">
              <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                placeholder="Search loan or lender..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 pl-9 pr-3 py-2 text-xs focus:outline-none"
              />
            </div>
          </div>

          {/* Loans Cards Stream */}
          <div className="space-y-4">
            {filteredLoans.length > 0 ? (
              filteredLoans.map((loan) => {
                const isOverdue = loan.status === 'active' && loan.nextDueDate && new Date(loan.nextDueDate) < new Date()
                const overdueDays = loan.nextDueDate ? getOverdueDays(loan.nextDueDate) : 0
                
                const pct = Math.round((loan.installmentsPaid / loan.totalInstallments) * 100) || 0
                const isCompleted = loan.status === 'completed' || loan.status === 'paid'

                // Next Due formatting
                const dueText = isCompleted 
                  ? 'Completed'
                  : loan.nextDueDate 
                    ? new Date(loan.nextDueDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', timeZone: 'UTC' })
                    : '-'

                const isExpanded = expandedLoanId === loan._id

                return (
                  <div
                    key={loan._id}
                    className={`bg-white dark:bg-dark-card border rounded-2xl shadow-premium overflow-hidden transition-all duration-200 min-w-0 w-full ${
                      isOverdue 
                        ? 'border-rose-500 ring-1 ring-rose-500/20' 
                        : 'border-slate-100 dark:border-dark-border'
                    }`}
                  >
                    <div className="p-4 sm:p-5 flex flex-col gap-5 min-w-0">
                      
                      {/* Top Header: Title, Lender and Badge */}
                      <div className="flex justify-between items-start gap-3">
                        <div className="space-y-1 min-w-0 flex-1">
                          <h4 className="font-extrabold text-slate-800 dark:text-white text-base sm:text-lg leading-snug break-words">{loan.title}</h4>
                          <p className="text-xs sm:text-sm text-slate-450 dark:text-slate-400 capitalize font-medium break-words">
                            {loan.lenderName} • {loan.mainCategory === 'bank' ? 'Bank Loan' : 'Friend / Family Loan'}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] sm:text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                          isCompleted
                            ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400'
                            : isOverdue
                              ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-600 dark:text-rose-455'
                              : 'bg-blue-50 dark:bg-blue-950/20 text-blue-600 dark:text-blue-400'
                        }`}>
                          {isCompleted ? 'Completed' : isOverdue ? 'Overdue' : 'Active'}
                        </span>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-100 dark:border-dark-border/40" />

                      {/* Middle: EMI Details Grid (Spaced out for vertical height, fitting width perfectly) */}
                      <div className="grid grid-cols-2 gap-y-4 gap-x-3 text-left">
                        <div className="min-w-0">
                          <p className="text-slate-450 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">EMI Amount</p>
                          <p className="font-black text-sm sm:text-base text-slate-800 dark:text-white mt-1 truncate">{formatCurrency(loan.emiAmount)}/mo</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-450 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">Next Due</p>
                          <p className={`font-black text-sm sm:text-base mt-1 truncate ${isOverdue ? 'text-rose-500' : 'text-slate-800 dark:text-slate-200'}`}>
                            {dueText}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-450 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">Left to Pay</p>
                          <p className="font-black text-sm sm:text-base text-slate-800 dark:text-white mt-1 truncate">{formatCurrency(loan.remainingAmount)}</p>
                        </div>
                        <div className="min-w-0">
                          <p className="text-slate-450 font-bold uppercase tracking-wider text-[10px] sm:text-[11px]">Installments</p>
                          <p className="font-bold text-sm sm:text-base text-slate-700 dark:text-slate-300 mt-1 truncate">{loan.installmentsPaid} / {loan.totalInstallments}</p>
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-slate-100 dark:border-dark-border/40" />

                      {/* Bottom: Action Buttons */}
                      <div className="flex items-center flex-wrap gap-2.5 w-full justify-between sm:justify-start">
                        {!isCompleted && (
                          <button
                            onClick={() => handleMarkPaid(loan._id)}
                            className="bg-secondary dark:bg-purple-650 hover:bg-indigo-700 dark:hover:bg-purple-750 text-white font-bold text-xs sm:text-sm px-4 py-2.5 rounded-xl transition-all shadow-sm flex-1 sm:flex-none cursor-pointer text-center"
                          >
                            Mark Paid
                          </button>
                        )}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleToggleHistory(loan._id)}
                            className="p-2.5 border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="View Payment History"
                          >
                            <FiBookOpen className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => openEditModal(loan)}
                            className="p-2.5 border border-slate-200 dark:border-dark-border text-slate-500 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Edit Settings"
                          >
                            <FiEdit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDeleteLoan(loan._id)}
                            className="p-2.5 border border-slate-200 dark:border-dark-border text-slate-400 hover:text-red-500 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition-colors cursor-pointer"
                            title="Delete Loan"
                          >
                            <FiTrash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="px-4 sm:px-5 pb-4">
                      <div className="flex justify-between items-center text-[10px] text-slate-400 dark:text-dark-text-muted font-bold mb-1.5">
                        <span>{pct}% Paid</span>
                        <span>{loan.totalInstallments - loan.installmentsPaid} installments left</span>
                      </div>
                      <div className="w-full h-2 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-[#8B5CF6] to-indigo-500 rounded-full transition-all duration-500 ease-out"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      {isOverdue && (
                        <div className="mt-3 flex items-center gap-1.5 text-xs text-rose-500 font-extrabold">
                          <FiAlertTriangle className="w-4 h-4 animate-pulse" />
                          <span>Overdue by {overdueDays} Days</span>
                        </div>
                      )}
                    </div>

                    {/* Expandable History Drawer */}
                    {isExpanded && (
                      <div className="border-t border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/30 p-5 space-y-3">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-slate-400">Installment Details & History</h5>
                        {historyLoading ? (
                          <div className="flex items-center gap-2 text-xs text-slate-450 justify-center py-4">
                            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-secondary"></div>
                            Loading history...
                          </div>
                        ) : installmentsHistory.length > 0 ? (
                          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {installmentsHistory.map((inst) => {
                              const isPaid = inst.status === 'paid'
                              const instOverdue = inst.status !== 'paid' && new Date(inst.dueDate) < new Date()
                              
                              return (
                                <div
                                  key={inst._id}
                                  className={`p-3 rounded-xl border flex justify-between items-center text-xs ${
                                    isPaid
                                      ? 'bg-emerald-500/5 border-emerald-150 dark:border-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                                      : instOverdue
                                        ? 'bg-rose-500/5 border-rose-150 dark:border-rose-950/20 text-rose-700 dark:text-rose-400'
                                        : 'bg-white dark:bg-dark-card border-slate-100 dark:border-dark-border text-slate-600 dark:text-slate-350'
                                  }`}
                                >
                                  <div>
                                    <p className="font-bold">Installment #{inst.installmentNumber}</p>
                                    <p className="text-[10px] text-slate-400 mt-0.5">
                                      Due: {new Date(inst.dueDate).toLocaleDateString('en-IN', { timeZone: 'UTC' })}
                                    </p>
                                    {isPaid && inst.paidDate && (
                                      <p className="text-[9px] text-emerald-500 mt-0.5 font-bold">
                                        Paid: {new Date(inst.paidDate).toLocaleDateString('en-IN')}
                                      </p>
                                    )}
                                  </div>
                                  <div className="text-right">
                                    <p className="font-extrabold">{formatCurrency(inst.amount)}</p>
                                    <span className={`inline-block px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider mt-1 ${
                                      isPaid
                                        ? 'bg-emerald-500/10 text-emerald-500'
                                        : instOverdue
                                          ? 'bg-rose-500/10 text-rose-500'
                                          : 'bg-slate-100 dark:bg-slate-800 text-slate-400'
                                    }`}>
                                      {isPaid ? 'Paid' : instOverdue ? 'Overdue' : 'Upcoming'}
                                    </span>
                                  </div>
                                </div>
                              )
                            })}
                          </div>
                        ) : (
                          <p className="text-xs text-slate-400 py-2">No installments logged for this loan.</p>
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            ) : (
              <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-12 text-center rounded-2xl text-slate-450 shadow-sm font-medium">
                No loans found matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: EMI Calendar and Selected Date Reminders */}
        <div className="lg:col-span-1 space-y-6 min-w-0">
          <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl p-4 shadow-premium space-y-4 overflow-hidden w-full">
            
            {/* Calendar Header */}
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">EMI Calendar</span>
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
                  className="p-1 hover:bg-slate-50 dark:hover:bg-slate-800 rounded text-slate-500 cursor-pointer"
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

                const dateInsts = getInstallmentsForDate(day)
                const hasOverdue = dateInsts.some(i => i.status !== 'paid' && new Date(i.dueDate) < new Date())
                const hasUpcoming = dateInsts.some(i => i.status !== 'paid' && new Date(i.dueDate) >= new Date())
                const hasPaid = dateInsts.some(i => i.status === 'paid')

                let bgClass = 'hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-full'
                let textClass = 'text-slate-700 dark:text-slate-300'
                
                if (dateInsts.length > 0) {
                  if (hasOverdue) {
                    bgClass = 'bg-rose-500 text-white rounded-full font-black shadow-sm'
                    textClass = 'text-white'
                  } else if (hasUpcoming) {
                    bgClass = 'bg-amber-500 text-white rounded-full font-black shadow-sm'
                    textClass = 'text-white'
                  } else if (hasPaid) {
                    bgClass = 'bg-emerald-500 text-white rounded-full font-black shadow-sm'
                    textClass = 'text-white'
                  }
                }

                const isToday = new Date().toDateString() === day.toDateString()
                const todayClass = isToday && dateInsts.length === 0 ? 'border border-indigo-500 rounded-full font-bold' : ''

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
                <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                Paid
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full" />
                Upcoming
              </span>
              <span className="flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                Overdue
              </span>
            </div>

            {/* Selected Date Details */}
            {selectedCalendarDate && (
              <div className="bg-slate-50 dark:bg-dark-border/20 p-3 rounded-xl space-y-2.5 animate-fadeIn">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span>DUE ON {selectedCalendarDate.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  <button onClick={() => setSelectedCalendarDate(null)} className="hover:text-slate-655 cursor-pointer">✕</button>
                </div>
                {getInstallmentsForDate(selectedCalendarDate).map((inst) => {
                  const loanItem = loans.find(l => l._id === inst.loanId)
                  return (
                    <div key={inst._id} className="text-xs space-y-1">
                      <p className="font-bold text-slate-800 dark:text-white">{loanItem?.title || 'Loan'}</p>
                      <div className="flex justify-between items-center text-[10px]">
                        <span className="text-slate-400">Installment #{inst.installmentNumber}</span>
                        <span className="font-extrabold text-secondary dark:text-purple-400">{formatCurrency(inst.amount)}</span>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Creation/Editing Dialog Overlay */}
      {(showAddModal || showEditModal) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-dark-border max-h-[90vh] overflow-y-auto">
            <header className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-dark-card/50">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">
                {showEditModal ? 'Edit Loan Details' : 'Add New Loan'}
              </h3>
              <button
                onClick={() => {
                  setShowAddModal(false)
                  setShowEditModal(false)
                  setForm(emptyForm)
                  setEditingLoanId(null)
                  setIsCustomBank(false)
                }}
                className="text-slate-400 hover:text-slate-655 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </header>

            <form onSubmit={handleSaveLoan} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-xl text-xs font-semibold leading-relaxed">
                  {error}
                </div>
              )}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan Name</label>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => setForm({ ...form, title: e.target.value })}
                    placeholder="e.g. Car Loan, Home Loan"
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {form.mainCategory === 'bank' ? 'Select Bank' : 'Lender Name'}
                  </label>
                  {form.mainCategory === 'bank' ? (
                    <div className="space-y-2">
                      <select
                        value={isCustomBank ? 'Other (Type Below)' : form.lenderName}
                        onChange={(e) => {
                          const val = e.target.value
                          if (val === 'Other (Type Below)') {
                            setIsCustomBank(true)
                            setForm({ ...form, lenderName: '' })
                          } else {
                            setIsCustomBank(false)
                            setForm({ ...form, lenderName: val })
                          }
                        }}
                        className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                        required
                      >
                        <option value="" disabled>Select a bank...</option>
                        {POPULAR_BANKS.map(bank => (
                          <option key={bank} value={bank}>{bank}</option>
                        ))}
                      </select>
                      {isCustomBank && (
                        <input
                          type="text"
                          value={form.lenderName}
                          onChange={(e) => setForm({ ...form, lenderName: e.target.value })}
                          placeholder="Type your bank name here..."
                          className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                          required
                        />
                      )}
                    </div>
                  ) : (
                    <input
                      type="text"
                      value={form.lenderName}
                      onChange={(e) => setForm({ ...form, lenderName: e.target.value })}
                      placeholder="e.g. Uncle John, Friend Raj"
                      className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan Option</label>
                  <select
                    value={form.mainCategory}
                    onChange={(e) => setForm({ ...form, mainCategory: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="bank">Bank Loan (Institution)</option>
                    <option value="personal">Personal Debt (Friend/Family)</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="borrowed">Borrowed (Money Taken - I Owe)</option>
                    <option value="lent">Lent (Money Given - They Owe Me)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Loan Amount (₹)</label>
                  <input
                    type="number"
                    value={form.totalAmount}
                    onChange={(e) => setForm({ ...form, totalAmount: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EMI Amount (₹)</label>
                  <input
                    type="number"
                    value={form.emiAmount}
                    onChange={(e) => setForm({ ...form, emiAmount: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.interestRate}
                    onChange={(e) => setForm({ ...form, interestRate: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Processing Fee</label>
                  <input
                    type="number"
                    value={form.processingFee}
                    onChange={(e) => setForm({ ...form, processingFee: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Installments Count</label>
                  <input
                    type="number"
                    value={form.totalInstallments}
                    onChange={(e) => setForm({ ...form, totalInstallments: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-sans">First EMI Due Date</label>
                  <input
                    type="date"
                    value={form.firstEmiDate}
                    onChange={(e) => setForm({ ...form, firstEmiDate: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Source Account</label>
                  <select
                    value={form.paymentSourceId}
                    onChange={(e) => setForm({ ...form, paymentSourceId: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                    required
                  >
                    <option value="" disabled>Select payment source...</option>
                    {accounts.map(acc => (
                      <option key={acc._id} value={acc._id}>{acc.name} ({acc.type})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">EMI Category</label>
                  <input
                    type="text"
                    value={form.emiCategory}
                    onChange={(e) => setForm({ ...form, emiCategory: e.target.value })}
                    placeholder="e.g. Bills, Housing, Transport"
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Payment Frequency</label>
                  <select
                    value={form.paymentFrequency}
                    onChange={(e) => setForm({ ...form, paymentFrequency: e.target.value })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="monthly">Monthly</option>
                    <option value="weekly">Weekly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="yearly">Yearly</option>
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Memo / Notes</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  rows="2"
                  placeholder="Optional details, interest calculations..."
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              {/* Reminder configurations */}
              <div className="border-t border-slate-100 dark:border-dark-border pt-4">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">EMI In-App Reminders</span>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs font-semibold text-slate-600 dark:text-slate-350">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.reminder7Days}
                      onChange={(e) => setForm({ ...form, reminder7Days: e.target.checked })}
                      className="rounded border-slate-200 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    7 Days Before
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.reminder3Days}
                      onChange={(e) => setForm({ ...form, reminder3Days: e.target.checked })}
                      className="rounded border-slate-200 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    3 Days Before
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.reminder1Day}
                      onChange={(e) => setForm({ ...form, reminder1Day: e.target.checked })}
                      className="rounded border-slate-200 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    1 Day Before
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.reminderDueDate}
                      onChange={(e) => setForm({ ...form, reminderDueDate: e.target.checked })}
                      className="rounded border-slate-200 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    On Due Date (9 AM)
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.reminderDailyOverdue}
                      onChange={(e) => setForm({ ...form, reminderDailyOverdue: e.target.checked })}
                      className="rounded border-slate-200 text-secondary focus:ring-secondary cursor-pointer"
                    />
                    Daily until Paid
                  </label>
                </div>
              </div>

              <footer className="pt-4 border-t border-slate-100 dark:border-dark-border flex justify-end gap-3 bg-slate-50/50 dark:bg-dark-card/50 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false)
                    setShowEditModal(false)
                    setForm(emptyForm)
                    setEditingLoanId(null)
                    setIsCustomBank(false)
                  }}
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-xl bg-secondary dark:bg-purple-650 px-5 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 transition-colors shadow-md shadow-secondary/15 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      <span>Saving...</span>
                    </>
                  ) : (
                    showEditModal ? 'Save Changes' : 'Create Loan & EMI'
                  )}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Loans
