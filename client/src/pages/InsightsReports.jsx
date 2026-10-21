import { useEffect, useMemo, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { fetchInsights, fetchPrediction } from '../redux/slices/insightSlice'
import { downloadMonthlyReport, getMonthlyReport } from '../services/reportService'
import { formatCurrency } from '../utils/format'
import { governmentSchemes, scholarships } from '../utils/welfareData'
import { 
  FiTrendingUp, 
  FiCpu, 
  FiRefreshCw, 
  FiAlertTriangle, 
  FiCheckCircle, 
  FiDownload, 
  FiCalendar, 
  FiLayers,
  FiUsers,
  FiDollarSign,
  FiActivity,
  FiPercent,
  FiShield
} from 'react-icons/fi'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import API from '../services/api' // To allow posting subsidy receipts directly

function InsightsReports() {
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const isDark = theme === 'dark'
  const [activeTab, setActiveTab] = useState('insights') // 'insights', 'reports', or 'welfare'

  // Insights (AI) Redux Selector
  const { insights, predictions, loading: aiLoading, error: aiError } = useSelector(state => state.insights)

  const safePredictions = useMemo(() => {
    return predictions || null;
  }, [predictions])

  // Reports State
  const now = new Date()
  const [period, setPeriod] = useState({ month: now.getMonth() + 1, year: now.getFullYear() })
  const [periodType, setPeriodType] = useState('monthly') // 'monthly', 'yearly', 'custom'
  const [startDate, setStartDate] = useState(() => {
    return new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  })
  const [endDate, setEndDate] = useState(() => {
    return new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  })

  const [report, setReport] = useState(null)
  const [reportLoading, setReportLoading] = useState(true)
  const [reportError, setReportError] = useState('')

  const reportParams = useMemo(() => {
    if (periodType === 'custom') {
      return { startDate, endDate }
    } else if (periodType === 'yearly') {
      return { type: 'yearly', year: period.year }
    } else {
      return { month: period.month, year: period.year }
    }
  }, [periodType, period, startDate, endDate])

  // Welfare & AI Coach Interactive States
  const [schemeAge, setSchemeAge] = useState(25)
  const [schemeGender, setSchemeGender] = useState('any')
  const [schemeIncome, setSchemeIncome] = useState(300000)
  const [schemeCategory, setSchemeCategory] = useState('any')
  const [subsidyMessage, setSubsidyMessage] = useState('')
  const [subsidyAmt, setSubsidyAmt] = useState(2000)
  const [subsidyName, setSubsidyName] = useState('PM Kisan')

  const [pensionAge, setPensionAge] = useState(25)
  const [pensionTarget, setPensionTarget] = useState(3000) // target payout

  const [loanAmount, setLoanAmount] = useState(500000)
  const [loanInterest, setLoanInterest] = useState(9.5)
  const [loanTenure, setLoanTenure] = useState(5)

  const [chatQuestion, setChatQuestion] = useState('')
  const [chatResponse, setChatResponse] = useState('')
  const [chatLoading, setChatLoading] = useState(false)

  // Fetch AI insights
  useEffect(() => {
    if (activeTab === 'insights' || activeTab === 'welfare') {
      dispatch(fetchInsights())
      dispatch(fetchPrediction())
    }
  }, [dispatch, activeTab])

  // Fetch monthly report
  useEffect(() => {
    if (activeTab === 'reports') {
      setReportLoading(true)
      getMonthlyReport(reportParams)
        .then((response) => setReport(response.data.data))
        .catch((err) => setReportError(err.response?.data?.message || 'Unable to load report'))
        .finally(() => setReportLoading(false))
    }
  }, [reportParams, activeTab])

  const exportPdf = async () => {
    try {
      const response = await downloadMonthlyReport(reportParams)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      let filename = `finance-report-${period.year}-${String(period.month).padStart(2, '0')}.pdf`
      if (periodType === 'custom') {
        filename = `finance-report-custom-${startDate}-to-${endDate}.pdf`
      } else if (periodType === 'yearly') {
        filename = `finance-report-${period.year}-yearly.pdf`
      }
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      alert('Failed to export PDF statement')
    }
  }
  const logSubsidyReceipt = async (e) => {
    e.preventDefault()
    try {
      setSubsidyMessage('Logging subsidy...')
      await API.post('/transactions', {
        title: `Subsidy: ${subsidyName}`,
        amount: Number(subsidyAmt),
        type: 'income',
        category: 'Subsidy',
        paymentMethod: 'bank',
        transactionDate: new Date().toISOString().slice(0, 10)
      })
      setSubsidyMessage('Success: Subsidy transaction logged successfully!')
      setTimeout(() => setSubsidyMessage(''), 4000)
    } catch (err) {
      setSubsidyMessage('Error: Failed to log subsidy.')
    }
  }

  const askAIFinancialCoach = (questionTopic) => {
    setChatLoading(true)
    setChatQuestion(
      questionTopic === 'retirement' ? 'How should I plan my pension & retirement?' :
      questionTopic === 'savings' ? 'How can I start saving at least 20%?' :
      questionTopic === 'loans' ? 'Am I ready to take a bank loan?' :
      'Where can I reduce spending and find cheaper alternatives?'
    )
    
    setTimeout(() => {
      let ans = ''
      if (questionTopic === 'retirement') {
        ans = `To secure a monthly pension of INR ${pensionTarget.toLocaleString('en-IN')}/month through Atal Pension Yojana (APY) starting at age 60:
• Since you are current age ${pensionAge}, your estimated monthly premium contribution is around INR ${Math.round(pensionTarget * 0.08)}/month.
• Action: We recommend setting up auto-debit on your primary bank account before age 30 to lock in the lowest contribution slabs.`
      } else if (questionTopic === 'savings') {
        ans = `To reach a healthy 20% savings rate:
• Setup an automatic transfer on your salary day to move 20% of income directly into a high-yield savings or fixed deposit account.
• Avoid 'saving what is left after spending'; instead, 'spend what is left after saving'.`
      } else if (questionTopic === 'loans') {
        const emi = Math.round((loanAmount * (loanInterest / 100 / 12) * Math.pow(1 + (loanInterest / 100 / 12), loanTenure * 12)) / (Math.pow(1 + (loanInterest / 100 / 12), loanTenure * 12) - 1))
        const income = safePredictions?.financialInclusion?.totalIncome || 35000
        const ratio = emi / income
        
        ans = `Loan Affordability Analysis:
• Estimated EMI: INR ${emi.toLocaleString('en-IN')}/month.
• Debt-to-Income impact: This EMI consumes ${Math.round(ratio * 100)}% of your estimated monthly income.
• Verdict: ${ratio < 0.3 ? 'Affordable and safe (below 30% threshold).' : 'High Risk! This exceeds 30% of your income. Consider lowering the loan amount or extending the tenure.'}`
      } else {
        const alts = safePredictions?.cashflowForecast?.cheaperAlternatives || []
        ans = `Top Spending Reduction Strategies based on your profile:
${alts.map(a => `• ${a.category}: ${a.suggestion}`).join('\n')}
• Action: Set category limits in your Budget tab to restrict excess outlays.`
      }
      setChatResponse(ans)
      setChatLoading(false)
    }, 800)
  }
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{t('spendingInsights')}</h2>
          <p className="text-slate-400 dark:text-dark-text-muted text-sm mt-0.5">{t('insightsSubtitle')}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-slate-dark p-1 rounded-xl w-fit">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-white dark:bg-dark-card text-secondary dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FiCpu className="w-4 h-4" />
            {t('aiForecast')}
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-dark-card text-secondary dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FiLayers className="w-4 h-4" />
            Monthly Reports
          </button>
          <button
            onClick={() => setActiveTab('welfare')}
            className={`flex items-center gap-2 px-4 py-2 text-sm font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'welfare'
                ? 'bg-white dark:bg-dark-card text-secondary dark:text-purple-400 shadow-sm'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200'
            }`}
          >
            <FiUsers className="w-4 h-4" />
            Welfare & AI Coach
          </button>
        </div>
      </div>

      {/* AI INSIGHTS VIEW */}
      {activeTab === 'insights' && (
        <div className="space-y-6 animate-fadeIn">
          {aiError && <div className="rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/10 p-4 text-sm text-rose-700 dark:text-rose-400">{aiError}</div>}

          <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
            {/* Suggestions Card */}
            <section id="analytics-ai-advice-tour" className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium lg:col-span-2 space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-dark-border pb-4">
                <div className="flex items-center gap-2">
                  <FiCpu className="w-5 h-5 text-secondary dark:text-purple-400" />
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg">AI Financial Advice</h3>
                </div>
                <button
                  onClick={() => { dispatch(fetchInsights()); dispatch(fetchPrediction()) }}
                  className="flex items-center justify-center gap-2 rounded-lg border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-1.5 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                >
                  <FiRefreshCw className="w-3.5 h-3.5" />
                  Refresh
                </button>
              </div>

              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary dark:border-purple-400"></div>
                  Generating AI insights...
                </div>
              ) : (
                <div className="space-y-3">
                  {insights.length ? insights.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-xl border border-indigo-50/30 dark:border-purple-950/20 bg-indigo-50/10 dark:bg-purple-950/5 p-4 text-slate-700 dark:text-slate-300 hover:bg-indigo-50/20 dark:hover:bg-purple-950/10 transition-colors">
                      <FiCheckCircle className="w-5 h-5 text-secondary dark:text-purple-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm font-medium leading-relaxed">{item}</p>
                    </div>
                  )) : (
                    <p className="text-sm text-slate-400 dark:text-slate-500 py-6 text-center">
                      Record more transactions to unlock AI insights recommendations.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Forecast Panel */}
            <section id="analytics-ai-forecast-tour" className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium h-fit space-y-6 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-dark-border">
                <FiTrendingUp className="w-5 h-5 text-secondary dark:text-purple-400" />
                <h3 className="font-bold text-slate-800 dark:text-white text-lg">{t('aiForecast')}</h3>
              </div>

              <div className="space-y-4">
                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Projected Outflows</p>
                  <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">
                    {formatCurrency(safePredictions.predictedExpense || 0)}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Confidence Level</p>
                  <div className="mt-2">
                    <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-dark overflow-hidden">
                      <div
                        className="h-3 rounded-full bg-emerald-500 transition-all duration-500"
                        style={{ width: `${safePredictions.confidence || 0}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs font-bold text-slate-500 mt-1">
                      <span>{safePredictions.confidence || 0}% Accuracy</span>
                      <span className="text-slate-400 dark:text-dark-text-muted">Confidence rate</span>
                    </div>
                  </div>
                </div>

                {safePredictions.budgetRisk && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-amber-100 dark:border-amber-950/30 bg-amber-50/50 dark:bg-amber-950/10 p-4 text-xs font-medium text-amber-800 dark:text-amber-300 leading-relaxed">
                    <FiAlertTriangle className="w-5 h-5 text-warning flex-shrink-0" />
                    Warning: Projected month outflows exceed your global monthly limit. Consider restricting discretionary categories immediately.
                  </div>
                )}

                {safePredictions.financialInclusion && (
                  <div className="border-t border-slate-100 dark:border-dark-border/40 pt-4 space-y-3">
                    <div>
                      <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Financial Inclusion Score</p>
                      <div className="flex justify-between items-baseline mt-1">
                        <span className="text-2xl font-black text-slate-800 dark:text-white">
                          {safePredictions.financialInclusion.score}/100
                        </span>
                        <span className={`text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded-full ${
                          safePredictions.financialInclusion.tier === 'Excellent'
                            ? 'bg-emerald-500/10 text-emerald-500'
                            : safePredictions.financialInclusion.tier === 'Good'
                            ? 'bg-blue-500/10 text-blue-500'
                            : safePredictions.financialInclusion.tier === 'Fair'
                            ? 'bg-amber-500/10 text-amber-500'
                            : 'bg-rose-500/10 text-rose-500'
                        }`}>
                          {safePredictions.financialInclusion.tier} Tier
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                      {safePredictions.financialInclusion.advice.map((item, idx) => (
                        <p key={idx} className="text-[10px] leading-relaxed text-slate-500 dark:text-dark-text-muted font-medium bg-slate-50/40 dark:bg-slate-900/30 p-2 rounded-lg border border-slate-50 dark:border-dark-border/20">
                          • {item}
                        </p>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          </div>
        </div>
      )}

      {/* STATEMENTS & PDF REPORTS VIEW */}
      {activeTab === 'reports' && (
        <div className="space-y-6 animate-fadeIn">
          {reportError && <div className="rounded-xl border border-rose-100 dark:border-rose-950/30 bg-rose-50/50 dark:bg-rose-950/10 p-4 text-sm text-rose-700 dark:text-rose-400">{reportError}</div>}

          {/* Period Filter Card */}
          <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-premium flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <FiCalendar className="text-secondary dark:text-purple-400 w-5 h-5 flex-shrink-0" />
              
              <select
                value={periodType}
                onChange={(e) => setPeriodType(e.target.value)}
                className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="monthly">Monthly</option>
                <option value="yearly">Yearly</option>
                <option value="custom">Custom Range</option>
              </select>

              {periodType === 'monthly' && (
                <div className="flex gap-2">
                  <select
                    value={period.month}
                    onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  >
                    {Array.from({ length: 12 }, (_, index) => (
                      <option key={index + 1} value={index + 1}>
                        {new Date(2024, index, 1).toLocaleString('en-IN', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                  <input
                    type="number"
                    value={period.year}
                    onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
                    className="w-24 rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    placeholder="Year"
                  />
                </div>
              )}

              {periodType === 'yearly' && (
                <input
                  type="number"
                  value={period.year}
                  onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
                  className="w-28 rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  placeholder="Year"
                />
              )}

              {periodType === 'custom' && (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={exportPdf}
              disabled={reportLoading || !report}
              className="flex items-center justify-center gap-2 rounded-xl bg-secondary dark:bg-purple-600 px-4 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-700 transition-colors shadow-md disabled:opacity-50 w-full md:w-auto cursor-pointer"
            >
              <FiDownload className="w-4 h-4" />
              Download Report
            </button>
          </section>

          {reportLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-sm">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-secondary dark:border-purple-400"></div>
              Generating statement report...
            </div>
          )}

          {report && !reportLoading && (
            <>
              {/* Summary Metric Counters */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-premium flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Income</span>
                  <span className="text-2xl font-extrabold text-emerald-600 dark:text-emerald-400 mt-2">{formatCurrency(report.totalIncome)}</span>
                </div>
                <div className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-premium flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Expense</span>
                  <span className="text-2xl font-extrabold text-rose-600 dark:text-rose-455 mt-2">{formatCurrency(report.totalExpense)}</span>
                </div>
                <div className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-premium flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Savings</span>
                  <span className="text-2xl font-extrabold text-slate-800 dark:text-white mt-2">{formatCurrency(report.savings)}</span>
                </div>
                <div className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-5 shadow-premium flex flex-col justify-between">
                  <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Balance Left</span>
                  <span className={`text-2xl font-extrabold mt-2 ${report.savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-450'}`}>{formatCurrency(report.savings)}</span>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
                {/* Category Spend Chart */}
                <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium lg:col-span-2 min-w-0 overflow-hidden">
                  <h3 className="font-bold text-slate-800 dark:text-white text-lg mb-4">Category Analysis</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" className="dark:stroke-dark-border" />
                        <XAxis dataKey="category" tickLine={false} stroke="#94a3b8" fontSize={11} />
                        <YAxis tickLine={false} stroke="#94a3b8" fontSize={11} />
                        <Tooltip
                          contentStyle={isDark
                            ? { backgroundColor: '#13141f', borderRadius: '12px', border: '1px solid #222533', color: '#fff' }
                            : { backgroundColor: '#ffffff', borderRadius: '12px', border: '1px solid #f1f5f9', boxShadow: '0 4px 12px rgba(0, 0, 0, 0.05)' }
                          }
                          itemStyle={{ color: isDark ? '#f8fafc' : '#0f172a' }}
                          labelStyle={{ color: isDark ? '#94a3b8' : '#64748b' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Bar dataKey="amount" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Categorical Breakdown Table */}
                <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium flex flex-col justify-between min-w-0 overflow-hidden">
                  <div className="space-y-4">
                    <h3 className="font-bold text-slate-800 dark:text-white text-lg">Categorical Statement</h3>
                    <div className="max-h-72 overflow-y-auto pr-1">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-slate-400 dark:text-dark-text-muted text-[10px] font-bold uppercase border-b border-slate-100 dark:border-dark-border/40">
                            <th className="pb-2">Category</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-dark-border/40">
                          {report.fullCategoryBreakdown && report.fullCategoryBreakdown.length > 0 ? (
                            report.fullCategoryBreakdown.map((item, idx) => (
                              <tr key={`${item.category}-${item.type}-${idx}`} className="text-slate-700 dark:text-slate-200">
                                <td className="py-2.5 font-bold text-slate-800 dark:text-white truncate max-w-[100px]">{item.category}</td>
                                <td className="py-2.5 capitalize">
                                  <span className={`px-1.5 py-0.5 rounded-full text-[8px] font-extrabold uppercase ${
                                    item.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                  }`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td className={`py-2.5 text-right font-black ${
                                  item.type === 'income' ? 'text-emerald-500' : 'text-rose-505'
                                }`}>
                                  {item.type === 'income' ? '+' : '-'}{formatCurrency(item.amount)}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan="3" className="py-12 text-center text-slate-400 dark:text-slate-500">
                                No categories found.
                              </td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot>
                          <tr className="border-t border-slate-200 dark:border-dark-border font-extrabold text-slate-800 dark:text-white text-xs bg-slate-50/50 dark:bg-slate-900/40">
                            <td className="py-3" colSpan="2">Net Balance</td>
                            <td className={`py-3 text-right font-black ${
                              report.savings >= 0 ? 'text-emerald-500' : 'text-rose-505'
                            }`}>
                              {report.savings >= 0 ? '+' : ''}{formatCurrency(report.savings)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </section>
              </div>
            </>
          )}
        </div>
      )}

      {/* WELFARE & AI COACH VIEW */}
      {activeTab === 'welfare' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Top Row: AI Cashflow Burn Rate & Run-out gauge */}
          <div className="grid gap-6 md:grid-cols-3 w-full overflow-hidden">
            {/* Cashflow Run-out Predictor */}
            <div className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-dark-border">
                <FiActivity className="w-5 h-5 text-secondary dark:text-purple-400" />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Cashflow Burn Rate</h3>
              </div>
              {safePredictions?.cashflowForecast ? (
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-450 dark:text-dark-text-muted">Total Accounts Balance</span>
                    <span className="text-sm font-black text-slate-800 dark:text-white">
                      {formatCurrency(safePredictions.cashflowForecast.totalCashBalance)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-semibold text-slate-450 dark:text-dark-text-muted">Daily Burn Rate</span>
                    <span className="text-sm font-black text-rose-500">
                      {formatCurrency(safePredictions.cashflowForecast.dailySpendRate)}/day
                    </span>
                  </div>
                  <div className="pt-2 border-t border-dashed border-slate-100 dark:border-dark-border/40">
                    <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Month-End Runway</p>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-3xl font-extrabold text-slate-800 dark:text-white">
                        {safePredictions.cashflowForecast.daysOfCashRemaining >= 999 ? '99+' : safePredictions.cashflowForecast.daysOfCashRemaining}
                      </span>
                      <span className="text-xs font-semibold text-slate-400">days left</span>
                    </div>
                  </div>
                  {safePredictions.cashflowForecast.willRunOut ? (
                    <div className="flex items-start gap-2 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-[11px] leading-relaxed text-rose-600 dark:text-rose-400 font-medium">
                      <FiAlertTriangle className="w-4 h-4 text-rose-500 flex-shrink-0 mt-0.5" />
                      Warning: At your current daily burn rate, you will run out of cash before month-end! Consider restricting discretionary expenses immediately.
                    </div>
                  ) : (
                    <div className="flex items-start gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-[11px] leading-relaxed text-emerald-600 dark:text-emerald-400 font-medium">
                      <FiCheckCircle className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                      Safe: Your cash reserves are projected to last past the end of the month.
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-xs text-slate-400 py-6 text-center">{aiLoading ? 'Calculating cashflow burn rate...' : 'Add transactions and accounts to view your live cashflow burn rate.'}</p>
              )}
            </div>

            {/* Spend Reducer & Cheaper Alternatives */}
            <div className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium space-y-4 md:col-span-2 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-dark-border">
                <FiTrendingUp className="w-5 h-5 text-secondary dark:text-purple-400" />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Cheaper Alternatives & Spend Reductions</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto pr-1">
                {safePredictions?.cashflowForecast?.cheaperAlternatives?.length ? (
                  safePredictions.cashflowForecast.cheaperAlternatives.map((alt, idx) => (
                    <div key={idx} className="rounded-xl border border-slate-50 dark:border-dark-border/40 p-3.5 bg-slate-50/20 dark:bg-slate-900/10 space-y-2 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-bold text-slate-800 dark:text-white text-xs truncate max-w-[80px]">{alt.category}</span>
                          <span className="text-[10px] font-black text-rose-500">{formatCurrency(alt.amount)}</span>
                        </div>
                        <p className="text-[10px] leading-relaxed text-slate-450 dark:text-dark-text-muted">{alt.suggestion}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-3 text-xs text-slate-400 py-6 text-center">Log category expenses to unlock cheaper alternative suggestions.</p>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Calculators & Coaching Row */}
          <div className="grid gap-6 md:grid-cols-2 w-full overflow-hidden">
            {/* Pension Eligibility & APY Calculator */}
            <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium space-y-5 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-dark-border">
                <FiShield className="w-5 h-5 text-secondary dark:text-purple-400" />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Atal Pension Yojana (APY) & Pension Eligibility</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Your Current Age</label>
                    <input
                      type="number"
                      min="18"
                      max="40"
                      value={pensionAge}
                      onChange={(e) => setPensionAge(Math.min(40, Math.max(18, Number(e.target.value))))}
                      className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase font-bold">Target Pension Amount</label>
                    <select
                      value={pensionTarget}
                      onChange={(e) => setPensionTarget(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="1000">INR 1,000 / month</option>
                      <option value="2000">INR 2,000 / month</option>
                      <option value="3000">INR 3,000 / month</option>
                      <option value="4000">INR 4,000 / month</option>
                      <option value="5000">INR 5,000 / month</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-xl bg-slate-50/50 dark:bg-slate-900/20 p-4 border border-slate-50 dark:border-dark-border/40 space-y-2">
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-450 dark:text-dark-text-muted">Estimated Premium Contribution</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">
                      {formatCurrency(Math.round(pensionTarget * (0.04 + (pensionAge - 18) * 0.004)))}/month
                    </span>
                  </div>
                  <div className="flex justify-between text-xs font-semibold">
                    <span className="text-slate-450 dark:text-dark-text-muted">Retirement Payout Commences</span>
                    <span className="font-extrabold text-slate-800 dark:text-white">At age 60</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-100 dark:border-dark-border/40">
                    *Note: APY premium depends on entry age. Joining early (e.g. 18 years) requires lower monthly investments compared to joining at age 40.
                  </p>
                </div>
              </div>
            </section>

            {/* Loan Affordability Calculator */}
            <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium space-y-5 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-dark-border">
                <FiPercent className="w-5 h-5 text-secondary dark:text-purple-400" />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Loan Affordability Calculator</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Amount</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-2.5 py-2 text-xs bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={loanInterest}
                      onChange={(e) => setLoanInterest(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-2.5 py-2 text-xs bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-bold text-slate-400 uppercase">Tenure (Yrs)</label>
                    <input
                      type="number"
                      value={loanTenure}
                      onChange={(e) => setLoanTenure(Number(e.target.value))}
                      className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-2.5 py-2 text-xs bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                    />
                  </div>
                </div>

                {(() => {
                  const monthlyRate = (loanInterest / 100) / 12
                  const totalMonths = loanTenure * 12
                  const emi = monthlyRate > 0
                    ? Math.round((loanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / (Math.pow(1 + monthlyRate, totalMonths) - 1))
                    : Math.round(loanAmount / totalMonths)
                  
                  // Estimate user monthly income from analysis or use default 35k
                  const userIncome = (safePredictions?.financialInclusion?.totalIncome) || 35000
                  const dtiRatio = emi / userIncome

                  return (
                    <div className="rounded-xl bg-slate-50/50 dark:bg-slate-900/20 p-4 border border-slate-50 dark:border-dark-border/40 space-y-3">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-450 dark:text-dark-text-muted">Estimated Monthly EMI</span>
                        <span className="font-extrabold text-slate-800 dark:text-white">{formatCurrency(emi)}</span>
                      </div>
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-slate-450 dark:text-dark-text-muted">Debt Burden (DTI)</span>
                        <span className={`font-black ${dtiRatio < 0.3 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {Math.round(dtiRatio * 100)}% of income
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-100 dark:border-dark-border/40">
                        {dtiRatio < 0.3 ? (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-bold">
                            Affordable: This EMI accounts for less than 30% of your income. You can safely manage this debt.
                          </p>
                        ) : (
                          <p className="text-[10px] text-rose-600 dark:text-rose-450 font-bold">
                            High Risk: EMI exceeds 30% of income. Consider increasing tenure or reducing principal amount.
                          </p>
                        )}
                      </div>
                    </div>
                  )
                })()}
              </div>
            </section>
          </div>

          {/* Welfare Schemes Matcher & Subsidy Logger */}
          <div className="grid gap-6 md:grid-cols-2 w-full overflow-hidden">
            {/* Government Schemes & Scholarships Finder */}
            <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium space-y-5 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-dark-border">
                <FiUsers className="w-5 h-5 text-secondary dark:text-purple-400" />
                <h3 className="font-bold text-slate-800 dark:text-white text-base">Eligible Welfare Schemes & Scholarships</h3>
              </div>

              {/* Profile Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/30 dark:bg-slate-900/10 p-3 rounded-xl border border-slate-50 dark:border-dark-border/30">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Age</label>
                  <input
                    type="number"
                    value={schemeAge}
                    onChange={(e) => setSchemeAge(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-dark-border px-2 py-1 text-xs bg-white dark:bg-dark-card text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Gender</label>
                  <select
                    value={schemeGender}
                    onChange={(e) => setSchemeGender(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-dark-border px-2 py-1 text-xs bg-white dark:bg-dark-card text-slate-800"
                  >
                    <option value="any">Any</option>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Income (Annual)</label>
                  <input
                    type="number"
                    value={schemeIncome}
                    onChange={(e) => setSchemeIncome(Number(e.target.value))}
                    className="w-full rounded-lg border border-slate-200 dark:border-dark-border px-2 py-1 text-xs bg-white dark:bg-dark-card text-slate-800"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold text-slate-400 uppercase">Category</label>
                  <select
                    value={schemeCategory}
                    onChange={(e) => setSchemeCategory(e.target.value)}
                    className="w-full rounded-lg border border-slate-200 dark:border-dark-border px-2 py-1 text-xs bg-white dark:bg-dark-card text-slate-800"
                  >
                    <option value="any">Any</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="OBC">OBC</option>
                    <option value="General">General</option>
                  </select>
                </div>
              </div>

              {/* Matched Schemes List */}
              <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1">
                {(() => {
                  const matched = governmentSchemes.filter(s => {
                    const ageOk = schemeAge >= s.minAge && schemeAge <= s.maxAge
                    const genOk = s.gender === 'any' || schemeGender === 'any' || s.gender.toLowerCase() === schemeGender.toLowerCase()
                    const incOk = schemeIncome <= s.maxIncome
                    const catOk = s.category === 'any' || schemeCategory === 'any' || s.category.toLowerCase().includes(schemeCategory.toLowerCase())
                    return ageOk && genOk && incOk && catOk
                  })

                  const matchedSchol = scholarships.filter(s => {
                    const incOk = schemeIncome <= s.maxIncome
                    const catOk = s.category === 'any' || schemeCategory === 'any' || s.category.toLowerCase() === schemeCategory.toLowerCase()
                    return incOk && catOk
                  })

                  return (
                    <div className="space-y-3">
                      <div>
                        <h4 className="text-xs font-black text-indigo-500 uppercase tracking-wider mb-2">Government Schemes ({matched.length})</h4>
                        <div className="space-y-2">
                          {matched.map(s => (
                            <div key={s.id} className="p-3 rounded-xl border border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-900/20">
                              <div className="flex justify-between items-start">
                                <span className="font-extrabold text-slate-800 dark:text-white text-xs">{s.name}</span>
                                <a href={s.link} target="_blank" rel="noreferrer" className="text-[10px] text-secondary font-bold hover:underline">Apply ↗</a>
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-dark-text-muted mt-1 leading-relaxed">{s.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="pt-2 border-t border-slate-100 dark:border-dark-border/40">
                        <h4 className="text-xs font-black text-purple-500 uppercase tracking-wider mb-2">Academic Scholarships ({matchedSchol.length})</h4>
                        <div className="space-y-2">
                          {matchedSchol.map(s => (
                            <div key={s.id} className="p-3 rounded-xl border border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-900/20">
                              <div className="flex justify-between items-baseline">
                                <span className="font-extrabold text-slate-800 dark:text-white text-xs">{s.name}</span>
                                <span className="text-[9px] font-black text-emerald-500 uppercase">{s.amount}</span>
                              </div>
                              <p className="text-[10px] text-slate-400 dark:text-dark-text-muted mt-1 leading-relaxed">{s.description}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </section>

            {/* Subsidy Tracker Form */}
            <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium space-y-5 flex flex-col justify-between min-w-0 overflow-hidden">
              <div>
                <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-dark-border">
                  <FiDollarSign className="w-5 h-5 text-secondary dark:text-purple-400" />
                  <h3 className="font-bold text-slate-800 dark:text-white text-base">Welfare Subsidy Tracker</h3>
                </div>
                <p className="text-xs text-slate-450 dark:text-dark-text-muted leading-relaxed mt-3">
                  Log direct benefit transfers or government subsidies (e.g. gas subsidy, agriculture credit) straight into your transaction book.
                </p>

                <form onSubmit={logSubsidyReceipt} className="space-y-4 mt-5">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase">Subsidy Name</label>
                      <input
                        type="text"
                        value={subsidyName}
                        onChange={(e) => setSubsidyName(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                        placeholder="e.g. PM Kisan"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-bold text-slate-400 uppercase font-bold">Amount (INR)</label>
                      <input
                        type="number"
                        value={subsidyAmt}
                        onChange={(e) => setSubsidyAmt(Number(e.target.value))}
                        className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                        placeholder="2000"
                      />
                    </div>
                  </div>

                  {subsidyMessage && (
                    <p className={`text-xs font-bold text-center ${subsidyMessage.includes('Success') ? 'text-emerald-500' : 'text-rose-500'}`}>
                      {subsidyMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="w-full py-2.5 rounded-xl bg-secondary dark:bg-purple-650 hover:bg-indigo-700 dark:hover:bg-purple-755 text-white font-extrabold text-sm transition-colors cursor-pointer"
                  >
                    Log Subsidy Receipt
                  </button>
                </form>
              </div>
            </section>
          </div>

          {/* AI Financial Coach Chat Panel */}
          <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium space-y-4 overflow-hidden w-full">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-150 dark:border-dark-border">
              <FiCpu className="w-5 h-5 text-secondary dark:text-purple-400 animate-pulse" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">AI Financial Coach & Wealth Guide</h3>
            </div>
            
            <div className="grid gap-6 md:grid-cols-3 w-full overflow-hidden">
              {/* Pre-set Advisory Questions */}
              <div className="space-y-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">Pick a Coaching Topic</span>
                <button
                  onClick={() => askAIFinancialCoach('spending')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-900/30 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer block"
                >
                  🔍 Where should I reduce spending?
                </button>
                <button
                  onClick={() => askAIFinancialCoach('retirement')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-900/30 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer block"
                >
                  🛡️ Atal Pension premium check?
                </button>
                <button
                  onClick={() => askAIFinancialCoach('loans')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-900/30 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer block"
                >
                  💸 Can I afford my new loan?
                </button>
                <button
                  onClick={() => askAIFinancialCoach('savings')}
                  className="w-full text-left p-3 rounded-xl border border-slate-100 dark:border-dark-border hover:bg-slate-50 dark:hover:bg-slate-900/30 text-xs font-bold text-slate-700 dark:text-slate-200 cursor-pointer block"
                >
                  📈 How to reach a 20% savings rate?
                </button>
              </div>

              {/* Chat Output Frame */}
              <div className="md:col-span-2 rounded-xl bg-slate-50/30 dark:bg-slate-900/20 border border-slate-100 dark:border-dark-border/40 p-4 min-h-[160px] flex flex-col justify-between">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Interactive AI Coach Advice</div>
                  {chatQuestion && (
                    <div className="text-xs font-bold text-slate-800 dark:text-white mb-3">
                      User: <span className="font-semibold text-slate-600 dark:text-slate-350">{chatQuestion}</span>
                    </div>
                  )}
                  {chatLoading ? (
                    <div className="flex items-center gap-2 text-slate-400 text-xs py-4">
                      <div className="animate-spin rounded-full h-4 w-4 border-t border-b border-slate-400"></div>
                      Consulting financial model...
                    </div>
                  ) : chatResponse ? (
                    <div className="text-xs text-slate-600 dark:text-slate-300 font-medium leading-relaxed whitespace-pre-line bg-white/40 dark:bg-dark-card/40 p-3.5 rounded-lg border border-slate-100/50 dark:border-dark-border/20 shadow-sm">
                      {chatResponse}
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">Click one of the coaching topics on the left to consult your AI Coach.</p>
                  )}
                </div>
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  )
}

export default InsightsReports
