import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { FiLayout, FiDollarSign, FiPieChart, FiTrendingUp, FiUser, FiLogOut, FiCreditCard, FiRepeat, FiZap, FiAward, FiGift } from 'react-icons/fi'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { useSubscription } from '../../context/SubscriptionContext'
import logoLight from '../../assets/logo-light.png'
import logoDark from '../../assets/logo-dark.png'

function Sidebar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { tier, isTrial, trialDaysRemaining, openUpgradeModal } = useSubscription()

  const navItems = [
    { labelKey: 'dashboard', path: '/dashboard', icon: FiLayout },
    { labelKey: 'accounts', path: '/balance', icon: FiCreditCard },
    { labelKey: 'transactions', path: '/transactions', icon: FiDollarSign },
    { labelKey: 'budget', path: '/budget', icon: FiPieChart },
    { labelKey: 'subscriptions', path: '/subscriptions', icon: FiRepeat },
    { labelKey: 'analytics', path: '/insights', icon: FiTrendingUp },
    { labelKey: 'referral', path: '/referral', icon: FiGift, badge: '25% OFF' },
    { labelKey: 'profile', path: '/profile', icon: FiUser }
  ]

  const isActive = (path) => {
    if (path.includes('?')) {
      return location.pathname + location.search === path
    }
    if (path === '/transactions') {
      return location.pathname === '/transactions' && !location.search.includes('tab=loans')
    }
    return location.pathname === path
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  return (
    <aside className="w-64 bg-slate-900 dark:bg-dark-card text-white flex flex-col transition-all duration-200 border-r border-slate-800 dark:border-dark-border shadow-premium h-screen no-scrollbar">
      {/* Header */}
      <div className="p-6 border-b border-slate-800 dark:border-dark-border flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            <img src={logoDark} alt="URxpenz" className="w-10 h-10 rounded-lg object-contain" />
            URxpenz
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-dark-text-muted mt-1 font-bold uppercase tracking-wider">AI Personal Finance</p>
        </div>
      </div>

      {/* Navigation */}
      <nav id="sidebar-navigation-tour" className="flex-1 p-4 space-y-1 bg-slate-900 dark:bg-dark-card overflow-y-auto no-scrollbar">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-200 group ${
                active
                  ? 'sidebar-active'
                  : 'sidebar-inactive'
              }`}
            >
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 transition-transform duration-200 group-hover:scale-105" />
                <span className="font-semibold text-sm">{t(item.labelKey)}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded-md text-[10px] font-black bg-gradient-to-r from-amber-500 to-amber-600 text-white shadow-sm">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      {/* Subscription Status Card */}
      <div className="px-4 pb-2">
        {isTrial ? (
          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-950/50 to-indigo-950/50 border border-purple-500/30 text-white shadow-sm">
            <div className="flex items-center justify-between text-xs font-bold text-purple-300">
              <span className="flex items-center gap-1.5"><FiZap className="w-3.5 h-3.5 text-amber-400 fill-amber-400" /> Free Trial</span>
              <span className="px-1.5 py-0.5 rounded-md bg-purple-500/20 text-[10px] text-purple-200">{trialDaysRemaining}d left</span>
            </div>
            <p className="text-[11px] text-slate-300 mt-1 leading-tight">All Pro features unlocked</p>
            <button
              onClick={() => openUpgradeModal()}
              className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
            >
              View Pro Plans
            </button>
          </div>
        ) : tier === 'basic' ? (
          <div className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700/60 text-white">
            <div className="flex items-center justify-between text-xs font-bold text-slate-200">
              <span>Basic Plan</span>
              <span className="text-[10px] uppercase tracking-wider text-amber-400 font-bold px-1.5 py-0.5 rounded bg-amber-500/10">Free</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-tight">1 Bank, 1 Loan, 2 Subs</p>
            <button
              onClick={() => openUpgradeModal()}
              className="mt-2.5 w-full py-1.5 px-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:opacity-95 text-white text-xs font-bold transition-all shadow-md shadow-purple-900/30 cursor-pointer"
            >
              Upgrade to Pro (₹45)
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-emerald-950/30 border border-emerald-500/20 text-emerald-300 flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5"><FiAward className="w-4 h-4 text-emerald-400" /> Pro Member</span>
            <button onClick={() => openUpgradeModal()} className="text-[10px] text-emerald-400 hover:underline cursor-pointer">Manage</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-slate-800 dark:border-dark-border bg-slate-950/20 dark:bg-dark-card/50">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 text-rose-400 hover:text-white hover:bg-rose-600 rounded-xl transition-all duration-200 font-semibold text-sm shadow-sm"
        >
          <FiLogOut className="w-5 h-5" />
          {t('logout')}
        </button>
        <div className="pt-2 text-center">
          <Link
            to="/privacy"
            className="text-[10px] text-slate-500 hover:text-purple-400 transition-colors underline font-medium"
          >
            Privacy Policy & Data Safety
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar