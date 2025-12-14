import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { User, UserTier } from '../types';
import { Mail, Lock, Eye, EyeOff, CheckCircle, XCircle } from 'lucide-react';
import { supabase, signInWithGoogle } from '../lib/supabase';

interface AuthPageProps {
  onLogin: (user: User) => void;
  onNavigate: (page: string) => void;
}

// Custom Toast Component
const Toast: React.FC<{ message: string; type: 'success' | 'error'; onClose: () => void }> = ({ message, type, onClose }) => {
  React.useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[9999] animate-slideDown">
      <div className={`flex items-center gap-3 px-6 py-4 rounded-xl shadow-2xl backdrop-blur-xl ${
        type === 'success' 
          ? 'bg-green-500/90 text-white' 
          : 'bg-red-500/90 text-white'
      }`}>
        {type === 'success' ? <CheckCircle size={20} /> : <XCircle size={20} />}
        <span className="font-medium">{message}</span>
      </div>
    </div>
  );
};

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [booting, setBooting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  const [loading, setLoading] = useState(false);

  // Password Strength
  const getPasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length > 7) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const strength = getPasswordStrength(password);

  const switchMode = (mode: boolean) => {
    setIsAnimating(true);
    setError('');
    setTimeout(() => {
      setIsLogin(mode);
      setIsAnimating(false);
      setPassword('');
      setConfirmPassword('');
    }, 300);
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Check if Supabase is configured
      if (!supabase) {
        setError('Authentication is not configured. Please use Guest mode.');
        setLoading(false);
        return;
      }

      if (!isLogin) {
        // Sign Up
        if (password !== confirmPassword) {
          setError("Passwords do not match");
          setLoading(false);
          return;
        }

        if (password.length < 8) {
          setError("Password must be at least 8 characters");
          setLoading(false);
          return;
        }

        const { data, error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/auth/callback`
          }
        });

        if (signUpError) throw signUpError;

        if (data.user) {
          showToast('Check your email to confirm your account!', 'success');
          setLoading(false);
          setTimeout(() => {
            setIsLogin(true);
          }, 2000);
        }
      } else {
        // Sign In
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          showToast('Login successful! Loading...', 'success');
          setLoading(false);
          setBooting(true);
          setTimeout(() => {
            onNavigate('chat');
          }, 3500);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setError('');
    setLoading(true);

    try {
      if (!supabase) {
        setError('Google Sign-In is not configured. Please use Guest mode.');
        setLoading(false);
        return;
      }

      console.log('🔐 Initiating Google Sign-In...');
      setBooting(true);
      
      const { data, error } = await signInWithGoogle();
      
      if (error) {
        console.error('❌ Google sign-in error:', error);
        setBooting(false);
        throw error;
      }

      console.log('✅ Redirecting to Google...');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
      setBooting(false);
    }
  };

  const handleGuest = () => {
    setBooting(true);
    setTimeout(() => {
      const guestUser: User = {
        id: 'guest_' + Date.now(),
        email: 'guest@jainn.ai',
        tier: UserTier.GUEST,
        tokensUsed: 0,
        imagesGenerated: 0,
        themeColor: '#3B82F6'
      };
      localStorage.setItem('jainnUser', JSON.stringify(guestUser));
      onLogin(guestUser);
    }, 3500);
  };

  if (booting) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center overflow-hidden">
        <div className="text-center space-y-8 animate-fadeIn">
          <div className="relative">
            <div className="w-24 h-24 mx-auto relative animate-float">
              <Logo size={96} className="drop-shadow-2xl" />
              <div className="absolute inset-0 bg-blue-500/20 blur-3xl animate-pulse" />
            </div>
          </div>
          
          <div className="space-y-3">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 bg-clip-text text-transparent animate-shimmer">
              Jainn AI
            </h1>
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
            <p className="text-gray-400 text-lg animate-pulse">Initializing AI Agents...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0A0E1A] dark:via-[#0F1419] dark:to-[#0A0E1A] flex items-center justify-center p-4">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      
      <div className="w-full max-w-6xl bg-white dark:bg-[#0D1117] rounded-3xl shadow-2xl overflow-hidden grid md:grid-cols-2">
        {/* Left Panel - Form */}
        <div className="p-8 md:p-12 relative">
          <button
            onClick={() => onNavigate('landing')}
            className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            ← Back
          </button>

          <div className="max-w-md mx-auto mt-12">
            <div className="text-center mb-8">
              <Logo size={48} className="mx-auto mb-4" />
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {isLogin ? 'Enter your details to access your AI agents.' : 'Start your journey with Jainn AI today.'}
              </p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-red-600 dark:text-red-400 text-sm animate-shake">
                {error}
              </div>
            )}

            {/* Toggle */}
            <div className="flex gap-2 mb-8 p-1 bg-gray-100 dark:bg-[#161B22] rounded-xl">
              <button
                onClick={() => switchMode(true)}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                  isLogin
                    ? 'bg-white dark:bg-[#0D1117] text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => switchMode(false)}
                className={`flex-1 py-2.5 rounded-lg font-medium transition-all ${
                  !isLogin
                    ? 'bg-white dark:bg-[#0D1117] text-blue-600 dark:text-blue-400 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className={`space-y-6 transition-all duration-300 ${isAnimating ? 'opacity-0' : 'opacity-100'}`}>
              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 z-10" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 z-10"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {!isLogin && password && (
                  <div className="flex gap-1 mt-2">
                    {[1,2,3,4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          i <= strength
                            ? strength < 2 ? 'bg-red-500' : strength < 3 ? 'bg-yellow-500' : strength < 4 ? 'bg-blue-500' : 'bg-green-500'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {!isLogin && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Confirm Password</label>
                  <div className="relative">
                    <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                      type="password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className={`w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-[#161B22] border ${
                        confirmPassword && password !== confirmPassword
                          ? 'border-red-500 focus:ring-red-500'
                          : 'border-gray-200 dark:border-white/10 focus:ring-blue-500'
                      } outline-none transition-all dark:text-white`}
                      placeholder="••••••••"
                    />
                  </div>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200 dark:border-white/10" />
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white dark:bg-[#0D1117] text-gray-500">or</span>
                </div>
              </div>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleGoogleAuth}
                disabled={loading}
              >
                <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                  <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </Button>

              <Button
                type="button"
                variant="secondary"
                className="w-full"
                onClick={handleGuest}
                disabled={loading}
              >
                Continue as Guest (Limited)
              </Button>

              {!supabase && (
                <p className="text-xs text-center text-gray-500 dark:text-gray-400">
                  💡 Tip: Email/Google sign-in requires Supabase configuration. Guest mode works without setup!
                </p>
              )}
            </form>
          </div>
        </div>

        {/* Right Panel - Professional Graphic */}
        <div className="hidden md:flex bg-gradient-to-br from-blue-600 to-purple-600 p-12 items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjEiIHN0cm9rZS13aWR0aD0iMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCNncmlkKSIvPjwvc3ZnPg==')] opacity-40" />
          
          <div className="relative z-10 text-white space-y-6 max-w-md">
            <div className="w-16 h-16 bg-white/20 backdrop-blur-xl rounded-2xl flex items-center justify-center mb-6">
              <Logo size={40} />
            </div>
            
            <h2 className="text-4xl font-bold">Master Multi-Agent AI</h2>
            <p className="text-lg text-white/80 leading-relaxed">
              Orchestrate Gemini, LLaMA, and Mistral in one seamless interface. Let the Referee AI optimize your results.
            </p>
            
            <div className="space-y-4 pt-4">
              {[
                { icon: '🤖', text: '3 Powerful AI Models' },
                { icon: '⚡', text: 'Lightning Fast Responses' },
                { icon: '🎨', text: 'AI Image Generation' },
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3 bg-white/10 backdrop-blur-xl rounded-xl p-4">
                  <span className="text-2xl">{item.icon}</span>
                  <span className="font-medium">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }

        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-20px); }
        }

        @keyframes shimmer {
          0% { background-position: -1000px 0; }
          100% { background-position: 1000px 0; }
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }

        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }

        .animate-shake {
          animation: shake 0.3s ease-in-out;
        }

        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .animate-shimmer {
          background-size: 2000px 100%;
          animation: shimmer 3s linear infinite;
        }

        .animate-fadeIn {
          animation: fadeIn 0.8s ease-out;
        }
      `}</style>
    </div>
  );
};
