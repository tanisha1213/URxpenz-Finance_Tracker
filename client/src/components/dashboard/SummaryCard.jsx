import { motion } from 'framer-motion'

function SummaryCard({ label, value, icon: Icon, tone = 'slate' }) {
  const tones = {
    slate: 'border-slate-100 bg-white dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-[#131522] dark:to-[#0d0f17] text-slate-900 dark:text-white shadow-premium',
    green: 'border-slate-100 bg-white dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-[#131522] dark:to-[#0d0f17] text-slate-900 dark:text-white shadow-premium',
    red: 'border-slate-100 bg-white dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-[#131522] dark:to-[#0d0f17] text-slate-900 dark:text-white shadow-premium',
    blue: 'border-slate-100 bg-white dark:border-slate-800/80 dark:bg-gradient-to-b dark:from-[#131522] dark:to-[#0d0f17] text-slate-900 dark:text-white shadow-premium'
  }

  const iconColors = {
    slate: 'bg-slate-100 dark:bg-purple-950/40 text-slate-600 dark:text-purple-400',
    green: 'bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400',
    red: 'bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-450',
    blue: 'bg-sky-100 dark:bg-indigo-950/40 text-sky-600 dark:text-indigo-400'
  }

  const trendData = {
    green: { percent: '+12%', color: 'text-emerald-500' },
    red: { percent: '-8%', color: 'text-rose-500' },
    blue: { percent: '18% used', color: 'text-indigo-500' },
    slate: { percent: '+14%', color: 'text-purple-500' }
  }

  const sparklines = {
    green: (
      <svg className="w-16 h-8 text-emerald-500" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 22 C 20 15, 30 5, 50 18 C 70 8, 80 2, 100 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    red: (
      <svg className="w-16 h-8 text-rose-500" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 5 C 20 12, 30 25, 50 12 C 70 28, 80 18, 100 25" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    blue: (
      <svg className="w-16 h-8 text-indigo-500" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 15 C 20 10, 40 22, 60 8 C 80 18, 90 10, 100 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    ),
    slate: (
      <svg className="w-16 h-8 text-purple-500" viewBox="0 0 100 30" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M0 20 C 15 15, 30 22, 50 8 C 70 5, 85 18, 100 10" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className={`rounded-3xl border p-5 flex flex-col justify-between h-[150px] relative overflow-hidden transition-colors ${tones[tone]}`}
    >
      {/* Background soft glowing accent circles */}
      <div className={`absolute -right-6 -bottom-6 w-24 h-24 rounded-full blur-3xl opacity-10 ${
        tone === 'green' ? 'bg-emerald-500' : tone === 'red' ? 'bg-rose-500' : tone === 'blue' ? 'bg-indigo-500' : 'bg-purple-500'
      }`} />

      <div className="flex justify-between items-center w-full">
        <div className="flex items-center gap-2">
          {Icon && (
            <div className={`p-2 rounded-xl ${iconColors[tone]}`}>
              <Icon className="w-4 h-4" />
            </div>
          )}
          <span className="text-xs font-bold text-slate-400 dark:text-dark-text-muted uppercase tracking-wider">{label}</span>
        </div>
        <span className={`text-xs font-extrabold px-2 py-0.5 rounded-lg bg-slate-100 dark:bg-slate-900/60 ${trendData[tone].color}`}>
          {trendData[tone].percent}
        </span>
      </div>

      <div className="flex justify-between items-end w-full mt-4">
        <p className="text-2xl font-extrabold tracking-tight text-slate-800 dark:text-white">{value}</p>
        <div className="opacity-95 pr-1">
          {sparklines[tone]}
        </div>
      </div>
    </motion.div>
  )
}

export default SummaryCard
