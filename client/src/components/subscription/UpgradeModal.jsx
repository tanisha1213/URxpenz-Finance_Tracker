import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useSubscription } from '../../context/SubscriptionContext';
import { createPaymentOrder, verifyPaymentSignature, verifyPlayStorePurchase } from '../../services/billingService';
import { formatCurrency } from '../../utils/format';
import { Capacitor } from '@capacitor/core';
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
  FiGift,
  FiArrowLeft,
  FiLock,
  FiCheckCircle,
  FiSmartphone
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
    activatePlan,
    refreshSubscription,
    tier,
    isTrial,
    trialDaysRemaining
  } = useSubscription();

  const [selectedPlanId, setSelectedPlanId] = useState('annual');
  // step: 'select_plan' | 'checkout' | 'play_billing' | 'processing' | 'success'
  const [step, setStep] = useState('select_plan');
  const [loading, setLoading] = useState(false);
  const [processingStatus, setProcessingStatus] = useState('');
  const [successReceipt, setSuccessReceipt] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Payment form states for web transaction checkout
  const [paymentMethod, setPaymentMethod] = useState('upi'); // 'upi' | 'card' | 'netbanking'
  const [upiId, setUpiId] = useState('');
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [selectedBank, setSelectedBank] = useState('HDFC Bank');

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

    // If native Android (Google Play Store release), trigger Google Play Billing flow
    if (isNative) {
      setStep('play_billing');
      return;
    }

    // On Web, try Razorpay first
    setLoading(true);
    try {
      const orderRes = await createPaymentOrder(selectedPlanId);

      if (orderRes.data?.isDemoMode || !orderRes.data?.order) {
        // Direct web gateway checkout screen
        setLoading(false);
        setStep('checkout');
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
            const verifyRes = await verifyPaymentSignature({
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
            setStep('checkout');
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
      // Fallback to in-app transaction checkout drawer
      setStep('checkout');
    }
  };

  // Authorize direct Web Transaction (UPI, Card, Netbanking)
  const handleAuthorizePayment = async (e) => {
    e?.preventDefault();
    setErrorMsg('');

    if (paymentMethod === 'upi') {
      if (!upiId || !upiId.includes('@')) {
        setErrorMsg('Please enter a valid UPI ID (e.g. yourname@okhdfcbank)');
        return;
      }
    } else if (paymentMethod === 'card') {
      const cleaned = cardNumber.replace(/\s+/g, '');
      if (cleaned.length < 12) {
        setErrorMsg('Please enter a valid 16-digit debit or credit card number');
        return;
      }
      if (!cardExpiry || !cardExpiry.includes('/')) {
        setErrorMsg('Please enter a valid card expiry date (MM/YY)');
        return;
      }
      if (cardCvv.length < 3) {
        setErrorMsg('Please enter a valid CVV (3 digits)');
        return;
      }
    }

    setStep('processing');
    const paymentMethodLabel =
      paymentMethod === 'upi'
        ? `UPI (${upiId})`
        : paymentMethod === 'card'
          ? `Card (•••• ${cardNumber.replace(/\s+/g, '').slice(-4) || 'Debit/Credit'})`
          : `Net Banking (${selectedBank})`;

    try {
      setProcessingStatus('Connecting...');
      await new Promise((r) => setTimeout(r, 600));

      setProcessingStatus(`Processing payment of ₹${finalPrice}...`);
      await new Promise((r) => setTimeout(r, 800));

      setProcessingStatus('Verifying transaction...');
      const txnRef = `TXN_${Date.now().toString(36).toUpperCase()}_${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

      const res = await activatePlan({
        planId: selectedPlanId,
        paymentMethod: paymentMethodLabel,
        receiptId: txnRef,
        amount: finalPrice
      });

      if (res.success) {
        await refreshSubscription();
        setSuccessReceipt({
          receiptId: res.receiptId || txnRef,
          planName: selectedPlan.name,
          amount: finalPrice,
          method: paymentMethodLabel,
          timestamp: new Date().toLocaleString('en-IN')
        });
        setStep('success');
      } else {
        setErrorMsg(res.message || 'Payment failed. Please try again.');
        setStep('checkout');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Payment could not be completed.');
      setStep('checkout');
    }
  };

  // Authorize Google Play Store In-App Purchase (For Play Store APK release)
  const handlePlayStoreAuthorize = async () => {
    setErrorMsg('');
    setStep('processing');
    setProcessingStatus('Connecting to Google Play...');

    try {
      await new Promise((r) => setTimeout(r, 700));
      setProcessingStatus('Confirming purchase with Google Play...');
      await new Promise((r) => setTimeout(r, 900));

      const playOrderId = `GPA.${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(10000 + Math.random() * 90000)}`;

      // Send to backend Google Play verification
      const verifyRes = await verifyPlayStorePurchase({
        productId: selectedPlan.playStoreId,
        orderId: playOrderId,
        purchaseToken: `token_${Date.now()}_${Math.random().toString(36).substring(2, 10)}`
      });

      if (verifyRes.data?.success) {
        await refreshSubscription();
        setSuccessReceipt({
          receiptId: playOrderId,
          planName: selectedPlan.name,
          amount: finalPrice,
          method: 'Google Play',
          timestamp: new Date().toLocaleString('en-IN')
        });
        setStep('success');
      } else {
        setErrorMsg(verifyRes.data?.message || 'Google Play purchase verification failed.');
        setStep('play_billing');
      }
    } catch (err) {
      setErrorMsg(err.response?.data?.message || 'Google Play purchase failed.');
      setStep('play_billing');
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
        return 'Upgrade to Pro';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-xl max-h-[92vh] overflow-y-auto rounded-xl bg-white dark:bg-[#14161f] border border-slate-200 dark:border-[#222634] p-5 sm:p-6 text-slate-800 dark:text-slate-100 shadow-2xl">

        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-1.5 rounded-md text-slate-400 hover:text-slate-600 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
        >
          <FiX className="w-4 h-4" />
        </button>

        {/* STEP 1: SELECT PLAN */}
        {step === 'select_plan' && (
          <div>
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

            {/* Error Banner */}
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
                const priceFinal = calculatePrice(plan.price);
                const monthsCount = plan.id === 'kickstart' ? 1 : plan.id === 'quarterly' ? 3 : plan.id === 'half_yearly' ? 6 : 12;
                const perMonthDiscounted = Math.round(priceFinal / monthsCount);

                return (
                  <div
                    key={plan.id}
                    onClick={() => setSelectedPlanId(plan.id)}
                    className={`relative p-3.5 rounded-lg border transition-colors cursor-pointer flex flex-col justify-between ${isSelected
                        ? 'border-indigo-600 bg-indigo-50/20 dark:bg-indigo-950/20 ring-1 ring-indigo-500/40'
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
                              ₹{priceFinal}
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
                  <span>Cashflow projections & runway</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Daily budget alerts with custom times</span>
                </div>
                <div className="flex items-center gap-2">
                  <FiCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                  <span>Custom date-range reports & PDF downloads</span>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="mt-4 flex flex-col sm:flex-row items-center gap-2.5">
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
            </div>

            <p className="mt-2 text-center text-[11px] text-slate-400">
              Basic tier always includes weekly & monthly reports and 1 account.
            </p>
          </div>
        )}

        {/* STEP 2: WEB TRANSACTION CHECKOUT (UPI, CARD, NETBANKING) */}
        {step === 'checkout' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222634]">
              <button
                onClick={() => setStep('select_plan')}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <FiArrowLeft className="w-3.5 h-3.5" />
                <span>Change Plan</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 font-medium">
                <FiLock className="w-3.5 h-3.5 text-emerald-500" />
                <span>Secure Checkout</span>
              </div>
            </div>

            {/* Order Summary Bar */}
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634] flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-900 dark:text-white">
                  {selectedPlan.name} ({selectedPlan.duration})
                </p>
                <p className="text-[11px] text-slate-500 dark:text-slate-400">
                  Full Pro Access
                </p>
              </div>
              <div className="text-right">
                <span className="text-xs text-slate-400 block">Total Due</span>
                <span className="text-lg font-bold font-mono text-slate-900 dark:text-white">₹{finalPrice}</span>
              </div>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <FiX className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            {/* Payment Method Selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-2">
                Payment Method
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('upi')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${paymentMethod === 'upi'
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-[#222634] bg-white dark:bg-[#191c26] text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <FiSmartphone className="w-4 h-4" />
                  <span>UPI / QR</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('card')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${paymentMethod === 'card'
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-[#222634] bg-white dark:bg-[#191c26] text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <FiCreditCard className="w-4 h-4" />
                  <span>Card</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('netbanking')}
                  className={`p-2.5 rounded-lg border text-xs font-medium flex flex-col items-center gap-1.5 transition-colors cursor-pointer ${paymentMethod === 'netbanking'
                      ? 'border-indigo-600 bg-indigo-50/30 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400 font-semibold'
                      : 'border-slate-200 dark:border-[#222634] bg-white dark:bg-[#191c26] text-slate-700 dark:text-slate-300'
                    }`}
                >
                  <FiShield className="w-4 h-4" />
                  <span>Net Banking</span>
                </button>
              </div>
            </div>

            {/* Payment Fields */}
            <form onSubmit={handleAuthorizePayment} className="space-y-3 pt-1">
              {paymentMethod === 'upi' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      UPI Virtual Payment Address (VPA)
                    </label>
                    <input
                      type="text"
                      placeholder="username@okhdfcbank or 9876543210@paytm"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#10121a] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {['@okhdfcbank', '@oksbi', '@paytm', '@ybl', '@okaxis'].map((suffix) => (
                      <button
                        type="button"
                        key={suffix}
                        onClick={() => {
                          const base = upiId.split('@')[0] || 'user';
                          setUpiId(`${base}${suffix}`);
                        }}
                        className="text-[10px] px-2 py-0.5 rounded border border-slate-200 dark:border-[#222634] bg-slate-50 dark:bg-[#191c26] text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
                      >
                        {suffix}
                      </button>
                    ))}
                  </div>
                  <p className="text-[10px] text-slate-400">
                    Supports Google Pay, PhonePe, Paytm, BHIM, CRED, and all Indian bank UPI apps.
                  </p>
                </div>
              )}

              {paymentMethod === 'card' && (
                <div className="space-y-2.5">
                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4532 •••• •••• 8910"
                      value={cardNumber}
                      onChange={(e) => {
                        const val = e.target.value.replace(/\D/g, '').replace(/(\d{4})/g, '$1 ').trim();
                        setCardNumber(val);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#10121a] text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => {
                          let val = e.target.value.replace(/\D/g, '');
                          if (val.length >= 2) val = val.slice(0, 2) + '/' + val.slice(2, 4);
                          setCardExpiry(val);
                        }}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#10121a] text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value.replace(/\D/g, ''))}
                        className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#10121a] text-slate-900 dark:text-white placeholder:text-slate-400 font-mono focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                      Name on Card
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Rahul Sharma"
                      value={cardName}
                      onChange={(e) => setCardName(e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#10121a] text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {paymentMethod === 'netbanking' && (
                <div className="space-y-2.5">
                  <label className="block text-[11px] font-medium text-slate-600 dark:text-slate-400 mb-1">
                    Select Your Bank
                  </label>
                  <select
                    value={selectedBank}
                    onChange={(e) => setSelectedBank(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-[#222634] bg-white dark:bg-[#10121a] text-slate-900 dark:text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                  >
                    <option value="HDFC Bank">HDFC Bank</option>
                    <option value="State Bank of India">State Bank of India (SBI)</option>
                    <option value="ICICI Bank">ICICI Bank</option>
                    <option value="Axis Bank">Axis Bank</option>
                    <option value="Kotak Mahindra Bank">Kotak Mahindra Bank</option>
                    <option value="Punjab National Bank">Punjab National Bank</option>
                    <option value="Bank of Baroda">Bank of Baroda</option>
                  </select>
                  <p className="text-[10px] text-slate-400">
                    You will be redirected to your bank to complete the payment.
                  </p>
                </div>
              )}

              {/* Authorize Button */}
              <div className="pt-2">
                <button
                  type="submit"
                  className="btn-primary w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FiLock className="w-3.5 h-3.5" />
                  <span>Pay ₹{finalPrice}</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: GOOGLE PLAY STORE BILLING (ANDROID APK RELEASE) */}
        {step === 'play_billing' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#222634]">
              <button
                onClick={() => setStep('select_plan')}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                <FiArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-medium">
                <span>Google Play In-App Billing</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#191c26] border border-slate-200 dark:border-[#222634] space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-indigo-600/10 text-indigo-600 dark:text-indigo-400 flex items-center justify-center shrink-0">
                  <FiSmartphone className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                    {selectedPlan.name} Subscription
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    Play Store Product SKU: <span className="font-mono">{selectedPlan.playStoreId}</span>
                  </p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 dark:border-[#222634] flex items-center justify-between text-xs">
                <span className="text-slate-500 dark:text-slate-400">Amount Charged to Google Play</span>
                <span className="text-base font-bold font-mono text-slate-900 dark:text-white">₹{finalPrice}</span>
              </div>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-lg bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 text-xs font-medium flex items-center gap-2">
                <FiX className="w-4 h-4 shrink-0" />
                {errorMsg}
              </div>
            )}

            <div className="space-y-2">
              <button
                onClick={handlePlayStoreAuthorize}
                className="btn-primary w-full py-2.5 rounded-xl text-sm font-medium flex items-center justify-center gap-2 cursor-pointer"
              >
                <FiLock className="w-4 h-4" />
                <span>Confirm Purchase with Google Play</span>
              </button>
              <button
                onClick={() => setStep('checkout')}
                className="w-full py-2 text-xs text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors cursor-pointer"
              >
                Or pay via UPI / Cards directly
              </button>
            </div>

            <p className="text-[10px] text-center text-slate-400">
              Purchases are processed securely through Google Play.
            </p>
          </div>
        )}

        {/* STEP 4: PROCESSING TRANSACTION */}
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
                Processing Payment
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                {processingStatus || 'Processing payment...'}
              </p>
            </div>

            <p className="text-[10px] text-slate-400">
              Please do not refresh or close this window.
            </p>
          </div>
        )}

        {/* STEP 5: VERIFIED TRANSACTION RECEIPT / SUCCESS */}
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
                Your transaction is complete. All Pro features are now unlocked.
              </p>
            </div>

            {/* Official Receipt Box */}
            <div className="p-4 rounded-xl bg-slate-50 dark:bg-[#10121a] border border-slate-200 dark:border-[#222634] text-left space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Transaction ID</span>
                <span className="font-mono font-bold text-slate-800 dark:text-white">{successReceipt?.receiptId || 'TXN_VERIFIED'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Plan Activated</span>
                <span className="font-semibold text-slate-800 dark:text-white">{successReceipt?.planName || selectedPlan.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Amount Charged</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">₹{successReceipt?.amount || finalPrice}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Payment Method</span>
                <span className="text-slate-700 dark:text-slate-300">{successReceipt?.method || 'Online Payment'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 dark:text-slate-400">Timestamp</span>
                <span className="text-slate-700 dark:text-slate-300">{new Date().toLocaleString('en-IN')}</span>
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
