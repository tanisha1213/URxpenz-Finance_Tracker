import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { forgotPassword, resetPassword } from '../services/authService'
import { useTheme } from '../context/ThemeContext'
import { motion, AnimatePresence } from 'framer-motion'
import { FiMail, FiArrowLeft, FiAlertCircle, FiCheckCircle, FiLock, FiEye, FiEyeOff, FiKey } from 'react-icons/fi'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'

function Forgot() {
  const [step, setStep] = useState('email') // 'email' | 'reset' | 'complete'
  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [resetToken, setResetToken] = useState('')
  const [emailSent, setEmailSent] = useState(false)
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMessage, setSuccessMessage] = useState('')
  
  const { theme } = useTheme()
  const navigate = useNavigate()

  // Step 1: Submit registered email
  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      return setError('Please enter your registered email address')
    }

    setLoading(true)
    try {
      const response = await forgotPassword({ email: trimmedEmail })
      if (response.data.success) {
        setSubmittedEmail(trimmedEmail)
        setEmailSent(!!response.data.emailSent)
        
        if (response.data.resetToken) {
          setResetToken(response.data.resetToken)
          setStep('reset')
        } else {
          // Fallback if token wasn't returned
          setStep('complete')
          setSuccessMessage(response.data.message || 'Please check your inbox for reset instructions.')
        }
      } else {
        setError(response.data.message || 'Unable to process request. Please try again.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Unable to process password reset request. Please check your connection and try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  // Step 2: In-App Password Reset
  const handlePasswordResetSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!newPassword || newPassword.length < 6) {
      return setError('Password must be at least 6 characters long')
    }

    if (newPassword !== confirmPassword) {
      return setError('Passwords do not match')
    }

    setLoading(true)
    try {
      const response = await resetPassword(resetToken, { password: newPassword })
      if (response.data.success) {
        setStep('complete')
        setSuccessMessage('Password reset successfully! Redirecting you to login...')
        setTimeout(() => {
          navigate('/login')
        }, 2200)
      } else {
        setError(response.data.message || 'Failed to update password. Please try again.')
      }
    } catch (err) {
      setError(
        err.response?.data?.message || 
        'Unable to update password. The session may have expired. Please try again.'
      )
    } finally {
      setLoading(false)
    }
  }

  const handleStartOver = () => {
    setStep('email')
    setEmail('')
    setSubmittedEmail('')
    setResetToken('')
    setNewPassword('')
    setConfirmPassword('')
    setError('')
    setSuccessMessage('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-card flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md relative overflow-hidden">
        
        {/* Header decoration bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-indigo-650 dark:from-purple-650 dark:to-pink-650"></div>

        <div className="flex flex-col items-center mb-6">
          <img src={theme === 'light' ? logoLight : logoDark} alt="URxpenz Logo" className="w-16 h-16 rounded-2xl object-contain shadow-lg mb-3" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white tracking-tight">
            {step === 'reset' ? 'Set New Password' : step === 'complete' ? 'Success!' : 'Forgot Password'}
          </h1>
          <p className="text-[10px] text-slate-400 dark:text-dark-text-muted mt-1 uppercase font-bold tracking-wider">AI Personal Finance</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-red-50 border border-red-200 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-400 px-4 py-3 rounded-xl mb-5 text-sm font-medium"
          >
            <FiAlertCircle className="shrink-0 mt-0.5 text-base" />
            <span className="leading-snug">{error}</span>
          </motion.div>
        )}

        <AnimatePresence mode="wait">
          {/* STEP 1: ENTER REGISTERED EMAIL */}
          {step === 'email' && (
            <motion.form 
              key="step-email"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handleEmailSubmit} 
              className="space-y-4"
            >
              <p className="text-sm text-slate-500 dark:text-dark-text-muted leading-relaxed">
                Enter your registered email address. You will be able to reset your password directly here.
              </p>
              
              <div className="space-y-1">
                <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">Email Address</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-dark-text-muted">
                    <FiMail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="e.g. yourname@gmail.com"
                    className="w-full pl-10 pr-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:border-secondary transition-all"
                    required
                    autoFocus
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary dark:bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-750 dark:hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-secondary/15 dark:shadow-purple-600/10 mt-6 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <FiKey className="w-4 h-4" />
                    <span>Reset Password</span>
                  </>
                )}
              </button>

              <p className="text-center pt-2 text-sm text-slate-500 dark:text-dark-text-muted flex items-center justify-center gap-1.5">
                <FiArrowLeft className="w-3.5 h-3.5" />
                <span>Back to</span>
                <Link to="/login" className="text-secondary dark:text-purple-400 font-bold hover:underline">
                  Login
                </Link>
              </p>
            </motion.form>
          )}

          {/* STEP 2: SET NEW PASSWORD DIRECTLY IN-APP */}
          {step === 'reset' && (
            <motion.form 
              key="step-reset"
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 15 }}
              onSubmit={handlePasswordResetSubmit} 
              className="space-y-4"
            >
              <div className="w-full bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800/40 p-3 rounded-xl flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 min-w-0">
                  <FiCheckCircle className="text-emerald-500 shrink-0 w-4 h-4" />
                  <span className="truncate text-slate-700 dark:text-slate-300 font-medium">{submittedEmail}</span>
                </div>
                <button
                  type="button"
                  onClick={handleStartOver}
                  className="text-[11px] text-secondary dark:text-purple-400 font-bold hover:underline shrink-0 ml-2"
                >
                  Change
                </button>
              </div>

              {emailSent && (
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  A confirmation link was also dispatched to your inbox. You can complete the reset right here:
                </p>
              )}

              <div className="space-y-1">
                <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-dark-text-muted">
                    <FiLock className="w-4 h-4" />
                  </span>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimum 6 characters"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:border-secondary transition-all"
                    required
                    minLength={6}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">Confirm New Password</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400 dark:text-dark-text-muted">
                    <FiLock className="w-4 h-4" />
                  </span>
                  <input
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Re-enter your new password"
                    className="w-full pl-10 pr-10 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:border-secondary transition-all"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                  >
                    {showConfirmPassword ? <FiEyeOff className="w-4 h-4" /> : <FiEye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-secondary dark:bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-750 dark:hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-secondary/15 dark:shadow-purple-600/10 mt-6 flex items-center justify-center gap-2 cursor-pointer"
              >
                {loading ? (
                  <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                ) : (
                  <>
                    <FiCheckCircle className="w-4 h-4" />
                    <span>Save New Password</span>
                  </>
                )}
              </button>

              <p className="text-center pt-2 text-sm text-slate-500 dark:text-dark-text-muted flex items-center justify-center gap-1.5">
                <FiArrowLeft className="w-3.5 h-3.5" />
                <span>Back to</span>
                <Link to="/login" className="text-secondary dark:text-purple-400 font-bold hover:underline">
                  Login
                </Link>
              </p>
            </motion.form>
          )}

          {/* STEP 3: SUCCESS CONFIRMATION */}
          {step === 'complete' && (
            <motion.div
              key="step-complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col items-center text-center space-y-4"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-inner mb-1">
                <FiCheckCircle />
              </div>

              <h2 className="text-xl font-bold text-slate-850 dark:text-white">
                Password Updated!
              </h2>

              <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed px-1">
                {successMessage || 'Your password has been reset successfully. Redirecting you to login...'}
              </p>

              <div className="w-full pt-3">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="w-full bg-secondary dark:bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-750 dark:hover:bg-purple-700 transition-all shadow-md shadow-secondary/15 dark:shadow-purple-600/10 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Go to Login Now</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

      </div>
    </div>
  )
}

export default Forgot
