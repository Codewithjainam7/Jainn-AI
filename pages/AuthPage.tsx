import React, { useState } from 'react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { User, UserTier } from '../types';
import { Mail, Lock, Eye, EyeOff, CheckCircle, AlertCircle } from 'lucide-react';
import { supabase, signInWithGoogle } from '../lib/supabase';

// Inline Custom Modal Component
const CustomModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
}> = ({ isOpen, onClose, title, message, type = 'info' }) => {
  if (!isOpen) return null;

  const getIconAndColor = () => {
    switch (type) {
      case 'success':
        return { Icon: CheckCircle, iconColor: 'text-green-500', bgColor: 'bg-green-100 dark:bg-green-900/30' };
      case 'error':
        return { Icon: AlertCircle, iconColor: 'text-red-500', bgColor: 'bg-red-100 dark:bg-red-900/30' };
      case 'warning':
        return { Icon: AlertCircle, iconColor: 'text-yellow-500', bgColor: 'bg-yellow-100 dark:bg-yellow-900/30' };
      default:
        return { Icon: Mail, iconColor: 'text-blue-500', bgColor: 'bg-blue-100 dark:bg-blue-900/30' };
    }
  };

  const { Icon, iconColor, bgColor } = getIconAndColor();

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="bg-white dark:bg-[#161B22] rounded-2xl p-6 max-w-md w-full shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95">
        <div className={`w-12 h-12 rounded-full ${bgColor} flex items-center justify-center mb-4 mx-auto`}>
          <Icon size={24} className={iconColor} />
        </div>
        <h3 className="text-xl font-bold mb-2 dark:text-white text-center">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-6 text-center leading-relaxed">{message}</p>
        <button 
          onClick={onClose}
          className="w-full px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-700 font-medium transition-colors"
        >
          Got it
        </button>
      </div>
    </div>
  );
};

