import { Link } from 'react-router-dom'
import { FiArrowLeft, FiFileText, FiShield, FiCheckCircle, FiDollarSign, FiLock, FiAlertCircle } from 'react-icons/fi'
import logoLight from '../assets/logo-light.png'
import logoDark from '../assets/logo-dark.png'
import { useTheme } from '../context/ThemeContext'

export default function TermsAndConditions() {
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
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 dark:bg-purple-500/20 text-secondary dark:text-purple-300 border border-secondary/20 dark:border-purple-500/30 text-xs font-black uppercase tracking-wider mb-3">
            <FiFileText className="w-3.5 h-3.5" />
            Terms of Service & User Agreement
          </div>
          <h1 className="text-2xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
            Terms & Conditions
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
            Effective Date: October 28, 2026 • Last Updated: October 2026
          </p>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 mt-4 leading-relaxed">
            Welcome to <strong>URxpenz</strong> (&quot;we&quot;, &quot;our&quot;, &quot;us&quot;, or &quot;the Service&quot;). By creating an account, downloading our application from Google Play, or accessing our web platform, you agree to comply with and be bound by these Terms and Conditions. Please review them carefully before using URxpenz.
          </p>
        </div>

        {/* Summary Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center font-bold">
              <FiShield className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Your Data, Your Control</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              You own all your transaction and budget data. You can export or permanently delete your account and all records at any time.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <FiLock className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Zero Credential Access</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              URxpenz never collects, requests, or stores your bank passwords, net-banking credentials, ATM PINs, CVVs, or SMS OTPs.
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border shadow-sm space-y-2">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 flex items-center justify-center font-bold">
              <FiDollarSign className="w-4 h-4" />
            </div>
            <h2 className="font-extrabold text-sm text-slate-900 dark:text-white">Informational Tool</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">
              URxpenz is an intuitive budgeting and expense tracker designed for personal financial planning and analytics.
            </p>
          </div>
        </div>

        {/* Detailed Sections */}
        <div className="bg-white dark:bg-dark-card border border-slate-100 dark:border-dark-border rounded-3xl p-6 sm:p-9 space-y-8 shadow-sm">
          
          {/* Section 1 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">1</span>
              Acceptance of Terms & Eligibility
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                By registering, accessing, or using URxpenz, you acknowledge that you have read, understood, and agree to be bound by these Terms and our <Link to="/privacy" className="text-secondary dark:text-purple-400 font-semibold underline">Privacy Policy</Link>.
              </p>
              <p>
                You must be at least 18 years of age or the age of legal majority in your jurisdiction to create an account and use this Service. If you do not agree to these Terms, you must not use or access URxpenz.
              </p>
            </div>
          </section>

          {/* Section 2 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">2</span>
              Nature of Service & Financial Disclaimer
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                URxpenz is a personal finance management software application that assists users in organizing expenses, recording cash and bank account balances, managing category budgets, tracking loan EMI schedules, and analyzing visual reports.
              </p>
              <div className="p-3.5 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 text-amber-800 dark:text-amber-300 text-xs font-medium">
                <strong>Disclaimer:</strong> URxpenz is not a bank, certified financial planner, tax advisor, or investment broker. The insights, summaries, and forecasts provided are for general educational and organizational purposes only. You are solely responsible for verifying the accuracy of all financial data you record.
              </div>
            </div>
          </section>

          {/* Section 3 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">3</span>
              Account Security & User Obligations
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>When you create an account on URxpenz, you agree to:</p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                <li>Provide accurate, current, and complete registration information.</li>
                <li>Maintain the confidentiality and security of your account password.</li>
                <li>Promptly notify us if you discover or suspect any unauthorized access or breach of your account.</li>
                <li>Accept full responsibility for all activities that occur under your authenticated session.</li>
              </ul>
            </div>
          </section>

          {/* Section 4 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">4</span>
              Subscriptions, Upgrades & Billing Terms
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                URxpenz offers both free access and optional premium Pro membership tiers (Kickstart, Quarterly, Half-Yearly, and Annual Pro):
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-xs">
                <li><strong>Free Tier:</strong> Free accounts have full access to core expense logging, balance management, custom categories, and both monthly and weekly spending reports.</li>
                <li><strong>Pro Tiers:</strong> Unlock unlimited bank accounts, unlimited loans and subscriptions, advanced export capabilities, and dedicated financial analytics.</li>
                <li><strong>Payment Processing:</strong> On mobile devices, Pro upgrades are processed securely via Google Play In-App Billing. On the web platform, payments are handled via PCI-DSS certified checkout gateways.</li>
                <li><strong>Cancellation:</strong> You may cancel auto-renewing subscriptions at any time via your Google Play account settings or billing dashboard. Your Pro benefits remain active until the end of the paid billing cycle.</li>
              </ul>
            </div>
          </section>

          {/* Section 5 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">5</span>
              Intellectual Property & Restrictions
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                All software code, visual designs, logos, graphics, icons, and text comprising URxpenz are the exclusive intellectual property of URxpenz Personal Finance and its licensors. You are granted a limited, personal, non-exclusive, non-transferable license to use the app for personal, non-commercial purposes.
              </p>
              <p>You agree not to:</p>
              <ul className="list-disc pl-5 space-y-1 text-xs">
                <li>Decompile, reverse engineer, or attempt to extract the source code of the application.</li>
                <li>Interfere with, disrupt, or attack the integrity or performance of our cloud services or APIs.</li>
                <li>Use automated bots, scrapers, or scripts to access or harvest data from the Service.</li>
              </ul>
            </div>
          </section>

          {/* Section 6 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">6</span>
              Permanent Account & Data Deletion
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                In strict adherence to Google Play policies, you hold complete autonomy over your data. You may permanently delete your account and all associated transactions, accounts, and budgets at any time directly in the app via <strong>Profile ➔ Danger Zone ➔ Delete Account & All Data</strong>, or by emailing <span className="font-mono font-bold text-secondary dark:text-purple-400">privacy@urxpenz.com</span>. Once confirmed, all user data is permanently purged immediately.
              </p>
            </div>
          </section>

          {/* Section 7 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">7</span>
              Limitation of Liability
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>
                To the maximum extent permitted by applicable law, URxpenz and its developers shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including loss of profits, loss of data, or financial losses resulting from your use of or inability to use the Service.
              </p>
            </div>
          </section>

          {/* Section 8 */}
          <section className="space-y-3">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-indigo-50 dark:bg-purple-950/40 text-secondary dark:text-purple-400 flex items-center justify-center text-xs font-black">8</span>
              Contact Information
            </h2>
            <div className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 space-y-2 leading-relaxed">
              <p>If you have any questions or inquiries regarding these Terms and Conditions, please contact us:</p>
              <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-dark-border text-xs space-y-1">
                <p><strong>Entity:</strong> URxpenz Personal Finance</p>
                <p><strong>Support Email:</strong> support@urxpenz.com</p>
                <p><strong>Legal & Privacy:</strong> privacy@urxpenz.com</p>
                <p><strong>Website:</strong> https://urxpenz-finance-tracker.vercel.app</p>
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

