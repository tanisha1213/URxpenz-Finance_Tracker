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
    <nav className="bg-white/80 dark:bg-dark-card/80 backdrop-blur-md border-b border-slate-100 dark:border-dark-border sticky top-0 z-30 transition-colors duration-200">
      <div className="px-3 sm:px-6 py-3 flex justify-between items-center gap-2 max-w-full overflow-hidden">
        {/* Brand Logo & Title */}
        <div className="flex items-center gap-2 shrink-0">
          <img src={theme === 'light' ? logoLight : logoDark} alt="URxpenz Logo" className="w-8 h-8 rounded-md object-contain shadow-sm" />
          <h2 className="text-base sm:text-lg md:text-xl font-bold text-slate-800 dark:text-white tracking-tight">
            URxpenz
          </h2>
        </div>
        
        {/* Right Header Actions */}
        <div className="flex items-center gap-1 sm:gap-2 md:gap-3 shrink-0 flex-nowrap">
          {/* Automatic Offline & Sync Status Indicator */}
          {(!isOnline || pendingOfflineCount > 0 || isSyncing || recentlySynced) && (
            <div
              title={
                !isOnline
                  ? 'Offline Mode: Transactions are safely queued and will automatically sync the moment connection returns'
                  : isSyncing
                  ? 'Auto-syncing offline transactions with cloud database...'
                  : recentlySynced
                  ? 'All offline transactions synced successfully!'
                  : 'Auto-sync active'
              }
              className={`flex items-center gap-1.5 px-2 sm:px-2.5 py-1 rounded-xl text-[10px] sm:text-[11px] font-bold border transition-all ${
                !isOnline
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20'
                  : isSyncing
                  ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20'
                  : 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20 shadow-sm animate-fadeIn'
              }`}
            >
              {isSyncing ? (
                <>
                  <span className="w-2.5 h-2.5 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  <span className="hidden sm:inline">Auto-Syncing...</span>
                </>
              ) : !isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
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
              className="appearance-none bg-slate-50 dark:bg-dark-border border border-slate-200 dark:border-dark-border text-slate-650 dark:text-slate-300 rounded-xl pl-2.5 pr-6 py-1 sm:py-1.5 text-[11px] sm:text-xs font-bold focus:outline-none cursor-pointer hover:bg-slate-100 dark:hover:bg-slate-800 transition-all font-sans"
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

          {/* Refer & Earn Quick Button */}
          <Link
            to="/profile"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gradient-to-r from-amber-500/15 via-purple-500/15 to-indigo-500/15 border border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/20 text-xs font-extrabold shadow-sm transition-all cursor-pointer"
            title="Refer & Earn Rewards - Get up to 25% OFF"
          >
            <FiGift className="w-3.5 h-3.5 text-amber-500" />
            <span className="hidden sm:inline">Refer & Earn</span>
            <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-amber-500 text-white font-black leading-none">25% OFF</span>
          </Link>

          {/* Theme Switcher Button */}
          <button
            onClick={toggleTheme}
            className="p-1.5 sm:p-2 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-all cursor-pointer"
            title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
          >
            {theme === 'light' ? <FiMoon className="w-4.5 h-4.5 sm:w-5 sm:h-5" /> : <FiSun className="w-4.5 h-4.5 sm:w-5 sm:h-5 text-amber-400" />}
          </button>

          {/* Tour Guide Button */}
          <button
            onClick={() => window.dispatchEvent(new Event('xpenz_trigger_tour'))}
            className="p-1.5 sm:p-2 rounded-full text-secondary dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/40 transition-all cursor-pointer"
            title="Restart Tour Guide"
          >
            <FiHelpCircle className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
          </button>

          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications)
                setHasUnread(false)
              }}
              className="p-2 rounded-full text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors relative cursor-pointer"
            >
              <FiBell className="w-5 h-5" />
              {hasUnread && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-[#8B5CF6] rounded-full" />
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-[#131522] border border-slate-100 dark:border-slate-800/80 rounded-2xl shadow-xl p-4 space-y-3 z-50 animate-fadeIn text-slate-800 dark:text-slate-100">
                <div className="flex justify-between items-center pb-2 border-b border-slate-100 dark:border-dark-border">
                  <h4 className="font-bold text-sm">Notifications</h4>
                  <button 
                    onClick={() => setNotifications([])} 
                    className="text-[10px] text-slate-400 hover:text-slate-600 font-bold uppercase tracking-wider cursor-pointer"
                  >
                    Clear All
                  </button>
                </div>
                <div className="space-y-3 max-h-60 overflow-y-auto">
                  {notifications.length ? notifications.map((n) => (
                    <div key={n.id} className="text-xs p-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <div className="flex justify-between font-bold text-slate-800 dark:text-slate-200">
                        <span>{n.title}</span>
                        <span className="text-[10px] text-slate-400 font-medium">{n.time}</span>
                      </div>
                      <p className="text-slate-500 dark:text-dark-text-muted mt-1 leading-normal font-medium">{n.message}</p>
                    </div>
                  )) : (
                    <div className="py-8 text-center text-slate-400 dark:text-slate-500 text-xs">
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
              className="flex items-center gap-3 pl-2 border-l border-slate-100 dark:border-dark-border cursor-pointer group hover:opacity-90 transition-all"
              title="View & Edit Profile"
            >
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-slate-800 dark:text-slate-200 group-hover:text-secondary dark:group-hover:text-purple-400 transition-colors">{user.name}</p>
                <p className="text-xs text-slate-400 dark:text-dark-text-muted">{user.email}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-indigo-50 border border-indigo-100 dark:bg-purple-950/20 dark:border-purple-900/30 flex items-center justify-center text-secondary dark:text-purple-400 font-bold text-base shadow-sm group-hover:scale-105 group-hover:shadow-md transition-all">
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