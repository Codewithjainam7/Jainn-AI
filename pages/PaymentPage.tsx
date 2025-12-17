import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { User, UserTier } from '../types';
import { Check, Crown, Sparkles, Tag, ArrowLeft, Shield, Lock, X } from 'lucide-react';

interface PaymentPageProps {
  user: User;
  selectedPlan: 'pro' | 'ultra';
  onBack: () => void;
  onPaymentSuccess: (tier: 'pro' | 'ultra') => void;
}

export const PaymentPage: React.FC<PaymentPageProps> = ({
  user,
  selectedPlan,
  onBack,
  onPaymentSuccess
}) => {
  const [couponCode, setCouponCode] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{code: string, discount: number, type: string} | null>(null);
  const [couponError, setCouponError] = useState('');
  const [processing, setProcessing] = useState(false);

  // FIXED: Correct coupon codes with proper types
  const VALID_COUPONS: {[key: string]: {discount: number, type: 'percentage' | 'fixed'}} = {
    'JAINN50': { discount: 50, type: 'percentage' },
    'WELCOME25': { discount: 25, type: 'percentage' },
    'EARLY100': { discount: 100, type: 'percentage' }, // 100% discount = FREE
    'LAUNCH2025': { discount: 30, type: 'percentage' }
  };

  const planDetails = {
    pro: {
      name: 'Pro Plan',
      price: 19900, // ₹199 in paise (199 * 100)
      originalPrice: 19900,
      features: [
        'Multi-Agent Mode',
        '50,000 tokens/day',
        '20 images/day',
        '500 chat history',
        'Priority support'
      ],
      icon: <Crown size={24} className="text-yellow-500" />
    },
    ultra: {
      name: 'Ultra Plan',
      price: 39900, // ₹399 in paise (399 * 100)
      originalPrice: 39900,
      features: [
        'Everything in Pro',
        'Unlimited tokens',
        '30 images/day',
        'Custom themes',
        '24/7 Premium support',
        'Team collaboration'
      ],
      icon: <Sparkles size={24} className="text-purple-500" />
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

  // FIXED: Proper coupon calculation
  const calculateFinalPrice = () => {
    if (!appliedCoupon) return plan.price;

    const couponData = VALID_COUPONS[appliedCoupon.code];
    if (couponData.type === 'percentage') {
      const discount = Math.floor(plan.price * couponData.discount / 100);
      return Math.max(0, plan.price - discount);
    } else {
      // Fixed amount discount (in paise)
      return Math.max(0, plan.price - (couponData.discount * 100));
    }
  };

  const finalPrice = calculateFinalPrice();
  const savings = plan.price - finalPrice;
  const gstAmount = Math.floor(finalPrice * 0.18);
  const totalWithGST = finalPrice + gstAmount;

  const handlePayment = async () => {
    setProcessing(true);

    try {
      // Load Razorpay script
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.async = true;
      document.body.appendChild(script);

      script.onload = () => {
        const options = {
          key: import.meta.env.VITE_RAZORPAY_KEY_ID || '',
          amount: totalWithGST, // Amount in paise
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
            onPaymentSuccess(selectedPlan);
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
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] p-4 sm:p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={onBack}
            className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-blue-500 transition-colors"
          >
            <ArrowLeft size={20} />
            <span className="hidden sm:inline">Back</span>
          </button>
          
          {/* Logo Animation - Same as Login Page */}
          <div className="relative w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center">
            <div className="relative z-20 w-12 h-12 sm:w-16 sm:h-16 bg-white/5 backdrop-blur-2xl rounded-2xl border border-white/10 flex items-center justify-center shadow-2xl">
              <Logo size={40} />
            </div>
            <svg className="absolute inset-0 w-full h-full opacity-30 animate-[spin_30s_linear_infinite]">
              <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" className="text-blue-500" />
              <circle cx="50%" cy="50%" r="35%" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-purple-500" />
            </svg>
          </div>
        </div>

        <div className="grid lg:grid-cols-5 gap-6 lg:gap-8">
          {/* Left: Plan Details - Takes 3 columns */}
          <div className="lg:col-span-3 bg-white dark:bg-[#161B22] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10 h-fit">
            <div className="flex items-center gap-3 mb-6">
              {plan.icon}
              <h2 className="text-xl sm:text-2xl font-bold dark:text-white">{plan.name}</h2>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline gap-2 flex-wrap mb-2">
                {savings > 0 && (
                  <span className="text-base sm:text-lg text-gray-400 line-through">
                    ₹{(plan.originalPrice / 100).toFixed(0)}
                  </span>
                )}
                <span className="text-3xl sm:text-4xl font-bold dark:text-white">
                  ₹{(finalPrice / 100).toFixed(0)}
                </span>
                <span className="text-gray-500">/month</span>
              </div>
              {savings > 0 && (
                <div className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded-full text-sm font-medium">
                  <Tag size={14} />
                  You save ₹{(savings / 100).toFixed(0)} ({Math.round((savings / plan.price) * 100)}% off)
                </div>
              )}
            </div>

            <div className="space-y-3 mb-8">
              {plan.features.map((feature, idx) => (
                <div key={idx} className="flex items-center gap-3 text-sm sm:text-base text-gray-700 dark:text-gray-300">
                  <Check size={18} className="text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </div>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="pt-6 border-t border-gray-200 dark:border-white/10">
              <div className="flex items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                <div className="flex items-center gap-2">
                  <Shield size={16} className="text-green-500" />
                  <span className="hidden sm:inline">Secure Payment</span>
                  <span className="sm:hidden">Secure</span>
                </div>
                <div className="flex items-center gap-2">
                  <Lock size={16} className="text-blue-500" />
                  <span className="hidden sm:inline">SSL Encrypted</span>
                  <span className="sm:hidden">Encrypted</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Payment Form - Takes 2 columns */}
          <div className="lg:col-span-2 space-y-6">
            {/* Coupon Code */}
            <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10">
              <h3 className="text-base sm:text-lg font-bold mb-4 dark:text-white flex items-center gap-2">
                <Tag size={20} className="text-blue-500" />
                Coupon Code
              </h3>

              {!appliedCoupon ? (
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Enter code"
                      className="flex-1 px-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0D1117] border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none dark:text-white text-sm"
                    />
                    <Button
                      onClick={applyCoupon}
                      disabled={!couponCode.trim()}
                      className="px-4 sm:px-6 whitespace-nowrap text-sm"
                    >
                      Apply
                    </Button>
                  </div>
                  {couponError && (
                    <p className="text-sm text-red-500">{couponError}</p>
                  )}
                </div>
              ) : (
                <div className="flex items-center justify-between p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border border-green-200 dark:border-green-500/30">
                  <div className="flex items-center gap-3">
                    <Check size={20} className="text-green-500 flex-shrink-0" />
                    <div>
                      <p className="font-bold text-green-600 dark:text-green-400 text-sm">
                        {appliedCoupon.code}
                      </p>
                      <p className="text-xs text-green-600 dark:text-green-400">
                        {appliedCoupon.discount}% discount applied
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="text-red-500 hover:text-red-700 p-1"
                  >
                    <X size={18} />
                  </button>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-white/10">
              <h3 className="text-base sm:text-lg font-bold mb-4 dark:text-white">Order Summary</h3>
              
              <div className="space-y-3 mb-6 text-sm">
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>{plan.name}</span>
                  <span>₹{(plan.originalPrice / 100).toFixed(0)}</span>
                </div>
                
                {savings > 0 && (
                  <div className="flex justify-between text-green-600 dark:text-green-400">
                    <span>Discount ({appliedCoupon?.discount}%)</span>
                    <span>-₹{(savings / 100).toFixed(0)}</span>
                  </div>
                )}
                
                <div className="flex justify-between text-gray-600 dark:text-gray-400">
                  <span>GST (18%)</span>
                  <span>₹{(gstAmount / 100).toFixed(0)}</span>
                </div>
                
                <div className="pt-3 border-t border-gray-200 dark:border-white/10 flex justify-between text-lg sm:text-xl font-bold dark:text-white">
                  <span>Total</span>
                  <span>₹{(totalWithGST / 100).toFixed(0)}</span>
                </div>
              </div>

              <Button
                onClick={handlePayment}
                disabled={processing}
                className="w-full py-4 text-base sm:text-lg"
              >
                {processing ? 'Processing...' : 'Proceed to Payment'}
              </Button>

              <p className="text-xs text-center text-gray-500 mt-4">
                By continuing, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>

            {/* Payment Methods */}
            <div className="bg-white dark:bg-[#161B22] rounded-3xl p-6 border border-gray-200 dark:border-white/10">
              <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 mb-3">
                Accepted Payment Methods:
              </p>
              <div className="flex items-center justify-center gap-3 sm:gap-4 opacity-60 flex-wrap text-xs">
                <div className="font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                  UPI
                </div>
                <div className="font-bold">CARDS</div>
                <div className="font-bold hidden sm:inline">NET BANKING</div>
                <div className="font-bold">WALLETS</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
