import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { useNavigate, Link } from 'react-router-dom'
import { logout, updateProfileThunk } from '../redux/slices/authSlice'
import { changePassword, getAccountStats, deleteUserAccount } from '../services/authService'
import { formatCurrency } from '../utils/format'
import {
  FiUser, FiKey, FiCheck, FiPieChart, FiLogOut, FiBell,
  FiSmartphone, FiAlertCircle, FiTrash2, FiAlertTriangle, FiShield,
  FiGift, FiCopy, FiShare2, FiUsers, FiZap, FiAward
} from 'react-icons/fi'
import { useLanguage } from '../context/LanguageContext'
import { useNotification } from '../context/NotificationContext'
import { useSubscription } from '../context/SubscriptionContext'
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
  const {
    tier,
    isTrial,
    trialDaysRemaining,
    isPro,
    limits,
    openUpgradeModal
  } = useSubscription()
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
    if (window.location.hash === '#referral-section') {
      const el = document.getElementById('referral-section')
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 150)
      }
    }
  }, [])

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

  const referralCode = referralData?.referralCode || user?.referral?.referralCode || 'URXPENZ'
  const referralCount = referralData?.referralCount ?? user?.referral?.referralCount ?? 0
  const discountPercent = referralData?.discountPercent ?? user?.referral?.discountPercent ?? 0

  // Always use the live production URL for invite links shared with friends
  const liveDomain = 'https://urxpenz-finance-tracker.vercel.app'
  const currentOrigin = typeof window !== 'undefined' && window.location.origin ? window.location.origin : ''
  const isLocalHost = !currentOrigin || currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1') || currentOrigin.includes('capacitor:')
  const inviteBaseUrl = isLocalHost ? liveDomain : currentOrigin
  const inviteLink = `${inviteBaseUrl}/signup?ref=${referralCode}`

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
    const text = `Hey! Track your daily budgets, expenses, and bank accounts on URxpenz. Use my invite code "${referralCode}" to get 10 DAYS EXTRA FREE TRIAL (70 Days Total)! Sign up here: ${inviteLink}`
    const url = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`
    window.open(url, '_blank')
  }

  return (
    <div className="space-y-6 text-slate-800 dark:text-slate-100 max-w-6xl">
      <div>
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">Account settings</h2>
        <p className="text-slate-500 dark:text-slate-400 text-xs mt-0.5">Manage personal details, security, and notification preferences.</p>
      </div>

      {message && <div className="rounded-lg border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50 dark:bg-emerald-950/20 p-3 text-xs text-emerald-800 dark:text-emerald-300 font-medium">{message}</div>}
      {error && <div className="rounded-lg border border-rose-200 dark:border-rose-900/40 bg-rose-50 dark:bg-rose-950/20 p-3 text-xs text-rose-800 dark:text-rose-300 font-medium">{error}</div>}

      {/* Subscription & Membership Plan Card */}
      <section className="rounded-3xl border border-slate-100 dark:border-slate-800/80 bg-white dark:bg-gradient-to-b dark:from-[#131522] dark:to-[#0d0f17] p-5 sm:p-6 shadow-premium">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border ${
              isTrial
                ? 'bg-amber-500/10 border-amber-500/20 text-amber-500'
                : tier === 'basic'
                ? 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-900/40 text-indigo-600 dark:text-indigo-400'
                : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
            }`}>
              {isTrial ? <FiZap className="w-5 h-5" /> : <FiAward className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Subscription plan
                </h3>
                {isTrial ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-amber-500/10 border border-amber-500/30 text-amber-600 dark:text-amber-400">
                    Free trial ({trialDaysRemaining}d remaining)
                  </span>
                ) : tier === 'basic' ? (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                    Basic tier (Free)
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    Pro member
                  </span>
                )}
                {discountPercent > 0 && (
                  <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                    {discountPercent}% referral discount ready
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xl">
                {isTrial
                  ? 'You have unrestricted access to all Pro features during your trial period. Upgrade anytime to lock in your discounted rate.'
                  : tier === 'basic'
                  ? 'Your current free tier is limited to 1 bank account, 1 loan, and 2 recurring subscriptions. Upgrade to unlock unlimited tracking.'
                  : 'You have full access to unlimited bank accounts, loans, statement exports, and daily budget alerts.'}
              </p>
            </div>
          </div>

          <div className="shrink-0 sm:self-center">
            <button
              type="button"
              onClick={() => openUpgradeModal()}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl btn-primary text-white text-xs font-semibold cursor-pointer"
            >
              <FiAward className="w-3.5 h-3.5" />
              {tier === 'basic' ? 'Upgrade to Pro (from ₹45)' : isTrial ? 'View subscription plans' : 'Manage plan'}
            </button>
          </div>
        </div>

        {/* Feature status strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-[#222634] grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634]">
            <span className="text-[10px] text-slate-400 block font-medium">Bank accounts</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{isPro ? 'Unlimited' : `${limits.maxAccounts} account`}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634]">
            <span className="text-[10px] text-slate-400 block font-medium">Active loans & EMIs</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{isPro ? 'Unlimited' : `${limits.maxLoans} loan`}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634]">
            <span className="text-[10px] text-slate-400 block font-medium">Recurring subs</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{isPro ? 'Unlimited' : `${limits.maxSubscriptions} subs`}</span>
          </div>
          <div className="p-2.5 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634]">
            <span className="text-[10px] text-slate-400 block font-medium">Reports & alerts</span>
            <span className="font-semibold text-slate-800 dark:text-slate-200">{isPro ? 'Full access' : 'Basic only'}</span>
          </div>
        </div>
      </section>

      {/* Referral program */}
      <section id="referral-section" className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 sm:p-6 scroll-mt-20">
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0">
                <FiGift className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Referral program
                  </h3>
                  {discountPercent > 0 && (
                    <span className="px-2 py-0.5 rounded text-[11px] font-semibold bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400">
                      {discountPercent}% discount active
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Friends receive 70 days of free trial (10 days extra). You get 5% off on your next plan upgrade for each friend who signs up, up to 25% total.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleShareWhatsApp}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-[#1da851] hover:bg-[#168840] text-white text-xs font-semibold transition-colors cursor-pointer"
              >
                <FiShare2 className="w-3.5 h-3.5" />
                Share on WhatsApp
              </button>
            </div>
          </div>

          {/* Referral Code & Link Box */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634] flex items-center justify-between gap-3">
              <div>
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Your referral code
                </span>
                <p className="text-base font-semibold font-mono tracking-wider text-slate-900 dark:text-white mt-0.5">
                  {referralCode}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#2a2f42] text-slate-700 dark:text-slate-200 text-xs font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                {copiedCode ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                {copiedCode ? 'Copied' : 'Copy code'}
              </button>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634] flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
                  Invite link
                </span>
                <p className="text-xs text-slate-600 dark:text-slate-300 truncate mt-0.5 font-mono">
                  {inviteLink}
                </p>
              </div>
              <button
                type="button"
                onClick={handleCopyLink}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-200 dark:border-indigo-900/40 text-indigo-700 dark:text-indigo-300 text-xs font-medium hover:bg-indigo-100 dark:hover:bg-indigo-900/60 transition-colors shrink-0 cursor-pointer"
              >
                {copiedLink ? <FiCheck className="w-3.5 h-3.5 text-emerald-500" /> : <FiCopy className="w-3.5 h-3.5" />}
                {copiedLink ? 'Copied' : 'Copy link'}
              </button>
            </div>
          </div>

          {/* 5-Step Escalator */}
          <div className="p-4 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634] space-y-3">
            <div className="flex items-center justify-between text-xs font-medium">
              <span className="text-slate-600 dark:text-slate-300 flex items-center gap-1.5">
                <FiUsers className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                Referral tiers ({referralCount}/5 friends)
              </span>
              <span className="text-emerald-600 dark:text-emerald-400 font-semibold">
                {discountPercent}% current discount
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map((step) => {
                const discount = step * 5;
                const isReached = referralCount >= step;
                return (
                  <div
                    key={step}
                    className={`p-2.5 rounded-lg border text-center transition-colors ${
                      isReached
                        ? 'border-emerald-500/40 bg-emerald-50 dark:bg-emerald-950/20 text-emerald-800 dark:text-emerald-300'
                        : 'border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] text-slate-500 dark:text-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-1 mb-0.5">
                      {isReached ? (
                        <FiCheck className="w-3 h-3 text-emerald-500" />
                      ) : (
                        <span className="text-[10px] font-medium text-slate-400">Step {step}</span>
                      )}
                    </div>
                    <p className={`text-xs font-bold ${isReached ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-800 dark:text-slate-200'}`}>
                      {discount}% off
                    </p>
                    <p className="text-[10px] text-slate-400 mt-0.5">
                      {step} friend{step > 1 ? 's' : ''}
                    </p>
                  </div>
                );
              })}
            </div>

            <div className="w-full bg-slate-200 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                style={{ width: `${Math.min((referralCount / 5) * 100, 100)}%` }}
              />
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              Discounts apply once automatically on your next plan upgrade. Maximum 5 referrals.
            </p>
          </div>

          {/* Referred Friends List */}
          {referralData?.friendsReferred && referralData.friendsReferred.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-200 dark:border-[#222634]">
              <h4 className="text-xs font-semibold text-slate-500 dark:text-slate-400">
                Referred accounts ({referralData.friendsReferred.length}):
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                {referralData.friendsReferred.map((friend, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-lg bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] flex items-center justify-between text-xs"
                  >
                    <div className="min-w-0 pr-2">
                      <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                        {friend.name || 'Friend'}
                      </p>
                      <p className="text-[10px] text-slate-400">
                        {friend.email ? friend.email.replace(/(.{2})(.*)(@.*)/, '$1***$3') : 'Registered'}
                      </p>
                    </div>
                    <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-semibold text-[11px] shrink-0">
                      +5% off
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-3">
        <section id="profile-card-tour" className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 sm:p-6 lg:col-span-2 space-y-7">
          {/* Personal details */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#222634] pb-3 mb-4">
              <FiUser className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Personal details</h3>
            </div>
            <form onSubmit={saveProfile} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Name</label>
                <input
                  value={profile.name}
                  onChange={(e) => setProfile({ ...profile, name: e.target.value })}
                  className="rounded-lg border border-slate-200 dark:border-[#2a2f42] px-3 py-2 text-sm bg-white dark:bg-[#191c26] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Email address</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="rounded-lg border border-slate-200 dark:border-[#2a2f42] px-3 py-2 text-sm bg-white dark:bg-[#191c26] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
              <button className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white text-xs hover:bg-indigo-500 transition-colors sm:w-fit mt-1 cursor-pointer">
                <FiCheck className="w-3.5 h-3.5" />
                Save changes
              </button>
            </form>
          </div>

          {/* Password & Security */}
          <div>
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#222634] pb-3 mb-4">
              <FiKey className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Password & security</h3>
            </div>
            <form onSubmit={savePassword} className="grid gap-4 sm:grid-cols-2">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">Current password</label>
                <input
                  type="password"
                  value={passwords.currentPassword}
                  onChange={(e) => setPasswords({ ...passwords, currentPassword: e.target.value })}
                  className="rounded-lg border border-slate-200 dark:border-[#2a2f42] px-3 py-2 text-sm bg-white dark:bg-[#191c26] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-slate-500 dark:text-slate-400">New password</label>
                <input
                  type="password"
                  minLength="6"
                  value={passwords.newPassword}
                  onChange={(e) => setPasswords({ ...passwords, newPassword: e.target.value })}
                  className="rounded-lg border border-slate-200 dark:border-[#2a2f42] px-3 py-2 text-sm bg-white dark:bg-[#191c26] text-slate-800 dark:text-slate-200 focus:outline-none focus:border-indigo-600"
                  required
                />
              </div>
              <button className="flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-4 py-2 font-medium text-white text-xs hover:bg-indigo-500 transition-colors sm:w-fit mt-1 cursor-pointer">
                <FiKey className="w-3.5 h-3.5" />
                Update password
              </button>
            </form>
          </div>

          {/* Notification settings */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-[#222634] pb-3 mb-4">
              <FiBell className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Notification settings</h3>
            </div>

            {pushStatusMsg && (
              <div className={`p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${
                pushSuccess
                  ? 'bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900/40'
                  : 'bg-rose-50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/40'
              }`}>
                {pushSuccess ? <FiCheck className="shrink-0 mt-0.5 text-sm" /> : <FiAlertCircle className="shrink-0 mt-0.5 text-sm" />}
                <span>{pushStatusMsg}</span>
              </div>
            )}
            
            <div className="p-4 rounded-lg border border-slate-200 dark:border-[#222634] bg-slate-50/50 dark:bg-[#191c26]/50 flex items-center justify-between gap-4">
              <div>
                <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                  In-app banners
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-normal max-w-md">
                  Display floating alerts on screen for loan dues and budget thresholds while browsing the app.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setPopupEnabled(!popupEnabled)}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-150 focus:outline-none ${
                  popupEnabled ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-700'
                }`}
                role="switch"
                aria-checked={popupEnabled}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white transition duration-150 ${
                    popupEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            <div className="p-4 rounded-lg border border-slate-200 dark:border-[#222634] bg-slate-50/50 dark:bg-[#191c26]/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2">
                  <FiSmartphone className="text-slate-500 dark:text-slate-400" />
                  <h4 className="font-semibold text-sm text-slate-800 dark:text-slate-200">
                    System push notifications
                  </h4>
                  {isPushSubscribed ? (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400">
                      Active
                    </span>
                  ) : (
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      Disabled
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-normal max-w-lg">
                  Receive device alerts for upcoming EMI dates, overdue payments, and bill reminders even when the app is closed.
                </p>
                {pushPermission === 'denied' && (
                  <p className="text-[11px] text-rose-500 font-medium">
                    Notifications are blocked in your browser settings. Allow notifications to enable this.
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  type="button"
                  onClick={handleTogglePush}
                  disabled={pushLoading || !isPushSupported}
                  className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors cursor-pointer disabled:opacity-50 ${
                    isPushSubscribed
                      ? 'bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                      : 'bg-indigo-600 hover:bg-indigo-500 text-white'
                  }`}
                >
                  {pushLoading ? (
                    <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-current border-t-transparent" />
                  ) : isPushSubscribed ? (
                    'Disable'
                  ) : (
                    'Enable'
                  )}
                </button>
              </div>
            </div>
          </div>
        </section>

        <div className="flex flex-col gap-6">
          {/* Account overview */}
          <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 h-fit space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#222634]">
              <FiPieChart className="w-4 h-4 text-slate-500 dark:text-slate-400" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Account overview</h3>
            </div>
            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg border border-slate-100 dark:border-[#222634] flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total entries</span>
                <span className="text-base font-semibold text-slate-800 dark:text-white font-mono">{stats?.transactionCount || 0}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 dark:border-[#222634] flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total income</span>
                <span className="text-base font-semibold text-emerald-600 dark:text-emerald-400 font-mono">{formatCurrency(stats?.totalIncome)}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 dark:border-[#222634] flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Total expenses</span>
                <span className="text-base font-semibold text-rose-600 dark:text-rose-400 font-mono">{formatCurrency(stats?.totalExpense)}</span>
              </div>
              <div className="p-2.5 rounded-lg border border-slate-100 dark:border-[#222634] flex items-center justify-between">
                <span className="text-xs text-slate-500 dark:text-slate-400">Net savings</span>
                <span className="text-base font-semibold text-indigo-600 dark:text-indigo-400 font-mono">{formatCurrency(stats?.savings)}</span>
              </div>
            </div>
          </section>

          {/* Session */}
          <section className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-5 h-fit space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-100 dark:border-[#222634]">
              <FiLogOut className="w-4 h-4 text-slate-500" />
              <h3 className="font-semibold text-slate-900 dark:text-white text-sm">Session</h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400">End your current session on this device.</p>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-3 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FiLogOut className="w-4 h-4" />
              Sign out
            </button>
          </section>

          {/* Danger Zone: Account Deletion */}
          <section className="rounded-xl border border-rose-200 dark:border-rose-900/40 bg-rose-50/20 dark:bg-rose-950/10 p-5 h-fit space-y-3">
            <div className="flex items-center gap-2 pb-3 border-b border-rose-100 dark:border-rose-900/30">
              <FiAlertTriangle className="w-4 h-4 text-rose-600 dark:text-rose-400" />
              <h3 className="font-semibold text-rose-900 dark:text-rose-300 text-sm">Delete account</h3>
            </div>
            <div>
              <p className="text-xs text-rose-700/80 dark:text-rose-400/80 leading-normal">
                Permanently removes your account profile, transaction entries, bank records, and budgets.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setDeleteConfirmText('')
                setDeleteError('')
                setShowDeleteModal(true)
              }}
              className="w-full flex items-center justify-center gap-1.5 px-3 py-2 bg-rose-600 hover:bg-rose-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
            >
              <FiTrash2 className="w-3.5 h-3.5" />
              Delete account & data
            </button>

            <div className="pt-2 border-t border-rose-100 dark:border-rose-900/30 flex justify-center">
              <Link
                to="/privacy"
                className="text-[11px] text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white underline transition-colors"
              >
                Privacy policy & data retention
              </Link>
            </div>
          </section>
        </div>
      </div>

      {/* Account Deletion Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
          <div className="w-full max-w-md bg-white dark:bg-[#14161f] border border-rose-200 dark:border-rose-900/40 rounded-xl p-5 space-y-4">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-lg bg-rose-100 dark:bg-rose-950/40 flex items-center justify-center text-rose-600 shrink-0">
                <FiAlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">Delete account and data</h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">This action is irreversible.</p>
              </div>
            </div>

            <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634] text-xs text-slate-600 dark:text-slate-300 space-y-1">
              <p className="font-semibold text-slate-800 dark:text-slate-200">The following data will be permanently erased:</p>
              <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-slate-500 dark:text-slate-400">
                <li>All transaction records and income/expense ledgers</li>
                <li>Linked bank accounts and balance totals</li>
                <li>Monthly and daily budgets</li>
                <li>Active loans, EMI schedules, and push tokens</li>
              </ul>
            </div>

            {deleteError && (
              <div className="p-2.5 rounded-md bg-red-100 text-red-700 dark:bg-red-950/30 dark:text-red-400 text-xs">
                {deleteError}
              </div>
            )}

            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Type <span className="font-mono text-rose-600 font-bold">DELETE</span> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                placeholder="DELETE"
                className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-[#2a2f42] bg-white dark:bg-[#191c26] text-slate-800 dark:text-white font-mono text-sm focus:outline-none focus:border-rose-500 uppercase tracking-widest text-center"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <button
                type="button"
                onClick={() => setShowDeleteModal(false)}
                disabled={deleteLoading}
                className="btn-ghost flex-1 px-3 py-2 rounded-xl font-medium text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteAccount}
                disabled={deleteConfirmText.trim().toUpperCase() !== 'DELETE' || deleteLoading}
                className="flex-1 px-3 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-medium text-xs transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer flex items-center justify-center gap-1.5"
              >
                {deleteLoading ? (
                  <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FiTrash2 className="w-3.5 h-3.5" />
                )}
                Delete account
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default Profile