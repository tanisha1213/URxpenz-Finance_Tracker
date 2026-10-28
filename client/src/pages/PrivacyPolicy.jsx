import { Link } from 'react-router-dom'
import { FiArrowLeft, FiShield, FiLock, FiTrash2, FiDatabase, FiCpu, FiMail, FiCheckCircle } from 'react-icons/fi'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'
import { useTheme } from '../context/ThemeContext'

export default function PrivacyPolicy() {
  const { theme } = useTheme()

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0b0d17] text-slate-800 dark:text-slate-100 py-10 px-4 sm:px-6 lg:px-8 transition-colors">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Navigation & Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-secondary dark:text-slate-400 dark:hover:text-purple-400 transition-colors"
          >
            <FiArrowLeft className="w-4 h-4" />
            Back to App
          </Link>

          <div className="flex items-center gap-2.5">
            <img
              src={theme === 'light' ? logoLight : logoDark}
              alt="URxpenz Logo"
              className="w-7 h-7 rounded-lg object-contain shadow-sm"
            />
            <span className="font-extrabold text-lg text-slate-900 dark:text-white tracking-tight">
              URxpenz Finance Tracker
            </span>
          </div>
        </div>

        {/* Hero Section */}
        <div className="rounded-3xl bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent dark:from-purple-900/20 dark:via-indigo-950/10 p-6 sm:p-10 border border-indigo-100 dark:border-purple-900/30">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-black uppercase tracking-wider mb-3">
            <FiShield className="w-3.5 h-3.5" />
            Google Play Data Safety & Privacy Policy
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Privacy Policy & User Data Retention
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Effective Date: October 27, 2026 • Last Reviewed: October 2026
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
            Welcome to <strong>URxpenz</strong> (&quot;we&quot;, &quot;our&quot;, or &quot;the Service&quot;). Your privacy and data security are our highest priorities. This Privacy Policy discloses how your personal and financial information is collected, stored, encrypted, and deleted in full compliance with the Google Play Store Developer Policy and international data protection standards.
          </p>
        </div>

        {/* Key Guarantees */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FiLock className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Zero Data Selling</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              We never sell, rent, or share your financial data or personal identity with advertisers, third-party data brokers, or marketing networks.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-purple-950/40 text-indigo-600 dark:text-purple-400 flex items-center justify-center font-bold">
              <FiDatabase className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Encrypted Cloud & Offline</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              All cloud data is hosted on enterprise-grade Supabase infrastructure with multi-tenant row security and TLS 1.3 transport encryption.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 flex items-center justify-center font-bold">
              <FiTrash2 className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Instant Account Deletion</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              Self-serve permanent data erasure is available directly inside the app under Profile Settings with immediate cascading deletion.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-3xl p-6 sm:p-9 space-y-8 shadow-sm">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">1</span>
              Information We Collect
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>We collect only the minimum necessary information to deliver personal finance tracking services:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li><strong>Account Information:</strong> Name, email address, and a salted cryptographic hash of your password. We never have access to plain-text passwords.</li>
                <li><strong>User-Logged Financial Records:</strong> Transaction amounts, expense categories (e.g., Food, Transport, Utilities), payment method tags (Cash, UPI, Card), transaction dates, user-created bank account nicknames, monthly/daily budgets, loan balances, and recurring subscription reminders.</li>
                <li><strong>Push Notification Endpoint Tokens:</strong> If enabled, a standard browser/system web push subscription token is stored to dispatch timely loan EMI and bill payment reminders.</li>
                <li><strong>Offline Local Storage Data:</strong> When adding transactions without network connectivity, records are temporarily queued in your device&apos;s sandboxed browser storage (`localStorage`) and automatically synced when reconnected.</li>
              </ul>
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
                <strong>Important:</strong> URxpenz DOES NOT collect, request, or store your bank account passwords, net-banking credentials, credit card numbers, CVVs, or SMS OTPs.
              </div>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">2</span>
              How We Use Your Information
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>We process your data strictly to provide core application features:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Displaying income, expenses, and net savings charts.</li>
                <li>Calculating monthly and daily budget allowances.</li>
                <li>Providing financial insights, breakdown summaries, and PDF report downloads.</li>
                <li>Delivering push reminders for upcoming loan EMIs and bill due dates.</li>
                <li>Verifying and managing Pro subscription access via our billing gateway.</li>
              </ul>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">3</span>
              Third-Party Service Providers
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>We integrate exclusively with established, privacy-compliant service infrastructure:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong>Supabase:</strong> Cloud database and authentication provider. Governed by strict SOC2 Type II certification, encrypting all data in transit and at rest.</li>
                <li><strong>Razorpay:</strong> PCI-DSS certified payment processing platform used when users subscribe to Pro tiers. All credit card, debit card, and UPI payment operations occur within Razorpay&apos;s secure checkout dialog. We never receive or store your card or bank account credentials.</li>
                <li><strong>WebPush / Service Worker:</strong> Used solely to push native desktop and Android notification alerts for scheduled reminders.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 - Google Play Mandatory Account Deletion */}
          <section className="space-y-3 p-5 rounded-2xl bg-rose-50/50 dark:bg-rose-950/10 border border-rose-100 dark:border-rose-950/30">
            <h2 className="text-lg font-bold text-rose-900 dark:text-rose-300 flex items-center gap-2">
              <FiTrash2 className="w-5 h-5 text-rose-600 dark:text-rose-400" />
              Account Deletion & Data Erasure (Google Play Requirement)
            </h2>
            <div className="text-xs sm:text-sm text-rose-950/80 dark:text-rose-200/80 space-y-2.5 leading-relaxed">
              <p>
                In compliance with Google Play&apos;s User Data Safety Policy, every user has the absolute right to permanently delete their account and all associated personal and financial information at any time.
              </p>
              
              <div className="p-3.5 rounded-xl bg-white dark:bg-dark-card border border-rose-200 dark:border-rose-900/40 space-y-2">
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  How to delete your account in the application:
                </p>
                <ol className="list-decimal pl-5 space-y-1 text-xs text-slate-700 dark:text-slate-300">
                  <li>Open the URxpenz app and sign in.</li>
                  <li>Click on your name or avatar in the top navigation bar to go to <strong>Profile</strong>.</li>
                  <li>Scroll to the <strong>Danger Zone</strong> section on the right.</li>
                  <li>Click <strong>&quot;Delete Account & All Data&quot;</strong> and type <strong>DELETE</strong> in the confirmation box.</li>
                </ol>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Once confirmed, our server permanently purges your user credentials, transactions, bank accounts, budgets, loans, and push tokens from our cloud databases immediately. This action cannot be reversed.
                </p>
              </div>

              <div className="p-3.5 rounded-xl bg-white dark:bg-dark-card border border-slate-200 dark:border-dark-border space-y-1.5">
                <p className="font-bold text-slate-900 dark:text-white text-xs">
                  Web-Based Deletion Request (if app is uninstalled):
                </p>
                <p className="text-xs text-slate-600 dark:text-slate-300">
                  If you have uninstalled the app and wish to delete your account and all associated data, you may submit a request by sending an email from your registered address to:
                </p>
                <p className="font-mono text-xs text-indigo-650 dark:text-purple-400 font-bold">
                  privacy@urxpenz.com
                </p>
                <p className="text-[11px] text-slate-500">
                  All requests submitted via email are verified and executed within 48 business hours.
                </p>
              </div>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">5</span>
              Data Security Safeguards
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>We protect user data using industry-standard engineering safeguards:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li><strong>Transport Security:</strong> All client-server traffic is encrypted using HTTPS and TLS 1.3.</li>
                <li><strong>Password Protection:</strong> Passwords are one-way hashed with salted bcrypt (10 rounds) before reaching persistent storage.</li>
                <li><strong>Tenant Isolation:</strong> Every database operation is strictly scoped to the authenticated user ID extracted from secure JSON Web Tokens (JWT).</li>
                <li><strong>Input Sanitization:</strong> Form inputs are sanitized against SQL injection, NoSQL operator injection, and Cross-Site Scripting (XSS).</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">6</span>
              Children&apos;s Privacy
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
              Our application is not intended for use by children under the age of 18. We do not knowingly collect personal or financial data from minors. If you believe a minor has created an account, please contact us for immediate account and data deletion.
            </p>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">7</span>
              Contact Us & Grievance Officer
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>If you have any questions, feedback, or data requests regarding this Privacy Policy, please contact our Data Protection Officer:</p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border text-xs space-y-1">
                <p><strong>Entity:</strong> URxpenz Personal Finance</p>
                <p><strong>Email:</strong> support@urxpenz.com / privacy@urxpenz.com</p>
                <p><strong>Website:</strong> https://urxpenz-finance-tracker.vercel.app</p>
                <p><strong>Response SLA:</strong> Within 48 hours for data requests</p>
              </div>
            </div>
          </section>

        </div>

        {/* Footer */}
        <div className="text-center pt-4 text-xs text-slate-400 dark:text-slate-500">
          <p>© 2026 URxpenz. All rights reserved. Google Play is a trademark of Google LLC.</p>
        </div>

      </div>
    </div>
  )
}
