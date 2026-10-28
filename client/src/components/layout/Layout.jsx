import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import BottomNavigation from './BottomNavigation'
import OnboardingTour from './OnboardingTour'
import PopUpBanner from '../common/PopUpBanner'

function Layout() {
  return (
    <div className="flex h-screen bg-transparent overflow-hidden text-slate-800 dark:text-slate-100 transition-colors duration-150 relative">
      <PopUpBanner />
      <OnboardingTour />

      <div className="hidden md:block z-10">
        <Sidebar isOpen={false} setIsOpen={() => {}} />
      </div>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden z-10">
        {/* Navbar Component */}
        <Navbar />
        
        {/* Extra bottom padding (pb-20) on mobile viewports prevents content from overlapping the bottom bar */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 pb-20 md:pb-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
        
        {/* Bottom Navigation Component (Visible only on mobile screens) */}
        <BottomNavigation />
      </div>
    </div>
  )
}

export default Layout