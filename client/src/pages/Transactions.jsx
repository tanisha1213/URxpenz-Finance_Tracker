import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useSearchParams } from 'react-router-dom'
import {
  fetchTransactions,
  removeTransactionById,
  saveTransaction
} from '../redux/slices/transactionSlice'
import { categories, formatCurrency, formatDate, paymentMethods } from '../utils/format'
import {
  FiPlus, FiEdit2, FiTrash2, FiSearch, FiRefreshCw, FiChevronLeft, FiChevronRight,
  FiPercent, FiInfo, FiCalendar
} from 'react-icons/fi'
import { useLanguage } from '../context/LanguageContext'
import { getLoans, addLoan, updateLoan, deleteLoan } from '../services/loanService'
import { getAccounts } from '../services/accountService'
import Loans from './Loans'
import Investments from './Investments'
import Insurance from './Insurance'

const emptyForm = {
  type: 'expense',
  title: '',
  amount: '',
  category: 'Food',
  paymentMethod: 'upi',
  accountId: '', // Explicit account association
  description: '',
  transactionDate: new Date().toISOString().slice(0, 10),
  
  // Integrated Loan properties
  isLoan: false,
  loanAction: 'link', // 'link' = repay existing loan, 'create' = create new loan
  loanId: '', // for linking existing
  loanMainCategory: 'bank', // 'bank' | 'personal'
  loanSubCategory: 'home',
  loanLenderName: '',
  loanInterestRate: '0',
  loanEmiAmount: '0',
  loanEndDate: '',
  loanProcessingFee: '0',
  loanTotalInstallments: '12',
  loanFirstEmiDate: new Date().toISOString().slice(0, 10),
  loanPaymentFrequency: 'monthly',
  loanReminder7Days: true,
  loanReminder3Days: true,
  loanReminder1Day: true,
  loanReminderDueDate: true,
  loanReminderDailyOverdue: true
}