interface AuthPageProps {
  onLogin: (user: User) => void;
  onNavigate: (page: string) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onLogin, onNavigate }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isAnimating, setIsAnimating] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });

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

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModalConfig({ title, message, type });
    setModalOpen(true);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (!supabase) {
        setError('Authentication is not configured. Please use Guest mode.');
        setLoading(false);
        return;
      }

      if (!isLogin) {
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
          showModal(
            'Check Your Email',
            'We\'ve sent you a confirmation link. Please check your inbox to verify your account.',
            'success'
          );
          setIsLogin(true);
        }
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (signInError) throw signInError;

        if (data.user) {
          const userData: User = {
            id: data.user.id,
            email: data.user.email || '',
            tier: UserTier.FREE,
            tokensUsed: 0,
            imagesGenerated: 0,
            themeColor: '#3B82F6',
            displayName: data.user.email?.split('@')[0] || 'User'
          };
          onLogin(userData);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setError(err.message || 'Authentication failed');
    } finally {
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
      const { error } = await signInWithGoogle();
      
      if (error) {
        console.error('❌ Google sign-in error:', error);
        throw error;
      }
      
      console.log('✅ Redirecting to Google...');
    } catch (err: any) {
      console.error('Google auth error:', err);
      setError(err.message || 'Google sign-in failed');
      setLoading(false);
    }
  };

  const handleGuest = () => {
    const guestUser: User = {
      id: 'guest_' + Date.now(),
      email: 'guest@jainn.ai',
      tier: UserTier.GUEST,
      tokensUsed: 0,
      imagesGenerated: 0,
      themeColor: '#3B82F6',
      displayName: 'Guest User'
    };
    localStorage.setItem('jainnUser', JSON.stringify(guestUser));
    onLogin(guestUser);
  };

  return (
    <>
      <CustomModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalConfig.title}
        message={modalConfig.message}
        type={modalConfig.type}
      />

      <div className="min-h-screen flex bg-gray-50 dark:bg-[#0D1117]">
        {/* Left Panel - Form */}
        <div className="w-full lg:w-1/2 p-8 sm:p-12 lg:p-24 flex flex-col justify-center relative">
          <button 
            onClick={() => onNavigate('landing')}
            className="absolute top-8 left-8 flex items-center gap-2 text-gray-500 hover:text-blue-500 transition-colors"
          >
            ← Back
          </button>

          <div className="max-w-md w-full mx-auto transition-opacity duration-300" style={{ opacity: isAnimating ? 0 : 1 }}>
            <div className="mb-10 text-center lg:text-left">
              <div className="flex justify-center lg:justify-start mb-6">
                <Logo size={48} />
              </div>
              <h1 className="text-3xl font-bold mb-2 text-gray-900 dark:text-white">
                {isLogin ? 'Welcome Back' : 'Create Account'}
              </h1>
              <p className="text-gray-500">
                {isLogin ? 'Enter your details to access your AI agents.' : 'Start your journey with Jainn AI today.'}
              </p>
            </div>

            {error && (
              <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-xl text-red-600 dark:text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="flex bg-gray-200 dark:bg-[#161B22] p-1 rounded-xl mb-8 relative">
              <div className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-[#0D1117] rounded-lg shadow-sm transition-all duration-300 ${isLogin ? 'left-1' : 'left-[calc(50%+4px)]'}`}></div>
              <button 
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all z-10 ${isLogin ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                onClick={() => switchMode(true)}
              >
                Sign In
              </button>
              <button 
                className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all z-10 ${!isLogin ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500'}`}
                onClick={() => switchMode(false)}
              >
                Sign Up
              </button>
            </div>

            <form onSubmit={handleEmailAuth} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                  <input 
                    type={showPassword ? "text" : "password"}
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
                  <div className="flex gap-1 mt-2 h-1">
                    {[1,2,3,4].map(i => (
                      <div 
                        key={i} 
                        className={`flex-1 rounded-full transition-colors ${
                          i <= strength 
                            ? (strength > 2 ? 'bg-green-500' : 'bg-yellow-500') 
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>

              {!isLogin && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Confirm Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
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
              
              <Button type="submit" className="w-full py-3 text-lg" disabled={loading || !supabase}>
                {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Create Account')}
              </Button>
            </form>

            <div className="my-8 flex items-center">
              <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
              <span className="px-4 text-sm text-gray-500">or</span>
              <div className="flex-1 border-t border-gray-200 dark:border-white/10"></div>
            </div>

            <div className="space-y-3">
              <button 
                type="button"
                onClick={handleGoogleAuth}
                disabled={loading || !supabase}
                className="w-full py-3 px-4 rounded-xl border border-gray-200 dark:border-white/10 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-700 dark:text-gray-200 font-medium bg-white dark:bg-[#161B22] disabled:opacity-50"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                Continue with Google
              </button>

              <button 
                type="button"
                onClick={handleGuest}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-dashed border-gray-300 dark:border-white/20 flex items-center justify-center gap-3 hover:bg-gray-50 dark:hover:bg-white/5 transition-all text-gray-500 hover:text-blue-500 font-medium disabled:opacity-50"
              >
                Continue as Guest (Limited)
              </button>
            </div>

            {!supabase && (
              <p className="text-xs text-center text-gray-400 mt-4">
                💡 Tip: Email/Google sign-in requires Supabase configuration. Guest mode works without setup!
              </p>
            )}
          </div>
        </div>

        {/* Right Panel */}
        <div className="hidden lg:flex w-1/2 bg-[#0D1117] relative overflow-hidden items-center justify-center">
          <div className="absolute inset-0 bg-gradient-to-br from-blue-900/40 to-black"></div>
          <div className="absolute top-0 right-0 w-full h-full overflow-hidden">
            <div className="absolute top-[10%] left-[20%] w-72 h-72 bg-blue-600/20 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[20%] right-[10%] w-96 h-96 bg-purple-600/10 rounded-full blur-[120px] animate-pulse delay-1000"></div>
          </div>

          <div className="relative z-10 p-12 text-center max-w-lg">
            <div className="w-full aspect-square max-w-sm mx-auto mb-12 relative flex items-center justify-center">
              <div className="relative z-20 w-48 h-48 bg-white/5 backdrop-blur-2xl rounded-[40px] border border-white/10 flex items-center justify-center shadow-2xl animate-[float_6s_ease-in-out_infinite]">
                <Logo size={100} />
              </div>
              
              <svg className="absolute inset-0 w-full h-full opacity-30 animate-[spin_30s_linear_infinite]">
                <circle cx="50%" cy="50%" r="48%" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="8 8" className="text-blue-500" />
                <circle cx="50%" cy="50%" r="35%" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" className="text-purple-500" />
              </svg>
            </div>

            <h2 className="text-4xl font-bold text-white mb-6">Master Multi-Agent AI</h2>
            <p className="text-gray-400 text-lg leading-relaxed">
              Orchestrate Gemini, LLaMA, and Mistral in one seamless interface. Let the Referee AI optimize your results.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};
