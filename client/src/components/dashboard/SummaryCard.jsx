function SummaryCard({ label, value, icon: Icon, tone = 'slate' }) {
  const iconTones = {
    slate: 'bg-slate-100 dark:bg-[#1e2230] text-slate-600 dark:text-slate-300',
    green: 'bg-emerald-50 dark:bg-emerald-950/30 text-emerald-600 dark:text-emerald-400',
    red: 'bg-rose-50 dark:bg-rose-950/30 text-rose-600 dark:text-rose-400',
    blue: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400'
  }

  return (
    <div className="rounded-xl border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#14161f] p-4 flex flex-col justify-between h-[120px] transition-colors">
      <div className="flex justify-between items-center w-full">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>
        {Icon && (
          <div className={`p-1.5 rounded-md ${iconTones[tone] || iconTones.slate}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      <div className="mt-2">
        <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 dark:text-white">
          {value}
        </p>
      </div>
    </div>
  )
}

export default SummaryCard
