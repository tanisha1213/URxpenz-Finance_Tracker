import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Area,
  AreaChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend
} from 'recharts'
import SummaryCard from '../components/dashboard/SummaryCard'
import { getDashboardSummary } from '../services/dashboardService'
import { saveTransaction } from '../redux/slices/transactionSlice'
import { formatCurrency, formatDate, categories, paymentMethods } from '../utils/format'
import { FiArrowUpRight, FiArrowDownRight, FiDollarSign, FiActivity, FiTrendingUp, FiPlus, FiCheck, FiCalendar } from 'react-icons/fi'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { getLoans, addLoan } from '../services/loanService'

const COLORS = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4']

const emptyForm = {
  type: 'expense',
  title: '',
  amount: '',
  category: 'Food',
  paymentMethod: 'upi',
  accountId: '', // Explicit account association
  toAccountId: '', // for transfers
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

const checklistTranslations = {
  en: {
    setupGuide: 'Setup checklist',
    setupGuideSubtitle: 'Recommended initial steps to configure your personal ledger:',
    step1Budget: '1. Set up monthly budget',
    step1BudgetDesc: 'Define spending limits and target savings before recording expenses.',
    step2Accounts: '2. Configure accounts & balances',
    step2AccountsDesc: 'Set starting balances for cash and bank accounts.',
    step3Tx: '3. Log your first transaction',
    step3TxDesc: 'Record an income or expense entry to populate your ledgers.',
    goToBudget: 'Set budget',
    goToAccounts: 'Set balances',
    addFirstTx: 'Add entry',
    dismissGuide: 'Hide checklist',
    setupComplete: 'Setup complete. You are ready to manage your accounts.',
  },
  hi: {
    setupGuide: '🚀 त्वरित शुरुआत चेकलिस्ट',
    setupGuideSubtitle: 'अपने वित्त कार्यक्षेत्र को सेट करने के लिए इन अनुशंसित चरणों का पालन करें:',
    step1Budget: '1. मासिक बजट सेट करें (यह पहले करें!)',
    step1BudgetDesc: 'खर्चों को रिकॉर्ड करने से पहले अपनी खर्च सीमा और लक्षित बचत की योजना बनाएं।',
    step2Accounts: '2. खातों और प्रारंभिक शेष राशि को कॉन्फ़िगर करें',
    step2AccountsDesc: 'सही कुल राशि दर्शाने के लिए नकद और बैंक खातों के लिए प्रारंभिक शेष राशि सेट करें।',
    step3Tx: '3. अपना पहला लेनदेन दर्ज करें',
    step3TxDesc: 'अपने रीयल-टाइम चार्ट को भरने के लिए आय या व्यय प्रविष्टि रिकॉर्ड करें।',
    goToBudget: 'बजट सेट करें',
    goToAccounts: 'शेष राशि सेट करें',
    addFirstTx: 'लेनदेन जोड़ें',
    dismissGuide: 'चेकलिस्ट छुपाएं',
    setupComplete: '🎉 सेटअप पूरा हुआ! आप अपने वित्त का प्रबंधन करने के लिए तैयार हैं।',
  },
  mr: {
    setupGuide: '🚀 त्वरित सुरुवात चेकलिस्ट',
    setupGuideSubtitle: 'तुमची आर्थिक जागा सेट करण्यासाठी या शिफारस केलेल्या चरणांचे अनुसरण करा:',
    step1Budget: '१. मासिक बजेट सेट करा (हे आधी करा!)',
    step1BudgetDesc: 'खर्च नोंदवण्यापूर्वी तुमच्या खर्चाच्या मर्यादा आणि लक्ष्यित बचतीचे नियोजन करा.',
    step2Accounts: '२. खाती आणि शिल्लक रक्कम कॉन्फ़िगर करा',
    step2AccountsDesc: 'योग्य एकूण रक्कम दर्शवण्यासाठी रोख आणि बँक खात्यांसाठी सुरुवातीची शिल्लक सेट करा.',
    step3Tx: '३. तुमचा पहिला व्यवहार नोंदवा',
    step3TxDesc: 'तुमचे रिअल-टाइम चार्ट अपडेट करण्यासाठी उत्पन्न किंवा खर्चाची नोंद करा.',
    goToBudget: 'बजेट सेट करा',
    goToAccounts: 'शिल्लक सेट करा',
    addFirstTx: 'व्यवहार जोडा',
    dismissGuide: 'चेकलिस्ट लपवा',
    setupComplete: '🎉 सेटअप पूर्ण झाला! तुम्ही तुमचे आर्थिक नियोजन करण्यासाठी सज्ज आहात.',
  },
  ta: {
    setupGuide: '🚀 விரைவு தொடக்க சரிபார்ப்பு பட்டியல்',
    setupGuideSubtitle: 'உங்கள் நிதிப் பகுதியை அமைக்க இந்த பரிந்துரைக்கப்பட்ட வழிமுறைகளைப் பின்பற்றவும்:',
    step1Budget: '1. மாதாந்திர பட்ஜெட்டை அமைக்கவும் (இதை முதலில் செய்யுங்கள்!)',
    step1BudgetDesc: 'செலவுகளைப் பதிவுசெய்வதற்கு முன் உங்கள் செலவு வரம்புகள் மற்றும் இலக்கு சேமிப்புகளைத் திட்டமிடுங்கள்.',
    step2Accounts: '2. கணக்குகள் மற்றும் இருப்புகளை அமைக்கவும்',
    step2AccountsDesc: 'சரியான மொத்தத் தொகையைக் காட்ட ரொக்கம் மற்றும் வங்கிக் கணக்குகளுக்கான இருப்புகளை அமைக்கவும்.',
    step3Tx: '3. உங்கள் முதல் பரிவர்த்தனையைப் பதிவு செய்யவும்',
    step3TxDesc: 'உங்கள் நிகழ்நேர விளக்கப்படங்களைப் புதுப்பிக்க வரவு அல்லது செலவைப் பதிவு செய்யவும்.',
    goToBudget: 'பட்ஜெட் அமை',
    goToAccounts: 'இருப்புகளை அமை',
    addFirstTx: 'பரிவர்த்தனை சேர்',
    dismissGuide: 'பட்டியலை மறை',
    setupComplete: '🎉 அமைவு முடிந்தது! உங்கள் நிதியை நிர்வகிக்க நீங்கள் தயாராக உள்ளீர்கள்.',
  }
}

function Dashboard() {
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const { t, language } = useLanguage()
  const [summary, setSummary] = useState(null)
  
  // Setup Checklist state
  const [dismissedChecklist, setDismissedChecklist] = useState(() => {
    return localStorage.getItem('xpenz_dismissed_checklist') === 'true'
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Quick Add Form States
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [formLoading, setFormLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [loans, setLoans] = useState([])

  const fetchLoans = async () => {
    try {
      const response = await getLoans()
      setLoans(response.data.data)
    } catch (err) {
      console.error('Failed to fetch loans:', err)
    }
  }

  const loadDashboard = () => {
    setLoading(true)
    const cached = localStorage.getItem('xpenz_cached_summary')
    if (cached) {
      try {
        setSummary(JSON.parse(cached))
      } catch (e) {
        console.warn('Failed to parse cached summary:', e)
      }
    }

    getDashboardSummary()
      .then((response) => {
        setSummary(response.data.data)
        localStorage.setItem('xpenz_cached_summary', JSON.stringify(response.data.data))
        setError('')
      })
      .catch((err) => {
        if (!cached) {
          setError(err.response?.data?.message || 'Unable to load dashboard. Please check your internet connection.')
        }
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    loadDashboard()
    fetchLoans()

    const handleSyncComplete = () => {
      loadDashboard()
      fetchLoans()
    }
    window.addEventListener('xpenz-offline-synced', handleSyncComplete)
    return () => window.removeEventListener('xpenz-offline-synced', handleSyncComplete)
  }, [])

  const openCreate = (type = 'expense') => {
    setForm({
      ...emptyForm,
      type,
      accountId: summary?.accounts?.[0]?._id || ''
    })
    setShowForm(true)
    setMessage('')
  }

  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target
    const val = type === 'checkbox' ? checked : value
    
    let extraChanges = {}

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
    setFormLoading(true)
    try {
      if (form.isLoan && form.loanAction === 'create') {
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
        setForm(emptyForm)
        const response = await getDashboardSummary()
        setSummary(response.data.data)
        fetchLoans()
      } else {
        // Standard save (normal transaction or linking existing loan)
        const payload = {
          ...form,
          loanId: (form.isLoan && form.loanAction === 'link') ? form.loanId : undefined
        }
        await dispatch(saveTransaction({ id: null, data: payload })).unwrap()
        setShowForm(false)
        setForm(emptyForm)
        const response = await getDashboardSummary()
        setSummary(response.data.data)
        fetchLoans()
      }
    } catch (err) {
      setMessage(err.response?.data?.message || err || 'Failed to save transaction')
    } finally {
      setFormLoading(false)
    }
  }

  const accounts = summary?.accounts || []
  const editingId = null

  if (loading && !summary) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-secondary"></div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-2xl border border-rose-100 bg-rose-50/50 p-6 text-rose-700 shadow-premium">
        <p className="font-semibold text-lg">Error Loading Dashboard</p>
        <p className="text-sm mt-1">{error}</p>
      </div>
    )
  }

  const trend = summary?.monthlyTrend || []
  const categoriesList = summary?.categoryBreakdown || []
  const incomeExpense = trend.map((item) => ({
    month: item.month,
    Income: item.income,
    Expense: item.expense
  }))

  const isDark = theme === 'dark'
  const gridStroke = isDark ? '#222533' : '#f1f5f9'
  const textStroke = isDark ? '#475569' : '#94a3b8'
  const tooltipStyle = isDark
    ? { backgroundColor: '#13141f', borderRadius: '12px', border: '1px solid #222533', color: '#fff' }
    : { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }
  const tooltipItemStyle = { color: isDark ? '#f8fafc' : '#0f172a' }
  const tooltipLabelStyle = { color: isDark ? '#94a3b8' : '#64748b' }

  const isBudgetDone = Number(summary?.monthlyBudget || 0) > 0
  const isAccountsDone = summary?.totalBalance > 0
  const isTxDone = summary?.recentTransactions?.length > 0
  
  const completedCount = [isBudgetDone, isAccountsDone, isTxDone].filter(Boolean).length
  const progressPct = Math.round((completedCount / 3) * 100)
  const showChecklist = !dismissedChecklist && completedCount < 3
  const checklistLabels = checklistTranslations[language] || checklistTranslations['en']

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      {/* Setup Guide / Checklist Card */}
      {showChecklist && (
        <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-slate-50/50 dark:bg-[#14161f] p-4 sm:p-5 space-y-4">
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-0.5">
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">
                {checklistLabels.setupGuide}
              </h3>
              <p className="text-slate-500 dark:text-slate-400 text-xs">
                {checklistLabels.setupGuideSubtitle}
              </p>
            </div>
            <button
              onClick={() => {
                localStorage.setItem('xpenz_dismissed_checklist', 'true')
                setDismissedChecklist(true)
              }}
              className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 text-xs font-medium px-2.5 py-1 border border-slate-200 dark:border-[#222634] rounded-md cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors shrink-0"
            >
              {checklistLabels.dismissGuide}
            </button>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs font-medium text-slate-500 dark:text-slate-400">
              <span>{t('progress') || 'Progress'}</span>
              <span>{completedCount} / 3 {t('completed') || 'Completed'} ({progressPct}%)</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-indigo-600 rounded-full transition-all duration-300" style={{ width: `${progressPct}%` }}></div>
            </div>
          </div>

          {/* Checklist Items */}
          <div className="grid gap-3 md:grid-cols-3">
            {/* Step 1: Budget */}
            <div className={`p-3.5 rounded-lg border transition-colors ${
              isBudgetDone 
                ? 'border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10' 
                : 'border-slate-200 dark:border-[#222634] bg-white dark:bg-[#191c26]'
            }`}>
              <div className="flex items-start gap-2.5">
                <div className={`p-1 rounded-md shrink-0 ${
                  isBudgetDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}>
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className={`text-xs font-semibold ${isBudgetDone ? 'text-slate-400 dark:text-slate-500 line-through font-normal' : 'text-slate-900 dark:text-white'}`}>
                    {checklistLabels.step1Budget}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {checklistLabels.step1BudgetDesc}
                  </p>
                  {!isBudgetDone && (
                    <Link
                      to="/budget"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors"
                    >
                      {checklistLabels.goToBudget}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Step 2: Accounts */}
            <div className={`p-3.5 rounded-lg border transition-colors ${
              isAccountsDone 
                ? 'border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10' 
                : 'border-slate-200 dark:border-[#222634] bg-white dark:bg-[#191c26]'
            }`}>
              <div className="flex items-start gap-2.5">
                <div className={`p-1 rounded-md shrink-0 ${
                  isAccountsDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}>
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className={`text-xs font-semibold ${isAccountsDone ? 'text-slate-400 dark:text-slate-500 line-through font-normal' : 'text-slate-900 dark:text-white'}`}>
                    {checklistLabels.step2Accounts}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {checklistLabels.step2AccountsDesc}
                  </p>
                  {!isAccountsDone && (
                    <Link
                      to="/balance"
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors"
                    >
                      {checklistLabels.goToAccounts}
                    </Link>
                  )}
                </div>
              </div>
            </div>

            {/* Step 3: Transaction */}
            <div className={`p-3.5 rounded-lg border transition-colors ${
              isTxDone 
                ? 'border-emerald-200 dark:border-emerald-950/40 bg-emerald-50/20 dark:bg-emerald-950/10' 
                : 'border-slate-200 dark:border-[#222634] bg-white dark:bg-[#191c26]'
            }`}>
              <div className="flex items-start gap-2.5">
                <div className={`p-1 rounded-md shrink-0 ${
                  isTxDone ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-950/40' : 'bg-slate-100 text-slate-400 dark:bg-slate-800 dark:text-slate-500'
                }`}>
                  <FiCheck className="w-3.5 h-3.5" />
                </div>
                <div className="space-y-1.5 flex-1 min-w-0">
                  <h4 className={`text-xs font-semibold ${isTxDone ? 'text-slate-400 dark:text-slate-500 line-through font-normal' : 'text-slate-900 dark:text-white'}`}>
                    {checklistLabels.step3Tx}
                  </h4>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400 leading-normal">
                    {checklistLabels.step3TxDesc}
                  </p>
                  {!isTxDone && (
                    <button
                      onClick={() => openCreate('expense')}
                      className="inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded-md text-xs font-medium transition-colors cursor-pointer"
                    >
                      <FiPlus className="w-3.5 h-3.5" />
                      {checklistLabels.addFirstTx}
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Hero Balance Section */}
      <div id="total-balance-card-tour" className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 sm:p-6 flex flex-col justify-between">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400">{t('totalBalance')}</p>
            <div className="flex items-baseline gap-1 mt-1.5">
              <h2 className="text-3xl sm:text-4xl font-bold font-mono text-slate-900 dark:text-white tracking-tight">
                {summary ? formatCurrency(summary.totalBalance).split('.')[0] : '₹0'}
              </h2>
              <span className="text-base sm:text-lg font-mono text-slate-400">
                .{summary ? formatCurrency(summary.totalBalance).split('.')[1] || '00' : '00'}
              </span>
              <span className="ml-2 inline-flex items-center px-1.5 py-0.5 rounded text-[11px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
                INR
              </span>
            </div>
          </div>

          <div className="flex items-center">
            <button
              id="add-transaction-btn-tour"
              onClick={() => openCreate('expense')}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-4 py-2.5 font-semibold text-white text-xs transition-colors cursor-pointer"
            >
              <FiPlus className="w-4 h-4" />
              {t('addTransaction')}
            </button>
          </div>
        </div>
      </div>

      {/* Daily Budget Tracker Banner */}
      {summary && !summary.isDailyBudgetLocked && summary.dailyBudget > 0 && (
        <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-slate-50/50 dark:bg-[#14161f] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-900/40 shrink-0">
              <FiCalendar className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">Today's daily budget</span>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded ${
                  summary.isOverspentToday
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-500/20'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20'
                }`}>
                  {summary.isOverspentToday ? 'Overspent' : 'On track'}
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Daily allowance: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(summary.dailyBudget)}</strong> | Spent today: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(summary.todaySpent || 0)}</strong>
                {summary.isOverspentToday
                  ? ` (Overspent by ${formatCurrency(summary.todaySpent - summary.dailyBudget)})`
                  : ` (Saved ${formatCurrency(summary.todaySaved || 0)} today)`}
              </p>
            </div>
          </div>
          <Link
            to="/budget"
            className="self-start sm:self-center px-3 py-1.5 rounded-lg bg-white dark:bg-[#191c26] border border-slate-200 dark:border-[#2a2f42] text-xs font-medium text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors shrink-0"
          >
            Manage budget
          </Link>
        </div>
      )}

      {/* Summary Stats Grid */}
      {summary && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <SummaryCard
            label={t('totalIncome')}
            value={formatCurrency(summary.totalIncome)}
            icon={FiArrowUpRight}
            tone="green"
          />
          <SummaryCard
            label={t('totalExpense')}
            value={formatCurrency(summary.totalExpense)}
            icon={FiArrowDownRight}
            tone="red"
          />
          <SummaryCard
            label={t('budgetSetup')}
            value={formatCurrency(summary.budgetRemaining)}
            icon={FiActivity}
            tone="blue"
          />
          <SummaryCard
            label={t('netSavings')}
            value={formatCurrency(summary.savings)}
            icon={FiDollarSign}
            tone="slate"
          />
        </div>
      )}

      {/* Analytics Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
        {/* Monthly Trend Chart */}
        <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 sm:p-5 lg:col-span-2 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 mb-4">
            <FiTrendingUp className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm">{t('monthlyTrend')}</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorExpense" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0.0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="month" tickLine={false} stroke={textStroke} fontSize={11} />
                <YAxis tickLine={false} stroke={textStroke} fontSize={11} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value) => [formatCurrency(value), 'Spent']}
                />
                <Area type="monotone" dataKey="expense" stroke="#6366f1" strokeWidth={2} fillOpacity={1} fill="url(#colorExpense)" activeDot={{ r: 5, strokeWidth: 1.5, stroke: '#fff' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Category Share Donut Chart */}
        <section id="category-distribution-chart-tour" className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 sm:p-5 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">{t('spendingByCat')}</h3>
          <div className="h-72 flex items-center justify-center relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={categoriesList} dataKey="amount" nameKey="category" innerRadius={60} outerRadius={90} paddingAngle={2}>
                  {categoriesList.map((entry, index) => (
                    <Cell key={entry.category} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
            {categoriesList.length === 0 && (
              <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-xs">
                No data available
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Comparisons & Recent Listings Grid */}
      <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
        {/* Income vs Expenses Bar Chart */}
        <section id="income-expense-chart-tour" className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 sm:p-5 lg:col-span-2 min-w-0 overflow-hidden">
          <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">{t('incomeVsExpense')}</h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpense} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridStroke} />
                <XAxis dataKey="month" tickLine={false} stroke={textStroke} fontSize={11} />
                <YAxis tickLine={false} stroke={textStroke} fontSize={11} />
                <Tooltip
                  contentStyle={tooltipStyle}
                  itemStyle={tooltipItemStyle}
                  labelStyle={tooltipLabelStyle}
                  formatter={(value) => formatCurrency(value)}
                />
                <Legend iconType="circle" />
                <Bar dataKey="Income" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="Expense" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        {/* Right Side Stack: Upcoming Commitments & Recent Transactions */}
        <div className="space-y-6 lg:col-span-1 min-w-0">
          {/* Upcoming Payments Widget */}
          <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 sm:p-5 overflow-hidden">
            <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3.5 flex items-center gap-2">
              <FiCalendar className="w-4 h-4 text-indigo-500" />
              Upcoming payments
            </h3>
            <div className="space-y-2.5 max-h-[300px] overflow-y-auto pr-1">
              {summary?.upcomingPayments?.length ? (
                summary.upcomingPayments.slice(0, 5).map((pay, index) => {
                  const isLoan = pay.type === 'loan_emi'
                  const isSIP = pay.type === 'investment_sip'
                  
                  return (
                    <div key={`${pay.type}-${pay.id}-${index}`} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#191c26] hover:bg-slate-50 dark:hover:bg-[#1f2330] transition-colors w-full min-w-0 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-semibold shrink-0 ${
                          isLoan 
                            ? 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400' 
                            : isSIP 
                            ? 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400' 
                            : 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400'
                        }`}>
                          {isLoan ? 'EMI' : isSIP ? 'SIP' : 'PRM'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate">{pay.title}</p>
                          <p className="text-[10px] text-slate-400 mt-0.5">
                            Due {formatDate(pay.dueDate)}
                          </p>
                        </div>
                      </div>
                      <p className="font-semibold font-mono text-xs text-slate-800 dark:text-slate-200 shrink-0 ml-1">
                        {formatCurrency(pay.amount)}
                      </p>
                    </div>
                  )
                })
              ) : (
                <div className="py-8 text-center text-slate-400 text-xs">
                  No upcoming payments.
                </div>
              )}
            </div>
          </section>

          {/* Recent Transactions List */}
          <section id="recent-activity-tour" className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 sm:p-5 flex flex-col justify-between overflow-hidden">
            <div>
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-3.5">{t('recentTransactions')}</h3>
              <div className="space-y-2.5">
                {summary?.recentTransactions?.length ? (
                  summary.recentTransactions.map((item) => (
                    <div key={item._id} className="flex items-center justify-between p-2.5 rounded-lg border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#191c26] hover:bg-slate-50 dark:hover:bg-[#1f2330] transition-colors w-full min-w-0 gap-2">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <div className={`p-1.5 rounded-md text-[11px] font-semibold shrink-0 ${
                          item.type === 'income' ? 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400' : 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400'
                        }`}>
                          {item.type === 'income' ? 'IN' : 'EX'}
                        </div>
                        <div className="min-w-0">
                          <p className="font-medium text-slate-800 dark:text-slate-200 text-xs truncate">{item.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">
                            {item.category} • {formatDate(item.transactionDate)}
                          </p>
                        </div>
                      </div>
                      <p className={`font-semibold font-mono text-xs shrink-0 ml-1 ${
                        item.type === 'income' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
                      }`}>
                        {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                      </p>
                    </div>
                  ))
                ) : (
                  <div className="py-12 text-center text-slate-400 dark:text-slate-550 text-sm">
                    No transactions recorded yet.
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      </div>

      {/* Quick Add Overlay Form */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 dark:bg-black/60 backdrop-blur-sm p-4 animate-fadeIn">
          <div className="bg-white dark:bg-dark-card rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 dark:border-dark-border max-h-[95vh] overflow-y-auto">
            <header className="px-6 py-4 border-b border-slate-100 dark:border-dark-border flex justify-between items-center bg-slate-50/50 dark:bg-dark-card/50">
              <h3 className="text-lg font-bold text-slate-800 dark:text-white">
                {editingId ? t('editTransaction') : t('newTransaction')}
              </h3>
              <button
                onClick={() => setShowForm(false)}
                className="text-slate-400 hover:text-slate-655 dark:hover:text-white font-bold p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-lg transition-colors cursor-pointer"
              >
                &times;
              </button>
            </header>

            <form onSubmit={submitForm} className="p-6 space-y-4">
              {message && <div className="rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/10 p-3 text-xs text-rose-700 dark:text-rose-450">{message}</div>}

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-1">{t('category')}</label>
                  <select
                    name="category"
                    value={form.category}
                    onChange={handleFormChange}
                    disabled={form.isLoan}
                    className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none disabled:opacity-60 cursor-pointer"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
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
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-4 py-2.5 text-sm font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                >
                  {t('cancel')}
                </button>
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary dark:bg-purple-650 px-4 py-2.5 text-sm font-bold text-white hover:bg-indigo-700 dark:hover:bg-purple-755 shadow-md disabled:opacity-50 cursor-pointer"
                >
                  <FiCheck className="w-4 h-4" />
                  {formLoading ? 'Saving...' : form.isLoan && form.loanAction === 'create' ? t('createLoanAndLog') : t('addTransaction')}
                </button>
              </footer>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default Dashboard