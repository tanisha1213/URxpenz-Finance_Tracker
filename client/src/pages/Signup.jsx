import { useState, useEffect } from 'react'
import { useNavigate, Link, useSearchParams } from 'react-router-dom'
import { useDispatch, useSelector } from 'react-redux'
import { signupUser } from '../redux/slices/authSlice'
import { validateReferralCode } from '../services/referralService'
import { useTheme } from '../context/ThemeContext'
import { FiGift, FiCheck, FiX } from 'react-icons/fi'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'

function Signup() {
  const [searchParams] = useSearchParams()
  const initialRef = searchParams.get('ref') || ''

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    referralCode: initialRef.toUpperCase()
  })
  const [error, setError] = useState('')
  const [referralValidation, setReferralValidation] = useState({
    status: 'idle', // 'idle' | 'valid' | 'invalid'
    message: ''
  })
  const [showRefInput, setShowRefInput] = useState(!!initialRef)
  const { theme } = useTheme()
  const { loading } = useSelector(state => state.auth)
  const navigate = useNavigate()
  const dispatch = useDispatch()

  useEffect(() => {
    if (initialRef) {
      validateCode(initialRef)
    }
  }, [initialRef])

  const validateCode = async (code) => {
    if (!code || !code.trim()) {
      setReferralValidation({ status: 'idle', message: '' })
      return
    }
    try {
      const res = await validateReferralCode(code.trim())
      if (res.data?.valid) {
        setReferralValidation({
          status: 'valid',
          message: '🎉 Valid Referral Code! You unlock +10 Days Extra Free Trial (70 Days Total).'
        })
      } else {
        setReferralValidation({
          status: 'invalid',
          message: 'Referral code not recognized.'
        })
      }
    } catch (err) {
      setReferralValidation({
        status: 'invalid',
        message: err.response?.data?.message || 'Referral code not recognized.'
      })
    }
  }

  const handleChange = (e) => {
    const { name, value } = e.target
    const updated = name === 'referralCode' ? value.toUpperCase() : value
    setFormData({
      ...formData,
      [name]: updated
    })

    if (name === 'referralCode') {
      if (!updated.trim()) {
        setReferralValidation({ status: 'idle', message: '' })
      } else {
        validateCode(updated)
      }
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    try {
      await dispatch(signupUser({
        name: formData.name,
        email: formData.email,
        password: formData.password,
        referralCode: formData.referralCode ? formData.referralCode.trim() : undefined
      })).unwrap()
      navigate('/dashboard')
    } catch (err) {
      setError(err || 'Signup failed')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-dark-bg dark:to-dark-card flex items-center justify-center p-4 transition-colors duration-200">
      <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-2xl shadow-xl p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-8">
          <img src={theme === 'light' ? logoLight : logoDark} alt="Xpenz Logo" className="w-16 h-16 rounded-2xl object-contain shadow-lg mb-3" />
          <h1 className="text-3xl font-extrabold text-slate-850 dark:text-white tracking-tight">Xpenz</h1>
          <p className="text-[10px] text-slate-400 dark:text-dark-text-muted mt-1 uppercase font-bold tracking-wider">AI Personal Finance</p>
        </div>

        {error && (
          <div className="bg-red-150 border border-red-400 text-red-700 dark:bg-red-950/20 dark:border-red-900/30 dark:text-red-450 px-4 py-3 rounded-xl mb-4 text-sm font-semibold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">Full Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:border-secondary"
              required
            />
          </div>

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
            <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase mb-1">Confirm Password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none"
              required
            />
          </div>

          {/* Referral Code Field */}
          <div className="pt-1">
            {!showRefInput ? (
              <button
                type="button"
                onClick={() => setShowRefInput(true)}
                className="text-xs text-secondary dark:text-purple-400 font-bold hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <FiGift className="w-3.5 h-3.5" />
                Have a Referral Code? Get +10 Days Extra Free Trial
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-750 dark:text-dark-text-muted font-bold text-xs uppercase flex items-center gap-1">
                    <FiGift className="w-3.5 h-3.5 text-secondary dark:text-purple-400" />
                    Referral Code (+10 Days Bonus)
                  </label>
                  {!initialRef && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRefInput(false)
                        setFormData({ ...formData, referralCode: '' })
                        setReferralValidation({ status: 'idle', message: '' })
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-semibold cursor-pointer"
                    >
                      Remove
                    </button>
                  )}
                </div>
                <div className="relative">
                  <input
                    type="text"
                    name="referralCode"
                    value={formData.referralCode}
                    onChange={handleChange}
                    placeholder="e.g. XP-TANIS7A"
                    className="w-full px-4 py-2.5 border border-slate-200 dark:border-dark-border rounded-xl bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 font-mono uppercase text-xs tracking-wider focus:outline-none focus:border-secondary"
                  />
                  {referralValidation.status === 'valid' && (
                    <FiCheck className="absolute right-3 top-3 text-emerald-500 w-4 h-4" />
                  )}
                  {referralValidation.status === 'invalid' && (
                    <FiX className="absolute right-3 top-3 text-rose-500 w-4 h-4" />
                  )}
                </div>

                {referralValidation.message && (
                  <p className={`text-[11px] font-semibold mt-1.5 ${
                    referralValidation.status === 'valid' 
                      ? 'text-emerald-600 dark:text-emerald-400' 
                      : 'text-rose-600 dark:text-rose-400'
                  }`}>
                    {referralValidation.message}
                  </p>
                )}
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-secondary dark:bg-purple-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-750 dark:hover:bg-purple-700 disabled:opacity-50 transition-all shadow-md shadow-secondary/15 dark:shadow-purple-600/10 mt-6"
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>

        <p className="text-center mt-6 text-sm text-slate-500 dark:text-dark-text-muted">
          Already have an account?{' '}
          <Link to="/login" className="text-secondary dark:text-purple-400 font-bold hover:underline">
            Login
          </Link>
        </p>

        <p className="text-center mt-3 text-xs text-slate-400 dark:text-dark-text-muted">
          By signing up, you agree to our{' '}
          <Link to="/privacy" className="underline hover:text-secondary dark:hover:text-purple-400 font-medium">
            Privacy Policy & Data Safety
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup