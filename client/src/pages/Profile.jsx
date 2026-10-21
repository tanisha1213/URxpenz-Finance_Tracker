import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import { logout, updateProfileThunk } from '../redux/slices/authSlice'
import { changePassword, getAccountStats } from '../services/authService'
import { formatCurrency } from '../utils/format'
import { FiUser, FiKey, FiCheck, FiPieChart, FiLogOut, FiBell, FiSmartphone, FiAlertCircle } from 'react-icons/fi'
import { useLanguage } from '../context/LanguageContext'
import { useNotification } from '../context/NotificationContext'

function Profile() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const { t } = useLanguage()
  const {
    popupEnabled,
    setPopupEnabled,
    isPushSupported,
    pushPermission,
    isPushSubscribed,
    pushLoading,
    enablePushNotifications,
    disablePushNotifications
  } = useNotification()
  const { user } = useSelector(state => state.auth)
  const [profile, setProfile] = useState({ name: '', email: '' })
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [stats, setStats] = useState(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [pushStatusMsg, setPushStatusMsg] = useState('')
  const [pushSuccess, setPushSuccess] = useState(false)

  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email })
    getAccountStats().then((response) => setStats(response.data.data))
  }, [user])

  const saveProfile = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await dispatch(updateProfileThunk(profile)).unwrap()
      setMessage('Profile updated successfully.')
    } catch (err) {
      setError(err || 'Unable to update profile.')
    }
  }

  const savePassword = async (event) => {
    event.preventDefault()
    setMessage('')
    setError('')
    try {
      await changePassword(passwords)
      setPasswords({ currentPassword: '', newPassword: '' })
      setMessage('Password changed successfully.')
    } catch (err) {
      setError(err.response?.data?.message || 'Unable to change password.')
    }
  }

  const handleLogout = () => {
    dispatch(logout())
    navigate('/login')
  }

  const handleTogglePush = async () => {
    setPushStatusMsg('')
    setPushSuccess(false)
    try {
      if (isPushSubscribed) {
        await disablePushNotifications()
        setPushSuccess(true)
        setPushStatusMsg('System push notifications have been disabled.')
      } else {
        await enablePushNotifications()
        setPushSuccess(true)
        setPushStatusMsg('System screen notifications enabled! You will now receive alerts for loan EMIs and bills even when the app is completely closed.')
      }
    } catch (err) {
      setPushSuccess(false)
      const errorMsg = err.response?.data?.message || err.message || 'Failed to update push notification settings.'
      setPushStatusMsg(errorMsg)
    }
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">{t('profile')}</h2>
        <p className="text-slate-400 dark:text-dark-text-muted text-sm mt-0.5">{t('profileSubtitle')}</p>
      </div>

      {message && <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/50 dark:bg-emerald-950/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">{message}</div>}
      {error && <div className="rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/5 p-3 text-sm text-rose-700 dark:text-rose-400">{error}</div>}

      <div className="grid gap-6 lg:grid-cols-3">
        <section id="profile-card-tour" className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-premium lg:col-span-2 space-y-8">
          {/* User Profile Form */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-4 mb-4">
              <FiUser className="w-5 h-5 text-secondary dark:text-purple-400" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">{t('userProfile')}</h3>
            </div>
            <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase">{t('name')}</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase">{t('email')}</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <button className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary dark:bg-purple-650 px-4 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 transition-colors sm:w-fit mt-2 shadow-md shadow-secondary/15 cursor-pointer">
                <FiCheck className="w-4 h-4" />
                {t('saveChanges')}
              </button>
            </form>
          </div>

          {/* Change Password Form */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-4 mb-4">
              <FiKey className="w-5 h-5 text-secondary dark:text-purple-400" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Security</h3>
            </div>
            <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase">Current Password</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-500 dark:text-dark-text-muted uppercase">New Password</label>
                <input
                  type="password"
                  minLength="6"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="rounded-xl border border-slate-200 dark:border-dark-border px-3 py-2.5 text-sm bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
                  required
                />
              </div>
              <button className="flex items-center justify-center gap-1.5 rounded-xl bg-secondary dark:bg-purple-650 px-4 py-2.5 font-bold text-white text-sm hover:bg-indigo-700 dark:hover:bg-purple-750 transition-colors sm:w-fit mt-2 shadow-md shadow-secondary/15 cursor-pointer">
                <FiKey className="w-4 h-4" />
                Change Password
              </button>
            </form>
          </div>

          {/* Notification Preferences */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-dark-border pb-4 mb-4">
              <FiBell className="w-5 h-5 text-secondary dark:text-purple-400" />
              <h3 className="font-bold text-slate-800 dark:text-white text-base">Notification Preferences</h3>
            </div>

            {pushStatusMsg && (
              <div className={`p-3.5 rounded-xl text-xs font-semibold flex items-start gap-2 ${
                pushSuccess
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/30'
                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-900/30'
              }`}>
                {pushSuccess ? <FiCheck className="shrink-0 mt-0.5 text-sm" /> : <FiAlertCircle className="shrink-0 mt-0.5 text-sm" />}
                <span>{pushStatusMsg}</span>
              </div>
            )}
            
            {/* 1. In-App Pop-up Banner */}
            <div className="p-4 rounded-xl border border-slate-100 dark:border-dark-border bg-slate-50/50 dark:bg-dark-card/50 flex items-center justify-between gap-4">
              <div className="space-y-1">
                <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                  In-App Pop-up Banners
                </h4>
                <p className="text-xs text-slate-400 dark:text-dark-text-muted leading-relaxed max-w-md">
                  Display instant floating banners on screen while browsing the app for loan payments and financial summaries.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPopupEnabled(!popupEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                  popupEnabled ? 'bg-secondary dark:bg-purple-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={popupEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                    popupEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* 2. OS-Level Screen Push Notifications (Works When Closed) */}
            <div className="p-4 rounded-xl border border-indigo-100 dark:border-purple-900/40 bg-gradient-to-br from-indigo-50/40 to-slate-50/30 dark:from-purple-950/20 dark:to-dark-card/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1.5 flex-1">
                <div className="flex items-center gap-2">
                  <FiSmartphone className="text-secondary dark:text-purple-400" />
                  <h4 className="font-bold text-sm text-slate-800 dark:text-slate-200">
                    System Screen Push Alerts (When App Is Closed)
                  </h4>
                  {isPushSubscribed ? (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40">
                      Active
                    </span>
                  ) : (
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-dark-text-muted leading-relaxed max-w-lg">
                  Delivers native Windows desktop banners, macOS alerts, and Android lockscreen notifications for upcoming EMI dates, overdue payments, and recurring bills <strong>even when your browser or app is completely closed</strong>.
                </p>
                {pushPermission === 'denied' && (
                  <p className="text-[11px] text-rose-500 font-semibold">
                    ⚠️ Notifications are currently blocked in your browser. Click the lock/settings icon in your address bar to allow notifications.
                  </p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={pushLoading || !isPushSupported}
                  className={`flex items-center justify-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl transition-all shadow-sm cursor-pointer disabled:opacity-50 ${
                    isPushSubscribed
                      ? 'bg-slate-200 hover:bg-rose-100 hover:text-rose-700 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-rose-950/30 dark:hover:text-rose-400'
                      : 'bg-secondary dark:bg-purple-600 hover:bg-indigo-700 dark:hover:bg-purple-700 text-white shadow-secondary/20'
                  }`}
                >
                  {pushLoading ? (
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                  ) : isPushSubscribed ? (
                    'Disable Alerts'
                  ) : (
                    'Enable Screen Alerts'
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {/* Account statistics */}
          <section className="rounded-2xl border border-slate-100 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-premium h-fit space-y-6">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-dark-border">
              <FiPieChart className="w-5 h-5 text-secondary dark:text-purple-400" />
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Account Stats</h3>
            </div>
            <div className="space-y-4">
              <div className="p-3 rounded-xl border border-slate-50 dark:border-dark-border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Total Actions Logged</span>
                <span className="text-xl font-extrabold text-slate-800 dark:text-white">{stats?.transactionCount || 0}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-50 dark:border-dark-border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Gross Income Total</span>
                <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">{formatCurrency(stats?.totalIncome)}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-50 dark:border-dark-border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Gross Expense Total</span>
                <span className="text-xl font-extrabold text-rose-600 dark:text-rose-400">{formatCurrency(stats?.totalExpense)}</span>
              </div>
              <div className="p-3 rounded-xl border border-slate-50 dark:border-dark-border flex items-center justify-between">
                <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">Total Savings Accumulation</span>
                <span className="text-xl font-extrabold text-indigo-650 dark:text-purple-400">{formatCurrency(stats?.savings)}</span>
              </div>
            </div>
          </section>

          {/* Exit Session / Logout Option */}
          <section className="rounded-2xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/20 dark:bg-rose-950/5 p-6 shadow-premium h-fit space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-rose-100 dark:border-rose-950/20">
              <FiLogOut className="w-5 h-5 text-rose-500" />
              <h3 className="font-bold text-rose-800 dark:text-rose-400 text-lg">Exit Account</h3>
            </div>
            <p className="text-xs text-rose-600/70 dark:text-rose-400/60 font-medium">Log out of your current session on this device. You will need to input your credentials again to log back in.</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-650 hover:bg-rose-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md shadow-rose-600/15 cursor-pointer"
            >
              <FiLogOut className="w-5 h-5" />
              {t('logout')}
            </button>
          </section>
        </div>
      </div>
    </div>
  )
}

export default Profile