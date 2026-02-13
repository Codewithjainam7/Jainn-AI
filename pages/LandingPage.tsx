import React, { useState, useEffect } from 'react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { Sun, Moon, Menu, X, Check, Brain, Trophy, Image as ImageIcon, Shield, MessageSquare, Zap, Bot, Lock } from 'lucide-react';

interface LandingPageProps {
  onNavigate: (page: string) => void;
  toggleTheme: () => void;
  isDark: boolean;
}

// Model Logos Components
const GeminiLogo = () => (
  <svg viewBox="0 0 28 28" className="w-12 h-12 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M14 28C14 21.75 9.53 16.55 3.61 15.28C2.42 15.03 1.22 14.92 0 14.92V13.08C1.22 13.08 2.42 12.97 3.61 12.72C9.53 11.45 14 6.25 14 0C14 6.25 18.47 11.45 24.39 12.72C25.58 12.97 26.78 13.08 28 13.08V14.92C26.78 14.92 25.58 15.03 24.39 15.28C18.47 16.55 14 21.75 14 28Z" fill="url(#geminiGrad)"/>
    <defs>
      <linearGradient id="geminiGrad" x1="0" y1="0" x2="28" y2="28" gradientUnits="userSpaceOnUse">
        <stop stopColor="#4285F4"/>
        <stop offset="0.33" stopColor="#9B72CB"/>
        <stop offset="0.66" stopColor="#D96570"/>
        <stop offset="1" stopColor="#D96570"/>
      </linearGradient>
    </defs>
  </svg>
);

const MetaLogo = () => (
  <svg viewBox="0 0 48 48" className="w-12 h-12 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100" xmlns="http://www.w3.org/2000/svg">
    <path d="M8.5 10C5.5 10 3 13.5 3 18.5C3 22 4.5 25.5 7 28C9 30 11.5 31 14 31C16 31 17.5 30.5 19 29C20.5 27 22 23.5 24 19.5C26 23.5 27.5 27 29 29C30.5 30.5 32 31 34 31C36.5 31 39 30 41 28C43.5 25.5 45 22 45 18.5C45 13.5 42.5 10 39.5 10C37 10 34.5 12 32 16C30 19.5 28 23 26 25.5C25 27 24.5 27.5 24 27.5C23.5 27.5 23 27 22 25.5C20 23 18 19.5 16 16C13.5 12 11 10 8.5 10Z" fill="url(#metaGrad)" stroke="none"/>
    <defs>
      <linearGradient id="metaGrad" x1="3" y1="10" x2="45" y2="31" gradientUnits="userSpaceOnUse">
        <stop stopColor="#0081FB"/>
        <stop offset="0.5" stopColor="#0064E0"/>
        <stop offset="1" stopColor="#0052CC"/>
      </linearGradient>
    </defs>
  </svg>
);

const MistralLogo = () => (
  <svg viewBox="0 0 28 28" className="w-12 h-12 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100" xmlns="http://www.w3.org/2000/svg">
    {/* Row 1 */}
    <rect x="0" y="0" width="5" height="5" fill="#F7D046"/>
    <rect x="11.5" y="0" width="5" height="5" fill="#F7D046"/>
    <rect x="23" y="0" width="5" height="5" fill="#F7D046"/>
    {/* Row 2 */}
    <rect x="0" y="5.75" width="5" height="5" fill="#F2A73B"/>
    <rect x="5.75" y="5.75" width="5" height="5" fill="#F2A73B"/>
    <rect x="17.25" y="5.75" width="5" height="5" fill="#F2A73B"/>
    <rect x="23" y="5.75" width="5" height="5" fill="#F2A73B"/>
    {/* Row 3 */}
    <rect x="0" y="11.5" width="5" height="5" fill="#EE792F"/>
    <rect x="11.5" y="11.5" width="5" height="5" fill="#EE792F"/>
    <rect x="23" y="11.5" width="5" height="5" fill="#EE792F"/>
    {/* Row 4 */}
    <rect x="0" y="17.25" width="5" height="5" fill="#EB5829"/>
    <rect x="5.75" y="17.25" width="5" height="5" fill="#EB5829"/>
    <rect x="17.25" y="17.25" width="5" height="5" fill="#EB5829"/>
    <rect x="23" y="17.25" width="5" height="5" fill="#EB5829"/>
    {/* Row 5 */}
    <rect x="0" y="23" width="5" height="5" fill="#EA3326"/>
    <rect x="11.5" y="23" width="5" height="5" fill="#EA3326"/>
    <rect x="23" y="23" width="5" height="5" fill="#EA3326"/>
  </svg>
);

