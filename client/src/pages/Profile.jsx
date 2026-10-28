import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logout, updateProfileThunk } from '../redux/slices/authSlice'
import { changePassword, getAccountStats, deleteUserAccount } from '../services/authService'
import { formatCurrency } from '../utils/format'
import {
  FiUser, FiKey, FiCheck, FiPieChart, FiLogOut, FiBell,
  FiSmartphone, FiAlertCircle, FiTrash2, FiAlertTriangle, FiShield,
  FiGift, FiCopy, FiShare2, FiUsers
} from 'react-icons/fi'
import { useLanguage } from '../context/LanguageContext'
import { useNotification } from '../context/NotificationContext'
import { getReferralStats } from '../services/referralService'

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
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteConfirmText, setDeleteConfirmText] = useState('')
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleteError, setDeleteError] = useState('')
  const [referralData, setReferralData] = useState(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)

  useEffect(() => {
    if (user) setProfile({ name: user.name, email: user.email })
    getAccountStats().then((response) => setStats(response.data.data))
    
    // Fetch latest referral data
    getReferralStats()
      .then((res) => {
        if (res.data?.data) {
          setReferralData(res.data.data)
        }
      })
      .catch(() => {
        if (user?.referral) {
          setReferralData(user.referral)
        }
      })
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

  const handleDeleteAccount = async () => {
    if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
      setDeleteError('Please type DELETE to confirm.')
      return
    }
    setDeleteLoading(true)
    setDeleteError('')
    try {
      await deleteUserAccount()
      localStorage.clear()
      sessionStorage.clear()
      dispatch(logout())
      navigate('/signup')
    } catch (err) {
      setDeleteLoading(false)
      setDeleteError(err.response?.data?.message || err.message || 'Failed to delete account. Please try again.')
    }
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

  const referralCode = referralData?.referralCode || user?.referral?.referralCode || 'XPENZ'
  const referralCount = referralData?.referralCount ?? user?.referral?.referralCount ?? 0
  const discountPercent = referralData?.discountPercent ?? user?.referral?.discountPercent ?? 0
  const inviteLink = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${referralCode}` : `https://xpenz.app/signup?ref=${referralCode}`

  const handleCopyCode = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(referralCode)
      } else {
        const input = document.createElement('input')
        input.value = referralCode
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch (e) {
      // ignore
    }
  }

  const handleCopyLink = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(inviteLink)
      } else {
        const input = document.createElement('input')
        input.value = inviteLink
        document.body.appendChild(input)
        input.select()
        document.execCommand('copy')
        document.body.removeChild(input)
      }
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch (e) {
      // ignore
    }
  }

  const handleShareWhatsApp = () => {
    const text = `Hey! Track your daily budgets, expenses, and bank accounts on Xpenz. Use my invite code "${referralCode}" to get 10 DAYS EXTRA FREE TRIAL (70 Days Total)! Sign up here: ${inviteLink}`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100">
      <div>
        <h2 className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">{t('profile')}</h2>
        <p className="text-slate-400 dark:text-dark-text-muted text-sm mt-0.5">{t('profileSubtitle')}</p>
      </div>

      {message && <div className="rounded-xl border border-emerald-100 dark:border-emerald-950/20 bg-emerald-50/50 dark:bg-emerald-950/5 p-3 text-sm text-emerald-700 dark:text-emerald-400">{message}</div>}
      {error && <div className="rounded-xl border border-rose-100 dark:border-rose-950/20 bg-rose-50/50 dark:bg-rose-950/5 p-3 text-sm text-rose-700 dark:text-rose-400">{error}</div>}

      {/* 🎁 Refer & Earn Rewards Card */}
      <section className="rounded-3xl border border-secondary/20 dark:border-purple-900/40 bg-gradient-to-br from-indigo-50/70 via-purple-50/40 to-white dark:from-[#151329] dark:via-[#121223] dark:to-dark-card p-6 sm:p-7 shadow-premium relative overflow-hidden">
        {/* Glow decoration */}
        <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-gradient-to-br from-secondary/15 to-purple-500/10 blur-3xl pointer-events-none" />
        
        <div className="relative z-10 space-y-6">
          {/* Header Row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-secondary/10 dark:bg-purple-900/30 border border-secondary/20 flex items-center justify-center text-secondary dark:text-purple-400 shrink-0 shadow-inner">
                <FiGift className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                    Refer & Earn Rewards
                  </h3>
                  {discountPercent > 0 && (
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-500 text-white shadow-sm animate-pulse">
                      {discountPercent}% OFF Active
                    </span>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                  Give friends <span className="font-bold text-secondary dark:text-purple-400">+10 Days Extra Free Trial</span> (70 Days Total). Earn <span className="font-bold text-emerald-600 dark:text-emerald-400">5% OFF</span> per friend up to 25% OFF your next plan upgrade!
                </p>
              </div>
            </div>

            {/* Quick Share on WhatsApp */}
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
              >
                <FiShare2 className="w-3.5 h-3.5" />
                Share on WhatsApp
              </button>
            </div>
          </div>

          {/* Referral Code & Link Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
            {/* Code Box */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-card/90 border border-slate-200/80 dark:border-dark-border shadow-sm flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
                  Your Referral Code
                </span>
                <p className="text-lg font-black font-mono tracking-wider text-slate-900 dark:text-white mt-0.5">
                  {referralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold transition-colors cursor-pointer"
              >
                {copiedCode ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied!' : 'Copy Code'}
              </button>
            </div>

            {/* Link Box */}
            <div className="p-4 rounded-2xl bg-white/80 dark:bg-dark-card/90 border border-slate-200/80 dark:border-dark-border shadow-sm flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
                  Your Personal Invite Link
                </span>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5 font-mono">
                  {inviteLink}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-secondary/10 hover:bg-secondary/20 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-secondary dark:text-purple-300 text-xs font-bold transition-colors shrink-0 cursor-pointer"
              >
                {copiedLink ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied!' : 'Copy Link'}
              </button>
            </div>
          </div>

          {/* 5-Step Escalator Tier Progress Bar */}
          <div className="p-4.5 rounded-2xl bg-white/60 dark:bg-dark-card/60 border border-slate-200/60 dark:border-dark-border/60 space-y-3">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <FiUsers className="w-3.5 h-3.5 text-secondary dark:text-purple-400" />
                Referral Tier Escalator ({referralCount}/5 Friends Referred)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400">
                {discountPercent}% Discount Earned
              </span>
            </div>

            {/* Visual Step Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const discount = step * 5;
                const isReached = referralCount >= step;
                return (
                  <div
                    key={step}
                    className={`p-2.5 rounded-xl border text-center transition-all ${
                      isReached
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 shadow-sm'
                        : 'border-slate-200/80 dark:border-dark-border bg-slate-50/50 dark:bg-dark-bg/40 text-slate-400 dark:text-slate-500'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-1">
                      {isReached ? (
                        <FiCheck className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] font-bold">Step {step}</span>
                      )}
                    </div>
                    <p className={`text-xs font-black ${isReached ? 'text-emerald-600 dark:text-emerald-400' : ''}`}>
                      {discount}% OFF
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {step} Friend{step > 1 ? 's' : ''}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Progress Track */}
            <div className="w-full bg-slate-200 dark:bg-dark-bg h-2 rounded-full overflow-hidden">
              <div
                className="bg-gradient-to-r from-secondary to-emerald-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min((referralCount / 5) * 100, 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-400 dark:text-dark-text-muted text-center sm:text-left">
              💡 <em>Friends receive 70 days free trial immediately upon signup with your code. Your discount applies automatically as a one-time reward on your next Pro plan upgrade.</em>
            </p>
          </div>

          {/* Referred Friends List */}
          {referralData?.friendsReferred && referralData.friendsReferred.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200/60 dark:border-dark-border/60">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-dark-text-muted">
                Friends Who Joined ({referralData.friendsReferred.length}):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {referralData.friendsReferred.map((friend, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-slate-800 dark:text-white truncate">
                        {friend.name || 'Friend'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {friend.email ? friend.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Registered'}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-extrabold text-[11px] shrink-0">
                      +5% OFF
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

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
          <section className="rounded-2xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card p-6 shadow-premium h-fit space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-slate-100 dark:border-dark-border">
              <FiLogOut className="w-5 h-5 text-slate-500" />
              <h3 className="font-bold text-slate-800 dark:text-white text-lg">Exit Account</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-dark-text-muted font-medium">Log out of your current session on this device. You will need to input your credentials again to log back in.</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-700 hover:bg-slate-850 dark:bg-slate-800 dark:hover:bg-slate-700 text-white rounded-xl font-semibold text-sm transition-all duration-200 shadow-md cursor-pointer"
            >
              <FiLogOut className="w-5 h-5" />
              {t('logout')}
            </button>
          </section>

          {/* Danger Zone: Account & Data Deletion (Google Play Compliance) */}
          <section className="rounded-2xl border border-rose-200 dark:border-rose-950/40 bg-rose-50/20 dark:bg-rose-950/10 p-6 shadow-premium h-fit space-y-4">
            <div className="flex items-center gap-2 pb-4 border-b border-rose-100 dark:border-rose-950/30">
              <FiAlertTriangle className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              <h3 className="font-bold text-rose-900 dark:text-rose-300 text-lg">Danger Zone</h3>
            </div>
            <div>
              <h4 className="text-sm font-bold text-rose-800 dark:text-rose-300">Delete Account & Personal Data</h4>
              <p className="text-xs text-rose-700/70 dark:text-rose-400/60 mt-1 leading-relaxed">
                Permanently purges your account profile, transaction entries, bank records, and budgets from our database. Meets Google Play Store User Data Compliance.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmText('')
                setDeleteError('')
                setShowDeleteModal(true)
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-bold text-xs uppercase tracking-wider transition-all shadow-md shadow-rose-600/20 cursor-pointer"
            >
              <FiTrash2 className="w-4 h-4" />
              Delete Account & All Data
            </button>

            <div className="pt-2 border-t border-rose-100 dark:border-rose-950/30 flex justify-center">
              <Link
                to="/privacy"
                className="text-xs text-slate-500 hover:text-secondary dark:text-slate-400 dark:hover:text-purple-400 font-semibold underline transition-colors"
              >
                Privacy Policy & Data Retention Policy
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Google Play Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md bg-white dark:bg-[#11131f] border border-rose-200 dark:border-rose-900/40 rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-2xl bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 shrink-0">
                <FiAlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-lg text-slate-900 dark:text-white">Delete Account & Wipe Data?</h3>
                <p className="text-xs text-rose-600 dark:text-rose-400 font-bold mt-0.5">Google Play Data Erasure Standard</p>
              </div>
            </div>

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/20 border border-rose-100 dark:border-rose-900/30 text-xs text-rose-800 dark:text-rose-300 space-y-1.5 leading-relaxed">
              <p className="font-bold">This action cannot be undone. It immediately deletes:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px]">
                <li>All transaction records and income/expense ledgers</li>
                <li>Linked bank accounts and balance totals</li>
                <li>Monthly and daily budget targets</li>
                <li>Active loans, EMI schedules, and push notification tokens</li>
                <li>Your credentials and authenticated session</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-3 rounded-xl bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-xs font-semibold">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Type <span className="font-mono text-rose-600 font-extrabold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border bg-slate-50 dark:bg-dark-bg text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-rose-500 uppercase tracking-widest text-center"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-dark-border text-slate-600 dark:text-slate-400 font-bold text-xs hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || deleteLoading}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5 shadow-md shadow-rose-600/20"
              >
                {deleteLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiTrash2 className="w-3.5 h-3.5" />
                )}
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile