import { useEffect, lazy, Suspense } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom'
import './App.css'

// Helper for dynamic imports to retry and reload page on chunk 404 deployment updates
const lazyWithRetry = (componentImport) =>
  lazy(async () => {
    const pageHasAlreadyBeenReloaded = JSON.parse(
      sessionStorage.getItem('page_reloaded_for_chunk_error') || 'false'
    )
    try {
      const component = await componentImport()
      sessionStorage.setItem('page_reloaded_for_chunk_error', 'false')
      return component
    } catch (error) {
      if (!pageHasAlreadyBeenReloaded) {
        sessionStorage.setItem('page_reloaded_for_chunk_error', 'true')
        window.location.reload()
      }
      throw error
    }
  })

// Lazy loaded Pages for performance
const Login = lazyWithRetry(() => import('./pages/Login'))
const Signup = lazyWithRetry(() => import('./pages/Signup'))
const Forgot = lazyWithRetry(() => import('./pages/Forgot'))
const Reset = lazyWithRetry(() => import('./pages/Reset'))
const Dashboard = lazyWithRetry(() => import('./pages/Dashboard'))
const Transactions = lazyWithRetry(() => import('./pages/Transactions'))
const Budget = lazyWithRetry(() => import('./pages/Budget'))
const InsightsReports = lazyWithRetry(() => import('./pages/InsightsReports'))
const Profile = lazyWithRetry(() => import('./pages/Profile'))
const Balance = lazyWithRetry(() => import('./pages/Balance'))
const Subscriptions = lazyWithRetry(() => import('./pages/Subscriptions'))
const PrivacyPolicy = lazyWithRetry(() => import('./pages/PrivacyPolicy'))
const TermsAndConditions = lazyWithRetry(() => import('./pages/TermsAndConditions'))

// Layout
import Layout from './components/layout/Layout'
import UpgradeModal from './components/subscription/UpgradeModal'

// Redux
import { useDispatch, useSelector } from 'react-redux'
import { refreshUser } from './redux/slices/authSlice'

function PageLoader() {
  return (
    <div className="flex h-screen w-screen items-center justify-center bg-slate-50 dark:bg-[#090b11]">
      <div className="h-10 w-10 animate-spin rounded-full border-[3px] border-slate-200 border-t-secondary dark:border-slate-800 dark:border-t-purple-400"></div>
    </div>
  )
}

function ProtectedRoute() {
  const { isAuthenticated } = useSelector(state => state.auth)

  return isAuthenticated ? <Outlet /> : <Navigate to="/login" replace />
}

function App() {
  const dispatch = useDispatch()

  useEffect(() => {
    const token = localStorage.getItem('token')

    if (!token) return

    dispatch(refreshUser())
  }, [dispatch])

  return (
    <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<Forgot />} />
          <Route path="/reset-password/:token" element={<Reset />} />
          <Route path="/privacy" element={<PrivacyPolicy />} />
          <Route path="/terms" element={<TermsAndConditions />} />
          <Route path="/terms-and-conditions" element={<TermsAndConditions />} />

          <Route element={<ProtectedRoute />}>
            <Route element={<Layout />}>
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/balance" element={<Balance />} />
              <Route path="/transactions" element={<Transactions />} />
              <Route path="/budget" element={<Budget />} />
              <Route path="/subscriptions" element={<Subscriptions />} />
              <Route path="/insights" element={<InsightsReports />} />
              <Route path="/reports" element={<Navigate to="/insights?tab=reports" replace />} />
              <Route path="/loans" element={<Navigate to="/transactions?tab=loans" replace />} />
              <Route path="/referral" element={<Profile />} />
              <Route path="/profile" element={<Profile />} />
              <Route path="/" element={<Navigate to="/dashboard" />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Suspense>
      <UpgradeModal />
    </Router>
  )
}

export default App