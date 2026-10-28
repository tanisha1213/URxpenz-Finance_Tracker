import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useSubscription } from '../../context/SubscriptionContext';
import { createPaymentOrder, verifyPaymentSignature } from '../../services/billingService';
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
  FiDownload,
  FiWifiOff,
  FiGift
} from 'react-icons/fi';

const PLANS = [
  {
    id: 'kickstart',
    name: 'Kickstart',
    duration: '30 days',
    price: 45,
    perMonth: 45,
    tag: '1 month',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  {
    id: 'quarterly',
    name: 'Quarterly',
    duration: '90 days',
    price: 119,
    perMonth: 39,
    tag: '13% savings',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  {
    id: 'half_yearly',
    name: 'Half-yearly',
    duration: '180 days',
    price: 199,
    perMonth: 33,
    tag: '26% savings',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  {
    id: 'annual',
    name: 'Annual',
    duration: '365 days',
    price: 349,
    perMonth: 29,
    tag: '35% savings',
    badgeClass: 'bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800 font-semibold'
  }
];

export default function UpgradeModal() {
  const { user } = useSelector((state) => state.auth);
  const {
    isUpgradeModalOpen,
    upgradeFeature,
    closeUpgradeModal,
    activatePlan,
    refreshSubscription,
    tier,
    isTrial,
    trialDaysRemaining
  } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState('annual');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const discountPercent = user?.referral?.discountPercent || 0;
  const calculatePrice = (price) => {
    if (!discountPercent || discountPercent <= 0) return price;
    const discount = Math.round((price * discountPercent) / 100);
    return Math.max(1, price - discount);
  };

  if (!isUpgradeModalOpen) return null;

  const handleSubscribe = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMsg('Internet connection required. You are currently offline. Please reconnect to purchase or activate a subscription plan.');
      return;
    }
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      // 1. Try to initiate Razorpay order
      const orderRes = await createPaymentOrder(selectedPlanId);

      if (orderRes.data?.isDemoMode || !orderRes.data?.order) {
        // Direct / demo activation mode
        const res = await activatePlan(selectedPlanId);
        setLoading(false);
        if (res.success) {
          setSuccessMsg(res.message || 'Pro Membership activated successfully!');
          setTimeout(() => {
            setSuccessMsg('');
            closeUpgradeModal();
          }, 1800);
        } else {
          setErrorMsg(res.message || 'Activation failed. Please try again.');
        }
        return;
      }

      // 2. Load Razorpay script if needed
      if (!window.Razorpay) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://checkout.razorpay.com/v1/checkout.js';
          script.onload = resolve;
          script.onerror = () => reject(new Error('Failed to load Razorpay payment script'));
          document.body.appendChild(script);
        });
      }

      const order = orderRes.data.order;
      const keyId = orderRes.data.keyId;

      const options = {
        key: keyId,
        amount: order.amount,
        currency: 'INR',
        name: 'URxpenz Finance',
        description: `Upgrade to ${orderRes.data.plan?.name || 'Pro Plan'}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            setLoading(true);
            const verifyRes = await verifyPaymentSignature({
              planId: selectedPlanId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            await refreshSubscription();
            setSuccessMsg(verifyRes.data?.message || 'Pro Membership activated successfully!');
            setTimeout(() => {
              setSuccessMsg('');
              closeUpgradeModal();
            }, 1800);
          } catch (vErr) {
            setErrorMsg(vErr.response?.data?.message || 'Payment verification failed');
          } finally {
            setLoading(false);
          }
        },
        theme: {
          color: '#6366f1'
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setErrorMsg(resp.error?.description || 'Payment was unsuccessful. Please try again.');
        setLoading(false);
      });
      rzp.open();
      setLoading(false);
    } catch (err) {
      // Fallback direct activation
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
    }
  };

  const getFeatureHeadline = () => {
    switch (upgradeFeature) {
      case 'accounts':
        return 'Manage multiple bank accounts';
      case 'loans':
        return 'Track multiple loans and EMI schedules';
      case 'subscriptions':
        return 'Track recurring subscriptions';
      case 'investments':
        return 'Investment portfolio tracking';
      case 'insurance':
        return 'Insurance policy tracking';
      case 'ai':
        return 'Cashflow runway projections';
      case 'daily_budget':
        return 'Daily budget and reminder schedule';
      case 'reports':
        return 'Custom date-range reports';
      default:
        return 'Select a subscription plan';
    }
  };

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[3];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] p-5 sm:p-6 text-slate-800 dark:text-slate-100">
        
        {/* Close Button */}
        <button
          onClick={closeUpgradeModal}
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <FiX className="w-4 h-4" />
        </button>

        {/* Top Header Badge */}
        <div className="flex items-center gap-2 mb-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            <FiZap className="w-3.5 h-3.5 text-amber-500" />
            {isTrial
              ? `${user?.hasReferralBonus ? '70-day referral trial' : '60-day trial'} (${trialDaysRemaining}d remaining)`
              : 'URxpenz membership'}
          </span>
          {discountPercent > 0 && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
              <FiGift className="w-3 h-3" />
              {discountPercent}% referral discount
            </span>
          )}
        </div>

        {/* Headline */}
        <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
          {getFeatureHeadline()}
        </h2>
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
          {isTrial
            ? 'Choose a plan to continue accessing multi-account tracking, loan schedules, and custom reports.'
            : 'Basic plan includes monthly budget, monthly/weekly reports, 1 bank account, 1 loan, and 2 subscriptions.'}
        </p>

        {/* Referral Reward Callout */}
        {discountPercent > 0 && (
          <div className="mt-3.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 flex items-center justify-between gap-3 text-slate-800 dark:text-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-300 shrink-0">
                <FiGift className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                  {discountPercent}% referral discount applied
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Earned from referring {user?.referral?.referralCount || 0} friend{user?.referral?.referralCount === 1 ? '' : 's'}. Deducted at checkout.
                </p>
              </div>
            </div>
            <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-600 text-white shrink-0">
              -{discountPercent}%
            </span>
          </div>
        )}

        {/* Success or Error Banner */}
        {successMsg && (
          <div className="mt-3.5 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/40 text-emerald-700 dark:text-emerald-300 text-xs font-medium flex items-center gap-2">
            <FiCheck className="w-4 h-4 shrink-0" />
            {successMsg}
          </div>
        )}
        {errorMsg && (
          <div className="mt-3.5 p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
            <FiX className="w-4 h-4 shrink-0" />
            {errorMsg}
          </div>
        )}

        {typeof navigator !== 'undefined' && !navigator.onLine && (
          <div className="mt-3.5 p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
            <FiWifiOff className="w-4 h-4 shrink-0 text-amber-500" />
            <span>Internet connection required for subscription changes.</span>
          </div>
        )}

        {/* Plans Selection Grid */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {PLANS.map((plan) => {
            const isSelected = selectedPlanId === plan.id;
            const finalPrice = calculatePrice(plan.price);
            const monthsCount = plan.id === 'kickstart' ? 1 : plan.id === 'quarterly' ? 3 : plan.id === 'half_yearly' ? 6 : 12;
            const perMonthDiscounted = Math.round(finalPrice / monthsCount);

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`relative p-3.5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${
                  isSelected
                    ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20'
                    : 'border-slate-200 dark:border-[#222634] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#191c26]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-sm text-slate-900 dark:text-white">
                      {plan.name}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded border ${plan.badgeClass}`}>
                      {plan.tag}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">{plan.duration}</p>
                </div>

                <div className="mt-3 flex items-baseline justify-between pt-2.5 border-t border-slate-100 dark:border-[#222634]">
                  <div className="flex items-baseline gap-1.5">
                    {discountPercent > 0 ? (
                      <>
                        <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                          ₹{finalPrice}
                        </span>
                        <span className="text-xs line-through text-slate-400 font-mono">
                          ₹{plan.price}
                        </span>
                      </>
                    ) : (
                      <span className="text-xl font-bold font-mono text-slate-900 dark:text-white">
                        ₹{plan.price}
                      </span>
                    )}
                    <span className="text-[11px] text-slate-400">total</span>
                  </div>
                  <span className="text-xs font-medium text-slate-500 dark:text-slate-400 font-mono">
                    ~₹{perMonthDiscounted}/mo
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Checklist */}
        <div className="mt-4 p-3.5 rounded-lg bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634]">
          <h4 className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 mb-2.5">
            Included with Pro:
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-300">
            <div className="flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Multiple bank, cash, and card accounts</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Loan and EMI schedules</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Recurring subscription tracking</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Investment portfolio overview</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Insurance policy renewal reminders</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Cashflow projections</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Daily budget alerts with custom times</span>
            </div>
            <div className="flex items-center gap-2">
              <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span>Custom date-range reports and statements</span>
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
          <button
            onClick={handleSubscribe}
            disabled={loading || (typeof navigator !== 'undefined' && !navigator.onLine)}
            className="w-full flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-lg btn-primary text-white font-semibold text-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
            ) : (
              <FiAward className="w-3.5 h-3.5" />
            )}
            <span>
              Activate {selectedPlan.name} (₹{calculatePrice(selectedPlan.price)})
            </span>
          </button>
          
          <button
            onClick={closeUpgradeModal}
            className="w-full sm:w-auto px-4 py-2.5 text-xs text-slate-500 hover:text-slate-800 dark:hover:text-white transition-colors cursor-pointer"
          >
            Keep basic tier
          </button>
        </div>

        <p className="mt-2 text-center text-[11px] text-slate-400">
          All your manual entries and budget history remain available on the basic tier.
        </p>
      </div>
    </div>
  );
}
