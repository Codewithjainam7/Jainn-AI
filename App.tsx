import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';
import { AuthCallback } from './pages/AuthCallback';
import { Logo } from './components/Logo';
import { User } from './types';
import { supabase, getCurrentUser, getUserProfile, upsertUserProfile } from './lib/supabase';

// Netflix-style Boot Animation Component
const NetflixBootAnimation: React.FC<{onComplete: () => void}> = ({ onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(onComplete, 2800); // Perfect Netflix timing
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 bg-black flex items-center justify-center z-[100] overflow-hidden">
      <div className="animate-[netflixZoom_2.8s_cubic-bezier(0.4,0,0.2,1)_forwards]">
        <Logo size={180} />
      </div>
      <style>{`
        @keyframes netflixZoom {
          0% { 
            transform: scale(0.5); 
            opacity: 0;
            filter: blur(20px);
          }
          30% { 
            transform: scale(1); 
            opacity: 1;
            filter: blur(0);
          }
          70% { 
            transform: scale(1); 
            opacity: 1;
          }
          100% { 
            transform: scale(15); 
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [showBootAnimation, setShowBootAnimation] = useState(false);
  const [currentPage, setCurrentPage] = useState('landing');
  const [user, setUser] = useState<User | null>(null);
  const [isDark, setIsDark] = useState(true);

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
    const currentHash = window.location.hash;
    
    if (currentPath === '/auth/callback' || currentHash.includes('access_token')) {
      setCurrentPage('auth-callback');
      setLoading(false);
      return;
    }

    // Initialize auth with timeout
    initializeAuth();
  }, []);

  const initializeAuth = async () => {
    console.log('🔐 Starting auth initialization...');
    
    try {
      // Only check auth if Supabase is configured
      if (supabase) {
        console.log('✅ Supabase configured, checking session...');
        
        // Set a timeout for auth check
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Auth timeout')), 3000)
        );
        
        try {
          const currentUser = await Promise.race([
            getCurrentUser(),
            timeoutPromise
          ]);
          
          if (currentUser) {
            console.log('✅ User session found:', currentUser.email);
            await loadUserProfile(currentUser.id, currentUser.email || '');
            setShowBootAnimation(true);
            setTimeout(() => {
              setCurrentPage('chat');
              setShowBootAnimation(false);
            }, 2800); // Match Netflix animation timing
          } else {
            console.log('ℹ️ No active session');
          }
        } catch (authError) {
          console.warn('⚠️ Auth check timed out or failed:', authError);
        }
      } else {
        console.log('ℹ️ Supabase not configured - using guest mode only');
      }
      
      // Check for guest users in localStorage
      const savedUser = localStorage.getItem('jainnUser');
      if (savedUser && !user) {
        try {
          const legacyUser = JSON.parse(savedUser);
          if (legacyUser.tier === 'guest') {
            console.log('✅ Guest user restored from localStorage');
            setUser(legacyUser);
            setShowBootAnimation(true);
            setTimeout(() => {
              setCurrentPage('chat');
              setShowBootAnimation(false);
            }, 2800);
          }
        } catch (e) {
          console.error('Failed to parse saved user:', e);
          localStorage.removeItem('jainnUser');
        }
      }
    } catch (error) {
      console.error('❌ Auth initialization error:', error);
    } finally {
      // Always show the page after initialization
      console.log('✅ Auth initialization complete');
      setTimeout(() => {
        setLoading(false);
      }, 1500);
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
          theme_color: '#3B82F6',
          display_name: email.split('@')[0]
        });
      }

      const userData: User = {
        id: profile.id,
        email: profile.email,
        tier: profile.tier as any,
        tokensUsed: profile.tokens_used,
        imagesGenerated: profile.images_generated,
        themeColor: profile.theme_color,
        displayName: profile.display_name
      };

      setUser(userData);
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
    console.log('✅ User logged in:', userData.email);
    setUser(userData);
    setShowBootAnimation(true);
    setTimeout(() => {
      setCurrentPage('chat');
      setShowBootAnimation(false);
    }, 2800);
  };

  const handleLogout = async () => {
    try {
      if (supabase) {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      }
      
      localStorage.removeItem('jainnUser');
      setUser(null);
      setCurrentPage('landing');
    } catch (error) {
      console.error('Logout error:', error);
      // Fallback logout
      localStorage.removeItem('jainnUser');
      setUser(null);
      setCurrentPage('landing');
    }
  };

  const handleNavigate = (page: string) => {
    console.log('📍 Navigating to:', page);
    setCurrentPage(page);
  };

  const handleUpdateUser = (updatedUser: User) => {
    setUser(updatedUser);
  };

  // Boot Loader - Only show on initial load
  if (loading) {
    return (
      <div className="fixed inset-0 bg-black flex flex-col items-center justify-center z-[100]">
        <div className="animate-pulse-fast">
          <Logo size={120} />
        </div>
        <p className="text-gray-200 mt-8 text-lg font-medium tracking-wide animate-pulse">
          Initializing Jainn AI...
        </p>
        <div className="w-48 h-1 bg-blue-900/30 rounded-full mt-6 overflow-hidden">
          <div className="h-full bg-blue-500 animate-[width_1.5s_ease-out_forwards] w-0"></div>
        </div>
        <style>{`
          @keyframes width {
            to { width: 100%; }
          }
        `}</style>
      </div>
    );
  }

  // Show Netflix-style boot animation when transitioning to chat
  if (showBootAnimation) {
    return <NetflixBootAnimation onComplete={() => setShowBootAnimation(false)} />;
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
      
      {currentPage === 'login' && (
        <AuthPage 
          onLogin={handleLogin} 
          onNavigate={handleNavigate} 
        />
      )}

      {currentPage === 'auth-callback' && (
        <AuthCallback />
      )}

      {currentPage === 'chat' && user && (
        <ChatPage 
          user={user} 
          onLogout={handleLogout}
          onHome={() => handleNavigate('landing')}
          onUpdateUser={handleUpdateUser}
        />
      )}

      {/* Fallback - if somehow on chat page without user */}
      {currentPage === 'chat' && !user && (
        <div className="fixed inset-0 bg-[#0D1117] flex flex-col items-center justify-center">
          <Logo size={80} />
          <p className="text-gray-400 mt-4">No user session found</p>
          <button 
            onClick={() => handleNavigate('landing')}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Go Home
          </button>
        </div>
      )}
    </>
  );
};

export default App;
