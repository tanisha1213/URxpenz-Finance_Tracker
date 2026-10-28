import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { loginUser } from '../redux/slices/authSlice'
import { useTheme } from '../context/ThemeContext'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'

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
    <div className="min-h-screen bg-slate-100 dark:bg-[#0c0d12] flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={theme === 'light' ? logoLight : logoDark} alt="URxpenz Logo" className="w-20 h-20 rounded-2xl object-contain mb-3.5" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">URxpenz</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Expense & budget manager</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-3.5 py-2.5 rounded-lg mb-4 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Email address</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-[#222634] rounded-lg bg-white dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">Password</label>
              <Link to="/forgot-password" className="text-indigo-600 dark:text-indigo-400 font-medium text-xs hover:underline">
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-[#222634] rounded-lg bg-white dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn-primary text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 mt-4 text-xs"
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
          Don&apos;t have an account?{' '}
          <Link to="/signup" className="text-[var(--primary)] font-semibold hover:underline">
            Create an account
          </Link>
        </p>

        <p className="text-center mt-3 text-[11px] text-slate-400 dark:text-slate-500">
          <Link to="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">
            Privacy policy & data safety
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Login