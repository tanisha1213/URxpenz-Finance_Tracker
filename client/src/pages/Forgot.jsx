import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../services/authService'
import { useTheme } from '../context/ThemeContext'
import { motion } from 'framer-motion'
import { FiMail, FiArrowLeft, FiAlertCircle, FiCheckCircle, FiSend } from 'react-icons/fi'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'

function Forgot() {
  const [email, setEmail] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const { theme } = useTheme()

  const handleSubmit = async (e) => {
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
        setIsSuccess(true)
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

  const handleResetForm = () => {
    setIsSuccess(false)
    setEmail('')
    setSubmittedEmail('')
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-card flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md relative overflow-hidden">
        
        {/* Header decoration bar */}
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-secondary to-indigo-650 dark:from-purple-650 dark:to-pink-650"></div>

        <div className="flex flex-col items-center mb-6">
          <img src={theme === 'light' ? logoLight : logoDark} alt="URxpenz Logo" className="w-16 h-16 rounded-2xl object-contain shadow-lg mb-3" />
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-850 dark:text-white tracking-tight">
            Forgot Password
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

        {isSuccess ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center space-y-4"
          >
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-inner mb-1">
              <FiCheckCircle />
            </div>

            <h2 className="text-xl font-bold text-slate-850 dark:text-white">
              Check Your Inbox
            </h2>

            <p className="text-sm text-slate-650 dark:text-slate-300 leading-relaxed px-1">
              We've dispatched a secure password reset link to:
            </p>

            <div className="w-full bg-slate-50 dark:bg-dark-bg/60 border border-slate-150 dark:border-dark-border py-2.5 px-4 rounded-xl font-medium text-sm text-slate-800 dark:text-white flex items-center justify-center gap-2">
              <FiMail className="text-secondary dark:text-purple-400" />
              <span className="truncate">{submittedEmail}</span>
            </div>

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3.5 rounded-xl text-left text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-1.5 w-full">
              <p className="font-semibold">Next steps:</p>
              <ul className="list-disc pl-4 space-y-1">
                <li>Open the email from <strong>URxpenz</strong> and click the reset button.</li>
                <li>From that secure email link only, you can set your new password.</li>
                <li>The link will expire in <strong>15 minutes</strong> for your security.</li>
                <li>If you don't see it in a moment, check your <strong>Spam</strong> or <strong>Junk</strong> folder.</li>
              </ul>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2.5">
              <Link
                to="/login"
                className="w-full bg-secondary dark:bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-750 dark:hover:bg-purple-700 transition-all shadow-md shadow-secondary/15 dark:shadow-purple-600/10 flex items-center justify-center gap-2"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span>Return to Login</span>
              </Link>

              <button
                type="button"
                onClick={handleResetForm}
                className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-white py-1 transition-colors cursor-pointer"
              >
                Send to a different email address
              </button>
            </div>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-dark-text-muted leading-relaxed">
              Enter the email address registered with your account. We will send you a secure link to reset your password.
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
                  <FiSend className="w-4 h-4" />
                  <span>Send Reset Link</span>
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
          </form>
        )}

      </div>
    </div>
  )
}

export default Forgot
