import { Link, useLocation } from 'react-router-dom'
import { FiLayout, FiDollarSign, FiPieChart, FiTrendingUp, FiRepeat, FiCreditCard } from 'react-icons/fi'
import { useLanguage } from '../../context/LanguageContext'

function BottomNavigation() {
  const location = useLocation()
  const { t } = useLanguage()
  
  const navItems = [
    { labelKey: 'dashboard', path: '/dashboard', icon: FiLayout },
    { labelKey: 'accounts', path: '/balance', icon: FiCreditCard },
    { labelKey: 'transactions', path: '/transactions', icon: FiDollarSign },
    { labelKey: 'budget', path: '/budget', icon: FiPieChart },
    { labelKey: 'subscriptions', path: '/subscriptions', icon: FiRepeat },
    { labelKey: 'analytics', path: '/insights', icon: FiTrendingUp }
  ]

  const isActive = (path) => location.pathname === path

  return (
    <nav id="bottom-navigation-tour" className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-white dark:bg-[#14161f] border-t border-slate-200 dark:border-[#222634] shadow-sm pb-safe">
      <div className="flex justify-around items-center h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative transition-colors ${
                active 
                  ? 'text-[var(--primary)] font-semibold' 
                  : 'text-[var(--text-muted)] hover:text-[var(--text)] font-medium'
              }`}
            >
              <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0" />
              <span className="text-[10px] font-medium mt-0.5 text-center leading-tight whitespace-nowrap overflow-hidden text-ellipsis px-0.5">
                {t(item.labelKey)}
              </span>
              {active && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-[var(--primary)]" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
