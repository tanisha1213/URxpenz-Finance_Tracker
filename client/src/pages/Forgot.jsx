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
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [submittedEmail, setSubmittedEmail] = useState('')
  const [isSuccess, setIsSuccess] = useState(false)
  
  const { theme } = useTheme()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    const trimmedEmail = email.trim()
    if (!trimmedEmail) {
      return setError('Please enter your email address')
    }

    setLoading(true)
    try {
      const response = await forgotPassword({ email: trimmedEmail })
      if (response.data.success) {
        setSubmittedEmail(trimmedEmail)
        setIsSuccess(true)
      } else {
        setError(response.data.message || 'Failed to send reset email')
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
    setError('')
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] rounded-xl p-8 w-full max-w-md relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-6">
          <img src={theme === 'light' ? logoLight : logoDark} alt="Xpenz Logo" className="w-12 h-12 rounded-lg object-contain mb-3" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Forgot password</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono tracking-wider">Expense & budget manager</p>
        </div>

        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 px-3.5 py-2.5 rounded-lg mb-5 text-xs font-medium"
          >
            <FiAlertCircle className="shrink-0 mt-0.5 text-sm" />
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
            <div className="w-16 h-16 rounded-full bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-3xl shadow-inner mb-1">
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

            <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 p-3 rounded-xl text-left text-xs text-amber-800 dark:text-amber-300 leading-relaxed space-y-1">
              <p className="font-semibold">Important:</p>
              <ul className="list-disc pl-4 space-y-0.5">
                <li>The reset link expires in <strong>10 minutes</strong>.</li>
                <li>If you don't see the email, please check your <strong>Spam</strong> or <strong>Junk</strong> folder.</li>
              </ul>
            </div>

            <div className="w-full pt-2 flex flex-col gap-2.5">
              <Link
                to="/login"
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors flex items-center justify-center gap-2 text-xs"
              >
                <FiArrowLeft className="w-4 h-4" />
                <span>Return to login</span>
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
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Enter the email address registered with your account. We will send you a secure link to reset your password.
            </p>
            
            <div className="space-y-1">
              <label className="block text-slate-700 dark:text-slate-300 font-medium text-xs mb-1">Email address</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                  <FiMail className="w-4 h-4" />
                </span>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                  className="w-full pl-9 pr-3 py-2 border border-slate-200 dark:border-[#222634] rounded-lg bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg disabled:opacity-50 transition-colors mt-4 flex items-center justify-center gap-2 text-xs cursor-pointer"
            >
              {loading ? (
                <span className="animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent"></span>
              ) : (
                <>
                  <FiSend className="w-3.5 h-3.5" />
                  <span>Send reset email</span>
                </>
              )}
            </button>

            <p className="text-center pt-2 text-xs text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5">
              <FiArrowLeft className="w-3.5 h-3.5" />
              <span>Back to</span>
              <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-medium hover:underline">
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
