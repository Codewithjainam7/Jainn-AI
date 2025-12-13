import React, { useState, useEffect } from 'react';
import { LandingPage } from './pages/LandingPage';
import { AuthPage } from './pages/AuthPage';
import { ChatPage } from './pages/ChatPage';
import { Logo } from './components/Logo';
import { User } from './types';

const App: React.FC = () => {
  const [loading, setLoading] = useState(true);
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

    // Check user session
    const savedUser = localStorage.getItem('jainnUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    // Initial Boot
    const timer = setTimeout(() => {
      setLoading(false);
    }, 3500); // 3.5s smooth boot

    return () => clearTimeout(timer);
  }, []);

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

  const handleLogout = () => {
    localStorage.removeItem('jainnUser');
    setUser(null);
    handleNavigate('landing');
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
  if (loading) {
    return (
      <div className="fixed inset-0 bg-[#0D1117] flex flex-col items-center justify-center z-[100]">
        <div className="animate-pulse-fast">
          <Logo size={120} />
        </div>
        <p className="text-gray-200 mt-8 text-lg font-medium tracking-wide animate-pulse">Initializing Jainn AI...</p>
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