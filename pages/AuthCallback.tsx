import React, { useEffect, useState } from 'react';
import { supabase, getUserProfile, upsertUserProfile } from '../lib/supabase';
import { User, UserTier } from '../types';
import { Logo } from '../components/Logo';

interface AuthCallbackProps {
  onLogin: (user: User) => void;
  onNavigate: (page: string) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onLogin, onNavigate }) => {
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('Processing authentication...');
  const [showBooting, setShowBooting] = useState(false);

  useEffect(() => {
    handleCallback();
  }, []);

  const handleCallback = async () => {
    try {
      if (!supabase) {
        throw new Error('Supabase not configured');
      }

      console.log('🔐 Processing OAuth callback...');

      // Get the session from the URL
      const { data: { session }, error } = await supabase.auth.getSession();

      if (error) throw error;

      if (!session) {
        throw new Error('No session found');
      }

      console.log('✅ Session obtained:', session.user.email);

      // Load or create user profile
      let profile = await getUserProfile(session.user.id);

      if (!profile) {
        console.log('Creating new user profile...');
        profile = await upsertUserProfile({
          id: session.user.id,
          email: session.user.email,
          tier: 'free',
          tokens_used: 0,
          images_generated: 0,
          theme_color: '#3B82F6'
        });
      }

      const userData: User = {
        id: profile.id,
        email: profile.email,
        tier: profile.tier as UserTier,
        tokensUsed: profile.tokens_used,
        imagesGenerated: profile.images_generated,
        themeColor: profile.theme_color
      };

      console.log('✅ User profile loaded:', userData);

      setStatus('success');
      setMessage('Login successful!');
      setShowBooting(true);

      // Show booting animation then navigate
      setTimeout(() => {
        onLogin(userData);
        onNavigate('chat');
      }, 3500);

    } catch (error: any) {
      console.error('❌ Auth callback error:', error);
      setStatus('error');
      setMessage(error.message || 'Authentication failed');

      // Redirect to login after 3 seconds
      setTimeout(() => {
        onNavigate('login');
      }, 3000);
    }
  };

  if (showBooting) {
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

        <style>{`
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
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-[#0A0E1A] dark:via-[#0F1419] dark:to-[#0A0E1A] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white dark:bg-[#0D1117] rounded-2xl shadow-2xl p-8 text-center">
        <div className="mb-6">
          <Logo size={64} className="mx-auto mb-4" />
          
          {status === 'loading' && (
            <div className="w-12 h-12 border-4 border-blue-500/20 border-t-blue-500 rounded-full animate-spin mx-auto mb-4" />
          )}
          
          {status === 'success' && (
            <div className="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          )}
          
          {status === 'error' && (
            <div className="w-12 h-12 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
          )}
        </div>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          {status === 'loading' && 'Authenticating...'}
          {status === 'success' && 'Success!'}
          {status === 'error' && 'Authentication Failed'}
        </h2>
        
        <p className="text-gray-600 dark:text-gray-400">
          {message}
        </p>
      </div>
    </div>
  );
};
