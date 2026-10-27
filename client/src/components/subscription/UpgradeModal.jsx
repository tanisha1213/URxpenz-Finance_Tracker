import { useState } from 'react';
import { useSubscription } from '../../context/SubscriptionContext';
import { formatCurrency } from '../../utils/format';
import {
  FiCheck,
  FiX,
  FiZap,
  FiShield,
  FiTrendingUp,
  FiPieChart,
  FiCreditCard,
  FiCalendar,
  FiAward,
  FiDownload
} from 'react-icons/fi';

const PLANS = [
  {
    id: 'kickstart',
    name: 'Kickstart Plan',
    duration: '1 Month (30 Days)',
    price: 45,
    perMonth: 45,
    tag: 'Intro Pass',
    badgeClass: 'bg-blue-500/10 text-blue-500 border-blue-500/20'
  },
  {
    id: 'quarterly',
    name: 'Quarterly Pro',
    duration: '3 Months (90 Days)',
    price: 119,
    perMonth: 39,
    tag: '13% OFF',
    badgeClass: 'bg-purple-500/10 text-purple-500 border-purple-500/20'
  },
  {
    id: 'half_yearly',
    name: 'Half-Yearly Pro',
    duration: '6 Months (180 Days)',
    price: 199,
    perMonth: 33,
    tag: '26% OFF',
    badgeClass: 'bg-indigo-500/10 text-indigo-500 border-indigo-500/20'
  },
  {
    id: 'annual',
    name: 'Annual Pro',
    duration: '1 Year (365 Days)',
    price: 349,
    perMonth: 29,
    tag: '👑 BEST VALUE (35% OFF)',
    badgeClass: 'bg-emerald-500/15 text-emerald-500 border-emerald-500/30 font-black'
  }
];

export default function UpgradeModal() {
  const {
    isUpgradeModalOpen,
    upgradeFeature,
    closeUpgradeModal,
    activatePlan,
    tier,
    isTrial,
    trialDaysRemaining
  } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isUpgradeModalOpen) return null;

  const handleSubscribe = async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    const res = await activatePlan(selectedPlanId);
    setLoading(false);

    if (res.success) {
      setSuccessMsg(res.message || 'Pro Membership activated successfully!');
      setTimeout(() => {
        setSuccessMsg('');
        closeUpgradeModal();
      }, 1800);
    } else {
      setErrorMsg(res.message || 'Payment processing failed. Please try again.');
    }
  };

  const getFeatureHeadline = () => {
    switch (upgradeFeature) {
      case 'accounts':
        return 'Unlock Unlimited Bank Accounts';
      case 'loans':
        return 'Unlock Unlimited Loans & EMI Tracking';
      case 'subscriptions':
        return 'Unlock Unlimited Recurring Subscriptions';
      case 'investments':
        return 'Unlock Investments Portfolio Tracker';
      case 'insurance':
        return 'Unlock Insurance Policies & Reminders';
      case 'ai':
        return 'Unlock AI Forecasts & Cashflow Runway';
      case 'reports':
        return 'Unlock Custom Date Range & PDF Reports';
      default:
        return 'Upgrade to Xpenz Pro';
    }
  };

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[3];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/70 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-3xl bg-white dark:bg-[#11131f] border border-slate-100 dark:border-slate-800 shadow-2xl p-5 sm:p-7 text-slate-800 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={closeUpgradeModal}
          className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-650 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <FiX className="w-5 h-5" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-secondary/10 dark:bg-purple-900/30 text-secondary dark:text-purple-400 border border-secondary/20">
            <FiZap className="w-3.5 h-3.5 fill-current" />
            {isTrial ? `🎁 60-Day Free Trial (${trialDaysRemaining} days remaining)` : 'Xpenz Membership'}
          </span>
        </div>

        {/* Headline */}
        <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
          {getFeatureHeadline()}
        </h2>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
          {isTrial
            ? 'Your 60-day full-access trial is active! Upgrade anytime to ensure uninterrupted access to all advanced tools.'
            : 'Basic tier includes 1 bank account, 1 loan, 2 subscriptions, and free cloud logging. Upgrade for unlimited power.'}
        </p>

        {/* Success or Error Banner */}
        {successMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-600 dark:text-emerald-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <FiCheck className="w-5 h-5 flex-shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-4 p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-600 dark:text-rose-400 text-xs sm:text-sm font-semibold flex items-center gap-2">
            <FiX className="w-5 h-5 flex-shrink-0" />
            {errorMsg}
          </div>
        )}

        {/* Plans Selection Grid */}
        <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-secondary dark:border-purple-500 bg-secondary/5 dark:bg-purple-950/20 shadow-md shadow-secondary/10'
                    : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700 bg-slate-50/50 dark:bg-slate-900/30'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-sm text-slate-900 dark:text-white">
                      {plan.name}
                    </span>
                    <span className={`text-[10px] px-2 py-0.5 rounded-md border ${plan.badgeClass}`}>
                      {plan.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{plan.duration}</p>
                </div>

                <div className="mt-4 flex items-baseline justify-between pt-3 border-t border-slate-200/60 dark:border-slate-800">
                  <div className="flex items-baseline gap-1">
                    <span className="text-2xl font-black text-slate-900 dark:text-white">
                      ₹{plan.price}
                    </span>
                    <span className="text-xs text-slate-400">total</span>
                  </div>
                  <span className="text-xs font-semibold text-secondary dark:text-purple-400">
                    ~₹{plan.perMonth}/mo
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Checklist */}
        <div className="mt-6 p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/50 border border-slate-200/70 dark:border-slate-800">
          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
            What you get with Xpenz Pro:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-slate-700 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>Unlimited</strong> Bank, Cash & Card accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>Unlimited</strong> Loans, EMIs & Calendar</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>Unlimited</strong> Subscriptions & Auto-Deductions</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>Investments Portfolio</strong> (Stocks, MF, Gold)</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>Insurance Policies</strong> & Renewal alerts</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>AI Cashflow Runway</strong> & Burn rate predictor</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>Custom Date Range Reports & PDF Export</strong> (Monthly basic free)</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-4 h-4 text-emerald-500 flex-shrink-0" />
              <span><strong>Multi-Device Cloud Sync</strong> (Always Safe)</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-6 flex flex-col sm:flex-row items-center gap-3">
          <button
            onClick={handleSubscribe}
            disabled={loading}
            className="w-full flex-1 flex items-center justify-center gap-2 py-3.5 px-6 rounded-2xl bg-secondary hover:bg-indigo-700 dark:bg-purple-600 dark:hover:bg-purple-700 text-white font-black text-sm shadow-xl shadow-secondary/25 transition-all duration-200 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
            ) : (
              <FiAward className="w-4 h-4" />
            )}
            <span>Activate {selectedPlan.name} (₹{selectedPlan.price})</span>
          </button>
          
          <button
            onClick={closeUpgradeModal}
            className="w-full sm:w-auto px-5 py-3.5 text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white transition-colors cursor-pointer"
          >
            Continue with Basic
          </button>
        </div>

        {/* Guarantee Note */}
        <p className="mt-3 text-center text-[11px] text-slate-400">
          🔒 Google Play & Cloud verified. Your transaction data and manual logging remain 100% free and stored safely forever.
        </p>
      </div>
    </div>
  );
}
