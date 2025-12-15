import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { CustomModal } from '../components/CustomModal';
import { ProfileSettings } from '../components/ProfileSettings';

import { User, ChatMode, Message, ModelType, UserTier, MultiResponse } from '../types';
import { generateResponse, generateRefereeAnalysis, generateImage } from '../services/gemini';
import { supabase, upsertUserProfile } from '../lib/supabase';
import { Settings, LogOut, Plus, Image as ImageIcon, Send, User as UserIcon, Bot, Menu, X, CheckCircle, Crown, Home, ChevronDown, Lock, Palette, CreditCard, ShieldCheck, Bell, Globe } from 'lucide-react';
const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
interface ChatPageProps {
  user: User;
  onLogout: () => void;
  onHome: () => void;
  onUpdateUser: (user: User) => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ user, onLogout, onHome, onUpdateUser }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>(ChatMode.SINGLE); 
  const [currentModel, setCurrentModel] = useState<ModelType>(ModelType.GEMINI);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('profile');
  const [userProfile, setUserProfile] = useState<any>(null);
  const [notifications, setNotifications] = useState(true);
  const [dataSharing, setDataSharing] = useState(false);
  
  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({
    title: '',
    message: '',
    type: 'info' as 'success' | 'error' | 'info' | 'warning'
  });
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Get user profile with photo on mount
  useEffect(() => {
    const loadUserProfile = async () => {
      if (supabase && !user.id.startsWith('guest_')) {
        try {
          const { data: { user: authUser } } = await supabase.auth.getUser();
          if (authUser) {
            setUserProfile({
              name: authUser.user_metadata?.full_name || authUser.email?.split('@')[0] || 'User',
              avatar: authUser.user_metadata?.avatar_url || null,
              email: authUser.email,
              provider: authUser.app_metadata?.provider || 'email'
            });
          }
        } catch (error) {
          console.error('Error loading profile:', error);
        }
      }
    };
    loadUserProfile();
  }, [user.id]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const showModal = (title: string, message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
    setModalConfig({ title, message, type });
    setModalOpen(true);
  };

  const handleModeSwitch = (newMode: ChatMode) => {
    if (user.tier === UserTier.FREE && newMode === ChatMode.MULTI) {
      showModal(
        'Upgrade Required',
        'Multi-Agent Mode is a PRO feature. Upgrade to Jainn Pro to access collaborative AI.',
        'warning'
      );
      return;
    }

    if (newMode !== mode) {
      setMessages([]);
      setMode(newMode);
    }
  };

  // Profile save function
  const handleSaveProfile = async (displayName: string, themeColor: string) => {
    try {
      const updatedUser: User = {
        ...user,
        displayName: displayName,
        themeColor: themeColor
      };

      // Update in Supabase if not guest
      if (supabase && !user.id.startsWith('guest_')) {
        await upsertUserProfile({
          id: user.id,
          email: user.email,
          tier: user.tier,
          tokens_used: user.tokensUsed,
          images_generated: user.imagesGenerated,
          theme_color: themeColor,
          display_name: displayName
        });
      } else {
        // Update localStorage for guest users
        localStorage.setItem('jainnUser', JSON.stringify(updatedUser));
      }

      onUpdateUser(updatedUser);
      showModal('Profile Updated', 'Your profile has been successfully updated!', 'success');
    } catch (error) {
      console.error('Error saving profile:', error);
      showModal('Update Failed', 'Failed to update profile. Please try again.', 'error');
      throw error;
    }
  };

  // Message handling function
  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    if (user.tier === UserTier.GUEST && messages.length >= 10) {
      showModal(
        'Guest Limit Reached',
        'You\'ve reached the 10 message limit for guest users. Please sign up to continue chatting!',
        'warning'
      );
      return;
    }

    const isImageCmd = input.toLowerCase().startsWith('/image');
    if (isImageCmd) {
      if (mode !== ChatMode.SINGLE) {
        showModal('Feature Unavailable', 'Image generation is only available in Single Mode.', 'warning');
        return;
      }
      if (currentModel !== ModelType.GEMINI) {
        showModal('Feature Unavailable', 'Image generation is only supported by the Gemini model.', 'warning');
        return;
      }
    }

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      if (isImageCmd) {
        const prompt = input.replace('/image', '').trim();
        const imageUrl = await generateImage(prompt);
        if (imageUrl) {
          const imgMsg: Message = {
            id: Date.now().toString(),
            role: 'model',
            model: 'Imagen 3.0',
            content: imageUrl,
            isImage: true,
            timestamp: Date.now()
          };
          setMessages(prev => [...prev, imgMsg]);
        } else {
          throw new Error("Failed to generate image");
        }
      } else if (mode === ChatMode.SINGLE) {
        const response = await generateResponse(userMsg.content, currentModel);
        const aiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          model: currentModel.toUpperCase(),
          content: response,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const models = [ModelType.GEMINI, ModelType.LLAMA, ModelType.MISTRAL];
        const responses = await Promise.all(models.map(async (m) => {
          return {
            model: m,
            text: await generateResponse(userMsg.content, m)
          };
        }));

        const multiResponses: MultiResponse[] = responses.map(r => ({
          model: r.model.toUpperCase(),
          content: r.text,
          isWinner: false
        }));

        const multiMsg: Message = {
          id: Date.now().toString(),
          role: 'model',
          content: 'Multi-Agent Response',
          timestamp: Date.now(),
          multiResponses: multiResponses
        };
        
        setMessages(prev => [...prev, multiMsg]);

        generateRefereeAnalysis(userMsg.content, responses).then(analysis => {
          console.log("Referee Analysis (Backend):", analysis);
        });
      }
    } catch (error) {
      console.error(error);
      const errorMsg: Message = {
        id: Date.now().toString(),
        role: 'model',
        content: "I encountered an error. Please check your API configuration or try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectWinner = (messageId: string, modelName: string) => {
    setMessages(prev => prev.map(msg => {
      if (msg.id === messageId && msg.multiResponses) {
        return {
          ...msg,
          selectedWinner: modelName,
          multiResponses: msg.multiResponses.map(r => ({
            ...r,
            isWinner: r.model === modelName
          }))
        };
      }
      return msg;
    }));
  };

  // Get user initials for avatar
  const getUserInitials = () => {
    if (userProfile?.name) {
      const names = userProfile.name.split(' ');
      if (names.length >= 2) {
        return (names[0][0] + names[1][0]).toUpperCase();
      }
      return userProfile.name.substring(0, 2).toUpperCase();
    }
    if (user.displayName) {
      return user.displayName.substring(0, 2).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  };

  // Get user avatar URL (for Google sign-in users)
  const getUserAvatar = () => {
    return userProfile?.avatar || null;
  };

  // Check if feature is locked based on tier
  const isFeatureLocked = (feature: string) => {
    if (feature === 'multi-agent') {
      return user.tier === UserTier.FREE || user.tier === UserTier.GUEST;
    }
    if (feature === 'custom-theme') {
      return user.tier !== UserTier.ULTRA;
    }
    return false;
  };

  // ... (rest of your ChatPage code above this)

  // JSX Render
  // COMPLETE RETURN FUNCTION FOR ChatPage.tsx
// Replace the entire return statement in your ChatPage component with this

return (
  <>
    <CustomModal
      isOpen={modalOpen}
      onClose={() => setModalOpen(false)}
      title={modalConfig.title}
      message={modalConfig.message}
      type={modalConfig.type}
    />

    <div className="flex h-screen bg-gray-50 dark:bg-[#0D1117] text-gray-900 dark:text-gray-100 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-40 w-72 bg-white dark:bg-[#161B22] border-r border-gray-200 dark:border-white/5 transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col
      `}>
        <div className="p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
            <Logo size={28} />
            <span className="font-bold text-lg">Jainn AI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-2">
          <Button onClick={() => setMessages([])} variant="secondary" className="w-full justify-start text-gray-700 dark:text-gray-200 border-gray-200 dark:border-white/10 hover:border-blue-500">
            <Plus size={18} /> New Chat
          </Button>
          <Button onClick={onHome} variant="ghost" className="w-full justify-start px-4 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5">
            <Home size={18} /> Home
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-hide">
          <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Recent</h3>
          <div className="p-3 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-sm font-medium cursor-pointer truncate">
            Quantum Computing Basics
          </div>
          <div className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-white/5 text-gray-600 dark:text-gray-400 text-sm cursor-pointer truncate transition-colors">
            React Project Structure
          </div>
        </div>

        <div className="p-4 border-t border-gray-100 dark:border-white/5">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
              {getUserAvatar() ? (
                <img src={getUserAvatar()!} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                getUserInitials()
              )}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{user.displayName || userProfile?.name || user.email}</p>
              <p className="text-xs text-gray-500 uppercase flex items-center gap-1">
                {user.tier === 'pro' && <Crown size={10} className="text-yellow-500" />}
                {user.tier === 'ultra' && <Crown size={10} className="text-purple-500" />}
                {user.tier}
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button size="sm" variant="ghost" onClick={() => setSettingsOpen(true)} className="flex-1 justify-start px-2"><Settings size={16} /> Settings</Button>
            <Button size="sm" variant="ghost" onClick={() => setLogoutConfirmOpen(true)} className="flex-1 justify-start px-2 text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"><LogOut size={16} /> Logout</Button>
          </div>
        </div>
      </aside>

      {/* Main Chat Area */}
      <main className="flex-1 flex flex-col relative w-full">
        {/* Header */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-gray-200 dark:border-white/5 bg-white/80 dark:bg-[#0D1117]/80 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-4">
            <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 -ml-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5">
              <Menu size={24} />
            </button>
            
            <div className={`flex bg-gray-100 dark:bg-[#161B22] p-1 rounded-lg ${isFeatureLocked('multi-agent') ? 'locked-overlay' : ''}`}>
              <button 
                onClick={() => handleModeSwitch(ChatMode.MULTI)}
                disabled={isFeatureLocked('multi-agent')}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${mode === ChatMode.MULTI ? 'bg-white dark:bg-blue-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'} ${isFeatureLocked('multi-agent') ? 'cursor-not-allowed' : ''}`}
              >
                <Bot size={14} /> Multi-Agent
                {isFeatureLocked('multi-agent') && <Lock size={12} />}
              </button>
              <button 
                onClick={() => handleModeSwitch(ChatMode.SINGLE)}
                className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${mode === ChatMode.SINGLE ? 'bg-white dark:bg-blue-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
              >
                <UserIcon size={14} /> Single
              </button>
            </div>

            {mode === ChatMode.SINGLE && (
              <div className="relative">
                <button 
                  onClick={() => setModelDropdownOpen(!modelDropdownOpen)}
                  className="flex items-center gap-2 text-sm font-medium bg-gray-100 dark:bg-[#161B22] px-3 py-1.5 rounded-lg hover:bg-gray-200 dark:hover:bg-[#1F2937] transition-colors dark:text-white"
                >
                  {currentModel === ModelType.GEMINI && <span className="text-blue-500">Gemini 2.5</span>}
                  {currentModel === ModelType.LLAMA && <span className="text-purple-500">LLaMA 3.1</span>}
                  {currentModel === ModelType.MISTRAL && <span className="text-yellow-500">Mistral</span>}
                  <ChevronDown size={14} />
                </button>
                
                {modelDropdownOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setModelDropdownOpen(false)}></div>
                    <div className="absolute top-full left-0 mt-2 w-48 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 rounded-xl shadow-xl overflow-hidden z-20">
                      <button onClick={() => { setCurrentModel(ModelType.GEMINI); setModelDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-sm dark:text-white">Gemini 2.5 Flash</button>
                      <button onClick={() => { setCurrentModel(ModelType.LLAMA); setModelDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-sm dark:text-white">LLaMA 3.1</button>
                      <button onClick={() => { setCurrentModel(ModelType.MISTRAL); setModelDropdownOpen(false); }} className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-white/5 text-sm dark:text-white">Mistral Large</button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 scrollbar-hide">
          {messages.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
              <Logo size={64} className="mb-6 opacity-20 grayscale" />
              <h2 className="text-2xl font-bold mb-2">How can I help you?</h2>
              {mode === ChatMode.MULTI ? (
                <p className="max-w-md">Try asking complex questions to see Multi-Agent collaboration in action.</p>
              ) : (
                <p className="max-w-md">Chat with {currentModel.toUpperCase()}. Type <code className="bg-gray-200 dark:bg-gray-800 px-1 rounded">/image</code> (Gemini only) to generate art.</p>
              )}
            </div>
          )}

          {messages.map((msg) => (
            <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in slide-in-from-bottom-2 duration-300`}>
              {msg.role === 'user' ? (
                <div className="max-w-[85%] md:max-w-[70%] rounded-[20px] p-4 bg-blue-600 text-white rounded-br-none shadow-md">
                  <div className="prose dark:prose-invert text-white text-sm leading-relaxed whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              ) : msg.multiResponses ? (
                <div className="w-full max-w-5xl">
                  <div className="flex items-center gap-2 mb-3 px-1 text-gray-500 dark:text-gray-400 text-sm font-medium">
                    <Bot size={16} /> Multi-Agent Results
                  </div>
                  <div className="grid md:grid-cols-3 gap-4">
                    {msg.multiResponses.map((response, idx) => (
                      <div key={idx} className={`
                        relative flex flex-col rounded-2xl bg-white dark:bg-[#161B22] border transition-all duration-300
                        ${msg.selectedWinner === response.model 
                          ? 'border-yellow-500 ring-1 ring-yellow-500 shadow-[0_0_20px_rgba(234,179,8,0.1)]' 
                          : 'border-gray-200 dark:border-white/10 hover:border-blue-500/50'}
                      `}>
                        {msg.selectedWinner === response.model && (
                          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-500 text-black text-[10px] font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg">
                            <Crown size={12} fill="black" /> BEST RESPONSE
                          </div>
                        )}
                        <div className="p-4 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
                          <span className="font-bold text-sm">{response.model}</span>
                          <div className="w-6 h-6 rounded-full bg-gray-100 dark:bg-white/10 flex items-center justify-center text-[10px]">
                            {response.model[0]}
                          </div>
                        </div>
                        <div className="p-4 text-sm leading-relaxed text-gray-600 dark:text-gray-300 h-64 overflow-y-auto scrollbar-hide">
                          {response.content}
                        </div>
                        <div className="p-3 mt-auto border-t border-gray-100 dark:border-white/5">
                          <button 
                            onClick={() => handleSelectWinner(msg.id, response.model)}
                            disabled={!!msg.selectedWinner}
                            className={`w-full py-2 rounded-xl text-xs font-semibold transition-all flex items-center justify-center gap-2
                              ${msg.selectedWinner === response.model
                                ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500'
                                : 'bg-gray-50 dark:bg-white/5 hover:bg-blue-50 dark:hover:bg-blue-900/20 hover:text-blue-500 text-gray-500'
                              }
                              ${!!msg.selectedWinner && msg.selectedWinner !== response.model ? 'opacity-50 cursor-not-allowed' : ''}
                            `}
                          >
                            {msg.selectedWinner === response.model ? (
                              <><CheckCircle size={14} /> Selected</>
                            ) : (
                              "Select Best"
                            )}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="max-w-[85%] md:max-w-[70%] rounded-[20px] p-4 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 rounded-bl-none shadow-sm">
                  <div className="flex items-center gap-2 mb-2 text-xs font-bold uppercase tracking-wider opacity-70">
                    {msg.model}
                  </div>
                  {msg.isImage ? (
                    <img src={msg.content} alt="Generated" className="rounded-xl w-full max-w-sm border border-white/10" />
                  ) : (
                    <div className="prose dark:prose-invert text-sm leading-relaxed whitespace-pre-wrap">
                      {msg.content}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 rounded-[20px] rounded-bl-none p-4 flex gap-1 shadow-sm">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Area */}
        <div className="p-6 bg-transparent">
          <div className="max-w-4xl mx-auto relative">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-2">
              <button 
                className={`p-2 transition-colors rounded-full ${mode === ChatMode.SINGLE && currentModel === ModelType.GEMINI ? 'text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-white/5' : 'text-gray-300 dark:text-gray-700 cursor-not-allowed'}`}
                title={mode === ChatMode.SINGLE && currentModel === ModelType.GEMINI ? "Upload Image" : "Image generation available in Single Gemini mode"}
                disabled={!(mode === ChatMode.SINGLE && currentModel === ModelType.GEMINI)}
              >
                <ImageIcon size={20} />
              </button>
            </div>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={mode === ChatMode.MULTI ? "Ask multi-agent network..." : `Ask ${currentModel}... (type /image for visuals)`}
              className="w-full pl-14 pr-14 py-4 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 rounded-[24px] shadow-lg focus:ring-2 focus:ring-blue-500 outline-none transition-all dark:text-white"
            />
            <button 
              onClick={handleSend}
              disabled={!input.trim() || isTyping}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-0 sm:p-4 animate-in fade-in overflow-hidden">
          <div className="bg-white dark:bg-[#161B22] rounded-none sm:rounded-[24px] w-full h-full sm:h-auto sm:max-w-5xl sm:my-4 shadow-2xl border-0 sm:border border-gray-200 dark:border-white/10 animate-in zoom-in-95 flex flex-col md:flex-row overflow-hidden sm:max-h-[90vh]">
            
            {/* Settings Sidebar */}
            <div className="w-full md:w-64 bg-gray-50 dark:bg-[#0D1117] border-b md:border-r md:border-b-0 border-gray-200 dark:border-white/5 p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold dark:text-white">Settings</h2>
                <button onClick={() => setSettingsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-lg dark:text-white transition-colors">
                  <X size={20} />
                </button>
              </div>
              
              <div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-visible pb-2 md:pb-0 scrollbar-hide">
                {[
                  { id: 'profile', icon: <UserIcon size={18} />, label: 'Profile' },
                  { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance' },
                  { id: 'models', icon: <Bot size={18} />, label: 'AI Models' },
                  { id: 'billing', icon: <CreditCard size={18} />, label: 'Billing' },
                  { id: 'privacy', icon: <ShieldCheck size={18} />, label: 'Privacy' },
                ].map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveSettingsTab(tab.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${
                      activeSettingsTab === tab.id 
                        ? 'bg-blue-500 text-white shadow-md' 
                        : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'
                    }`}
                  >
                    {tab.icon}
                    <span className="hidden sm:inline">{tab.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Settings Content */}
            <div className="flex-1 flex flex-col relative bg-white dark:bg-[#161B22] overflow-y-auto">
              <div className="p-4 sm:p-6 lg:p-8">
                {activeSettingsTab === 'profile' && (
                  <ProfileSettings 
                    user={user} 
                    userProfile={userProfile} 
                    onSave={handleSaveProfile}
                  />
                )}

                {activeSettingsTab === 'appearance' && (
                  <div className="space-y-6 max-w-3xl">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 dark:text-white">Appearance</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Customize your Jainn AI experience</p>
                      
                      <div className={`p-6 bg-gray-50 dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-white/5 space-y-6 ${isFeatureLocked('custom-theme') ? 'locked-overlay' : ''}`}>
                        <div>
                          <div className="flex items-center justify-between mb-4">
                            <h4 className="text-sm font-bold dark:text-white">Theme Color</h4>
                            {isFeatureLocked('custom-theme') && (
                              <span className="text-xs bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 px-2 py-1 rounded-full flex items-center gap-1">
                                <Crown size={12} /> Ultra Only
                              </span>
                            )}
                          </div>
                          <div className="grid grid-cols-5 sm:grid-cols-8 gap-3">
                            {['#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#EF4444', '#6366F1', '#14B8A6'].map((color) => (
                              <button
                                key={color}
                                disabled={isFeatureLocked('custom-theme')}
                                className={`w-full aspect-square rounded-xl transition-all hover:scale-110 ${
                                  user.themeColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#161B22]' : ''
                                } ${isFeatureLocked('custom-theme') ? 'cursor-not-allowed opacity-50' : ''}`}
                                style={{ backgroundColor: color }}
                              />
                            ))}
                          </div>
                        </div>

                        <div>
                          <h4 className="text-sm font-bold dark:text-white mb-4">Chat Density</h4>
                          <div className="flex flex-col sm:flex-row gap-3">
                            {['Compact', 'Normal', 'Comfortable'].map((density) => (
                              <button
                                key={density}
                                className="flex-1 px-4 py-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-sm font-medium dark:text-white"
                              >
                                {density}
                              </button>
                            ))}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'models' && (
                  <div className="space-y-6 max-w-3xl">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 dark:text-white">AI Models</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Configure default model and preferences</p>
                      
                      <div className="space-y-4">
                        {[
                          { name: 'Gemini 2.5 Flash', desc: 'Google\'s fastest model', color: 'blue', available: true },
                          { name: 'LLaMA 3.1 70B', desc: 'Meta\'s open-source powerhouse', color: 'purple', available: true },
                          { name: 'Mistral Large', desc: 'Efficient and precise', color: 'yellow', available: true },
                        ].map((model) => (
                          <div key={model.name} className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-white/5 flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-full bg-${model.color}-500/20 flex items-center justify-center`}>
                                <Bot size={20} className={`text-${model.color}-600`} />
                              </div>
                              <div>
                                <h4 className="text-sm font-bold dark:text-white">{model.name}</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">{model.desc}</p>
                              </div>
                            </div>
                            {model.available ? (
                              <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 px-3 py-1 rounded-full">Active</span>
                            ) : (
                              <span className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-500 px-3 py-1 rounded-full">Unavailable</span>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'billing' && (
                  <div className="space-y-6 max-w-3xl">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 dark:text-white">Billing & Subscription</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Manage your plan and payment methods</p>
                      
                      <div className="p-6 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-2xl border border-blue-200 dark:border-blue-500/30 mb-6">
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
                          <div>
                            <h4 className="text-lg font-bold dark:text-white flex items-center gap-2 mb-1">
                              {user.tier === 'pro' && <Crown size={20} className="text-yellow-500" />}
                              {user.tier === 'ultra' && <Crown size={20} className="text-purple-500" />}
                              {user.tier.toUpperCase()} Plan
                            </h4>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {user.tier === 'free' && 'Upgrade to unlock powerful features'}
                              {user.tier === 'pro' && 'Next billing: January 14, 2025'}
                              {user.tier === 'ultra' && 'Next billing: January 14, 2025'}
                              {user.tier === 'guest' && 'Sign up to save your progress'}
                            </p>
                          </div>
                          {user.tier !== 'ultra' && (
                            <button className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors whitespace-nowrap">
                              Upgrade Plan
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activeSettingsTab === 'privacy' && (
                  <div className="space-y-6 max-w-3xl">
                    <div>
                      <h3 className="text-2xl font-bold mb-2 dark:text-white">Privacy & Security</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">Control your data and privacy settings</p>
                      
                      <div className="space-y-4 mb-6">
                        <div className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Bell size={18} className="text-blue-600 dark:text-blue-400" />
                              <div>
                                <h4 className="text-sm font-bold dark:text-white">Notifications</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Receive updates about your account</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setNotifications(!notifications)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                notifications ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        </div>

                        <div className="p-4 bg-gray-50 dark:bg-[#0D1117] rounded-xl border border-gray-200 dark:border-white/5">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-3">
                              <Globe size={18} className="text-green-600 dark:text-green-400" />
                              <div>
                                <h4 className="text-sm font-bold dark:text-white">Data Sharing</h4>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Help improve Jainn with usage data</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setDataSharing(!dataSharing)}
                              className={`relative w-12 h-6 rounded-full transition-colors ${
                                dataSharing ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                              }`}
                            >
                              <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${
                                dataSharing ? 'translate-x-6' : 'translate-x-0'
                              }`} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Logout Confirmation Modal - MOVED INSIDE RETURN */}
      {logoutConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#161B22] rounded-2xl p-6 max-w-sm w-full shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95">
            <h3 className="text-xl font-bold mb-2 dark:text-white">Confirm Logout</h3>
            <p className="text-gray-600 dark:text-gray-400 mb-6">Are you sure you want to log out of your account?</p>
            <div className="flex gap-3">
              <button 
                onClick={() => setLogoutConfirmOpen(false)}
                className="flex-1 px-4 py-2 rounded-xl border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5 font-medium dark:text-white transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={onLogout}
                className="flex-1 px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 font-medium transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  </>
);
