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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-card flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={theme === 'light' ? logoLight : logoDark} alt="Xpenz Logo" className="w-16 h-16 rounded-2xl object-contain shadow-lg mb-3" />
          <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white tracking-tight">Reset Password</h1>
          <p className="text-[10px] text-slate-400 dark:text-dark-text-muted mt-1 uppercase font-bold tracking-wider">AI Personal Finance</p>
        </div>

        {error && (
          <div className="bg-red-150 border border-red-400 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-450 px-4 py-3 rounded-xl mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        {message && (
          <div className="bg-emerald-150 border border-emerald-400 text-emerald-700 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-450 px-4 py-3 rounded-xl mb-4 text-sm font-semibold">
            {message}
            <p className="text-xs mt-1 text-emerald-600 dark:text-emerald-500 font-normal">Redirecting you to login page in 3 seconds...</p>
          </div>
        )}

        {!message && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <p className="text-sm text-slate-500 dark:text-dark-text-muted mb-4">
              Enter and confirm your new password below.
            </p>
            
            <div>
              <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">New Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:border-secondary"
                placeholder="Minimum 6 characters"
                required
              />
            </div>

            <div>
              <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:border-secondary"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-secondary dark:bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-750 dark:hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-secondary/15 dark:shadow-purple-600/10 mt-6"
            >
              {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        )}

        <p className="text-center mt-6 text-sm text-slate-500 dark:text-dark-text-muted">
          Back to{' '}
          <Link to="/login" className="text-secondary dark:text-purple-400 font-bold hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Reset
