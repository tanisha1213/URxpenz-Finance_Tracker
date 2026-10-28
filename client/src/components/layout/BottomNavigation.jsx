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
    <nav id="bottom-navigation-tour" className="fixed bottom-0 left-0 right-0 z-40 block md:hidden bg-white/95 dark:bg-dark-card/95 border-t border-slate-100 dark:border-dark-border backdrop-blur-lg shadow-lg pb-safe">
      <div className="flex justify-around items-center h-14 px-1">
        {navItems.map((item) => {
          const Icon = item.icon
          const active = isActive(item.path)
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 relative transition-all duration-200 ${
                active 
                  ? 'text-secondary dark:text-purple-400 font-extrabold' 
                  : 'text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 font-medium'
              }`}
            >
              <Icon className="w-4.5 h-4.5 sm:w-5 sm:h-5 shrink-0 transition-transform" />
              <span className="text-[9px] min-[360px]:text-[10px] font-bold tracking-tight mt-0.5 text-center leading-none whitespace-nowrap overflow-hidden text-ellipsis px-0.5">
                {t(item.labelKey)}
              </span>
              {active && (
                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-secondary dark:bg-purple-400 animate-pulse" />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}

export default BottomNavigation
