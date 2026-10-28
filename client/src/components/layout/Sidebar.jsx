import { Link, useLocation, useNavigate } from 'react-router-dom'
import { useDispatch } from 'react-redux'
import { logout } from '../../redux/slices/authSlice'
import { FiLayout, FiDollarSign, FiPieChart, FiTrendingUp, FiUser, FiLogOut, FiCreditCard, FiRepeat, FiZap, FiAward, FiGift, FiLayers } from 'react-icons/fi'
import { useTheme } from '../../context/ThemeContext'
import { useLanguage } from '../../context/LanguageContext'
import { useSubscription } from '../../context/SubscriptionContext'
import logoDark from '../../assets/logo-dark.png'

function Sidebar() {
  const location = useLocation()
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { t } = useLanguage()
  const { tier, isPro, isTrial, trialDaysRemaining, openUpgradeModal } = useSubscription()

  const navItems = [
    { labelKey: 'dashboard', path: '/dashboard', icon: FiLayout },
    { labelKey: 'accounts', path: '/balance', icon: FiCreditCard },
    { labelKey: 'transactions', path: '/transactions', icon: FiDollarSign },
    { labelKey: 'budget', path: '/budget', icon: FiPieChart },
    { labelKey: 'subscriptions', path: '/subscriptions', icon: FiRepeat },
    { labelKey: 'reports', labelFallback: 'Reports', path: '/insights?tab=reports', icon: FiLayers },
    { labelKey: 'analytics', path: '/insights?tab=insights', icon: FiTrendingUp },
    { labelKey: 'referral', path: '/referral', icon: FiGift, badge: '25% OFF' },
    { labelKey: 'profile', path: '/profile', icon: FiUser }
  ]

  const isActive = (path) => {
    if (path.includes('?')) {
      const [basePath, search] = path.split('?')
      if (location.pathname === basePath && location.search === `?${search}`) {
        return true
      }
      if (location.pathname === basePath && (!location.search || location.search === '')) {
        if (!isPro && search.includes('reports')) return true
        if (isPro && search.includes('insights')) return true
      }
      return false
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
    <aside className="w-60 bg-[#0E0420] text-[#F4EEFF] flex flex-col border-r border-[rgba(196,139,255,0.14)] h-screen shrink-0 select-none">
      <div className="p-5 border-b border-[rgba(196,139,255,0.14)] flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold tracking-tight text-[#F4EEFF] flex items-center gap-2.5">
            <img src={logoDark} alt="URxpenz" className="w-11 h-11 rounded-lg object-contain" />
            URxpenz
          </h1>
          <p className="text-[11px] text-[#A99BC4] mt-0.5">Expense & budget manager</p>
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
                <Icon className={`w-4 h-4 shrink-0 transition-colors ${active ? 'text-[#F4EEFF]' : 'text-[#A99BC4] group-hover:text-[#F4EEFF]'}`} />
                <span className="font-medium">{t(item.labelKey) || item.labelFallback || item.labelKey}</span>
              </div>
              {item.badge && (
                <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-[#D93CF5]/15 border border-[#D93CF5]/30 text-[#F25CFF]">
                  {item.badge}
                </span>
              )}
            </Link>
          )
        })}
      </nav>

      <div className="p-3 border-t border-[rgba(196,139,255,0.14)]">
        {isTrial ? (
          <div className="p-3 rounded-xl bg-[#140727] border border-[rgba(196,139,255,0.14)] text-[#F4EEFF]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#F4EEFF]">
              <span className="flex items-center gap-1.5"><FiZap className="w-3.5 h-3.5 text-amber-400" /> Free trial</span>
              <span className="text-[11px] text-[#A99BC4]">{trialDaysRemaining}d remaining</span>
            </div>
            <p className="text-[11px] text-[#A99BC4] mt-1 leading-normal">Full access trial active</p>
            <button
              onClick={() => openUpgradeModal()}
              className="mt-2.5 w-full py-1.5 px-3 rounded-lg btn-primary text-[#F4EEFF] text-xs font-semibold cursor-pointer"
            >
              View plans
            </button>
          </div>
        ) : tier === 'basic' ? (
          <div className="p-3 rounded-xl bg-[#140727] border border-[rgba(196,139,255,0.14)] text-[#F4EEFF]">
            <div className="flex items-center justify-between text-xs font-semibold text-[#F4EEFF]">
              <span>Basic tier</span>
              <span className="text-[10px] text-[#A99BC4] px-1.5 py-0.5 rounded bg-[#1C0B36] border border-[rgba(196,139,255,0.1)]">Free</span>
            </div>
            <p className="text-[11px] text-[#A99BC4] mt-1 leading-normal">1 bank, 1 loan, 2 subscriptions</p>
            <button
              onClick={() => openUpgradeModal()}
              className="mt-2.5 w-full py-1.5 px-3 rounded-lg btn-primary text-[#F4EEFF] text-xs font-semibold cursor-pointer"
            >
              Upgrade plan (₹45)
            </button>
          </div>
        ) : (
          <div className="p-2.5 rounded-xl bg-[#140727] border border-[rgba(196,139,255,0.14)] text-[#F4EEFF] flex items-center justify-between text-xs font-medium">
            <span className="flex items-center gap-1.5 text-emerald-400"><FiAward className="w-4 h-4" /> Pro member</span>
            <button onClick={() => openUpgradeModal()} className="text-[11px] text-[#A99BC4] hover:text-[#F4EEFF] cursor-pointer transition-colors">Manage</button>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-[rgba(196,139,255,0.14)] bg-[#0B0316]/60">
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-500/15 text-rose-300 hover:text-white hover:bg-rose-600 rounded-xl transition-all duration-150 font-semibold text-xs border border-rose-500/20 cursor-pointer"
        >
          <FiLogOut className="w-4 h-4" />
          {t('logout')}
        </button>
        <div className="pt-2 text-center">
          <Link
            to="/privacy"
            className="text-[10px] text-[#A99BC4] hover:text-[#F4EEFF] transition-colors underline font-medium"
          >
            Privacy Policy & Data Safety
          </Link>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
