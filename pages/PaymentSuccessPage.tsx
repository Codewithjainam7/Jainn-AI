import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Crown, Zap, Gift, ArrowRight } from 'lucide-react';

interface PaymentSuccessPageProps {
  plan: 'pro' | 'ultra';
  wasFree: boolean;
  onContinue: () => void;
}

export const PaymentSuccessPage: React.FC<PaymentSuccessPageProps> = ({ 
  plan, 
  wasFree,
  onContinue 
}) => {
  const [showConfetti, setShowConfetti] = useState(true);
  const [animationStep, setAnimationStep] = useState(0);

  useEffect(() => {
    // Animation sequence
    const timers = [
      setTimeout(() => setAnimationStep(1), 500),
      setTimeout(() => setAnimationStep(2), 1000),
      setTimeout(() => setAnimationStep(3), 1500),
      setTimeout(() => setShowConfetti(false), 3000),
    ];

    return () => timers.forEach(clearTimeout);
  }, []);

  const planDetails = {
    pro: {
      name: 'Pro',
      color: 'from-blue-500 to-blue-600',
      icon: <Crown className="text-yellow-500" size={48} />,
      features: [
        'Multi-Agent Mode Unlocked',
        '50,000 tokens/day (10x more!)',
        '20 images per day',
        'Priority Support',
        '500 chat history'
      ]
    },
    ultra: {
      name: 'Ultra',
      color: 'from-purple-500 to-pink-600',
      icon: <Sparkles className="text-purple-400" size={48} />,
      features: [
        'Unlimited Tokens',
        '30 images per day',
        'Custom Themes',
        '24/7 Premium Support',
        'Team Collaboration',
        'Advanced Features'
      ]
    }
  };

  const details = planDetails[plan];

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-[#0D1117] dark:via-[#161B22] dark:to-[#1A1F2E] flex items-center justify-center p-4 overflow-hidden">
      
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {showConfetti && [...Array(50)].map((_, i) => (
          <div
            key={i}
            className="absolute animate-[confetti_3s_ease-out_forwards]"
            style={{
              left: `${Math.random() * 100}%`,
              top: '-10%',
              animationDelay: `${Math.random() * 0.5}s`,
              opacity: 0
            }}
          >
            <div 
              className={`w-3 h-3 ${
                i % 3 === 0 ? 'bg-blue-500' : i % 3 === 1 ? 'bg-purple-500' : 'bg-pink-500'
              } rounded-full`}
            />
          </div>
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main Content */}
      <div className="relative z-10 max-w-2xl w-full">
        
        {/* Success Icon */}
        <div className={`flex justify-center mb-8 transition-all duration-700 ${
          animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}>
          <div className="relative">
            <div className="absolute inset-0 bg-green-400 rounded-full blur-2xl opacity-50 animate-pulse" />
            <div className="relative w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle size={64} className="text-white" strokeWidth={3} />
            </div>
            {wasFree && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 p-2 rounded-full shadow-lg animate-bounce">
                <Gift size={24} className="text-white" />
              </div>
            )}
          </div>
        </div>

        {/* Success Message */}
        <div className={`text-center mb-8 transition-all duration-700 delay-300 ${
          animationStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {wasFree ? '🎉 Free Upgrade Activated!' : '🎊 Payment Successful!'}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-2">
            Welcome to Jainn AI {details.name}
          </p>
          {wasFree && (
            <p className="text-sm text-green-600 dark:text-green-400 font-medium">
              You got this plan for FREE with your coupon! 🎁
            </p>
          )}
        </div>

        {/* Plan Card */}
        <div className={`bg-white dark:bg-[#161B22] rounded-3xl p-8 border-2 border-transparent bg-gradient-to-r ${details.color} bg-clip-padding shadow-2xl mb-8 transition-all duration-700 delay-500 ${
          animationStep >= 3 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-6">
            
            {/* Plan Header */}
            <div className="flex items-center justify-between mb-6 pb-6 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                {details.icon}
                <div>
                  <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                    {details.name} Plan
                    <Zap className="text-yellow-500" size={24} />
                  </h2>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Your subscription is now active
                  </p>
                </div>
              </div>
            </div>

            {/* Features List */}
            <div className="space-y-3 mb-6">
              {details.features.map((feature, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 dark:bg-[#0D1117] transition-all duration-300 hover:bg-gray-100 dark:hover:bg-[#1A1F2E]"
                  style={{
                    animation: `slideInRight 0.5s ease-out ${0.1 * idx}s both`
                  }}
                >
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                    <CheckCircle size={16} className="text-white" />
                  </div>
                  <span className="text-gray-700 dark:text-gray-300 font-medium">
                    {feature}
                  </span>
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={onContinue}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 flex items-center justify-center gap-2 group"
            >
              Start Using {details.name}
              <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>

        {/* Additional Info */}
        <div className="text-center space-y-2 text-sm text-gray-500 dark:text-gray-400">
          <p>✨ All features are now available in your account</p>
          {!wasFree && <p>📧 Receipt sent to your email</p>}
          <p>💬 Need help? Our support team is here for you</p>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(360deg);
            opacity: 0;
          }
        }

        @keyframes slideInRight {
          from {
            opacity: 0;
            transform: translateX(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </div>
  );
};
