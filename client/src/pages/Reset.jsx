import { useState } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { resetPassword } from '../services/authService'
import { useTheme } from '../context/ThemeContext'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'

function Reset() {
  const { token } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setMessage('')

    if (!password || !confirmPassword) {
      return setError('All fields are required')
    }

    if (password.length < 6) {
      return setError('Password must be at least 6 characters')
    }

    if (password !== confirmPassword) {
      return setError('Passwords do not match')
    }

    setLoading(true)
    try {
      const response = await resetPassword(token, { password })
      setMessage(response.data.message || 'Password reset successful!')
      setTimeout(() => {
        navigate('/login')
      }, 3000)
    } catch (err) {
      setError(err.response?.data?.message || 'Token is invalid or has expired')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0c0d12] flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] rounded-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={theme === 'light' ? logoLight : logoDark} alt="URxpenz Logo" className="w-20 h-20 rounded-2xl object-contain mb-3.5" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">Reset password</h1>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 uppercase font-mono tracking-wider">Expense & budget manager</p>
        </div>

        {error && (
          <div className="bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-950/20 dark:border-rose-900/30 dark:text-rose-400 px-3.5 py-2.5 rounded-lg mb-4 text-xs font-medium">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400 px-3.5 py-2.5 rounded-lg mb-4 text-xs font-medium">
            {message}
            <p className="text-[11px] mt-1 text-emerald-600 dark:text-emerald-500 font-normal">Redirecting to login page in 3 seconds...</p>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">
              Enter and confirm your new password below.
            </p>
            
            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium text-xs mb-1">New password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-[#222634] rounded-lg bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-slate-700 dark:text-slate-300 font-medium text-xs mb-1">Confirm new password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-200 dark:border-[#222634] rounded-lg bg-white dark:bg-[#181a24] text-slate-800 dark:text-slate-100 text-xs focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary text-white font-medium py-2.5 rounded-lg disabled:opacity-50 transition-colors mt-4 text-xs cursor-pointer"
            >
              {loading ? 'Updating...' : 'Update password'}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
          Back to{' '}
          <Link to="/login" className="text-[var(--primary)] font-medium hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Reset
