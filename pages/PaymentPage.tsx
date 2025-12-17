import React, { useState } from 'react';
import { Check, Crown, Sparkles, Tag, ArrowLeft, Shield, Lock, X, Zap } from 'lucide-react';

interface PaymentPageProps {
  user: any;
  selectedPlan: 'pro' | 'ultra';
  onBack: () => void;
  onPaymentSuccess: (tier: 'pro' | 'ultra', wasFree: boolean) => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  user,
  selectedPlan: initialPlan,
  onBack,
  onPaymentSuccess
}) => {
  const [selectedPlan, setSelectedPlan] = useState<'pro' | 'ultra'>(initialPlan);
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number, type: string} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [processing, setProcessing] = useState(false);

  const VALID_COUPONS: {[key: string]: {discount: number, type: 'percentage' | 'fixed'}} = {
    'JAINN50': { discount: 50, type: 'percentage' },
    'WELCOME25': { discount: 25, type: 'percentage' },
    'EARLY100': { discount: 100, type: 'percentage' },
    'LAUNCH2025': { discount: 30, type: 'percentage' },
    'ULTRA50': { discount: 50, type: 'percentage' },
    'FREEPRO': { discount: 100, type: 'percentage' }
  };

  const planDetails = {
    pro: {
      name: 'Pro Plan',
      price: 19900,
      originalPrice: 19900,
      features: [
        '🤖 Multi-Agent Mode',
        '⚡ 50,000 tokens/day',
        '🎨 20 images/day',
        '💬 500 chat history',
        '🎯 Priority support'
      ],
      icon: <Crown size={32} className="text-yellow-500" />,
      gradient: 'from-blue-500 to-blue-600',
      badge: 'Most Popular'
    },
    ultra: {
      name: 'Ultra Plan',
      price: 39900,
      originalPrice: 39900,
      features: [
        '✨ Everything in Pro',
        '♾️ Unlimited tokens',
        '🎨 30 images/day',
        '🎨 Custom themes',
        '👥 Team collaboration',
        '🚀 24/7 Premium support'
      ],
      icon: <Sparkles size={32} className="text-purple-500" />,
      gradient: 'from-purple-500 to-pink-600',
      badge: 'Best Value'
    }
  };

  const plan = planDetails[selectedPlan];

  const applyCoupon = () => {
    setCouponError('');
    const code = couponCode.toUpperCase().trim();
    
    if (!code) {
      setCouponError('Please enter a coupon code');
      return;
    }

    const coupon = VALID_COUPONS[code];
    if (!coupon) {
      setCouponError('Invalid coupon code');
      return;
    }

    setAppliedCoupon({ code, discount: coupon.discount, type: coupon.type });
    setCouponError('');
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setCouponError('');
  };

  const calculateFinalPrice = () => {
    if (!appliedCoupon) return plan.price;

    const couponData = VALID_COUPONS[appliedCoupon.code];
    if (couponData.type === 'percentage') {
      const discount = Math.floor(plan.price * couponData.discount / 100);
      return Math.max(0, plan.price - discount);
    } else {
      return Math.max(0, plan.price - (couponData.discount * 100));
    }
  };

  const finalPrice = calculateFinalPrice();
  const savings = plan.price - finalPrice;
  const gstAmount = Math.floor(finalPrice * 0.18);
  const totalWithGST = finalPrice + gstAmount;
  const isFree = totalWithGST === 0;

  const handlePayment = async () => {
    setProcessing(true);

    // If price is 0, activate immediately
    if (isFree) {
      setTimeout(() => {
        onPaymentSuccess(selectedPlan, true);
      }, 1000);
      return;
    }

    try {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
          amount: totalWithGST,
          currency: 'INR',
          name: 'Jainn AI',
          description: `${plan.name} - Monthly Subscription`,
          image: 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none"%3E%3Cpath d="M12 2.25C6.61522 2.25 2.25 6.61522 2.25 12C2.25 17.3848 6.61522 21.75 12 21.75C17.3848 21.75 21.75 17.3848 21.75 12C21.75 9.25164 20.6696 6.73357 18.8891 4.88909" stroke="%233B82F6" stroke-width="2.5" stroke-linecap="round" fill="none"/%3E%3C/svg%3E',
          prefill: {
            name: user.displayName || user.email.split('@')[0],
            email: user.email,
          },
          notes: {
            plan: selectedPlan,
            userId: user.id,
            couponCode: appliedCoupon?.code || 'none'
          },
          theme: {
            color: '#3B82F6'
          },
          handler: function (response: any) {
            console.log('Payment successful:', response);
            onPaymentSuccess(selectedPlan, false);
          },
          modal: {
            ondismiss: function() {
              setProcessing(false);
            }
          }
        };

        // @ts-ignore
        const razorpay = new window.Razorpay(options);
        razorpay.open();
        setProcessing(false);
      };

      script.onerror = () => {
        setProcessing(false);
        alert('Failed to load payment gateway. Please try again.');
      };
    } catch (error) {
      console.error('Payment error:', error);
      setProcessing(false);
      alert('Payment failed. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-[#0D1117] dark:via-[#0D1117] dark:to-[#1A1F2E] p-4 sm:p-8">
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back to Chat</span>
          </button>
          
          <div className="text-center flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Choose Your Plan
            </h1>
          </div>

          <div className="w-20" />
        </div>

        {/* Plan Selection Cards */}
        <div className="grid md:grid-cols-2 gap-6 mb-8 max-w-5xl mx-auto">
          {(['pro', 'ultra'] as const).map((planType) => {
            const planInfo = planDetails[planType];
            const isSelected = selectedPlan === planType;
            
            return (
              <button
                key={planType}
                onClick={() => {
                  setSelectedPlan(planType);
                  setAppliedCoupon(null);
                  setCouponCode('');
                }}
                className={`relative p-6 rounded-3xl border-2 transition-all duration-300 text-left ${
                  isSelected 
                    ? `border-transparent bg-gradient-to-br ${planInfo.gradient} shadow-2xl scale-105` 
                    : 'border-gray-200 dark:border-white/10 bg-white dark:bg-[#161B22] hover:border-blue-300 dark:hover:border-blue-500/50'
                }`}
              >
                {isSelected && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-white dark:bg-[#0D1117] px-4 py-1 rounded-full text-xs font-bold text-blue-600 dark:text-blue-400 shadow-lg border border-blue-200 dark:border-blue-500/30">
                    {planInfo.badge}
                  </div>
                )}

                <div className={`${isSelected ? 'bg-white/10 backdrop-blur-md' : ''} rounded-2xl p-6 transition-all`}>
                  <div className="flex items-center justify-between mb-4">
                    {planInfo.icon}
                    {isSelected && (
                      <div className="w-8 h-8 rounded-full bg-white dark:bg-[#0D1117] flex items-center justify-center">
                        <Check size={20} className="text-green-500" />
                      </div>
                    )}
                  </div>

                  <h3 className={`text-2xl font-bold mb-2 ${isSelected ? 'text-white' : 'dark:text-white'}`}>
                    {planInfo.name}
                  </h3>

                  <div className="flex items-baseline gap-2 mb-4">
                    <span className={`text-4xl font-bold ${isSelected ? 'text-white' : 'dark:text-white'}`}>
                      ₹{(planInfo.price / 100).toFixed(0)}
                    </span>
                    <span className={`${isSelected ? 'text-white/70' : 'text-gray-500'}`}>/month</span>
                  </div>

                  <div className="space-y-2">
                    {planInfo.features.map((feature, idx) => (
                      <div key={idx} className={`flex items-center gap-2 text-sm ${isSelected ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${isSelected ? 'bg-white' : 'bg-blue-500'}`} />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Payment Section */}
        <div className="max-w-2xl mx-auto space-y-6">
          
          {/* Coupon Code */}
          <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 shadow-lg">
            <h3 className="text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
              <Tag size={20} className="text-blue-500" />
              Have a Coupon Code?
            </h3>

            {!appliedCoupon ? (
              <div className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={couponCode}
                    onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                    placeholder="Enter code (e.g., JAINN50)"
                    className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white"
                  />
                  <button
                    onClick={applyCoupon}
                    disabled={!couponCode.trim()}
                    className="px-6 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    Apply
                  </button>
                </div>
                {couponError && (
                  <p className="text-sm text-red-500">{couponError}</p>
                )}
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">Try:</span>
                  {['JAINN50', 'WELCOME25', 'EARLY100'].map(code => (
                    <button
                      key={code}
                      onClick={() => setCouponCode(code)}
                      className="text-xs px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors"
                    >
                      {code}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-500/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
                    <Check size={20} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {appliedCoupon.code}
                    </p>
                    <p className="text-sm text-green-600 dark:text-green-400">
                      {appliedCoupon.discount}% discount applied!
                    </p>
                  </div>
                </div>
                <button
                  onClick={removeCoupon}
                  className="text-red-500 hover:text-red-700 p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 shadow-lg">
            <h3 className="text-lg font-bold mb-6 dark:text-white">Order Summary</h3>
            
            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>{plan.name}</span>
                <span>₹{(plan.originalPrice / 100).toFixed(0)}</span>
              </div>
              
              {savings > 0 && (
                <div className="flex justify-between text-green-600 dark:text-green-400 font-medium">
                  <span>Discount ({appliedCoupon?.discount}%)</span>
                  <span>-₹{(savings / 100).toFixed(0)}</span>
                </div>
              )}
              
              <div className="flex justify-between text-gray-600 dark:text-gray-400">
                <span>GST (18%)</span>
                <span>₹{(gstAmount / 100).toFixed(0)}</span>
              </div>
              
              <div className="pt-4 border-t border-gray-200 dark:border-white/10 flex justify-between items-center">
                <span className="text-xl font-bold dark:text-white">Total</span>
                <div className="text-right">
                  {savings > 0 && (
                    <div className="text-sm text-gray-400 line-through mb-1">
                      ₹{((plan.price + Math.floor(plan.price * 0.18)) / 100).toFixed(0)}
                    </div>
                  )}
                  <span className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {isFree ? 'FREE' : `₹${(totalWithGST / 100).toFixed(0)}`}
                  </span>
                </div>
              </div>

              {isFree && (
                <div className="p-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-xl border border-yellow-200 dark:border-yellow-500/30 flex items-center gap-3">
                  <Zap size={24} className="text-yellow-500 flex-shrink-0" />
                  <p className="text-sm font-medium text-yellow-700 dark:text-yellow-400">
                    🎉 Amazing! You're getting {plan.name} completely FREE with your coupon!
                  </p>
                </div>
              )}
            </div>

            <button
              onClick={handlePayment}
              disabled={processing}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {processing ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  Processing...
                </>
              ) : isFree ? (
                <>
                  <Zap size={20} />
                  Activate Free Upgrade
                </>
              ) : (
                `Pay ₹${(totalWithGST / 100).toFixed(0)}`
              )}
            </button>

            <div className="mt-6 flex items-center justify-center gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1">
                <Shield size={14} className="text-green-500" />
                Secure Payment
              </div>
              <div className="flex items-center gap-1">
                <Lock size={14} className="text-blue-500" />
                SSL Encrypted
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};
