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
  FiShield,
  FiZap
} from 'react-icons/fi'
import { useTheme } from '../context/ThemeContext'
import { useLanguage } from '../context/LanguageContext'
import { useSubscription } from '../context/SubscriptionContext'
import API from '../services/api' // To allow posting subsidy receipts directly

function InsightsReports() {
  const dispatch = useDispatch()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { isPro, openUpgradeModal } = useSubscription()
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
  const [periodType, setPeriodType] = useState('monthly') // 'monthly', 'weekly', 'yearly', 'custom'
  const [weekOffset, setWeekOffset] = useState(0)
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
    } else if (periodType === 'weekly') {
      return { type: 'weekly', weekOffset }
    } else {
      return { month: period.month, year: period.year }
    }
  }, [periodType, period, startDate, endDate, weekOffset])

  // Welfare Schemes Filter States
  const [schemeAge, setSchemeAge] = useState(25)
  const [schemeGender, setSchemeGender] = useState('any')
  const [schemeIncome, setSchemeIncome] = useState(300000)
  const [schemeCategory, setSchemeCategory] = useState('any')

  // Fetch financial insights
  useEffect(() => {
    if (activeTab === 'insights') {
      dispatch(fetchInsights())
      dispatch(fetchPrediction())
    }
  }, [dispatch, activeTab])

  // Fetch monthly report
  useEffect(() => {
    if (activeTab === 'reports') {
      setReportLoading(true)
      setReportError('')
      getMonthlyReport(reportParams)
        .then((response) => setReport(response.data.data))
        .catch((err) => {
          const errMsg = err.response?.data?.message || 'Unable to load report'
          setReportError(errMsg)
          if (err.response?.data?.code === 'PRO_REQUIRED' || err.response?.status === 403) {
            setPeriodType('monthly')
            openUpgradeModal('reports')
          }
        })
        .finally(() => setReportLoading(false))
    }
  }, [reportParams, activeTab])

  const exportPdf = async () => {
    if (!isPro) {
      openUpgradeModal('reports')
      return
    }
    try {
      const response = await downloadMonthlyReport(reportParams)
      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      let filename = `finance-report-${period.year}-${String(period.month).padStart(2, '0')}.pdf`
      if (periodType === 'custom') {
        filename = `finance-report-custom-${startDate}-to-${endDate}.pdf`
      } else if (periodType === 'weekly') {
        filename = `finance-report-weekly-offset-${weekOffset}.pdf`
      } else if (periodType === 'yearly') {
        filename = `finance-report-${period.year}-yearly.pdf`
      }
      link.setAttribute('download', filename)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
    } catch (err) {
      if (err.response?.data?.code === 'PRO_REQUIRED' || err.response?.status === 403) {
        openUpgradeModal('reports')
      } else {
        alert('Failed to export PDF statement')
      }
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white tracking-tight">{t('spendingInsights')}</h2>
          <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">{t('insightsSubtitle')}</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-slate-100 dark:bg-[#10121a] p-1 rounded-lg border border-slate-200 dark:border-[#222634] w-fit">
          <button
            onClick={() => setActiveTab('insights')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'insights'
                ? 'bg-white dark:bg-[#181a24] text-slate-900 dark:text-white border border-slate-200 dark:border-[#2b3042]'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FiCpu className="w-3.5 h-3.5" />
            <span>Forecasts</span>
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'reports'
                ? 'bg-white dark:bg-[#181a24] text-slate-900 dark:text-white border border-slate-200 dark:border-[#2b3042]'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FiLayers className="w-3.5 h-3.5" />
            <span>Monthly reports</span>
          </button>
          <button
            onClick={() => setActiveTab('welfare')}
            className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded transition-colors cursor-pointer ${
              activeTab === 'welfare'
                ? 'bg-white dark:bg-[#181a24] text-slate-900 dark:text-white border border-slate-200 dark:border-[#2b3042]'
                : 'text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            <FiUsers className="w-3.5 h-3.5" />
            <span>Welfare schemes</span>
          </button>
        </div>
      </div>

      {/* AI INSIGHTS VIEW */}
      {activeTab === 'insights' && (
        !isPro ? (
          <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-8 sm:p-10 text-center flex flex-col items-center justify-center">
            <div className="w-12 h-12 rounded-lg bg-slate-100 dark:bg-[#1a1d29] border border-slate-200 dark:border-[#2b3042] flex items-center justify-center text-slate-700 dark:text-slate-300 mb-4">
              <FiCpu className="w-6 h-6" />
            </div>
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-2">
              Pro plan feature
            </span>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Financial forecasts & runway intelligence</h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 max-w-lg mt-2 leading-relaxed">
              Analyze projected month-end outlays, cashflow runway, burn rate alerts, and category reduction opportunities.
            </p>
            <button
              onClick={() => openUpgradeModal('ai')}
              className="mt-6 flex items-center gap-2 py-2.5 px-6 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium text-xs transition-colors cursor-pointer"
            >
              <FiZap className="w-3.5 h-3.5" />
              <span>Upgrade to Pro (from ₹45)</span>
            </button>
          </div>
        ) : (
        <div className="space-y-6">
          {aiError && <div className="rounded-lg border border-rose-200 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-400">{aiError}</div>}

          <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
            {/* Suggestions Card */}
            <section id="analytics-ai-advice-tour" className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 lg:col-span-2 space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-[#222634] pb-3">
                <div className="flex items-center gap-2">
                  <FiCpu className="w-4 h-4 text-indigo-500" />
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Financial suggestions</h3>
                </div>
                <button
                  onClick={() => { dispatch(fetchInsights()); dispatch(fetchPrediction()) }}
                  className="flex items-center justify-center gap-1.5 rounded border border-slate-200 dark:border-[#222634] bg-slate-50 dark:bg-[#181a24] px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#222634] transition-colors cursor-pointer"
                >
                  <FiRefreshCw className="w-3 h-3" />
                  Refresh
                </button>
              </div>

              {aiLoading ? (
                <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
                  <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
                  Generating forecast recommendations...
                </div>
              ) : (
                <div className="space-y-2.5">
                  {insights.length ? insights.map((item, index) => (
                    <div key={`${item}-${index}`} className="flex items-start gap-3 rounded-lg border border-slate-100 dark:border-[#222634] bg-slate-50/60 dark:bg-[#181a24]/50 p-3 text-slate-700 dark:text-slate-300">
                      <FiCheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 flex-shrink-0" />
                      <p className="text-xs leading-relaxed">{item}</p>
                    </div>
                  )) : (
                    <p className="text-xs text-slate-400 dark:text-slate-500 py-6 text-center">
                      Log more transactions to generate forecast recommendations.
                    </p>
                  )}
                </div>
              )}
            </section>

            {/* Forecast Panel */}
            <section id="analytics-ai-forecast-tour" className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 h-fit space-y-5 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#222634]">
                <FiTrendingUp className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Forecast</h3>
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
        )
      )}

      {/* STATEMENTS & PDF REPORTS VIEW */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          {reportError && <div className="rounded-lg border border-rose-200 dark:border-rose-950/40 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-700 dark:text-rose-400">{reportError}</div>}

          {/* Period Filter Card */}
          <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 flex flex-col md:flex-row gap-4 justify-between items-center">
            <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
              <FiCalendar className="text-indigo-500 w-4 h-4 flex-shrink-0" />
              
              <select
                value={periodType}
                onChange={(e) => {
                  const val = e.target.value;
                  if ((val === 'custom' || val === 'yearly') && !isPro) {
                    openUpgradeModal('reports');
                    return;
                  }
                  setPeriodType(val);
                }}
                className="rounded-lg border border-slate-200 dark:border-[#222634] px-3 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
              >
                <option value="monthly">Monthly report</option>
                <option value="weekly">Weekly report</option>
                <option value="custom">{!isPro ? '🔒 Custom date range (Pro)' : 'Custom date range'}</option>
                <option value="yearly">{!isPro ? '🔒 Yearly report (Pro)' : 'Yearly report'}</option>
              </select>

              {periodType === 'weekly' && (
                <select
                  value={weekOffset}
                  onChange={(e) => setWeekOffset(Number(e.target.value))}
                  className="rounded-lg border border-slate-200 dark:border-[#222634] px-3 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                >
                  <option value={0}>This week (current)</option>
                  <option value={-1}>Last week</option>
                  <option value={-2}>2 weeks ago</option>
                  <option value={-3}>3 weeks ago</option>
                  <option value={-4}>4 weeks ago</option>
                </select>
              )}

              {periodType === 'monthly' && (
                <div className="flex gap-2">
                  <select
                    value={period.month}
                    onChange={(e) => setPeriod({ ...period, month: Number(e.target.value) })}
                    className="rounded-lg border border-slate-200 dark:border-[#222634] px-3 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
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
                    className="w-20 rounded-lg border border-slate-200 dark:border-[#222634] px-2.5 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                    placeholder="Year"
                  />
                </div>
              )}

              {periodType === 'yearly' && (
                <input
                  type="number"
                  value={period.year}
                  onChange={(e) => setPeriod({ ...period, year: Number(e.target.value) })}
                  className="w-24 rounded-lg border border-slate-200 dark:border-[#222634] px-2.5 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                  placeholder="Year"
                />
              )}

              {periodType === 'custom' && (
                <div className="flex flex-wrap gap-2 items-center">
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-[#222634] px-2.5 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  />
                  <span className="text-slate-400 text-xs">to</span>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="rounded-lg border border-slate-200 dark:border-[#222634] px-2.5 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                  />
                </div>
              )}
            </div>
            
            <button
              onClick={exportPdf}
              disabled={reportLoading || !report}
              className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 font-medium text-white text-xs hover:bg-indigo-700 transition-colors disabled:opacity-50 w-full md:w-auto cursor-pointer"
            >
              <FiDownload className="w-3.5 h-3.5" />
              <span>Download PDF statement</span>
            </button>
          </section>

          {reportLoading && (
            <div className="py-12 flex flex-col items-center justify-center gap-2 text-slate-400 dark:text-slate-500 text-xs">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-indigo-500 border-t-transparent"></div>
              Generating report...
            </div>
          )}

          {report && !reportLoading && (
            <>
              {/* Summary Metric Counters */}
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500">Income</span>
                  <span className="text-xl font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-2">{formatCurrency(report.totalIncome)}</span>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500">Expense</span>
                  <span className="text-xl font-bold font-mono text-rose-600 dark:text-rose-400 mt-2">{formatCurrency(report.totalExpense)}</span>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500">Savings</span>
                  <span className="text-xl font-bold font-mono text-slate-900 dark:text-white mt-2">{formatCurrency(report.savings)}</span>
                </div>
                <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 flex flex-col justify-between">
                  <span className="text-[11px] font-mono uppercase text-slate-400 dark:text-slate-500">Net balance</span>
                  <span className={`text-xl font-bold font-mono mt-2 ${report.savings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>{formatCurrency(report.savings)}</span>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
                {/* Category Spend Chart */}
                <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 lg:col-span-2 min-w-0 overflow-hidden">
                  <h3 className="font-semibold text-slate-900 dark:text-white text-sm mb-4">Category analysis</h3>
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={report.categoryBreakdown} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                        <defs>
                          <linearGradient id="urxpenzBarGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#AD5CFF" />
                            <stop offset="70%" stopColor="#7A00FF" />
                            <stop offset="100%" stopColor="#3A0A9A" />
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "rgba(196,139,255,0.1)" : "rgba(58,10,154,0.08)"} />
                        <XAxis dataKey="category" tickLine={false} stroke={isDark ? "#A99BC4" : "#5E5078"} fontSize={11} />
                        <YAxis tickLine={false} stroke={isDark ? "#A99BC4" : "#5E5078"} fontSize={11} />
                        <Tooltip
                          contentStyle={isDark
                            ? { backgroundColor: '#140727', borderRadius: '12px', border: '1px solid rgba(196,139,255,0.14)', color: '#F4EEFF' }
                            : { backgroundColor: '#FFFFFF', borderRadius: '12px', border: '1px solid rgba(58,10,154,0.12)', boxShadow: '0 4px 12px rgba(14, 4, 32, 0.08)' }
                          }
                          itemStyle={{ color: isDark ? '#F4EEFF' : '#170A2E' }}
                          labelStyle={{ color: isDark ? '#A99BC4' : '#5E5078' }}
                          formatter={(value) => formatCurrency(value)}
                        />
                        <Bar dataKey="amount" fill="url(#urxpenzBarGradient)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>

                {/* Categorical Breakdown Table */}
                <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 flex flex-col justify-between min-w-0 overflow-hidden">
                  <div className="space-y-4">
                    <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Categorical breakdown</h3>
                    <div className="max-h-72 overflow-y-auto pr-1">
                      <table className="w-full text-xs text-left">
                        <thead>
                          <tr className="text-slate-400 dark:text-slate-500 text-[10px] font-mono uppercase border-b border-slate-100 dark:border-[#222634]">
                            <th className="pb-2">Category</th>
                            <th className="pb-2">Type</th>
                            <th className="pb-2 text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 dark:divide-[#222634]/60">
                          {report.fullCategoryBreakdown && report.fullCategoryBreakdown.length > 0 ? (
                            report.fullCategoryBreakdown.map((item, idx) => (
                              <tr key={`${item.category}-${item.type}-${idx}`} className="text-slate-700 dark:text-slate-200">
                                <td className="py-2.5 font-medium text-slate-900 dark:text-white truncate max-w-[100px]">{item.category}</td>
                                <td className="py-2.5 capitalize">
                                  <span className={`px-1.5 py-0.5 rounded text-[9px] font-mono uppercase ${
                                    item.type === 'income' ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'
                                  }`}>
                                    {item.type}
                                  </span>
                                </td>
                                <td className={`py-2.5 text-right font-mono font-medium ${
                                  item.type === 'income' ? 'text-emerald-500' : 'text-rose-500'
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
                          <tr className="border-t border-slate-200 dark:border-[#222634] font-semibold text-slate-900 dark:text-white text-xs bg-slate-50 dark:bg-[#181a24]">
                            <td className="py-2.5 px-1" colSpan="2">Net balance</td>
                            <td className={`py-2.5 text-right font-mono font-bold ${
                              report.savings >= 0 ? 'text-emerald-500' : 'text-rose-500'
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
        <div className="space-y-6">
          {/* Top Row: AI Cashflow Burn Rate & Run-out gauge */}
          <div className="grid gap-6 md:grid-cols-3 w-full overflow-hidden">
            {/* Cashflow Run-out Predictor */}
            <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#222634]">
                <FiActivity className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Cashflow burn rate</h3>
              </div>
              {safePredictions?.cashflowForecast ? (
                <div className="space-y-3.5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Total accounts balance</span>
                    <span className="text-sm font-bold font-mono text-slate-900 dark:text-white">
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
            <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 space-y-4 md:col-span-2 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#222634]">
                <FiTrendingUp className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Category reduction opportunities</h3>
              </div>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 max-h-48 overflow-y-auto pr-1">
                {safePredictions?.cashflowForecast?.cheaperAlternatives?.length ? (
                  safePredictions.cashflowForecast.cheaperAlternatives.map((alt, idx) => (
                    <div key={idx} className="rounded-lg border border-slate-100 dark:border-[#222634] p-3 bg-slate-50/50 dark:bg-[#181a24]/50 space-y-1.5 flex flex-col justify-between">
                      <div>
                        <div className="flex justify-between items-baseline mb-1">
                          <span className="font-medium text-slate-900 dark:text-white text-xs truncate max-w-[80px]">{alt.category}</span>
                          <span className="text-[11px] font-mono font-bold text-rose-500">{formatCurrency(alt.amount)}</span>
                        </div>
                        <p className="text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{alt.suggestion}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="col-span-3 text-xs text-slate-400 py-6 text-center">Log expenses to view category reduction suggestions.</p>
                )}
              </div>
            </div>
          </div>

          {/* Interactive Calculators & Coaching Row */}
          <div className="grid gap-6 md:grid-cols-2 w-full overflow-hidden">
            {/* Pension Eligibility & APY Calculator */}
            <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#222634]">
                <FiShield className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Atal Pension Yojana (APY) eligibility</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Current age</label>
                    <input
                      type="number"
                      min="18"
                      max="40"
                      value={pensionAge}
                      onChange={(e) => setPensionAge(Math.min(40, Math.max(18, Number(e.target.value))))}
                      className="w-full rounded-lg border border-slate-200 dark:border-[#222634] px-3 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Target pension</label>
                    <select
                      value={pensionTarget}
                      onChange={(e) => setPensionTarget(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-[#222634] px-3 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none"
                    >
                      <option value="1000">₹1,000 / month</option>
                      <option value="2000">₹2,000 / month</option>
                      <option value="3000">₹3,000 / month</option>
                      <option value="4000">₹4,000 / month</option>
                      <option value="5000">₹5,000 / month</option>
                    </select>
                  </div>
                </div>

                <div className="rounded-lg bg-slate-50 dark:bg-[#181a24] p-3.5 border border-slate-100 dark:border-[#222634] space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Estimated monthly contribution</span>
                    <span className="font-mono font-bold text-slate-900 dark:text-white">
                      {formatCurrency(Math.round(pensionTarget * (0.04 + (pensionAge - 18) * 0.004)))}/month
                    </span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-500 dark:text-slate-400">Retirement payout start</span>
                    <span className="font-mono font-medium text-slate-900 dark:text-white">Age 60</span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-relaxed pt-2 border-t border-slate-200/60 dark:border-[#222634]">
                    APY contribution depends on entry age. Joining early requires lower monthly investments compared to joining at age 40.
                  </p>
                </div>
              </div>
            </section>

            {/* Loan Affordability Calculator */}
            <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#222634]">
                <FiPercent className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Loan affordability calculator</h3>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Amount</label>
                    <input
                      type="number"
                      value={loanAmount}
                      onChange={(e) => setLoanAmount(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-[#222634] px-2.5 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Rate (%)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={loanInterest}
                      onChange={(e) => setLoanInterest(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-[#222634] px-2.5 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-mono text-slate-400 uppercase">Tenure (yrs)</label>
                    <input
                      type="number"
                      value={loanTenure}
                      onChange={(e) => setLoanTenure(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-200 dark:border-[#222634] px-2.5 py-1.5 text-xs bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-200 focus:outline-none font-mono"
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
                    <div className="rounded-lg bg-slate-50 dark:bg-[#181a24] p-3.5 border border-slate-100 dark:border-[#222634] space-y-2.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Estimated monthly EMI</span>
                        <span className="font-mono font-bold text-slate-900 dark:text-white">{formatCurrency(emi)}</span>
                      </div>
                      <div className="flex justify-between text-xs">
                        <span className="text-slate-500 dark:text-slate-400">Debt burden (DTI)</span>
                        <span className={`font-mono font-bold ${dtiRatio < 0.3 ? 'text-emerald-500' : 'text-rose-500'}`}>
                          {Math.round(dtiRatio * 100)}% of income
                        </span>
                      </div>
                      <div className="pt-2 border-t border-slate-200/60 dark:border-[#222634]">
                        {dtiRatio < 0.3 ? (
                          <p className="text-[10px] text-emerald-600 dark:text-emerald-400 font-medium">
                            Affordable: EMI is within 30% of estimated income.
                          </p>
                        ) : (
                          <p className="text-[10px] text-rose-600 dark:text-rose-400 font-medium">
                            High debt burden: EMI exceeds 30% of income. Consider increasing tenure or reducing principal.
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
            <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 space-y-4 min-w-0 overflow-hidden">
              <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#222634]">
                <FiUsers className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Welfare schemes & scholarships</h3>
              </div>

              {/* Profile Inputs */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 dark:bg-[#181a24] p-3 rounded-lg border border-slate-100 dark:border-[#222634]">
                <div className="space-y-1">
                  <label className="text-[9px] font-mono text-slate-400 uppercase">Age</label>
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

          </div>
        </div>
      )}
    </div>
  )
}

export default InsightsReports