function Transactions() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { transactions, pagination, loading, error } = useSelector(state => state.transactions)
  const [searchParams, setSearchParams] = useSearchParams()
  const [activeSubTab, setActiveSubTab] = useState(
    ['loans', 'investments', 'insurance'].includes(searchParams.get('tab'))
      ? searchParams.get('tab')
      : 'transactions'
  )

  useEffect(() => {
    const tab = searchParams.get('tab')
    if (['loans', 'investments', 'insurance'].includes(tab)) {
      setActiveSubTab(tab)
    } else {
      setActiveSubTab('transactions')
    }
  }, [searchParams])

  const handleTabChange = (tab) => {
    setActiveSubTab(tab)
    setSearchParams({ tab })
  }

  // System states
  const [loans, setLoans] = useState([])
  const [accounts, setAccounts] = useState([])
  const [filters, setFilters] = useState({
    search: '',
    type: '',
    category: '',
    sort: 'latest',
    loanId: '', // filter transactions by linked loan
    page: 1
  })

  const [form, setForm] = useState(emptyForm)
  const [customCategories, setCustomCategories] = useState(() => {
    try {
      const saved = localStorage.getItem('xpenz_custom_categories')
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [isCustomCategory, setIsCustomCategory] = useState(false)
  const [newCategoryInput, setNewCategoryInput] = useState('')

  const allCategories = useMemo(() => {
    const base = categories.filter(c => c !== 'Other')
    const combined = [...base, ...customCategories]
    if (form.category && !combined.includes(form.category) && form.category !== 'Add Custom Category...') {
      combined.push(form.category)
    }
    return [...combined, 'Other', 'Add Custom Category...']
  }, [customCategories, form.category])
  const [editingId, setEditingId] = useState(null)
  const [showForm, setShowForm] = useState(false)
  const [message, setMessage] = useState('')
  const [loansLoading, setLoansLoading] = useState(false)
  const [editingLoan, setEditingLoan] = useState(null)
  const [showEditLoan, setShowEditLoan] = useState(false)
  const [currentMonth, setCurrentMonth] = useState(new Date())

  // Get calendar days in month
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

  // Get active loans ending on a specific date
  const getLoansEndingOnDate = (day) => {
    if (!day) return []
    return loans.filter(loan => {
      if (!loan.endDate || loan.status !== 'active') return false
      const loanDate = new Date(loan.endDate)
      return (
        loanDate.getUTCDate() === day.getDate() &&
        loanDate.getUTCMonth() === day.getMonth() &&
        loanDate.getUTCFullYear() === day.getFullYear()
      )
    })
  }

  const query = useMemo(() => ({
    search: filters.search,
    type: filters.type,
    category: filters.category,
    sort: filters.sort,
    loanId: filters.loanId,
    page: filters.page,
    limit: 10
  }), [filters])

  const fetchLoansAndAccounts = async () => {
    try {
      setLoansLoading(true)
      const [loansRes, accountsRes] = await Promise.all([getLoans(), getAccounts()])
      setLoans(loansRes.data.data)
      setAccounts(accountsRes.data.data)
    } catch (err) {
      console.error('Failed to fetch support data:', err)
    } finally {
      setLoansLoading(false)
    }
  }

  useEffect(() => {
    dispatch(fetchTransactions(query))
  }, [dispatch, query])

  useEffect(() => {
    const handleSyncComplete = () => {
      dispatch(fetchTransactions(query))
    }
    window.addEventListener('xpenz-offline-synced', handleSyncComplete)
    return () => window.removeEventListener('xpenz-offline-synced', handleSyncComplete)
  }, [dispatch, query])

  // Auto-sync custom categories from cloud transactions so they persist across devices
  useEffect(() => {
    if (transactions && transactions.length > 0) {
      const existingCats = transactions.map(t => t.category).filter(Boolean)
      const uniqueCats = [...new Set(existingCats)].filter(c => !categories.includes(c) && c !== 'Other')
      if (uniqueCats.length > 0) {
        setCustomCategories(prev => {
          const merged = [...new Set([...prev, ...uniqueCats])]
          localStorage.setItem('xpenz_custom_categories', JSON.stringify(merged))
          return merged
        })
      }
    }
  }, [transactions])

  useEffect(() => {
    fetchLoansAndAccounts()
  }, [showForm])

  const handleEditLoan = (loan) => {
    setEditingLoan({
      ...loan,
      endDate: loan.endDate ? new Date(loan.endDate).getUTCFullYear() + '-' + String(new Date(loan.endDate).getUTCMonth() + 1).padStart(2, '0') + '-' + String(new Date(loan.endDate).getUTCDate()).padStart(2, '0') : ''
    })
    setShowEditLoan(true)
  }

  const handleSaveLoan = async (e) => {
    e.preventDefault()
    try {
      await updateLoan(editingLoan._id, {
        title: editingLoan.title,
        lenderName: editingLoan.lenderName,
        totalAmount: Number(editingLoan.totalAmount),
        remainingAmount: Number(editingLoan.remainingAmount),
        interestRate: Number(editingLoan.interestRate) || 0,
        emiAmount: Number(editingLoan.emiAmount) || 0,
        endDate: editingLoan.endDate ? new Date(editingLoan.endDate) : null,
        status: editingLoan.status
      })
      setShowEditLoan(false)
      setEditingLoan(null)
      fetchLoansAndAccounts()
      dispatch(fetchTransactions(query))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update loan')
    }
  }

  const handleDeleteLoan = async (loanId) => {
    if (!window.confirm('Are you sure you want to delete this loan? This will not delete linked transactions.')) return
    try {
      await deleteLoan(loanId)
      fetchLoansAndAccounts()
      dispatch(fetchTransactions(query))
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete loan')
    }
  }

  const handleFilterChange = (e) => {
    setFilters({
      ...filters,
      [e.target.name]: e.target.value,
      page: 1
    })
  }

  const handleSelectLoanFilter = (loanId) => {
    setFilters({
      ...filters,
      loanId: filters.loanId === loanId ? '' : loanId, // toggle filter
      page: 1
    })
  }

  const handleResetFilters = () => {
    setFilters({
      search: '',
      type: '',
      category: '',
      sort: 'latest',
      loanId: '',
      page: 1
    })
  }

  const openCreate = () => {
    setEditingId(null)
    setIsCustomCategory(false)
    setNewCategoryInput('')
    const initialAccId = accounts[0]?._id || ''
    const initialAcc = accounts.find(acc => acc._id === initialAccId)
    const isCashAcc = initialAcc && (initialAcc.type === 'cash' || initialAcc.name.toLowerCase().includes('cash'))
    
    setForm({
      ...emptyForm,
      accountId: initialAccId,
      paymentMethod: isCashAcc ? 'cash' : emptyForm.paymentMethod
    })
    setShowForm(true)
    setMessage('')
  }

  const openEdit = (item) => {
    setEditingId(item._id)
    setIsCustomCategory(false)
    setNewCategoryInput('')
    setForm({
      type: item.type,
      title: item.title,
      amount: item.amount,
      category: item.category,
      paymentMethod: item.paymentMethod,
      accountId: item.accountId?._id || item.accountId || '',
      description: item.description || '',
      transactionDate: new Date(item.transactionDate).toISOString().slice(0, 10),
      isLoan: !!item.loanId,
      loanAction: 'link',
      loanId: item.loanId?._id || item.loanId || '',
      loanMainCategory: item.loanId?.mainCategory || 'bank',
      loanSubCategory: item.loanId?.subCategory || 'home',
      loanLenderName: item.loanId?.lenderName || '',
      loanInterestRate: item.loanId?.interestRate?.toString() || '0',
      loanEmiAmount: item.loanId?.emiAmount?.toString() || '0',
      loanEndDate: item.loanId?.endDate ? new Date(item.loanId.endDate).toISOString().slice(0, 10) : ''
    })
    setShowForm(true)
    setMessage('')
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    
    let extraChanges = {}

    if (name === 'accountId') {
      const selectedAcc = accounts.find(acc => acc._id === val)
      if (selectedAcc && (selectedAcc.type === 'cash' || selectedAcc.name.toLowerCase().includes('cash'))) {
        extraChanges.paymentMethod = 'cash'
      }
    }

    // Compute preview values including this input change
    const currentIsLoan = name === 'isLoan' ? !!val : !!form.isLoan
    const currentLoanAction = name === 'loanAction' ? val : form.loanAction
    const currentLoanId = name === 'loanId' ? val : form.loanId
    const currentAmount = name === 'amount' ? Number(val) : Number(form.amount)
    const currentType = name === 'type' ? val : form.type
    const currentLenderName = name === 'loanLenderName' ? val : form.loanLenderName
    const currentMainCategory = name === 'loanMainCategory' ? val : form.loanMainCategory
    const currentSubCategory = name === 'loanSubCategory' ? val : form.loanSubCategory

    if (currentIsLoan) {
      if (currentLoanAction === 'link') {
        extraChanges.category = 'Bills' // force category to Bills for repayment
        
        const loan = loans.find(l => l._id === currentLoanId)
        if (loan) {
          if (currentAmount >= loan.remainingAmount) {
            extraChanges.title = `Cleared loan of ${loan.lenderName}`
          } else {
            if (loan.type === 'borrowed') {
              extraChanges.title = `Repayment of ${loan.title} to ${loan.lenderName}`
            } else {
              extraChanges.title = `Repayment received for ${loan.title} from ${loan.lenderName}`
            }
          }
        }
      } else if (currentLoanAction === 'create') {
        extraChanges.category = 'Other' // force category to Other for creation
        
        if (currentLenderName && currentLenderName.trim() !== '') {
          const capitalizedSub = currentSubCategory.charAt(0).toUpperCase() + currentSubCategory.slice(1)
          if (currentMainCategory === 'bank') {
            extraChanges.title = `${currentLenderName.trim()} - ${capitalizedSub} Loan`
          } else {
            if (currentType === 'income') {
              extraChanges.title = `Loan from ${currentLenderName.trim()}`
            } else {
              extraChanges.title = `Loan to ${currentLenderName.trim()}`
            }
          }
        }
      }
    }

    setForm({
      ...form,
      [name]: val,
      ...extraChanges
    })
  }

  const submitForm = async (e) => {
    e.preventDefault()
    setMessage('')
    try {
      if (form.isLoan && form.loanAction === 'create') {
        // Step 1: Create the new loan ledger with integrated initial transaction setup
        await addLoan({
          title: form.title,
          type: form.type === 'income' ? 'borrowed' : 'lent',
          mainCategory: form.loanMainCategory,
          subCategory: form.loanSubCategory,
          lenderName: form.loanLenderName,
          totalAmount: Number(form.amount),
          interestRate: Number(form.loanInterestRate) || 0,
          emiAmount: Number(form.loanEmiAmount) || 0,
          startDate: form.transactionDate,
          endDate: form.loanEndDate || undefined,
          accountId: form.accountId || undefined,
          
          processingFee: Number(form.loanProcessingFee) || 0,
          totalInstallments: Number(form.loanTotalInstallments) || 12,
          firstEmiDate: form.loanFirstEmiDate,
          paymentFrequency: form.loanPaymentFrequency || 'monthly',
          reminder7Days: form.loanReminder7Days !== false,
          reminder3Days: form.loanReminder3Days !== false,
          reminder1Day: form.loanReminder1Day !== false,
          reminderDueDate: form.loanReminderDueDate !== false,
          reminderDailyOverdue: form.loanReminderDailyOverdue !== false
        })
        
        setShowForm(false)
        dispatch(fetchTransactions(query))
        fetchLoansAndAccounts()
        setMessage('Loan ledger created and transaction recorded successfully.')
      } else {
        // Standard save (normal transaction or linking existing loan)
        const payload = {
          ...form,
          loanId: (form.isLoan && form.loanAction === 'link') ? form.loanId : undefined
        }
        await dispatch(saveTransaction({ id: editingId, data: payload })).unwrap()
        setShowForm(false)
        dispatch(fetchTransactions(query))
        fetchLoansAndAccounts()
        setMessage(editingId ? 'Transaction updated successfully.' : 'Transaction created successfully.')
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err || 'Failed to save transaction')
    }
  }

  const deleteItem = async (item) => {
    if (window.confirm(`Are you sure you want to delete "${item.title}"?`)) {
      try {
        await dispatch(removeTransactionById(item._id)).unwrap()
        dispatch(fetchTransactions(query))
        fetchLoansAndAccounts()
        setMessage('Transaction deleted successfully.')
      } catch (err) {
        setMessage(err || 'Failed to delete transaction')
      }
    }
  }

  const handlePageChange = (newPage) => {
    setFilters({
      ...filters,
      page: newPage
    })
  }

  // Active loans computations
  const activeBorrowedLoans = loans.filter(l => l.type === 'borrowed' && l.status === 'active')
  const activeLentLoans = loans.filter(l => l.type === 'lent' && l.status === 'active')

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 w-full max-w-full overflow-hidden">
      {/* Page Title */}
      {activeSubTab === 'transactions' && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">
              {t('transactions')}
            </h2>
            <p className="text-slate-400 dark:text-dark-text-muted text-sm mt-0.5">
              Manage details of your cash flows, repayments, and liabilities.
            </p>
          </div>
          {activeSubTab === 'transactions' && (
            <button
              id="add-transaction-btn-tour"
              onClick={openCreate}
              className="flex items-center justify-center gap-2 rounded-xl bg-secondary dark:bg-purple-650 px-4 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 shadow-md transition-all w-fit cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              {t('addTransaction')}
            </button>
          )}
        </div>
      )}

      {/* Tabs Bar */}
      <div className="flex border-b border-slate-200 dark:border-dark-border w-full overflow-x-auto scrollbar-none">
        <div className="flex w-full md:w-auto">
          <button
            onClick={() => handleTabChange('transactions')}
            className={`pb-3.5 px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold border-b-[3px] transition-all cursor-pointer flex-1 md:flex-initial text-center whitespace-nowrap ${
              activeSubTab === 'transactions'
                ? 'border-secondary text-secondary dark:border-purple-400 dark:text-purple-400 font-black'
                : 'border-transparent text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Transactions
          </button>
          <button
            onClick={() => handleTabChange('loans')}
            className={`pb-3.5 px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold border-b-[3px] transition-all cursor-pointer flex-1 md:flex-initial text-center whitespace-nowrap ${
              activeSubTab === 'loans'
                ? 'border-secondary text-secondary dark:border-purple-400 dark:text-purple-400 font-black'
                : 'border-transparent text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Loans / EMIs
          </button>
          <button
            onClick={() => handleTabChange('investments')}
            className={`pb-3.5 px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold border-b-[3px] transition-all cursor-pointer flex-1 md:flex-initial text-center whitespace-nowrap ${
              activeSubTab === 'investments'
                ? 'border-secondary text-secondary dark:border-purple-400 dark:text-purple-400 font-black'
                : 'border-transparent text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Investments
          </button>
          <button
            onClick={() => handleTabChange('insurance')}
            className={`pb-3.5 px-4 sm:px-8 text-sm sm:text-base md:text-lg font-bold border-b-[3px] transition-all cursor-pointer flex-1 md:flex-initial text-center whitespace-nowrap ${
              activeSubTab === 'insurance'
                ? 'border-secondary text-secondary dark:border-purple-400 dark:text-purple-400 font-black'
                : 'border-transparent text-slate-550 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Insurance
          </button>
        </div>
      </div>

      {activeSubTab === 'loans' ? (
        <Loans />
      ) : activeSubTab === 'investments' ? (
        <Investments />
      ) : activeSubTab === 'insurance' ? (
        <Insurance />
      ) : (
        /* Main Two-Column Layout */
        <div className="grid gap-6 lg:grid-cols-4">
        
        {/* Left Side: Transactions List */}
        <div className="lg:col-span-3 space-y-6">
          
          {/* Filters Form Block */}
          <section id="transactions-filter-tour" className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 shadow-premium">
            <div className="grid gap-3 grid-cols-2 sm:grid-cols-3 md:grid-cols-5">
              <div className="relative col-span-2 sm:col-span-1">
                <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500" />
                <input
                  type="text"
                  name="search"
                  placeholder={t('searchPlaceholder')}
                  value={filters.search}
                  onChange={handleFilterChange}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 pl-9 pr-3 py-2 text-sm focus:outline-none"
                />
              </div>
              <select
                name="type"
                value={filters.type}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none cursor-pointer"
              >
                <option value="">{t('allTypes')}</option>
                <option value="income">{t('income')}</option>
                <option value="expense">{t('expense')}</option>
              </select>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none cursor-pointer"
              >
                <option value="">{t('allCategories')}</option>
                {allCategories.filter(c => c !== 'Add Custom Category...').map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <select
                name="sort"
                value={filters.sort}
                onChange={handleFilterChange}
                className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 px-3 py-2 text-sm focus:outline-none cursor-pointer"
              >
                <option value="latest">Latest</option>
                <option value="oldest">Oldest</option>
                <option value="amount_desc">Amount: High to Low</option>
                <option value="amount_asc">Amount: Low to High</option>
              </select>
              <button
                onClick={handleResetFilters}
                className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-sm font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiRefreshCw className="w-3.5 h-3.5" />
                {t('resetFilters')}
              </button>
            </div>
            {filters.loanId && (
              <div className="mt-3 flex items-center justify-between bg-amber-500/5 border border-amber-500/10 px-3 py-2 rounded-xl text-xs text-amber-700 dark:text-amber-400">
                <div className="flex items-center gap-1.5 font-semibold">
                  <FiInfo className="w-4 h-4" />
                  {t('showingOnlyLinked')} <span className="underline">{loans.find(l => l._id === filters.loanId)?.title}</span>
                </div>
                <button
                  onClick={() => setFilters({ ...filters, loanId: '' })}
                  className="font-bold hover:underline cursor-pointer"
                >
                  {t('clearLoanFilter')}
                </button>
              </div>
            )}
          </section>

          {/* Messages Banner */}
          {message && (
            <div className={`rounded-xl border p-4 text-sm ${
              message.includes('failed') || message.includes('Failed')
                ? 'border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/5 text-rose-700 dark:text-rose-400'
                : 'border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/50 dark:bg-emerald-950/5 text-emerald-700 dark:text-emerald-400'
            }`}>
              {message}
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/5 p-4 text-sm text-rose-700 dark:text-rose-400">
              {error}
            </div>
          )}

          {/* Transactions Table Section */}
          <section id="transactions-table-tour" className="hidden md:block overflow-hidden rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card shadow-premium">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px] text-left text-sm">
                <thead className="bg-slate-50/80 dark:bg-slate-900/40 text-slate-500 dark:text-dark-text-muted font-bold uppercase text-xs border-b border-slate-100 dark:border-dark-border">
                  <tr>
                    <th className="px-6 py-4">{t('titleDesc')}</th>
                    <th className="px-6 py-4">{t('type')}</th>
                    <th className="px-6 py-4">{t('category')}</th>
                    <th className="px-6 py-4">{t('account')}</th>
                    <th className="px-6 py-4">{t('date')}</th>
                    <th className="px-6 py-4">{t('method')}</th>
                    <th className="px-6 py-4">{t('amount')}</th>
                    <th className="px-6 py-4 text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-dark-border text-slate-700 dark:text-slate-350">
                  {loading ? (
                    <tr>
                      <td colSpan="8" className="px-6 py-8 text-center text-slate-400">
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-secondary dark:border-purple-400"></div>
                          Loading entries...
                        </div>
                      </td>
                    </tr>
                  ) : transactions.length > 0 ? (
                    transactions.map((item) => (
                      <tr key={item._id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10 transition-colors">
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-bold text-slate-800 dark:text-white flex items-center gap-1.5">
                              {item.title}
                              {item.isOfflinePending && (
                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-bold rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                  ⚡ Pending Sync
                                </span>
                              )}
                            </p>
                            {item.loanId && (
                              <div className="mt-1">
                                <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-950/10">
                                  Linked: {item.loanId.title || 'Loan'}
                                </span>
                              </div>
                            )}
                            {item.description && (
                              <p className="text-xs text-slate-400 dark:text-dark-text-muted mt-0.5 max-w-[200px] truncate">{item.description}</p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wider ${
                            item.type === 'income'
                              ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                              : item.type === 'expense'
                                ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                                : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                          }`}>
                            {item.type}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-medium text-slate-600 dark:text-slate-400">{item.category}</td>
                        <td className="px-6 py-4 text-slate-550 dark:text-slate-400">
                          {item.accountId?.name || 'Cash'}
                        </td>
                        <td className="px-6 py-4 text-slate-500 dark:text-slate-400">{formatDate(item.transactionDate)}</td>
                        <td className="px-6 py-4 font-medium text-xs text-slate-550 dark:text-slate-400 capitalize">
                          {item.paymentMethod.replace('_', ' ')}
                        </td>
                        <td className={`px-6 py-4 font-extrabold ${
                          item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-3">
                            <button
                              onClick={() => openEdit(item)}
                              className="p-1 text-slate-400 hover:text-secondary dark:hover:text-purple-400 rounded transition-colors cursor-pointer"
                              title="Edit"
                            >
                              <FiEdit2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteItem(item)}
                              className="p-1 text-slate-400 hover:text-red-500 dark:hover:text-rose-450 rounded transition-colors cursor-pointer"
                              title="Delete"
                            >
                              <FiTrash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center text-slate-400 dark:text-slate-500 font-medium">
                        No transactions found matching your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border px-6 py-4 text-sm bg-slate-50/50 dark:bg-dark-card text-slate-500 dark:text-dark-text-muted">
              <p className="font-medium">
                Page {pagination.page} of {pagination.pages || 1} <span className="text-slate-400 dark:text-slate-500">({pagination.total} records)</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-600 dark:text-slate-350 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <FiChevronLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="flex items-center justify-center p-2 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-600 dark:text-slate-350 disabled:opacity-40 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shadow-sm cursor-pointer"
                >
                  <FiChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </section>

          {/* Mobile Card List (Hidden on desktop) */}
          <div className="block md:hidden space-y-4">
            {loading ? (
              <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-8 text-center rounded-2xl text-slate-400">
                <div className="flex items-center justify-center gap-2 text-sm">
                  <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-secondary dark:border-purple-400"></div>
                  Loading entries...
                </div>
              </div>
            ) : transactions.length > 0 ? (
              transactions.map((item) => (
                <div key={item._id} className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-4 rounded-2xl shadow-sm space-y-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-sm leading-snug flex items-center gap-1.5">
                        {item.title}
                        {item.isOfflinePending && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                            ⚡ Offline
                          </span>
                        )}
                      </h4>
                      {item.loanId && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold rounded bg-amber-50 dark:bg-amber-950/20 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-950/10 mt-1">
                          Linked: {item.loanId.title || 'Loan'}
                        </span>
                      )}
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      item.type === 'income'
                        ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400'
                        : item.type === 'expense'
                          ? 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400'
                          : 'bg-blue-50 dark:bg-blue-950/20 text-blue-700 dark:text-blue-400'
                    }`}>
                      {item.type}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-xs text-slate-500 dark:text-slate-400">
                    <span>{item.category} • {item.accountId?.name || 'Cash'}</span>
                    <span>{formatDate(item.transactionDate)}</span>
                  </div>
                  
                  <div className="flex justify-between items-center pt-2 border-t border-slate-50 dark:border-dark-border/40">
                    <span className="text-[10px] text-slate-400 capitalize font-semibold">{item.paymentMethod.replace('_', ' ')}</span>
                    <div className="flex items-center gap-3">
                      <span className={`font-black text-sm ${
                        item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEdit(item)}
                          className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-secondary dark:hover:text-purple-400 rounded-lg border border-slate-100 dark:border-dark-border cursor-pointer"
                        >
                          <FiEdit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => deleteItem(item)}
                          className="p-1.5 bg-slate-50 dark:bg-slate-800 text-slate-500 hover:text-red-500 rounded-lg border border-slate-100 dark:border-dark-border cursor-pointer"
                        >
                          <FiTrash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border p-8 text-center rounded-2xl text-slate-450 font-medium text-xs">
                No transactions found matching your criteria.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Active Loans Side Panel */}
        <div className="lg:col-span-1 space-y-6">
          <section id="active-loans-sidebar-tour" className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-premium space-y-6 h-fit">
            <div className="border-b border-slate-100 dark:border-dark-border pb-3 flex items-center justify-between">
              <h3 className="font-extrabold text-slate-800 dark:text-white text-base">{t('activeLoans')}</h3>
              <FiPercent className="w-4.5 h-4.5 text-indigo-500 dark:text-purple-400" />
            </div>

            {loansLoading ? (
              <div className="text-center py-6 text-slate-400 text-xs">Loading ledger...</div>
            ) : loans.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs leading-normal">
                <p>{t('noLoansFound')}</p>
                <button
                  onClick={openCreate}
                  className="mt-2 text-indigo-650 dark:text-purple-400 hover:underline font-bold cursor-pointer"
                >
                  {t('createInsideTx')}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {/* Borrowed Loans */}
                {activeBorrowedLoans.length > 0 && (
                  <div className="space-y-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('owedTaken')}</span>
                    {activeBorrowedLoans.map((loan) => {
                      const pct = Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100)
                      const isFiltered = filters.loanId === loan._id
                      
                      return (
                        <div
                          key={loan._id}
                          onClick={() => handleSelectLoanFilter(loan._id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isFiltered
                              ? 'border-rose-300 bg-rose-50/10 dark:border-rose-900/40 dark:bg-rose-950/5'
                              : 'border-slate-100 hover:border-slate-200 dark:border-dark-border dark:hover:border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="font-bold text-slate-700 dark:text-slate-200 line-clamp-1 block">{loan.title}</span>
                              <span className="text-[10px] text-slate-400 capitalize block">{loan.lenderName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditLoan(loan)
                                }}
                                className="p-1 text-slate-400 hover:text-secondary dark:hover:text-purple-400 rounded transition-colors cursor-pointer"
                                title="Edit Loan"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteLoan(loan._id)
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                                title="Delete Loan"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 font-extrabold text-slate-800 dark:text-white">
                            <span>{formatCurrency(loan.remainingAmount)}</span>
                            <span className="text-[10px] text-slate-400">EMI: {loan.emiAmount > 0 ? formatCurrency(loan.emiAmount) : 'N/A'}</span>
                          </div>
                          {loan.endDate && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-dark-text-muted font-semibold mt-1">
                              <FiCalendar className="w-3 h-3 text-indigo-500 dark:text-purple-400" />
                              <span>{t('endsOn')}: {formatDate(loan.endDate)}</span>
                            </div>
                          )}
                          <div className="w-full h-1 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden mt-1.5">
                            <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Lent Loans */}
                {activeLentLoans.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('collectLent')}</span>
                    {activeLentLoans.map((loan) => {
                      const pct = Math.round(((loan.totalAmount - loan.remainingAmount) / loan.totalAmount) * 100)
                      const isFiltered = filters.loanId === loan._id

                      return (
                        <div
                          key={loan._id}
                          onClick={() => handleSelectLoanFilter(loan._id)}
                          className={`p-3 rounded-xl border text-xs cursor-pointer transition-all ${
                            isFiltered
                              ? 'border-emerald-350 bg-emerald-50/10 dark:border-emerald-900/40 dark:bg-emerald-950/5'
                              : 'border-slate-100 hover:border-slate-200 dark:border-dark-border dark:hover:border-slate-800'
                          }`}
                        >
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-2">
                              <span className="font-bold text-slate-700 dark:text-slate-200 line-clamp-1 block">{loan.title}</span>
                              <span className="text-[10px] text-slate-400 capitalize block">{loan.lenderName}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleEditLoan(loan)
                                }}
                                className="p-1 text-slate-400 hover:text-secondary dark:hover:text-purple-400 rounded transition-colors cursor-pointer"
                                title="Edit Loan"
                              >
                                <FiEdit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleDeleteLoan(loan._id)
                                }}
                                className="p-1 text-slate-400 hover:text-red-500 rounded transition-colors cursor-pointer"
                                title="Delete Loan"
                              >
                                <FiTrash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                          <div className="flex justify-between mt-2 font-extrabold text-slate-800 dark:text-white">
                            <span>{formatCurrency(loan.remainingAmount)}</span>
                            <span className="text-[10px] text-slate-400 font-medium">Repay: {loan.emiAmount > 0 ? formatCurrency(loan.emiAmount) : 'N/A'}</span>
                          </div>
                          {loan.endDate && (
                            <div className="flex items-center gap-1 text-[9px] text-slate-400 dark:text-dark-text-muted font-semibold mt-1">
                              <FiCalendar className="w-3 h-3 text-emerald-500 dark:text-emerald-400" />
                              <span>{t('endsOn')}: {formatDate(loan.endDate)}</span>
                            </div>
                          )}
                          <div className="w-full h-1 bg-slate-100 dark:bg-dark-border rounded-full overflow-hidden mt-1.5">
                            <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}

                {/* Amortization Calendar Widget */}
                <div id="due-date-calendar-tour" className="border-t border-slate-100 dark:border-dark-border pt-4 mt-4 space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">{t('dueDateCalendar')}</span>
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          const prev = new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1)
                          setCurrentMonth(prev)
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                        type="button"
                      >
                        <FiChevronLeft className="w-3.5 h-3.5" />
                      </button>
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-355 min-w-[70px] text-center capitalize">
                        {currentMonth.toLocaleDateString('default', { month: 'short', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => {
                          const next = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1)
                          setCurrentMonth(next)
                        }}
                        className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded text-slate-500 hover:text-slate-700 dark:text-slate-400 cursor-pointer"
                        type="button"
                      >
                        <FiChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-slate-400">
                    <div>S</div><div>M</div><div>T</div><div>W</div><div>T</div><div>F</div><div>S</div>
                  </div>

                  <div className="grid grid-cols-7 gap-1 text-center">
                    {getDaysInMonth(currentMonth).map((day, idx) => {
                      if (!day) return <div key={`empty-${idx}`} className="h-6" />

                      const loansEnding = getLoansEndingOnDate(day)
                      const hasBorrowed = loansEnding.some(l => l.type === 'borrowed')
                      const hasLent = loansEnding.some(l => l.type === 'lent')
                      
                      let bgClass = 'hover:bg-slate-50 dark:hover:bg-slate-800/40 rounded-full'
                      let textClass = 'text-slate-700 dark:text-slate-300'
                      let titleStr = `No loans ending on this date.`
                      
                      if (loansEnding.length > 0) {
                        titleStr = `Due: ${loansEnding.map(l => `${l.title} (${l.type === 'borrowed' ? 'Owed' : 'Lent'}: ${formatCurrency(l.remainingAmount)})`).join(', ')}`
                        if (hasBorrowed && hasLent) {
                          bgClass = 'bg-indigo-500 text-white rounded-full font-black'
                          textClass = 'text-white'
                        } else if (hasBorrowed) {
                          bgClass = 'bg-rose-500 text-white rounded-full font-black shadow-sm'
                          textClass = 'text-white'
                        } else {
                          bgClass = 'bg-emerald-500 text-white rounded-full font-black shadow-sm'
                          textClass = 'text-white'
                        }
                      }

                      const isToday = new Date().toDateString() === day.toDateString()
                      const todayClass = isToday && loansEnding.length === 0 ? 'border border-indigo-500 rounded-full font-bold' : ''

                      return (
                        <div
                          key={`day-${day.getDate()}`}
                          title={titleStr}
                          onClick={() => {
                            if (loansEnding.length > 0) {
                              handleSelectLoanFilter(loansEnding[0]._id)
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
                  <div className="flex gap-3 justify-center text-[9px] text-slate-400 font-bold pt-1">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full" />
                      {t('repayDue')}
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                      {t('collectDue')}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </section>
        </div>
      </div>
      )}

      {/* Creation/Editing Dialog Overlay */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-dark-border max-h-[95vh] overflow-y-auto">
            <header className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-dark-card/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingId ? t('editTransaction') : t('newTransaction')}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-white font-bold p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-lg cursor-pointer"
              >
                &times;
              </button>
            </header>

            <form onSubmit={submitForm} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('typeLabel')}</label>
                  <select
                    name="type"
                    value={form.type}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="expense">{t('expense')}</option>
                    <option value="income">{t('income')}</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('amountLabel')}</label>
                  <input
                    type="number"
                    name="amount"
                    min="0.01"
                    step="any"
                    value={form.amount}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('titleLabel')}</label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleFormChange}
                  placeholder="e.g. Monthly Salary, Grocery run"
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('accountLabel')}</label>
                  <select
                    name="accountId"
                    value={form.accountId}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                    required
                  >
                    {accounts.map((acc) => (
                      <option key={acc._id || acc.id} value={acc._id || acc.id}>
                        {acc.name} ({acc.type === 'cash' ? 'Cash' : 'Bank'}) - {formatCurrency(acc.balance)}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('paymentMethod')}</label>
                  <select
                    name="paymentMethod"
                    value={form.paymentMethod}
                    onChange={handleFormChange}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none capitalize cursor-pointer"
                  >
                    {paymentMethods.map((p) => (
                      <option key={p} value={p}>{p.replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('category')}</label>
                  <select
                    name="category"
                    value={isCustomCategory ? 'Add Custom Category...' : form.category}
                    onChange={(e) => {
                      const val = e.target.value
                      if (val === 'Add Custom Category...') {
                        setIsCustomCategory(true)
                        setNewCategoryInput('')
                        setForm(prev => ({ ...prev, category: '' }))
                      } else {
                        setIsCustomCategory(false)
                        setForm(prev => ({ ...prev, category: val }))
                      }
                    }}
                    disabled={form.isLoan}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-60 cursor-pointer"
                  >
                    {allCategories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>

                  {isCustomCategory && (
                    <div className="mt-2.5 flex gap-2">
                      <input
                        type="text"
                        placeholder="New category name"
                        value={newCategoryInput}
                        onChange={(e) => setNewCategoryInput(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const cleanVal = newCategoryInput.trim()
                          if (!cleanVal) return
                          
                          // Capitalize first letter
                          const formattedVal = cleanVal.charAt(0).toUpperCase() + cleanVal.slice(1)
                          
                          if (!allCategories.includes(formattedVal)) {
                            const updated = [...customCategories, formattedVal]
                            setCustomCategories(updated)
                            localStorage.setItem('xpenz_custom_categories', JSON.stringify(updated))
                          }
                          
                          setForm(prev => ({ ...prev, category: formattedVal }))
                          setIsCustomCategory(false)
                          setNewCategoryInput('')
                        }}
                        className="rounded-xl bg-secondary dark:bg-purple-650 px-4 py-2 text-xs font-bold text-white hover:opacity-90 cursor-pointer"
                      >
                        Add
                      </button>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('transactionDate')}</label>
                  <div className="relative">
                    <FiCalendar className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    <input
                      type="date"
                      name="transactionDate"
                      value={form.transactionDate}
                      onChange={handleFormChange}
                      className="w-full rounded-xl border border-slate-200 dark:border-dark-border pr-10 pl-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* INTEGRATED LOANS & DEBTS CONFIGURATION */}
              <div className="bg-slate-50 dark:bg-slate-900/40 p-4 rounded-2xl border border-slate-100 dark:border-dark-border space-y-3">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    name="isLoan"
                    id="isLoan"
                    checked={form.isLoan}
                    onChange={handleFormChange}
                    className="rounded text-secondary focus:ring-secondary w-4 h-4 cursor-pointer"
                  />
                  <label htmlFor="isLoan" className="text-xs font-extrabold text-slate-700 dark:text-slate-200 uppercase cursor-pointer">
                    Link to Loan / EMI Payment
                  </label>
                </div>

                {form.isLoan && (
                  <div className="space-y-3 pt-2 border-t border-slate-200/50 dark:border-dark-border">
                    <div className="flex flex-col gap-1">
                      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{t('selectActiveLoan')}</label>
                      {loans.length === 0 ? (
                        <span className="text-xs text-rose-500 font-semibold block mt-1">No active loan ledgers found.</span>
                      ) : (
                        <select
                          name="loanId"
                          value={form.loanId}
                          onChange={handleFormChange}
                          className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                          required
                        >
                          <option value="">-- Choose active loan --</option>
                          {loans.filter(l => l.status === 'active').map((loan) => (
                            <option key={loan._id} value={loan._id}>
                              {loan.title} ({loan.type === 'borrowed' ? 'Owed' : 'Lent'}: {formatCurrency(loan.remainingAmount)})
                            </option>
                          ))}
                        </select>
                      )}
                      <span className="text-[10px] text-slate-400 dark:text-dark-text-muted mt-1 leading-normal">
                        * Selecting a loan will automatically log this as a repayment installment and update its remaining amount. Category is automatically set to &quot;Bills&quot;.
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('descriptionLabel')}</label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleFormChange}
                  rows="3"
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                />
              </div>

              <footer className="pt-4 border-t border-slate-100 dark:border-dark-border flex justify-end gap-3 bg-slate-50/50 dark:bg-dark-card/50 -mx-6 -mb-6 px-6 py-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                  }}
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-4 py-2.5 text-sm font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-secondary dark:bg-purple-650 px-5 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 transition-colors shadow-md shadow-secondary/15 cursor-pointer"
                >
                  {editingId ? t('saveChanges') : form.isLoan && form.loanAction === 'create' ? t('createLoanAndLog') : t('addTransaction')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
      {/* Edit Loan Modal */}
      {showEditLoan && editingLoan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl shadow-2xl p-6 w-full max-w-md relative">
            <header className="pb-3 border-b border-slate-100 dark:border-dark-border flex justify-between items-center mb-4">
              <h3 className="text-lg font-extrabold text-slate-800 dark:text-white">Edit Loan Details</h3>
              <button
                onClick={() => setShowEditLoan(false)}
                className="text-slate-400 hover:text-slate-650 dark:hover:text-white cursor-pointer"
              >
                ✕
              </button>
            </header>
            
            <form onSubmit={handleSaveLoan} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Loan Title</label>
                <input
                  type="text"
                  value={editingLoan.title}
                  onChange={(e) => setEditingLoan({ ...editingLoan, title: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                  {editingLoan.mainCategory === 'bank' ? 'Bank Name' : 'Person Name'}
                </label>
                <input
                  type="text"
                  value={editingLoan.lenderName}
                  onChange={(e) => setEditingLoan({ ...editingLoan, lenderName: e.target.value })}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Total Amount</label>
                  <input
                    type="number"
                    value={editingLoan.totalAmount}
                    onChange={(e) => setEditingLoan({ ...editingLoan, totalAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remaining Amount</label>
                  <input
                    type="number"
                    value={editingLoan.remainingAmount}
                    onChange={(e) => setEditingLoan({ ...editingLoan, remainingAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Interest Rate (%)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={editingLoan.interestRate}
                    onChange={(e) => setEditingLoan({ ...editingLoan, interestRate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">EMI Amount</label>
                  <input
                    type="number"
                    value={editingLoan.emiAmount}
                    onChange={(e) => setEditingLoan({ ...editingLoan, emiAmount: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">End Date</label>
                  <input
                    type="date"
                    value={editingLoan.endDate}
                    onChange={(e) => setEditingLoan({ ...editingLoan, endDate: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={editingLoan.status}
                    onChange={(e) => setEditingLoan({ ...editingLoan, status: e.target.value })}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    <option value="active">Active</option>
                    <option value="paid">Paid / Settled</option>
                  </select>
                </div>
              </div>

              <footer className="pt-4 border-t border-slate-100 dark:border-dark-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowEditLoan(false)}
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-4 py-2 text-sm font-bold text-slate-600 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-gradient-to-r from-secondary to-indigo-650 dark:from-purple-650 dark:to-indigo-650 text-white px-5 py-2 text-sm font-bold hover:shadow-lg hover:brightness-105 transition-all cursor-pointer"
                >
                  Save Loan
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Transactions