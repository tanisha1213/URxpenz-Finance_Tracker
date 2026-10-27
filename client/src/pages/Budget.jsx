import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { fetchBudget, saveBudget } from '../redux/slices/budgetSlice'
import { getDashboardSummary } from '../services/dashboardService'
import { categories, formatCurrency } from '../utils/format'
import { FiPlus, FiTrash2, FiActivity, FiCheck, FiInbox, FiZap, FiBell, FiAlertTriangle, FiLock } from 'react-icons/fi'
import { useLanguage } from '../context/LanguageContext'
import { useSubscription } from '../context/SubscriptionContext'
import DailyAlertTimeCard from '../components/budget/DailyAlertTimeCard'

function Budget() {
  const dispatch = useDispatch()
  const { t } = useLanguage()
  const { isPro, openUpgradeModal } = useSubscription()
  const budget = useSelector(state => state.budget)
  const [monthlyBudget, setMonthlyBudget] = useState(0)
  const [categoryBudgets, setCategoryBudgets] = useState([])
  const [summary, setSummary] = useState(null)
  const [message, setMessage] = useState('')

  useEffect(() => {
    dispatch(fetchBudget())
    getDashboardSummary().then((response) => setSummary(response.data.data))
  }, [dispatch])

  useEffect(() => {
    setMonthlyBudget(budget.monthlyBudget)
    setCategoryBudgets(budget.categories)
  }, [budget.monthlyBudget, budget.categories])

  const addCategory = () => {
    setCategoryBudgets([...categoryBudgets, { category: 'Food', limit: 0 }])
  }

  const updateCategory = (index, field, value) => {
    setCategoryBudgets(categoryBudgets.map((item, itemIndex) => (
      itemIndex === index ? { ...item, [field]: field === 'limit' ? Number(value) : value } : item
    )))
  }

  const removeCategory = (index) => {
    setCategoryBudgets(categoryBudgets.filter((_, itemIndex) => itemIndex !== index))
  }

  const save = async (event) => {
    event.preventDefault()
    setMessage('')
    await dispatch(saveBudget({ monthlyBudget: Number(monthlyBudget), categoryBudgets })).unwrap()
    const response = await getDashboardSummary()
    setSummary(response.data.data)
    setMessage('Budget settings saved successfully.')
  }

  const totalExpense = summary?.totalExpense || 0
  const remaining = Number(monthlyBudget || 0) - totalExpense
  const usedPercent = monthlyBudget > 0 ? Math.min(100, Math.round((totalExpense / monthlyBudget) * 100)) : 0

  const now = new Date()
  const daysInMonth = budget.daysInMonth || new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
  const computedDailyBudget = monthlyBudget > 0 ? Math.round(Number(monthlyBudget) / daysInMonth) : 0
  const dailyLimit = budget.dailyBudget || computedDailyBudget
  const todaySpent = budget.todaySpent || 0
  const todayRemaining = dailyLimit - todaySpent
  const todaySaved = todaySpent <= dailyLimit ? Math.max(0, dailyLimit - todaySpent) : 0
  const isOverspentToday = todaySpent > dailyLimit && dailyLimit > 0
  const todayPercent = dailyLimit > 0 ? Math.min(100, Math.round((todaySpent / dailyLimit) * 100)) : 0

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-2xl font-extrabold text-slate-800 dark:text-white tracking-tight">{t('budgetSetup')}</h2>
        <p className="text-slate-400 dark:text-dark-text-muted text-sm mt-0.5">{t('budgetSubtitle')}</p>
      </div>

      {message && <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/50 dark:bg-emerald-950/5 p-4 text-sm text-emerald-700 dark:text-emerald-400">{message}</div>}
      {budget.error && <div className="rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/5 p-4 text-sm text-rose-700 dark:text-rose-400">{budget.error}</div>}

      {/* Daily Budget & End-of-Day Alert Hero Banner (Pro & 60-Day Trial Only) */}
      {isPro ? (
        <div className="rounded-3xl border border-purple-100 dark:border-purple-900/40 bg-gradient-to-br from-white via-purple-50/30 to-indigo-50/20 dark:from-dark-card dark:via-[#151329] dark:to-dark-card p-5 sm:p-6 shadow-premium relative overflow-hidden">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="space-y-3 flex-1">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400">Today's Daily Target</span>
              </div>
              <div className="flex flex-wrap items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-slate-800 dark:text-white tracking-tight">
                  {formatCurrency(dailyLimit)}
                </span>
                <span className="text-sm font-semibold text-slate-400">/ day allowance</span>
                
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black ${
                  isOverspentToday
                    ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-800/40'
                    : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40'
                }`}>
                  {isOverspentToday ? `⚠️ Overspent by ₹${(todaySpent - dailyLimit).toLocaleString('en-IN')}` : `🎉 Saved ₹${todaySaved.toLocaleString('en-IN')} today`}
                </span>
              </div>

              <p className="text-xs text-slate-500 dark:text-dark-text-muted leading-relaxed">
                Spent so far today: <strong className="text-slate-700 dark:text-slate-200">{formatCurrency(todaySpent)}</strong>. 
                {isOverspentToday
                  ? ' You have exceeded your daily target for today. Try to cut back tomorrow.'
                  : ` You still have ${formatCurrency(Math.max(0, todayRemaining))} left for today.`}
              </p>

              {/* Daily progress bar */}
              <div className="pt-1 max-w-xl">
                <div className="flex justify-between text-[11px] font-bold text-slate-500 dark:text-dark-text-muted mb-1">
                  <span>Today's Spending: {todayPercent}%</span>
                  <span>Allowance: {formatCurrency(dailyLimit)}</span>
                </div>
                <div className="h-2.5 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-500 ${
                      isOverspentToday ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-500 to-emerald-500'
                    }`}
                    style={{ width: `${todayPercent}%` }}
                  />
                </div>
              </div>
            </div>

            {/* End-of-Day Notification Alert Card */}
            <DailyAlertTimeCard
              initialTime={budget.dailyAlertTime || '20:00'}
              dailyLimit={dailyLimit}
              todaySpent={todaySpent}
              todaySaved={todaySaved}
              isOverspentToday={isOverspentToday}
              isPro={isPro}
              onUpgradeModal={openUpgradeModal}
            />
          </div>
        </div>
      ) : (
        /* Basic Tier Teaser Banner for Daily Budget */
        <div className="rounded-3xl border border-purple-100 dark:border-purple-900/40 bg-gradient-to-r from-purple-50/50 via-indigo-50/30 to-white dark:from-dark-card dark:via-purple-950/20 dark:to-dark-card p-5 sm:p-6 shadow-premium relative overflow-hidden flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3.5">
            <div className="p-3 rounded-2xl bg-secondary/10 dark:bg-purple-900/30 text-secondary dark:text-purple-400 border border-secondary/20 flex-shrink-0">
              <FiZap className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  Daily Budget & End-of-Day Alerts (Pro & 60-Day Trial)
                </span>
                <span className="text-[10px] bg-purple-500/10 text-purple-600 dark:text-purple-300 font-extrabold px-2 py-0.5 rounded-full border border-purple-200 dark:border-purple-800">
                  Pro Feature
                </span>
              </div>
              <h3 className="text-base font-bold text-slate-800 dark:text-white mt-1">
                Unlock Daily Per-Day Budgets & End-of-Day Prompts
              </h3>
              <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-0.5 max-w-xl leading-relaxed">
                Basic tier includes monthly budget limits and category tracking. Upgrade to Pro (or start your 60-day trial) to auto-calculate daily per-day allowances and get end-of-day OS alerts showing what you spent and saved.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => openUpgradeModal('daily_budget')}
            className="flex-shrink-0 px-5 py-2.5 rounded-xl bg-secondary hover:bg-indigo-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all cursor-pointer"
          >
            Unlock Daily Budget →
          </button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-3 w-full overflow-hidden">
        {/* Budget Editor Panel */}
        <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium lg:col-span-2 min-w-0 overflow-hidden">
          <form onSubmit={save} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase mb-2">{t('monthlyBudgetLimit')}</label>
              <div id="budget-global-limit-tour" className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 font-bold">₹</span>
                <input
                  type="number"
                  min="0"
                  value={monthlyBudget}
                  onChange={(e) => setMonthlyBudget(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 pl-8 pr-4 py-3 text-sm font-semibold focus:outline-none focus:border-secondary"
                />
              </div>

              {/* Daily Budget Prompt: Real-time for Pro, Teaser for Basic */}
              {isPro ? (
                <div className="mt-3 flex items-start sm:items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-purple-500/10 via-indigo-500/10 to-blue-500/10 dark:from-purple-900/20 dark:via-indigo-900/20 dark:to-blue-900/20 border border-purple-200/60 dark:border-purple-800/40 p-3.5">
                  <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-600 text-white shadow-md">
                      <FiZap className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase tracking-wider">Calculated Daily Allowance:</span>
                        <span className="text-lg font-black text-purple-700 dark:text-purple-300">₹{computedDailyBudget.toLocaleString('en-IN')}</span>
                        <span className="text-xs text-slate-400">/ day</span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-dark-text-muted">
                        Auto-calculated from your ₹{Number(monthlyBudget || 0).toLocaleString('en-IN')} monthly budget across {daysInMonth} days this month.
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-2.5 flex items-center justify-between rounded-xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200/60 dark:border-dark-border px-3.5 py-2 text-xs text-slate-500 dark:text-dark-text-muted">
                  <span className="flex items-center gap-1.5">
                    <FiLock className="w-3.5 h-3.5 text-slate-400" /> Daily budget per-day auto-prompt is locked on Basic (Monthly budget active).
                  </span>
                  <button
                    type="button"
                    onClick={() => openUpgradeModal('daily_budget')}
                    className="text-purple-600 dark:text-purple-400 font-bold hover:underline cursor-pointer"
                  >
                    Unlock Pro →
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 dark:border-dark-border pt-4">
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{t('categoryBudgets')}</h3>
              <button
                type="button"
                onClick={addCategory}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card px-3 py-2 text-xs font-bold text-slate-650 dark:text-slate-350 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <FiPlus className="w-3.5 h-3.5" />
                Add Category Limit
              </button>
            </div>

            <div id="budget-category-budgets-tour" className="space-y-4">
              {categoryBudgets.map((item, index) => {
                const spent = summary?.categoryBreakdown?.find((entry) => entry.category === item.category)?.amount || 0
                const percent = item.limit ? Math.min(100, Math.round((spent / item.limit) * 100)) : 0
                return (
                  <div key={`${item.category}-${index}`} className="rounded-xl border border-slate-100 dark:border-dark-border p-4 bg-slate-50/50 dark:bg-slate-900/10">
                    <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                      <select
                        value={item.category}
                        onChange={(e) => updateCategory(index, 'category', e.target.value)}
                        className="flex-1 rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none cursor-pointer"
                      >
                        {categories.map((category) => <option key={category}>{category}</option>)}
                      </select>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 dark:text-slate-500 text-xs font-bold">₹</span>
                        <input
                          type="number"
                          min="0"
                          value={item.limit}
                          onChange={(e) => updateCategory(index, 'limit', e.target.value)}
                          className="w-full rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2 pl-7 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => removeCategory(index)}
                        className="flex items-center justify-center gap-1 p-2 rounded-xl text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/20 border border-transparent hover:border-rose-100 dark:hover:border-rose-900/30 transition-colors cursor-pointer"
                        title="Remove Category"
                      >
                        <FiTrash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="mt-3">
                      <div className="mb-1 flex justify-between text-xs font-medium text-slate-500 dark:text-dark-text-muted">
                        <span>{formatCurrency(spent)} spent</span>
                        <span>{percent}%</span>
                      </div>
                      <div className="h-2 rounded-full bg-slate-200/50 dark:bg-slate-800">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            percent >= 100 ? 'bg-rose-500' : 'bg-emerald-500'
                          }`}
                          style={{ width: `${percent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )
              })}
              {categoryBudgets.length === 0 && (
                <div className="py-6 text-center text-slate-400 dark:text-slate-500 text-sm flex flex-col items-center justify-center gap-2 border border-dashed border-slate-200 dark:border-dark-border rounded-xl bg-slate-50/20 dark:bg-slate-900/5">
                  <FiInbox className="w-6 h-6 text-slate-350 dark:text-slate-600" />
                  No category limits configured.
                </div>
              )}
            </div>

            <button
              disabled={budget.loading}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary dark:bg-slate-800 px-4 py-3 font-bold text-white text-sm hover:bg-slate-800 dark:hover:bg-slate-700 disabled:opacity-50 transition-colors cursor-pointer"
            >
              <FiCheck className="w-4 h-4" />
              {budget.loading ? 'Saving...' : t('saveBudget')}
            </button>
          </form>
        </section>

        {/* Budget Status Sidebar Info */}
        <section id="budget-progress-sidebar-tour" className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-4 sm:p-6 shadow-premium h-fit space-y-6 min-w-0 overflow-hidden">
          <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-dark-border">
            <FiActivity className="w-5 h-5 text-secondary dark:text-purple-400" />
            <h3 className="font-bold text-slate-800 dark:text-white text-lg">Overall Progress</h3>
          </div>
          <div className="space-y-4">
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Total Month Spending</p>
              <p className="text-3xl font-extrabold text-slate-800 dark:text-white mt-1">{formatCurrency(totalExpense)}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Available Budget Balance</p>
              <p className={`text-3xl font-extrabold mt-1 ${remaining < 0 ? 'text-rose-600 dark:text-rose-455' : 'text-emerald-600 dark:text-emerald-400'}`}>
                {formatCurrency(remaining)}
              </p>
            </div>
            <div>
              <div className="mb-2 flex justify-between text-xs font-semibold text-slate-550 dark:text-dark-text-muted">
                <span>Budget Utilized</span>
                <span>{usedPercent}%</span>
              </div>
              <div className="h-3 rounded-full bg-slate-100 dark:bg-slate-800">
                <div
                  className={`h-3 rounded-full transition-all duration-300 ${
                    usedPercent >= 100 ? 'bg-rose-500' : 'bg-secondary dark:bg-purple-600'
                  }`}
                  style={{ width: `${usedPercent}%` }}
                />
              </div>
            </div>
            {remaining < 0 && (
              <div className="rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/5 p-4 text-xs font-medium text-rose-700 dark:text-rose-400 leading-relaxed">
                Budget overrun detected! You have exceeded your configured limit by {formatCurrency(Math.abs(remaining))}. Avoid discretionary outflows this period.
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}

export default Budget