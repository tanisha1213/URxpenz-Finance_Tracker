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
          message: 'Valid referral code: 10 extra trial days will be applied (70 days total).'
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
    <div className="min-h-screen bg-slate-100 dark:bg-[#0c0d12] flex items-center justify-center p-4 transition-colors">
      <div className="bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] rounded-xl shadow-lg p-6 sm:p-8 w-full max-w-md">
        <div className="flex flex-col items-center mb-6">
          <img src={theme === 'light' ? logoLight : logoDark} alt="URxpenz Logo" className="w-16 h-16 rounded-xl object-contain mb-3 drop-shadow-sm" />
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white tracking-tight">URxpenz</h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Expense & budget manager</p>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 px-3.5 py-2.5 rounded-lg mb-4 text-xs font-medium">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Full name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-[#222634] rounded-lg bg-white dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

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
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-[#222634] rounded-lg bg-white dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">Confirm password</label>
            <input
              type="password"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-3.5 py-2 text-xs border border-slate-300 dark:border-[#222634] rounded-lg bg-white dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          {/* Referral Code Field */}
          <div className="pt-1">
            {!showRefInput ? (
              <button
                type="button"
                onClick={() => setShowRefInput(true)}
                className="text-xs text-indigo-600 dark:text-indigo-400 font-medium hover:underline flex items-center gap-1.5 cursor-pointer"
              >
                <FiGift className="w-3.5 h-3.5 text-amber-500" />
                Have a referral code? Get +10 bonus trial days
              </button>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300 flex items-center gap-1">
                    <FiGift className="w-3.5 h-3.5 text-amber-500" />
                    Referral code (+10 bonus days)
                  </label>
                  {!initialRef && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowRefInput(false)
                        setFormData({ ...formData, referralCode: '' })
                        setReferralValidation({ status: 'idle', message: '' })
                      }}
                      className="text-[10px] text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 font-medium cursor-pointer"
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
                    className="w-full px-3.5 py-2 border border-slate-300 dark:border-[#222634] rounded-lg bg-white dark:bg-[#0f1117] text-slate-900 dark:text-slate-100 font-mono uppercase text-xs tracking-wider focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                  />
                  {referralValidation.status === 'valid' && (
                    <FiCheck className="absolute right-3 top-2.5 text-emerald-500 w-4 h-4" />
                  )}
                  {referralValidation.status === 'invalid' && (
                    <FiX className="absolute right-3 top-2.5 text-rose-500 w-4 h-4" />
                  )}
                </div>

                {referralValidation.message && (
                  <p className={`text-[11px] font-medium mt-1 ${
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
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-colors cursor-pointer disabled:opacity-50 mt-4 text-xs"
          >
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>

        <p className="text-center mt-6 text-xs text-slate-500 dark:text-slate-400">
          Already have an account?{' '}
          <Link to="/login" className="text-indigo-600 dark:text-indigo-400 font-semibold hover:underline">
            Sign in
          </Link>
        </p>

        <p className="text-center mt-3 text-[11px] text-slate-400 dark:text-slate-500">
          By signing up, you agree to our{' '}
          <Link to="/privacy" className="underline hover:text-slate-600 dark:hover:text-slate-300">
            Privacy policy & data safety
          </Link>
        </p>
      </div>
    </div>
  )
}

export default Signup