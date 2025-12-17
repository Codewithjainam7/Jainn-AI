import React, { useEffect, useState } from 'react';
import { CheckCircle, Sparkles, Crown, Zap, Gift, ArrowRight, Star } from 'lucide-react';

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
      accentColor: 'blue',
      icon: <Crown className="text-yellow-500" size={64} />,
      features: [
        { icon: '🤖', text: 'Multi-Agent Mode Unlocked', highlight: true },
        { icon: '⚡', text: '50,000 tokens/day (10x more!)' },
        { icon: '🎨', text: '20 images per day' },
        { icon: '🎯', text: 'Priority Support' },
        { icon: '💬', text: '500 chat history' }
      ],
      badge: 'Most Popular'
    },
    ultra: {
      name: 'Ultra',
      color: 'from-purple-500 to-pink-600',
      accentColor: 'purple',
      icon: <Sparkles className="text-purple-400" size={64} />,
      features: [
        { icon: '♾️', text: 'Unlimited Tokens', highlight: true },
        { icon: '🎨', text: '30 images per day' },
        { icon: '🎨', text: 'Custom Themes & Colors' },
        { icon: '🚀', text: '24/7 Premium Support' },
        { icon: '👥', text: 'Team Collaboration' },
        { icon: '⚡', text: 'Advanced Features' }
      ],
      badge: 'Best Value'
    }
  };

  const details = planDetails[plan];

  return (
    <div className="fixed inset-0 z-[200] bg-gradient-to-br from-gray-50 via-blue-50/30 to-purple-50/30 dark:from-[#0D1117] dark:via-[#0D1117] dark:to-[#1A1F2E] flex items-center justify-center p-4 overflow-hidden">
      
      {/* Animated Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {showConfetti && [...Array(60)].map((_, i) => (
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
                i % 4 === 0 ? 'bg-blue-500' : 
                i % 4 === 1 ? 'bg-purple-500' : 
                i % 4 === 2 ? 'bg-pink-500' : 'bg-yellow-500'
              } rounded-full shadow-lg`}
            />
          </div>
        ))}
      </div>

      {/* Floating Particles */}
      <div className="absolute top-20 left-20 w-64 h-64 bg-blue-400/20 rounded-full blur-[100px] animate-pulse" />
      <div className="absolute bottom-20 right-20 w-96 h-96 bg-purple-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main Content */}
      <div className="relative z-10 max-w-3xl w-full">
        
        {/* Success Icon with Ring Animation */}
        <div className={`flex justify-center mb-8 transition-all duration-700 ${
          animationStep >= 1 ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
        }`}>
          <div className="relative">
            {/* Animated Rings */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-48 h-48 border-4 border-green-400/30 rounded-full animate-ping" />
              <div className="absolute w-40 h-40 border-4 border-green-400/40 rounded-full animate-pulse" />
            </div>
            
            {/* Main Icon */}
            <div className="relative w-32 h-32 bg-gradient-to-br from-green-400 to-green-600 rounded-full flex items-center justify-center shadow-2xl">
              <CheckCircle size={64} className="text-white" strokeWidth={3} />
            </div>
            
            {/* Free Badge */}
            {wasFree && (
              <div className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-400 to-orange-500 p-3 rounded-full shadow-lg animate-bounce">
                <Gift size={24} className="text-white" />
              </div>
            )}
            
            {/* Sparkle Effects */}
            <Star className="absolute -top-4 -left-4 text-yellow-400 animate-pulse" size={20} />
            <Star className="absolute -bottom-4 -right-4 text-yellow-400 animate-pulse" size={16} style={{ animationDelay: '0.5s' }} />
          </div>
        </div>

        {/* Success Message */}
        <div className={`text-center mb-10 transition-all duration-700 delay-300 ${
          animationStep >= 2 ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
        }`}>
          <h1 className="text-4xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            {wasFree ? '🎉 Free Upgrade Activated!' : '🎊 Payment Successful!'}
          </h1>
          <p className="text-2xl font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Welcome to Jainn AI {details.name}
          </p>
          {wasFree && (
            <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full text-white font-bold text-sm shadow-lg">
              <Gift size={20} />
              You got this plan for FREE with your coupon!
            </div>
          )}
        </div>

        {/* Enhanced Plan Card */}
        <div className={`relative bg-white dark:bg-[#161B22] rounded-3xl border-2 border-gray-200 dark:border-white/10 shadow-2xl mb-8 overflow-hidden transition-all duration-700 delay-500 ${
          animationStep >= 3 ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
        }`}>
          
          {/* Gradient Top Bar */}
          <div className={`h-2 bg-gradient-to-r ${details.color}`} />
          
          <div className="p-8">
            
            {/* Plan Header */}
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-200 dark:border-white/10">
              <div className="flex items-center gap-4">
                <div className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${details.color} flex items-center justify-center shadow-lg`}>
                  {details.icon}
                </div>
                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <h2 className="text-3xl font-bold dark:text-white">
                      {details.name} Plan
                    </h2>
                    <div className={`px-3 py-1 rounded-full text-xs font-bold bg-${details.accentColor}-100 dark:bg-${details.accentColor}-900/30 text-${details.accentColor}-600 dark:text-${details.accentColor}-400`}>
                      {details.badge}
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                    Active Now
                  </p>
                </div>
              </div>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              {details.features.map((feature, idx) => (
                <div
                  key={idx}
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-300 hover:scale-105 ${
                    feature.highlight 
                      ? `bg-gradient-to-r ${details.color} text-white shadow-lg` 
                      : 'bg-gray-50 dark:bg-[#0D1117] hover:bg-gray-100 dark:hover:bg-[#1A1F2E]'
                  }`}
                  style={{
                    animation: `slideInRight 0.5s ease-out ${0.1 * idx}s both`
                  }}
                >
                  <div className={`text-3xl ${feature.highlight ? '' : 'opacity-70'}`}>
                    {feature.icon}
                  </div>
                  <span className={`font-semibold ${feature.highlight ? 'text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {feature.text}
                  </span>
                  {feature.highlight && (
                    <Zap className="ml-auto text-yellow-300" size={20} />
                  )}
                </div>
              ))}
            </div>

            {/* Action Button */}
            <button
              onClick={onContinue}
              className={`w-full py-5 bg-gradient-to-r ${details.color} hover:opacity-90 text-white rounded-xl font-bold text-lg transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95 flex items-center justify-center gap-3 group relative overflow-hidden`}
            >
              <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
              <span className="relative z-10">Start Using {details.name}</span>
              <ArrowRight size={24} className="relative z-10 group-hover:translate-x-2 transition-transform" />
            </button>
          </div>
        </div>

        {/* Additional Info Cards */}
        <div className="grid md:grid-cols-3 gap-4 text-center">
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-lg">
            <Sparkles className="mx-auto mb-2 text-purple-500" size={24} />
            <p className="text-sm font-medium dark:text-white">All Features</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">Now Available</p>
          </div>
          {!wasFree && (
            <div className="bg-white dark:bg-[#161B22] rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-lg">
              <CheckCircle className="mx-auto mb-2 text-green-500" size={24} />
              <p className="text-sm font-medium dark:text-white">Receipt Sent</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">Check Your Email</p>
            </div>
          )}
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-4 border border-gray-200 dark:border-white/10 shadow-lg">
            <Zap className="mx-auto mb-2 text-blue-500" size={24} />
            <p className="text-sm font-medium dark:text-white">Support Ready</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">We're Here to Help</p>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
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
