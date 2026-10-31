import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../redux/slices/authSlice'
import { useTheme } from '../context/ThemeContext'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'
import GooglePlayBadge from '../components/common/GooglePlayBadge'

function Login() {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  })
  const [error, setError] = useState('')
  const { theme } = useTheme()
  const { loading } = useSelector(state => state.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (!formData.email || !formData.password) {
      return setError('All fields are required')
    }

    try {
      await dispatch(loginUser(formData)).unwrap()
      navigate('/dashboard')
    } catch (err) {
      setError(err || 'Login failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-card flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={theme === 'light' ? logoLight : logoDark} alt="URxpenz Logo" className="w-16 h-16 rounded-2xl object-contain shadow-lg mb-3" />
          <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white tracking-tight">URxpenz</h1>
          <p className="text-[10px] text-slate-400 dark:text-dark-text-muted mt-1 uppercase font-bold tracking-wider">AI Personal Finance</p>
        </div>

        {error && (
          <div className="bg-red-150 border border-red-400 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-450 px-4 py-3 rounded-xl mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">Email Address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:border-secondary"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase">Password</label>
              <Link to="/forgot-password" className="text-secondary dark:text-purple-400 font-bold text-xs hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:border-secondary"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary dark:bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-750 dark:hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-secondary/15 dark:shadow-purple-600/10 mt-6"
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 dark:border-dark-border flex flex-col items-center">
          <GooglePlayBadge variant="button" />
        </div>

        <p className="text-center mt-6 text-sm text-slate-500 dark:text-dark-text-muted">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-secondary dark:text-purple-400 font-bold hover:underline">
            Sign up
          </Link>
        </p>

        <p className="text-center mt-3 text-xs text-slate-400 dark:text-dark-text-muted">
          <Link to="/privacy" className="underline hover:text-secondary dark:hover:text-purple-400 font-medium">
            Privacy Policy & Data Safety
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login