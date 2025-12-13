import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';
import { AuthCallback } from './pages/AuthCallback';
import { Logo } from './components/Logo';
import { User } from './types';
import { supabase, getCurrentUser, getUserProfile, upsertUserProfile } from './lib/supabase';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(true);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    // Check local storage for theme
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.documentElement.classList.remove('dark');
    } else {
      document.documentElement.classList.add('dark');
    }

    // Check if we're on the auth callback page
    const currentPath = window.location.pathname;
    if (currentPath === '/auth/callback' || window.location.hash.includes('access_token')) {
      setCurrentPage('auth-callback');
      setLoading(false);
      setAuthLoading(false);
      return; // Don't run other initialization yet
    }

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session);
      
      if (event === 'SIGNED_IN' && session?.user) {
        await loadUserProfile(session.user.id, session.user.email || '');
        setCurrentPage('chat');
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setCurrentPage('landing');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const initializeAuth = async () => {
    try {
      setAuthLoading(true);
      const currentUser = await getCurrentUser();
      
      if (currentUser) {
        await loadUserProfile(currentUser.id, currentUser.email || '');
      } else {
        // Check legacy localStorage for guest users
        const savedUser = localStorage.getItem('jainnUser');
        if (savedUser) {
          const legacyUser = JSON.parse(savedUser);
          // Only restore guest users
          if (legacyUser.tier === 'guest') {
            setUser(legacyUser);
          } else {
            // Remove old non-guest data
            localStorage.removeItem('jainnUser');
          }
        }
      }
    } catch (error) {
      console.error('Auth initialization error:', error);
    } finally {
      setAuthLoading(false);
      // Initial Boot Animation
      const timer = setTimeout(() => {
        setLoading(false);
      }, 3500);
    }
  };

  const loadUserProfile = async (userId: string, email: string) => {
    try {
      let profile = await getUserProfile(userId);
      
      if (!profile) {
        // Create new profile for first-time users
        profile = await upsertUserProfile({
          id: userId,
          email: email,
          tier: 'free',
          tokens_used: 0,
          images_generated: 0,
          theme_color: '#3B82F6'
        });
      }

      const userData: User = {
        id: profile.id,
        email: profile.email,
        tier: profile.tier as any,
        tokensUsed: profile.tokens_used,
        imagesGenerated: profile.images_generated,
        themeColor: profile.theme_color
      };

      setUser(userData);
      setCurrentPage('chat');
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const toggleTheme = () => {
    setIsDark(!isDark);
    if (isDark) {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
  };

  const handleLogin = (userData: User) => {
    setUser(userData);
    setCurrentPage('chat');
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      localStorage.removeItem('jainnUser');
      setUser(null);
      handleNavigate('landing');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback logout
      setUser(null);
      handleNavigate('landing');
    }
  };

  const handleNavigate = (page: string) => {
    if (page === 'landing') {
      // Trigger boot animation when going home
      setLoading(true);
      setTimeout(() => {
        setLoading(false);
      }, 3500);
    }
    setCurrentPage(page);
  };

  // Boot Loader
  if (loading || authLoading) {
    return (
      <div className="fixed inset-0 bg-[#0D1117] flex flex-col items-center justify-center z-[100]">
        <div className="animate-pulse-fast">
          <Logo size={120} />
        </div>
        <p className="text-gray-200 mt-8 text-lg font-medium tracking-wide animate-pulse">
          {authLoading ? 'Authenticating...' : 'Initializing Jainn AI...'}
        </p>
        <div className="w-48 h-1 bg-blue-900/30 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-blue-500 animate-[width_3.5s_ease-out_forwards] w-0"></div>
        </div>
        <style>{`
          @keyframes width {
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Router Logic
  return (
    <>
      {currentPage === 'landing' && (
        <LandingPage 
          onNavigate={handleNavigate} 
          toggleTheme={toggleTheme} 
          isDark={isDark} 
        />
      )}
      
      {currentPage === 'login' && !user && (
        <AuthPage 
          onLogin={handleLogin} 
          onNavigate={handleNavigate} 
        />
      )}

      {/* Auth Callback Page - For Google OAuth redirect */}
      {currentPage === 'auth-callback' && (
        <AuthCallback />
      )}

      {/* If we have a user and we are on chat page */}
      {currentPage === 'chat' && user && (
        <ChatPage 
          user={user} 
          onLogout={handleLogout}
          onHome={() => handleNavigate('landing')} 
        />
      )}
    </>
  );
};

export default App;
