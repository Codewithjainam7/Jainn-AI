import React, { useEffect, useState } from 'react';
import { Logo } from '../components/Logo';
import { supabase, upsertUserProfile } from '../lib/supabase';
import { User, UserTier } from '../types';

interface AuthCallbackProps {
  onLogin: (user: User) => void;
}

export const AuthCallback: React.FC<AuthCallbackProps> = ({ onLogin }) => {
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState('Processing authentication...');

  useEffect(() => {
    const handleCallback = async () => {
      console.log('🔐 Auth callback triggered');
      
      try {
        if (!supabase) {
          setError('Authentication service not configured');
          setTimeout(() => window.location.href = '/', 2000);
          return;
        }

        const urlParams = new URLSearchParams(window.location.search);
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        
        const tokenHash = urlParams.get('token_hash');
        const type = urlParams.get('type');
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error') || urlParams.get('error');
        const errorDescription = hashParams.get('error_description') || urlParams.get('error_description');

        console.log('📦 Auth params:', { 
          hasTokenHash: !!tokenHash,
          type,
          hasAccessToken: !!accessToken, 
          hasRefreshToken: !!refreshToken,
          error: errorParam 
        });

        if (errorParam) {
          console.error('❌ Auth error:', errorDescription);
          setError(errorDescription || 'Authentication failed');
          setTimeout(() => window.location.href = '/', 3000);
          return;
        }

        // CASE 1: Email verification callback
        if (type === 'signup' || type === 'email' || tokenHash) {
          console.log('📧 Processing email verification...');
          setStatus('Verifying your email...');
          
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          const { data: { session }, error: sessionError } = await supabase.auth.getSession();
          
          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            setError('Email verification failed');
            setTimeout(() => window.location.href = '/', 3000);
            return;
          }

          if (session?.user) {
            console.log('✅ Email verified, creating user profile...');
            setStatus('Setting up your account...');
            
            // Create user profile and trigger login
            const profile = await upsertUserProfile({
              id: session.user.id,
              email: session.user.email!,
              tier: 'free',
              tokens_used: 0,
              images_generated: 0,
              theme_color: '#3B82F6',
              display_name: session.user.email!.split('@')[0]
            });

            const userData: User = {
              id: profile.id,
              email: profile.email,
              tier: UserTier.FREE,
              tokensUsed: 0,
              imagesGenerated: 0,
              themeColor: '#3B82F6',
              displayName: session.user.email!.split('@')[0]
            };

            // Trigger Netflix animation and login
            onLogin(userData);
          } else {
            setStatus('Verification complete. Please sign in.');
            setTimeout(() => window.location.href = '/', 2000);
          }
          return;
        }

        // CASE 2: OAuth callback (Google)
        if (accessToken && refreshToken) {
          console.log('🔐 Setting up OAuth session...');
          setStatus('Setting up your session...');
          
          const { data: { session }, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            setError('Failed to establish session');
            setTimeout(() => window.location.href = '/', 3000);
            return;
          }

          if (session?.user) {
            console.log('✅ OAuth session established, creating profile...');
            setStatus('Setting up your account...');
            
            // Get or create user profile
            let profile = await upsertUserProfile({
              id: session.user.id,
              email: session.user.email!,
              tier: 'free',
              tokens_used: 0,
              images_generated: 0,
              theme_color: '#3B82F6',
              display_name: session.user.user_metadata?.full_name || session.user.email!.split('@')[0]
            });

            const userData: User = {
              id: profile.id,
              email: profile.email,
              tier: UserTier.FREE,
              tokensUsed: profile.tokens_used,
              imagesGenerated: profile.images_generated,
              themeColor: profile.theme_color,
              displayName: profile.display_name,
              avatar: session.user.user_metadata?.avatar_url
            };

            console.log('✅ Triggering login with Netflix animation...');
            // This will trigger the Netflix animation in App.tsx
            onLogin(userData);
          }
        } else {
          console.log('⚠️ No auth tokens found, redirecting home');
          setStatus('Redirecting...');
          setTimeout(() => window.location.href = '/', 1000);
        }
      } catch (err) {
        console.error('❌ Callback error:', err);
        setError('An unexpected error occurred');
        setTimeout(() => window.location.href = '/', 3000);
      }
    };

    handleCallback();
  }, [onLogin]);

  return (
    <div className="fixed inset-0 bg-[#0D1117] flex flex-col items-center justify-center z-[100]">
      <div className="animate-pulse-fast">
        <Logo size={120} />
      </div>
      
      {error ? (
        <>
          <p className="text-red-400 mt-8 text-lg font-medium tracking-wide">
            {error}
          </p>
          <p className="text-gray-400 mt-2 text-sm">
            Redirecting to home...
          </p>
        </>
      ) : (
        <>
          <p className="text-gray-200 mt-8 text-lg font-medium tracking-wide animate-pulse">
            {status}
          </p>
          <div className="w-48 h-1 bg-blue-900/30 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-blue-500 animate-[width_3s_ease-out_infinite] w-0"></div>
          </div>
        </>
      )}
      
      <style>{`
        @keyframes width {
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
};
