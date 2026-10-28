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
    <aside className="w-60 bg-[#0f1117] text-white flex flex-col transition-all duration-150 border-r border-[#1e2230] h-screen">
      <div className="p-5 border-b border-[#1e2230] flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-white flex items-center gap-2">
            <img src={theme === 'light' ? logoLight : logoDark} alt="Xpenz" className="w-7 h-7 rounded-md object-contain" />
            Xpenz
          </h1>
          <p className="text-[11px] text-slate-400 mt-0.5">Expense & budget manager</p>
        </div>
      </div>

      <nav id="sidebar-navigation-tour" className="flex-1 p-3 space-y-0.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm transition-colors duration-150 group ${
                active
                  ? 'sidebar-active'
                  : 'sidebar-inactive'
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Icon className="w-4 h-4 shrink-0 text-slate-400 group-hover:text-white" />
                <span className="font-medium">{t(item.labelKey)}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/10 border border-amber-500/20 text-amber-400">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-[#1e2230]">
        {isTrial ? (
          <div className="p-3 rounded-lg bg-[#151822] border border-[#232736] text-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span className="flex items-center gap-1.5"><FiZap className="w-3.5 h-3.5 text-amber-400" /> Free trial</span>
              <span className="text-[11px] text-slate-400">{trialDaysRemaining}d remaining</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">Full access trial active</p>
            <button
              onClick={() => openUpgradeModal()}
              className="mt-2.5 w-full py-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              View plans
            </button>
          </div>
        ) : tier === 'basic' ? (
          <div className="p-3 rounded-lg bg-[#151822] border border-[#232736] text-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
              <span>Basic tier</span>
              <span className="text-[10px] text-slate-400 px-1.5 py-0.5 rounded bg-slate-800">Free</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1 leading-normal">1 bank, 1 loan, 2 subscriptions</p>
            <button
              onClick={() => openUpgradeModal()}
              className="mt-2.5 w-full py-1.5 px-3 rounded-md bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition-colors cursor-pointer"
            >
              Upgrade plan (₹45)
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-[#151822] border border-[#232736] text-slate-200 flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400"><FiAward className="w-4 h-4" /> Pro member</span>
            <button onClick={() => openUpgradeModal()} className="text-[11px] text-slate-400 hover:text-white cursor-pointer">Manage</button>
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