import React, { useEffect, useState } from 'react';
import { Logo } from '../components/Logo';
import { supabase } from '../lib/supabase';

/**
 * AuthCallback page handles the redirect from Google OAuth
 * This page is shown briefly while Supabase processes the authentication
 */
export const AuthCallback: React.FC = () => {
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Handle the OAuth callback
    const handleCallback = async () => {
      try {
        // Get the hash from URL (Supabase uses hash-based callback)
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const refreshToken = hashParams.get('refresh_token');
        const errorParam = hashParams.get('error');
        const errorDescription = hashParams.get('error_description');

        if (errorParam) {
          setError(errorDescription || 'Authentication failed');
          setTimeout(() => {
            window.location.href = '/';
          }, 3000);
          return;
        }

        if (accessToken) {
          // Set the session with the tokens
          const { data, error: sessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken || '',
          });

          if (sessionError) {
            console.error('Session error:', sessionError);
            setError('Failed to establish session');
            setTimeout(() => {
              window.location.href = '/';
            }, 3000);
            return;
          }

          // Success - redirect to home (App.tsx will handle routing to chat)
          console.log('Auth successful, redirecting...');
          window.location.href = '/';
        } else {
          // No access token found, redirect to home
          console.log('No access token, redirecting to home...');
          setTimeout(() => {
            window.location.href = '/';
          }, 2000);
        }
      } catch (err) {
        console.error('Callback error:', err);
        setError('An unexpected error occurred');
        setTimeout(() => {
          window.location.href = '/';
        }, 3000);
      }
    };

    handleCallback();

    // Fallback timeout - redirect to home after 10 seconds no matter what
    const fallbackTimeout = setTimeout(() => {
      console.log('Fallback redirect triggered');
      window.location.href = '/';
    }, 10000);

    return () => clearTimeout(fallbackTimeout);
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
            Completing sign-in...
          </p>
          <div className="w-48 h-1 bg-blue-900/30 rounded-full mt-6 overflow-hidden">
            <div className="h-full bg-blue-500 animate-[width_5s_ease-out_infinite] w-0"></div>
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
