import React, { useEffect, useState } from 'react';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';

export const AuthCallback: React.FC = () => {
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

        // Get hash params
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        console.log('📦 Hash params:', { 
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

        if (accessToken && refreshToken) {
          setStatus('Setting up your session...');
          
          const { error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (sessionError) {
            console.error('❌ Session error:', sessionError);
            setError('Failed to establish session');
            setTimeout(() => window.location.href = '/', 3000);
            return;
          }

          console.log('✅ Session established, redirecting...');
          setStatus('Success! Redirecting...');
          
          // Wait a bit for session to fully establish
          setTimeout(() => {
            window.location.href = '/';
          }, 1000);
        } else {
          console.log('⚠️ No tokens found, redirecting home');
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
  }, []);

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
