import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useSubscription } from '../../context/SubscriptionContext';
import { createPaymentOrder, verifyPaymentSignature } from '../../services/billingService';
import { Capacitor } from '@capacitor/core';
import {
  FiCheck,
  FiX,
  FiZap,
  FiShield,
  FiAward,
  FiWifiOff,
  FiGift,
  FiLock,
  FiCheckCircle,
  FiClock,
  FiUsers
} from 'react-icons/fi';

const PLANS = [
  {
    id: 'kickstart',
    playStoreId: 'urxpenz_kickstart_1m',
    name: 'Kickstart',
    duration: '30 days',
    price: 45,
    perMonth: 45,
    tag: '1 month',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  {
    id: 'quarterly',
    playStoreId: 'urxpenz_pro_3m',
    name: 'Quarterly',
    duration: '90 days',
    price: 119,
    perMonth: 39,
    tag: '13% savings',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  {
    id: 'half_yearly',
    playStoreId: 'urxpenz_pro_6m',
    name: 'Half-yearly',
    duration: '180 days',
    price: 199,
    perMonth: 33,
    tag: '26% savings',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 border-slate-200 dark:border-slate-700'
  },
  {
    id: 'annual',
    playStoreId: 'urxpenz_annual_1y',
    name: 'Annual Pro',
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
    refreshSubscription,
    isTrial,
    trialDaysRemaining,
    isPro
  } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState('annual');
  // step: 'select_plan' | 'processing' | 'success'
  const [step, setStep] = useState('select_plan');
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  const isNative = typeof window !== 'undefined' && (Capacitor.isNativePlatform() || Capacitor.getPlatform() === 'android');

  const discountPercent = user?.referral?.discountPercent || 0;
  const calculatePrice = (price) => {
    if (!discountPercent || discountPercent <= 0) return price;
    const discount = Math.round((price * discountPercent) / 100);
    return Math.max(1, price - discount);
  };

  if (!isUpgradeModalOpen) return null;

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) || PLANS[3];
  const finalPrice = calculatePrice(selectedPlan.price);

  const handleStartTransaction = async () => {
    if (typeof navigator !== 'undefined' && !navigator.onLine) {
      setErrorMsg('Internet connection required. Please connect to internet to proceed.');
      return;
    }
    setErrorMsg('');

    // If native Android (Google Play Store release)
    if (isNative) {
      if (isTrial) {
        setErrorMsg('You currently have full Pro access on your active Free Trial! In-app renewals will open before your trial period concludes.');
      } else {
        setErrorMsg('In-app subscriptions are being enabled in Google Play. Please refer friends for extended trial or contact urxpenz.help@gmail.com.');
      }
      return;
    }

    // On Web, initiate real Razorpay payment
    setLoading(true);
    try {
      const orderRes = await createPaymentOrder(selectedPlanId);

      if (!orderRes.data?.order) {
        setLoading(false);
        setErrorMsg(
          orderRes.data?.message ||
            'Payment gateway is being initialized. All features are currently active during your free trial!'
        );
        return;
      }

      // Live Razorpay keys present: open official Razorpay Checkout popup
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
        description: `Upgrade to ${orderRes.data.plan?.name || selectedPlan.name}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            setStep('processing');
            setProcessingStatus('Verifying payment signature with Razorpay & clearing transaction...');
            await verifyPaymentSignature({
              planId: selectedPlanId,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature
            });
            await refreshSubscription();
            setSuccessReceipt({
              receiptId: response.razorpay_payment_id || `RZP_${Date.now().toString(36).toUpperCase()}`,
              planName: selectedPlan.name,
              amount: finalPrice,
              method: 'UPI / Card / Net Banking',
              timestamp: new Date().toLocaleString('en-IN')
            });
            setStep('success');
          } catch (vErr) {
            setErrorMsg(vErr.response?.data?.message || 'Payment verification failed.');
            setStep('select_plan');
          }
        },
        theme: {
          color: '#6366f1'
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          }
        }
      };

      const rzp = new window.Razorpay(options);
      rzp.on('payment.failed', function (resp) {
        setErrorMsg(resp.error?.description || 'Payment was cancelled or unsuccessful.');
        setLoading(false);
      });
      rzp.open();
      setLoading(false);
    } catch (err) {
      setLoading(false);
      setErrorMsg(
        err.response?.data?.message ||
          'Payment gateway could not be reached. All features are currently active during your free trial!'
      );
    }
  };

  const handleClose = () => {
    setStep('select_plan');
    setErrorMsg('');
    setProcessingStatus('');
    setSuccessReceipt(null);
    closeUpgradeModal();
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
        return 'URxpenz Pro Membership';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] p-5 sm:p-6 text-slate-800 dark:text-slate-100 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <FiX className="w-4 h-4" />
        </button>

        {/* STEP 1: SELECT PLAN & TRIAL OVERVIEW */}
        {step === 'select_plan' && (
          <div>
            {/* Top Free Trial Status Banner */}
            {isTrial ? (
              <div className="mb-4 p-3.5 rounded-xl bg-gradient-to-r from-emerald-500/10 via-indigo-500/10 to-purple-500/10 border border-emerald-500/30 flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold text-base shrink-0">
                    <FiZap className="w-5 h-5 text-amber-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      {user?.hasReferralBonus ? '70-Day Referral Trial Active' : '60-Day Free Pro Trial Active'}
                      <span className="px-2 py-0.5 rounded-full text-[10px] bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-bold">
                        {trialDaysRemaining} days remaining
                      </span>
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      All Pro features are fully unlocked for you at zero cost during your trial!
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded text-xs font-medium bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  <FiClock className="w-3.5 h-3.5 text-indigo-500" />
                  URxpenz Pro Membership
                </span>
                {discountPercent > 0 && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                    <FiGift className="w-3 h-3" />
                    {discountPercent}% referral discount
                  </span>
                )}
              </div>
            )}

            {/* Headline */}
            <h2 className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
              {getFeatureHeadline()}
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
              {isTrial
                ? 'Your free trial includes multi-account tracking, loan EMI calculators, budget alerts, and custom reports.'
                : 'Select a plan below to continue with unlimited accounts, loan schedules, and custom reports.'}
            </p>

            {/* Referral Reward Callout (Up to 5 friends = 25% off) */}
            <div className="mt-3.5 p-3 rounded-xl bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/40 flex items-center justify-between gap-3 text-slate-800 dark:text-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-lg bg-indigo-100 dark:bg-indigo-900/40 text-indigo-600 dark:text-indigo-400 shrink-0">
                  <FiUsers className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-900 dark:text-white">
                    Referral Program: 5% off per friend (up to 25% total)
                  </p>
                  <p className="text-[11px] text-slate-500 dark:text-slate-400">
                    {discountPercent > 0
                      ? `${discountPercent}% discount earned from ${user?.referral?.referralCount || 0} referral(s). Applied automatically to all plans!`
                      : 'Invite friends to earn 5% off your next renewal for each signup (capped at 5 friends).'}
                  </p>
                </div>
              </div>
              {discountPercent > 0 && (
                <span className="px-2 py-1 rounded text-xs font-bold bg-emerald-600 text-white shrink-0">
                  -{discountPercent}% OFF
                </span>
              )}
            </div>

            {/* Error Banner */}
            {errorMsg && (
              <div className="mt-3.5 p-3 rounded-xl bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <FiX className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {typeof navigator !== 'undefined' && !navigator.onLine && (
              <div className="mt-3.5 p-3 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/40 text-amber-800 dark:text-amber-300 text-xs font-medium flex items-center gap-2">
                <FiWifiOff className="w-4 h-4 shrink-0 text-amber-500" />
                <span>Internet connection required for subscription changes.</span>
              </div>
            )}

            {/* Plans Selection Grid */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {PLANS.map((plan) => {
                const isSelected = selectedPlanId === plan.id;
                const priceFinal = calculatePrice(plan.price);
                const monthsCount =
                  plan.id === 'kickstart' ? 1 : plan.id === 'quarterly' ? 3 : plan.id === 'half_yearly' ? 6 : 12;
                const perMonthDiscounted = Math.round(priceFinal / monthsCount);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-3.5 rounded-xl border transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-2 ring-indigo-500/40 shadow-sm'
                        : 'border-slate-200 dark:border-[#222634] hover:border-slate-300 dark:hover:border-slate-700 bg-white dark:bg-[#191c26]'
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-sm text-slate-900 dark:text-white">
                          {plan.name}
                        </span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full border ${plan.badgeClass}`}>
                          {plan.tag}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 dark:text-slate-400">
                        {plan.duration} duration
                      </p>
                    </div>

                    <div className="mt-3 pt-2 border-t border-slate-100 dark:border-[#222634] flex items-baseline justify-between">
                      <div>
                        {discountPercent > 0 ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs line-through text-slate-400 font-mono">
                              ₹{plan.price}
                            </span>
                            <span className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400">
                              ₹{priceFinal}
                            </span>
                          </div>
                        ) : (
                          <span className="text-base font-bold font-mono text-slate-900 dark:text-white">
                            ₹{priceFinal}
                          </span>
                        )}
                        <span className="text-[10px] text-slate-400 ml-1">
                          (₹{perMonthDiscounted}/mo)
                        </span>
                      </div>

                      {isSelected && (
                        <div className="w-5 h-5 rounded-full bg-indigo-600 text-white flex items-center justify-center">
                          <FiCheck className="w-3 h-3 stroke-[3]" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Feature Inclusions Checklist */}
            <div className="mt-4 p-3.5 rounded-xl bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634]">
              <p className="text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Everything included with Pro:
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Unlimited bank accounts & wallets</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Multi-loan tracking & EMI schedules</span>
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
                  <span>Cashflow projections & runway</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Daily budget alerts with custom times</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Custom date-range reports & PDF export</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Bank-grade privacy & no third-party ads</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
              {isTrial ? (
                <>
                  <button
                    onClick={handleClose}
                    className="btn-primary w-full flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium cursor-pointer py-2.5"
                  >
                    <FiZap className="w-4 h-4 text-amber-300" />
                    <span>Continue with Free Trial ({trialDaysRemaining}d left)</span>
                  </button>
                  <button
                    onClick={handleStartTransaction}
                    disabled={loading || (typeof navigator !== 'undefined' && !navigator.onLine)}
                    className="btn-ghost w-full sm:w-auto px-4 py-2.5 rounded-xl text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-950/30 cursor-pointer"
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-3 w-3 border-2 border-indigo-600 border-t-transparent" />
                    ) : (
                      <span>Upgrade Early (₹{finalPrice})</span>
                    )}
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={handleStartTransaction}
                    disabled={loading || (typeof navigator !== 'undefined' && !navigator.onLine)}
                    className="btn-primary w-full flex-1 flex items-center justify-center gap-2 rounded-xl text-sm font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed py-2.5"
                  >
                    {loading ? (
                      <span className="inline-block animate-spin rounded-full h-3.5 w-3.5 border-2 border-white border-t-transparent" />
                    ) : (
                      <FiAward className="w-4 h-4" />
                    )}
                    <span>
                      Proceed to Payment (₹{finalPrice})
                    </span>
                  </button>
                  <button
                    onClick={handleClose}
                    className="btn-ghost w-full sm:w-auto px-4 py-2.5 rounded-xl text-sm font-medium cursor-pointer"
                  >
                    Keep basic tier
                  </button>
                </>
              )}
            </div>

            <p className="mt-2 text-center text-[11px] text-slate-400">
              {isTrial
                ? 'Your 60-day trial gives you complete Pro access. No credit card required.'
                : 'Basic tier includes 1 bank account, 1 loan, and 2 subscriptions.'}
            </p>
          </div>
        )}

        {/* STEP 2: PROCESSING TRANSACTION */}
        {step === 'processing' && (
          <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
            <div className="relative">
              <div className="w-14 h-14 rounded-full border-4 border-indigo-200 dark:border-indigo-950 border-t-indigo-600 animate-spin" />
              <div className="absolute inset-0 flex items-center justify-center">
                <FiShield className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>

            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Verifying Payment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                {processingStatus || 'Verifying transaction with payment gateway...'}
              </p>
            </div>

            <p className="text-[10px] text-slate-400">
              Please do not refresh or close this window.
            </p>
          </div>
        )}

        {/* STEP 3: VERIFIED TRANSACTION RECEIPT / SUCCESS */}
        {step === 'success' && (
          <div className="py-4 space-y-4 text-center">
            <div className="w-12 h-12 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <FiCheckCircle className="w-7 h-7" />
            </div>

            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Payment Successful!
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Your transaction has been verified. All Pro features are active for your subscription period.
              </p>
            </div>

            {/* Official Receipt Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10121a] border border-slate-200 dark:border-[#222634] text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">
                  {successReceipt?.receiptId || 'TXN_VERIFIED'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Plan Activated</span>
                <span className="font-semibold text-slate-800 dark:text-white">
                  {successReceipt?.planName || selectedPlan.name}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Amount Paid</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                  ₹{successReceipt?.amount || finalPrice}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Payment Gateway</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {successReceipt?.method || 'Razorpay Verified (UPI/Card)'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Timestamp</span>
                <span className="text-slate-700 dark:text-slate-300">
                  {new Date().toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="btn-primary w-full py-2.5 rounded-xl text-sm font-medium cursor-pointer"
            >
              Continue to URxpenz
            </button>
          </div>
        )}

      </div>
    </div>
  );
}
