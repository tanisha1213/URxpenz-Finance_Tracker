import { FiBell, FiClock } from 'react-icons/fi';
import { useDailyAlertSettings } from '../../hooks/useDailyAlertSettings';

/**
 * Modular Reusable Daily Alert Settings Card
 */
export default function DailyAlertTimeCard({
  initialTime = '20:00',
  dailyLimit = 0,
  todaySpent = 0,
  todaySaved = 0,
  isOverspentToday = false,
  isPro = false,
  onUpgradeModal = null
}) {
  const {
    dailyAlertTime,
    setDailyAlertTime,
    saveAlertTime,
    saving,
    statusMessage,
    isError
  } = useDailyAlertSettings(initialTime, isPro, onUpgradeModal);

  const handleSubmit = (e) => {
    e.preventDefault();
    saveAlertTime();
  };

  const difference = Math.abs(todaySpent - dailyLimit);

  return (
    <div className="lg:w-84 flex-shrink-0 rounded-2xl bg-white/80 dark:bg-slate-900/70 border border-purple-100 dark:border-purple-900/30 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FiBell className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" />
          <h4 className="text-xs font-bold text-slate-800 dark:text-white uppercase tracking-wider">
            Daily Alert Settings
          </h4>
        </div>
        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
          {dailyAlertTime}
        </span>
      </div>

      <p className="text-[11px] text-slate-500 dark:text-dark-text-muted leading-relaxed">
        Daily prompt preview at <strong>{dailyAlertTime}</strong>: <br />
        <em>
          "Today's budget was ₹{dailyLimit.toLocaleString('en-IN')}, you spent ₹{todaySpent.toLocaleString('en-IN')}. You {isOverspentToday ? `overspent by ₹${difference.toLocaleString('en-IN')}` : `saved ₹${todaySaved.toLocaleString('en-IN')}`}!"
        </em>
      </p>

      <form onSubmit={handleSubmit} className="pt-2 border-t border-slate-100 dark:border-dark-border/40 space-y-2">
        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
          Customize Notification Time
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <FiClock className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              type="time"
              value={dailyAlertTime}
              onChange={(e) => setDailyAlertTime(e.target.value)}
              className="w-full pl-8 pr-2.5 py-2 text-xs font-bold rounded-xl border border-slate-200 dark:border-dark-border bg-white dark:bg-dark-card text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
          <button
            type="submit"
            disabled={saving}
            className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
          >
            {saving ? 'Saving...' : 'Save Time'}
          </button>
        </div>
      </form>

      {statusMessage && (
        <p
          className={`text-[10px] text-center font-semibold py-1.5 px-2 rounded-lg border ${
            isError
              ? 'text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-800'
              : 'text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800'
          }`}
        >
          {statusMessage}
        </p>
      )}
    </div>
  );
}
