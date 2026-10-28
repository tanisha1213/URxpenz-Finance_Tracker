import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useSelector } from 'react-redux'
import { FiBell, FiSun, FiMoon, FiHelpCircle, FiCheck, FiGift } from 'react-icons/fi'
import { useTheme } from '../../context/ThemeContext'
import logoLight from '../../assets/logo-light.png'
import logoDark from '../../assets/logo-dark.png'
import { getLoans } from '../../services/loanService'
import { useLanguage } from '../../context/LanguageContext'
import { useNotification } from '../../context/NotificationContext'
import { getOfflineQueue } from '../../services/offlineSyncService'

function Navbar() {
  const { user } = useSelector(state => state.auth)
  const { theme, toggleTheme } = useTheme()
  const { language, setLanguage } = useLanguage()
  const { triggerPopup } = useNotification()
  const [showNotifications, setShowNotifications] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true)
  const [pendingOfflineCount, setPendingOfflineCount] = useState(0)
  const [isSyncing, setIsSyncing] = useState(false)
  const [recentlySynced, setRecentlySynced] = useState(false)

  useEffect(() => {
    setPendingOfflineCount(getOfflineQueue().length)

    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    const handleQueueChange = (e) => setPendingOfflineCount(e.detail?.count ?? getOfflineQueue().length)
    const handleSyncStart = () => setIsSyncing(true)
    const handleSyncEnd = (e) => {
      setIsSyncing(false)
      const remaining = getOfflineQueue().length
      setPendingOfflineCount(remaining)
      if (e?.detail?.synced > 0) {
        setRecentlySynced(true)
        setTimeout(() => setRecentlySynced(false), 3500)
      }
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    window.addEventListener('xpenz-offline-queue-updated', handleQueueChange)
    window.addEventListener('xpenz-sync-started', handleSyncStart)
    window.addEventListener('xpenz-offline-synced', handleSyncEnd)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
      window.removeEventListener('xpenz-offline-queue-updated', handleQueueChange)
      window.removeEventListener('xpenz-sync-started', handleSyncStart)
      window.removeEventListener('xpenz-offline-synced', handleSyncEnd)
    }
  }, [])

  useEffect(() => {
    if (!user) return

    const loadReminders = async () => {
      try {
        const res = await getLoans()
        const activeLoans = res.data.data.filter(l => l.status === 'active')
        
        const reminders = activeLoans.map((loan, idx) => {
          if (!loan.nextDueDate) return null
          
          const diffTime = new Date(loan.nextDueDate) - new Date()
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          
          let title = ''
          let message = ''
          let notify = false

          if (diffDays < 0) {
            if (loan.reminderDailyOverdue !== false) {
              title = 'EMI Overdue! 🟥'
              message = `Your EMI of ₹${loan.emiAmount.toLocaleString()} for "${loan.title}" was due on ${new Date(loan.nextDueDate).toLocaleDateString('en-IN', { timeZone: 'UTC' })}. Overdue by ${Math.abs(diffDays)} days.`
              notify = true
            }
          } else if (diffDays === 0) {
            if (loan.reminderDueDate !== false) {
              title = 'EMI Due Today ⏰'
              message = `Your EMI of ₹${loan.emiAmount.toLocaleString()} for "${loan.title}" is due today.`
              notify = true
            }
          } else if (diffDays === 1) {
            if (loan.reminder1Day !== false) {
              title = 'EMI Due Tomorrow ⏰'
              message = `Your EMI of ₹${loan.emiAmount.toLocaleString()} for "${loan.title}" is due tomorrow.`
              notify = true
            }
          } else if (diffDays > 1 && diffDays <= 3) {
            if (loan.reminder3Days !== false) {
              title = 'EMI Due in 3 Days 📅'
              message = `Your EMI of ₹${loan.emiAmount.toLocaleString()} for "${loan.title}" is due in ${diffDays} days.`
              notify = true
            }
          } else if (diffDays > 3 && diffDays <= 7) {
            if (loan.reminder7Days !== false) {
              title = 'EMI Due in 7 Days 📅'
              message = `Your EMI of ₹${loan.emiAmount.toLocaleString()} for "${loan.title}" is due in ${diffDays} days.`
              notify = true
            }
          }

          if (!notify) return null

          return {
            id: `loan-${loan._id}-${idx}-${diffDays}`,
            title,
            message,
            time: diffDays < 0 ? 'Overdue' : diffDays === 0 ? 'Today' : `${diffDays}d left`
          }
        }).filter(Boolean)

        if (reminders.length > 0) {
          setNotifications(prev => {
            const filteredPrev = prev.filter(n => !n.id.toString().startsWith('loan-'))
            return [...reminders, ...filteredPrev]
          })
          setHasUnread(true)

          reminders.forEach((r) => {
            if (r.time === 'Overdue' || r.time === 'Today' || r.time === '1d left') {
              triggerPopup({
                id: r.id,
                title: r.title,
                message: r.message,
                time: r.time,
                type: r.time === 'Overdue' ? 'overdue' : 'due'
              })
            }
          })
        }
      } catch (err) {
        console.error('Failed to load loan reminders:', err)
      }
    }

    loadReminders()
  }, [user, triggerPopup])

  return (
    <nav className="bg-white dark:bg-[#14161f] border-b border-slate-200 dark:border-[#222634] sticky top-0 z-30 transition-colors">
      <div className="px-3 sm:px-6 py-3 flex justify-between items-center gap-2 max-w-full overflow-hidden">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <img src={theme === 'light' ? logoLight : logoDark} alt="URxpenz Logo" className="w-9 h-9 rounded-lg object-contain" />
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white tracking-tight">
            URxpenz
          </h2>
        </div>
        
        {/* Right Header Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-2.5 shrink-0 flex-nowrap">
          {/* Automatic Offline & Sync Status Indicator */}
          {(!isOnline || pendingOfflineCount > 0 || isSyncing || recentlySynced) && (
            <div
              title={
                !isOnline
                  ? 'Offline: Transactions are saved locally and will auto-sync when reconnected'
                  : isSyncing
                  ? 'Auto-syncing offline transactions...'
                  : recentlySynced
                  ? 'All offline transactions synced'
                  : 'Auto-sync active'
              }
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium border transition-colors ${
                !isOnline
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : isSyncing
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20'
              }`}
            >
              {isSyncing ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Syncing...</span>
                </>
              ) : !isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>Offline{pendingOfflineCount > 0 ? ` (${pendingOfflineCount})` : ''}</span>
                </>
              ) : recentlySynced ? (
                <>
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500" />
                  <span>Synced</span>
                </>
              ) : (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Syncing...</span>
                </>
              )}
            </div>
          )}

          {/* Language Switcher */}
          <div id="language-switcher-tour" className="relative flex items-center">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none bg-slate-50 dark:bg-[#151822] border border-slate-200 dark:border-[#232736] text-slate-700 dark:text-slate-300 rounded-md pl-2.5 pr-6 py-1 sm:py-1.5 text-xs font-medium focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-[#1c202e] transition-colors"
            >
              <option value="en">EN</option>
              <option value="hi">हिन्दी</option>
              <option value="mr">मराठी</option>
              <option value="ta">தமிழ்</option>
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-1 text-slate-400">
              <svg className="fill-current h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z" />
              </svg>
            </div>
          </div>

          {/* Refer & Earn Quick Link */}
          <Link
            to="/profile#referral-section"
            className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1 rounded-md border border-amber-500/30 bg-amber-500/10 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-medium transition-colors cursor-pointer"
            title="Referral program — up to 25% off"
          >
            <FiGift className="w-4 h-4 sm:w-3.5 sm:h-3.5 text-amber-500 shrink-0" />
            <span className="hidden sm:inline">Refer & earn</span>
            <span className="hidden md:inline text-[10px] px-1.5 py-0.5 rounded bg-amber-500 text-white font-semibold leading-none">25% off</span>
          </Link>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
          >
            {theme === 'light' ? <FiMoon className="w-4 h-4" /> : <FiSun className="w-4 h-4 text-amber-400" />}
          </button>

          {/* Tour Guide Button */}
          <button
            onClick={() => window.dispatchEvent(new Event('xpenz_trigger_tour'))}
            className="p-1.5 sm:p-2 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Restart tour guide"
          >
            <FiHelpCircle className="w-4 h-4" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setHasUnread(false)
              }}
              className="p-1.5 sm:p-2 rounded-md text-slate-400 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
            >
              <FiBell className="w-4 h-4" />
              {hasUnread && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-indigo-500 rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] rounded-xl shadow-lg p-3.5 space-y-2.5 z-50 text-slate-800 dark:text-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-[#222634]">
                  <h4 className="font-semibold text-xs text-slate-900 dark:text-white">Notifications</h4>
                  <button 
                    onClick={() => setNotifications([])} 
                    className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 font-medium cursor-pointer"
                  >
                    Clear all
                  </button>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {notifications.length ? notifications.map((n) => (
                    <div key={n.id} className="text-xs p-2 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                      <div className="flex justify-between font-medium text-slate-800 dark:text-slate-200">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-normal">{n.time}</span>
                      </div>
                      <p className="text-slate-500 dark:text-slate-400 mt-0.5 leading-normal text-[11px]">{n.message}</p>
                    </div>
                  )) : (
                    <div className="py-6 text-center text-slate-400 text-xs">
                      No notifications yet
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {user && (
            <Link
              id="user-profile-tour"
              to="/profile"
              className="flex items-center gap-2.5 pl-2 border-l border-slate-200 dark:border-[#222634] cursor-pointer group hover:opacity-90 transition-opacity"
              title="Account settings"
            >
              <div className="text-right hidden sm:block">
                <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 leading-tight">{user.name}</p>
                <p className="text-[11px] text-slate-400">{user.email}</p>
              </div>
              <div className="w-8 h-8 rounded-full bg-slate-100 dark:bg-[#1a1d28] border border-slate-200 dark:border-[#2b3042] flex items-center justify-center text-slate-700 dark:text-slate-200 font-semibold text-xs">
                {user.name.charAt(0).toUpperCase()}
              </div>
            </Link>
          )}
        </div>
      </div>
    </nav>
  )
}

export default Navbar