const VeoLogo = () => (
    <svg viewBox="0 0 24 24" className="w-12 h-12 grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100 text-[#8B5CF6]" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10Z" stroke="currentColor" strokeWidth="2"/><path d="M10 8l6 4-6 4V8Z" fill="currentColor"/></svg>
);

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate, toggleTheme, isDark }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [quoteIndex, setQuoteIndex] = useState(0);

  const quotes = [
    'Collaborative AI',
    'Intelligent Responses',
    'Multi-Agent Power',
    'Referee Optimization'
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setQuoteIndex(prev => (prev + 1) % quotes.length);
    }, 3000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
    }
    setMobileMenuOpen(false);
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-white overflow-x-hidden font-sans">
      
      {/* Navbar - Always Glass */}
      <nav className={`fixed top-4 left-0 right-0 z-50 transition-all duration-300 mx-4 md:mx-8`}>
        <div className={`
          mx-auto max-w-7xl px-6 py-4 
          bg-white/80 dark:bg-[#161B22]/80 backdrop-blur-xl border border-gray-200 dark:border-white/10 rounded-[24px] shadow-lg
        `}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => window.scrollTo(0,0)}>
              <Logo size={32} />
              <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-blue-700">
                Jainn AI
              </span>
            </div>

            {/* Desktop Links */}
            <div className="hidden md:flex items-center gap-8">
              <button onClick={() => scrollToSection('features')} className="text-sm font-medium hover:text-blue-500 transition-colors text-gray-700 dark:text-gray-200">Features</button>
              <button onClick={() => scrollToSection('pricing')} className="text-sm font-medium hover:text-blue-500 transition-colors text-gray-700 dark:text-gray-200">Pricing</button>
              <button onClick={toggleTheme} className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 transition-colors text-gray-700 dark:text-gray-200">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <Button onClick={() => onNavigate('login')} size="sm">Try Jainn Now</Button>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="md:hidden flex items-center gap-4">
              <button onClick={toggleTheme} className="p-2 text-gray-700 dark:text-gray-200">
                {isDark ? <Sun size={20} /> : <Moon size={20} />}
              </button>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="text-gray-700 dark:text-gray-200">
                {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="absolute top-full left-4 right-4 mt-2 p-6 bg-white dark:bg-[#161B22] rounded-[24px] shadow-xl border border-gray-200 dark:border-white/10 flex flex-col gap-4 md:hidden animate-in slide-in-from-top-4 fade-in z-50">
            <button onClick={() => scrollToSection('features')} className="text-lg font-medium text-left text-gray-800 dark:text-white">Features</button>
            <button onClick={() => scrollToSection('pricing')} className="text-lg font-medium text-left text-gray-800 dark:text-white">Pricing</button>
            <Button onClick={() => onNavigate('login')} className="w-full">Try Jainn Now</Button>
          </div>
        )}
      </nav>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 px-6 min-h-screen flex flex-col items-center justify-center text-center overflow-hidden">
        {/* Particles / Background Effects */}
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-500/20 rounded-full blur-[100px] animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-[120px]"></div>

        <div className="relative z-10 max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-sm font-semibold mb-8">
            <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
            Multi-Agent Platform 3.0
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 text-gray-900 dark:text-white">
            Experience the Future of <br />
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 via-blue-600 to-purple-600 transition-all duration-500">
              {quotes[quoteIndex]}
            </span>
          </h1>

          <p className="text-xl text-gray-600 dark:text-gray-400 mb-10 max-w-2xl mx-auto leading-relaxed">
            Three AI models working together, learning from each other, delivering intelligent responses powered by referee-based optimization.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={() => onNavigate('login')}>Start Chatting</Button>
            <Button size="lg" variant="secondary" onClick={() => scrollToSection('features')}>Learn More</Button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-8 mt-16 pt-8 border-t border-gray-200 dark:border-white/10">
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">3</div>
              <div className="text-sm text-gray-600 dark:text-gray-500">AI Models</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">∞</div>
              <div className="text-sm text-gray-600 dark:text-gray-500">Possibilities</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-500">24/7</div>
              <div className="text-sm text-gray-600 dark:text-gray-500">Uptime</div>
            </div>
          </div>
        </div>
      </section>

      {/* Powered By - Static Grid (Replaces Marquee) */}
      <section className="py-16 bg-white dark:bg-[#0D1117] border-y border-gray-100 dark:border-white/5 relative">
        <div className="max-w-7xl mx-auto px-6">
            <p className="text-center text-sm font-bold uppercase tracking-widest text-gray-400 mb-10">Powered By Industry Leaders</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-12 items-center justify-items-center opacity-70">
                <div className="flex flex-col items-center gap-3">
                    <GeminiLogo />
                    <span className="font-semibold text-gray-900 dark:text-white">Gemini</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                    <MetaLogo />
                    <span className="font-semibold text-gray-900 dark:text-white">LLaMA</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                    <MistralLogo />
                    <span className="font-semibold text-gray-900 dark:text-white">Mistral</span>
                </div>
                <div className="flex flex-col items-center gap-3">
                    <VeoLogo />
                    <span className="font-semibold text-gray-900 dark:text-white">Veo</span>
                </div>
            </div>
        </div>
      </section>

      {/* Features Grid - CSS/SVG Mockups */}
      <section id="features" className="py-24 px-6 bg-gray-50 dark:bg-[#0D1117]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Powerful Features</h2>
            <p className="text-gray-600 dark:text-gray-400">Everything you need for intelligent AI conversations</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { icon: <Brain className="w-6 h-6 text-blue-500" />, title: "Multi-Agent Chat", desc: "Orchestrate multiple models simultaneously.", imgClass: "bg-blue-500/5", type: 'chat' },
              { icon: <Trophy className="w-6 h-6 text-yellow-500" />, title: "Referee AI", desc: "Automated response ranking and selection.", imgClass: "bg-yellow-500/5", type: 'referee' },
              { icon: <ImageIcon className="w-6 h-6 text-purple-500" />, title: "Image Generation", desc: "Create visuals with Imagen 3.0 integration.", imgClass: "bg-purple-500/5", type: 'image' },
              { icon: <Shield className="w-6 h-6 text-green-500" />, title: "Secure & Private", desc: "Enterprise-grade encryption for all data.", imgClass: "bg-green-500/5", type: 'security' },
              { icon: <MessageSquare className="w-6 h-6 text-pink-500" />, title: "Chat History", desc: "Organized storage for all your conversations.", imgClass: "bg-pink-500/5", type: 'history' },
              { icon: <Zap className="w-6 h-6 text-orange-500" />, title: "Lightning Fast", desc: "Low latency responses via Gemini Flash.", imgClass: "bg-orange-500/5", type: 'speed' }
            ].map((feature, idx) => (
              <div key={idx} className="group p-6 rounded-[24px] bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/5 hover:-translate-y-2 transition-all duration-300 shadow-sm hover:shadow-xl overflow-hidden relative">
                 
                 {/* Visual Mockup Area - Pure CSS/SVG */}
                 <div className={`h-40 mb-6 rounded-2xl w-full ${feature.imgClass} flex items-center justify-center relative overflow-hidden`}>
                     
                     {feature.type === 'chat' && (
                         <div className="flex flex-col gap-2 w-3/4 opacity-80 group-hover:scale-105 transition-transform duration-500">
                             <div className="flex gap-2">
                                 <div className="w-6 h-6 rounded-full bg-blue-500/20 flex items-center justify-center"><Bot size={14} className="text-blue-600" /></div>
                                 <div className="bg-white dark:bg-[#0D1117] p-2 rounded-lg text-[10px] w-2/3 shadow-sm border border-black/5 dark:border-white/5 text-gray-600 dark:text-gray-300">
                                     Analyzing query...
                                 </div>
                             </div>
                             <div className="flex gap-2">
                                 <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center"><Bot size={14} className="text-purple-600" /></div>
                                 <div className="bg-white dark:bg-[#0D1117] p-2 rounded-lg text-[10px] w-1/2 shadow-sm border border-black/5 dark:border-white/5 text-gray-600 dark:text-gray-300">
                                     Here is my draft.
                                 </div>
                             </div>
                         </div>
                     )}

                     {feature.type === 'referee' && (
                         <div className="bg-white dark:bg-[#0D1117] p-4 rounded-xl shadow-lg border border-black/5 dark:border-white/5 flex gap-4 items-center group-hover:scale-110 transition-transform">
                             <div className="flex flex-col items-center gap-1">
                                 <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10"></div>
                                 <div className="h-1 w-6 bg-gray-200 dark:bg-white/10 rounded"></div>
                             </div>
                             <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10"></div>
                             <div className="flex flex-col items-center gap-1">
                                 <div className="w-10 h-10 rounded-full bg-yellow-500 flex items-center justify-center text-white shadow-lg"><Trophy size={20} /></div>
                                 <div className="h-1 w-8 bg-yellow-500 rounded"></div>
                             </div>
                             <div className="h-8 w-[1px] bg-gray-200 dark:bg-white/10"></div>
                             <div className="flex flex-col items-center gap-1">
                                 <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10"></div>
                                 <div className="h-1 w-6 bg-gray-200 dark:bg-white/10 rounded"></div>
                             </div>
                         </div>
                     )}

                     {feature.type === 'image' && (
                         <div className="relative w-24 h-24 bg-gradient-to-tr from-purple-500 to-pink-500 rounded-xl shadow-xl rotate-6 group-hover:rotate-12 transition-transform duration-500 flex items-center justify-center overflow-hidden">
                             <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20"></div>
                             <ImageIcon size={32} className="text-white relative z-10" />
                             <div className="absolute bottom-2 right-2 bg-black/20 backdrop-blur-sm px-1.5 py-0.5 rounded text-[8px] text-white font-mono">GEN</div>
                         </div>
                     )}

                     {feature.type === 'security' && (
                         <div className="relative">
                             <div className="w-20 h-24 bg-green-500/10 border-2 border-green-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                                <Lock size={32} className="text-green-500" />
                             </div>
                             <div className="absolute -bottom-2 -right-2 bg-white dark:bg-[#161B22] p-1.5 rounded-full shadow-lg border border-green-500/20">
                                 <Check size={14} className="text-green-500" />
                             </div>
                         </div>
                     )}

                     {feature.type === 'history' && (
                         <div className="w-40 bg-white dark:bg-[#0D1117] rounded-lg shadow-md border border-black/5 dark:border-white/5 p-2 flex flex-col gap-2 group-hover:-translate-y-2 transition-transform">
                             <div className="flex items-center gap-2 border-b border-black/5 dark:border-white/5 pb-2">
                                 <MessageSquare size={12} className="text-pink-500" />
                                 <div className="h-1.5 w-16 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                             </div>
                             <div className="flex items-center gap-2 opacity-50">
                                 <MessageSquare size={12} className="text-gray-400" />
                                 <div className="h-1.5 w-12 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                             </div>
                             <div className="flex items-center gap-2 opacity-30">
                                 <MessageSquare size={12} className="text-gray-400" />
                                 <div className="h-1.5 w-14 bg-gray-200 dark:bg-white/10 rounded-full"></div>
                             </div>
                         </div>
                     )}

                     {feature.type === 'speed' && (
                         <div className="flex items-center justify-center">
                             <div className="absolute inset-0 bg-orange-500/20 blur-2xl rounded-full scale-50 group-hover:scale-100 transition-transform duration-700"></div>
                             <Zap size={48} className="text-orange-500 drop-shadow-lg relative z-10 group-hover:rotate-12 transition-transform" />
                         </div>
                     )}

                 </div>

                <div className="mb-4 p-3 rounded-2xl bg-gray-100 dark:bg-white/5 w-fit text-gray-900 dark:text-white">{feature.icon}</div>
                <h3 className="text-xl font-bold mb-2 text-gray-900 dark:text-white">{feature.title}</h3>
                <p className="text-gray-600 dark:text-gray-400 leading-relaxed text-sm">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing - Detailed */}
      <section id="pricing" className="py-24 px-6 bg-white dark:bg-[#0D1117]">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4 text-gray-900 dark:text-white">Simple Pricing</h2>
            <p className="text-gray-600 dark:text-gray-400">Start for free, upgrade for power.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {/* Free */}
            <div className="p-8 rounded-[32px] bg-gray-50 dark:bg-[#161B22] border border-gray-200 dark:border-white/10 flex flex-col hover:border-blue-500/30 transition-colors">
              <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Free</div>
              <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">$0<span className="text-lg text-gray-500 font-normal">/mo</span></div>
              <ul className="space-y-4 mb-8 flex-1 text-sm">
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-green-500 shrink-0" /> 5,000 tokens/day</li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-green-500 shrink-0" /> 3 Images/day</li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-green-500 shrink-0" /> Single Model Only</li>
                <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-green-500 shrink-0" /> 50 chat history</li>
                <li className="flex items-center gap-3 text-gray-400"><X size={16} className="shrink-0" /> Multi-Agent Mode</li>
                <li className="flex items-center gap-3 text-gray-400"><X size={16} className="shrink-0" /> Custom Themes</li>
              </ul>
              <Button onClick={() => onNavigate('login')} variant="secondary" className="w-full">Get Started</Button>
            </div>

            {/* Pro - Improved Visuals */}
<div className="relative p-8 rounded-[32px] bg-[#1E293B] dark:bg-[#1D2B45] text-white border border-blue-500/50 shadow-2xl scale-105 z-10 flex flex-col ring-1 ring-blue-500/50">
  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-gradient-to-r from-blue-600 to-blue-500 text-white px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest shadow-lg whitespace-nowrap">Most Popular</div>
  <div className="mb-4 text-sm font-bold uppercase tracking-wider text-blue-300">Pro</div>
  <div className="text-4xl font-bold mb-6 text-white">₹199<span className="text-lg text-blue-300/70 font-normal">/mo</span></div>
  <ul className="space-y-4 mb-8 flex-1 text-sm">
    <li className="flex items-center gap-3 text-gray-100 font-medium"><Check size={16} className="text-blue-400 shrink-0" /> Unlock Multi-Agent Mode</li>
    <li className="flex items-center gap-3 text-gray-100"><Check size={16} className="text-blue-400 shrink-0" /> 50,000 tokens/day (10x)</li>
    <li className="flex items-center gap-3 text-gray-100"><Check size={16} className="text-blue-400 shrink-0" /> 20 Images/day</li>
    <li className="flex items-center gap-3 text-gray-100"><Check size={16} className="text-blue-400 shrink-0" /> 500 chat history</li>
    <li className="flex items-center gap-3 text-gray-100"><Check size={16} className="text-blue-400 shrink-0" /> Custom Instructions</li>
    <li className="flex items-center gap-3 text-gray-100"><Check size={16} className="text-blue-400 shrink-0" /> Priority Support</li>
  </ul>
  <Button onClick={() => onNavigate('login')} className="w-full bg-blue-600 text-white hover:bg-blue-500 shadow-blue-900/20 border-none">Upgrade to Pro</Button>
</div>
            {/* Ultra */}
            <div className="p-8 rounded-[32px] bg-gray-50 dark:bg-[#161B22] border border-gray-200 dark:border-white/10 flex flex-col hover:border-purple-500/30 transition-colors">
  <div className="mb-4 text-sm font-bold uppercase tracking-wider text-gray-500">Ultra</div>
  <div className="text-4xl font-bold mb-6 text-gray-900 dark:text-white">₹399<span className="text-lg text-gray-500 font-normal">/mo</span></div>
  <ul className="space-y-4 mb-8 flex-1 text-sm">
    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-purple-500 shrink-0" /> Unlimited tokens</li>
    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-purple-500 shrink-0" /> 30 Images/day</li>
    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-purple-500 shrink-0" /> Full Customization (Fonts, HEX)</li>
    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-purple-500 shrink-0" /> Advanced Code & Web Agents</li>
    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-purple-500 shrink-0" /> 24/7 Priority Support</li>
    <li className="flex items-center gap-3 text-gray-700 dark:text-gray-300"><Check size={16} className="text-purple-500 shrink-0" /> Team Collaboration</li>
  </ul>
  <Button onClick={() => onNavigate('login')} variant="secondary" className="w-full">Go Ultra</Button>
</div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white dark:bg-[#090C10] py-16 border-t border-gray-200 dark:border-white/5 relative overflow-hidden">
  <div className="max-w-7xl mx-auto px-6 relative z-10">
    <div className="flex flex-col md:flex-row justify-between items-center gap-8 mb-12">
      <div className="flex items-center gap-3">
        <Logo size={40} />
        <span className="text-2xl font-bold text-gray-900 dark:text-white">Jainn AI</span>
      </div>
      <div className="flex flex-col items-center md:items-end gap-2">
        <div className="flex gap-8 text-gray-500 dark:text-gray-400">
          <button onClick={() => onNavigate('privacy')} className="hover:text-blue-500 transition-colors">Privacy</button>
          <button onClick={() => onNavigate('terms')} className="hover:text-blue-500 transition-colors">Terms</button>
          <button onClick={() => onNavigate('refund-policy')} className="hover:text-blue-500 transition-colors">Refund</button>
          <button onClick={() => onNavigate('contact')} className="hover:text-blue-500 transition-colors">Contact</button>
        </div>
        <a href="mailto:jainn.ai.contact@gmail.com" className="text-sm text-gray-400 hover:text-blue-500 transition-colors">jainn.ai.contact@gmail.com</a>
      </div>
    </div>
    <div className="text-center text-sm text-gray-500">
      © 2025 Jainn.io - All rights reserved.
    </div>
  </div>
  <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/3 text-[20vw] font-black text-gray-100 dark:text-[#161B22] pointer-events-none select-none">
    JAINN
  </div>
</footer>
    </div>
  );
};
