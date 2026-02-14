import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { ChatHistory } from '../components/ChatHistory';
import { CustomModal } from '../components/CustomModal';
import { ProfileSettings } from '../components/ProfileSettings';
import { User, ChatMode, Message, ModelType, UserTier, MultiResponse, ChatSession, UploadedFile } from '../types';
import { saveChatSession, getChatSessions, generateChatTitle, deleteChatSession, renameChatSession } from '../lib/chatHistory';
import { MessageSquare, Edit2, Trash2, Loader } from 'lucide-react';
import { generateResponse, generateResponseStream, generateRefereeAnalysis, generateImage } from '../services/gemini';
import { supabase, upsertUserProfile } from '../lib/supabase';
import { Settings, LogOut, Plus, Image as ImageIcon, Send, User as UserIcon, Bot, Menu, X, CheckCircle, Crown, Home, ChevronDown, Lock, Palette, CreditCard, ShieldCheck, Bell, Globe, Code, Copy, Check } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

// Separate component for CodeBlock to handle state
const CodeBlock = ({ language, children, ...props }: any) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(String(children));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-xl overflow-hidden my-6 shadow-2xl border border-gray-700/50 bg-[#0d1117] ring-1 ring-white/5 transition-all duration-300">
      <div className="flex items-center justify-between px-4 py-3 bg-[#161b22] border-b border-gray-700/50 cursor-pointer hover:bg-[#1f242d] transition-colors" onClick={() => setIsCollapsed(!isCollapsed)}>
        <div className="flex items-center gap-3">
          <div className="flex gap-2">
            <div className="w-3 h-3 rounded-full bg-[#FF5F56] shadow-sm hover:opacity-80 transition-opacity" title="Close" onClick={(e) => { e.stopPropagation(); setIsCollapsed(true); }}></div>
            <div className={`w-3 h-3 rounded-full bg-[#FFBD2E] shadow-sm hover:opacity-80 transition-opacity ${isCollapsed ? 'animate-pulse' : ''}`} title="Minimize" onClick={(e) => { e.stopPropagation(); setIsCollapsed(!isCollapsed); }}></div>
            <div className="w-3 h-3 rounded-full bg-[#27C93F] shadow-sm hover:opacity-80 transition-opacity" title="Expand" onClick={(e) => { e.stopPropagation(); setIsCollapsed(false); }}></div>
          </div>
          <span className="text-xs text-blue-400 font-mono font-bold uppercase tracking-wider bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20 select-none">
            {language} {isCollapsed && '(Collapsed)'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={(e) => { e.stopPropagation(); handleCopy(); }}
            className="text-gray-400 hover:text-white transition-colors flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded hover:bg-white/5"
            title="Copy Code"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            <span className="hidden md:inline">{copied ? 'Copied!' : 'Copy'}</span>
          </button>
          <div className="text-gray-500">
            {isCollapsed ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
          </div>
        </div>
      </div>
      {!isCollapsed && (
        <SyntaxHighlighter
          style={dracula}
          language={language}
          PreTag="div"
          customStyle={{ margin: 0, borderRadius: 0, fontSize: '0.9rem', lineHeight: '1.6', padding: '1.5rem', background: 'transparent' }}
          {...props}
        >
          {String(children).replace(/\n$/, '')}
        </SyntaxHighlighter>
      )}
    </div>
  );
};

interface ChatPageProps {
  user: User;
  onLogout: () => void;
  onHome: () => void;
  onUpdateUser: (user: User) => void;
  onUpgrade?: (plan: 'pro' | 'ultra') => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ user, onLogout, onHome, onUpdateUser, onUpgrade }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>(ChatMode.SINGLE);
  const [currentSessionId, setCurrentSessionId] = useState<string>(() => crypto.randomUUID());
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(false);
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
  const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
  const [regeneratingMessageId, setRegeneratingMessageId] = useState<string | null>(null);

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

  useEffect(() => {
    loadChatSessions();
  }, [user.id]);

  const loadChatSessions = async () => {
    try {
      setLoadingSessions(true);
      const sessions = await getChatSessions(user.id);
      setChatSessions(sessions);
    } catch (error) {
      console.error('Failed to load chat sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

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

  const handleDeleteChat = async (sessionId: string) => {
    try {
      await deleteChatSession(sessionId, user.id);

      // If the deleted session was active, clear the view and start new
      if (sessionId === currentSessionId) {
        setMessages([]);
        setCurrentSessionId(crypto.randomUUID());
        setMode(ChatMode.SINGLE);
      }

      await loadChatSessions();
    } catch (error) {
      console.error('Failed to delete chat:', error);
      showModal('Delete Failed', 'Failed to delete chat.', 'error');
    }
  };

  const handleRenameChat = async (sessionId: string, newTitle: string) => {
    try {
      await renameChatSession(sessionId, user.id, newTitle);
      await loadChatSessions();
    } catch (error) {
      console.error('Failed to rename chat:', error);
    }
  };

  // Message handling function
  const handleSend = async () => {
    if ((!input.trim() && uploadedFiles.length === 0) || isTyping) return;

    if (user.tier === UserTier.GUEST && messages.length >= 10) {
      showModal(
        'Guest Limit Reached',
        'You\'ve reached the 10 message limit for guest users. Please sign up to continue chatting!',
        'warning'
      );
      return;
    }

    const isImageCmd = input.toLowerCase().startsWith('/image');

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input || `[${uploadedFiles.length} file(s) attached]`,
      timestamp: Date.now(),
      files: uploadedFiles.length > 0 ? uploadedFiles : undefined
    };

    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput('');
    setUploadedFiles([]);
    setIsTyping(true);

    try {
      let aiMsg: Message | undefined;

      if (isImageCmd) {
        const prompt = input.replace('/image', '').trim();
        const imageUrl = await generateImage(prompt);
        if (imageUrl) {
          aiMsg = {
            id: (Date.now() + 1).toString(),
            role: 'model',
            model: 'Imagen 3.0',
            content: imageUrl,
            isImage: true,
            timestamp: Date.now()
          };
          const updatedMessages = [...newMessages, aiMsg];
          setMessages(updatedMessages);

          const title = newMessages.length === 1 ? generateChatTitle([userMsg]) :
            chatSessions.find(s => s.id === currentSessionId)?.title || generateChatTitle(newMessages);
          await saveChatSession(user.id, currentSessionId, title, mode, updatedMessages);
          await loadChatSessions();
        } else {
          throw new Error("Failed to generate image");
        }
      } else if (mode === ChatMode.SINGLE) {
        // STREAMING IMPLEMENTATION
        let enhancedPrompt = userMsg.content;
        if (uploadedFiles.length > 0) {
          enhancedPrompt += `\n\n[User has attached ${uploadedFiles.length} file(s): ${uploadedFiles.map(f => f.name).join(', ')}]`;
        }

        // Create placeholder message
        const placeholderId = (Date.now() + 1).toString();
        aiMsg = {
          id: placeholderId,
          role: 'model',
          model: currentModel.toUpperCase(),
          content: '', // Start empty
          timestamp: Date.now()
        };

        // Update state with placeholder
        let currentMessages = [...newMessages, aiMsg];
        setMessages(currentMessages);

        let fullContent = '';

        try {
          // Iterate over stream
          const stream = generateResponseStream(enhancedPrompt, currentModel, uploadedFiles);

          for await (const chunk of stream) {
            fullContent += chunk;

            // Update the specific message in state (use functional update to avoid stale closure)
            setMessages(prev => prev.map(m =>
              m.id === placeholderId
                ? { ...m, content: fullContent }
                : m
            ));
          }
        } catch (streamError) {
          console.error("Streaming failed, falling back to non-stream", streamError);
          // Fallback if stream fails
          fullContent = await generateResponse(enhancedPrompt, currentModel, uploadedFiles);
        }

        // Final update and save
        aiMsg.content = fullContent;
        const updatedMessages = [...newMessages, { ...aiMsg, content: fullContent }];
        setMessages(updatedMessages);

        const title = newMessages.length === 1 ? generateChatTitle([userMsg]) :
          chatSessions.find(s => s.id === currentSessionId)?.title || generateChatTitle(updatedMessages);
        await saveChatSession(user.id, currentSessionId, title, mode, updatedMessages);
        await loadChatSessions();

      } else {
        // Multi-agent mode
        const models = [ModelType.GEMINI, ModelType.LLAMA, ModelType.MISTRAL];
        const responses = await Promise.all(models.map(async (m) => {
          return {
            model: m,
            text: await generateResponse(userMsg.content, m, uploadedFiles)
          };
        }));

        const multiResponses: MultiResponse[] = responses.map(r => ({
          model: r.model.toUpperCase(),
          content: r.text,
          isWinner: false
        }));

        const multiMsg: Message = {
          id: (Date.now() + 1).toString(),
          role: 'model',
          content: 'Multi-Agent Response',
          timestamp: Date.now(),
          multiResponses: multiResponses
        };

        const updatedMessages = [...newMessages, multiMsg];
        setMessages(updatedMessages);

        const title = newMessages.length === 1 ? generateChatTitle([userMsg]) :
          chatSessions.find(s => s.id === currentSessionId)?.title || generateChatTitle(newMessages);
        await saveChatSession(user.id, currentSessionId, title, mode, updatedMessages);
        await loadChatSessions();

        generateRefereeAnalysis(userMsg.content, responses).then(analysis => {
          console.log("Referee Analysis:", analysis);
        });
      }

    } catch (error) {
      console.error('Send message error:', error);
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: "I encountered an error. Please check your API configuration or try again.",
        timestamp: Date.now()
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  const handleSelectSession = (session: ChatSession) => {
    setCurrentSessionId(session.id);
    setMessages(session.messages as Message[]);
    setMode(session.mode as ChatMode);

    // Auto-close sidebar on mobile
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  };

  const handleSelectWinner = async (messageId: string, winnerModel: string) => {
    const updatedMessages = messages.map(msg => {
      if (msg.id === messageId && msg.multiResponses) {
        return {
          ...msg,
          selectedWinner: winnerModel,
          multiResponses: msg.multiResponses.map(r => ({
            ...r,
            isWinner: r.model === winnerModel
          }))
        };
      }
      return msg;
    });

    setMessages(updatedMessages);
    const title = chatSessions.find(s => s.id === currentSessionId)?.title || "Chat";
    await saveChatSession(user.id, currentSessionId, title, mode, updatedMessages);
  };

  const handleNewChat = () => {
    setMessages([]);
    setCurrentSessionId(crypto.randomUUID());
    setMode(ChatMode.SINGLE);
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
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

  // Get user avatar URL
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
        fixed inset-y-0 left-0 z-40 w-72 bg-white/80 dark:bg-[#161B22]/80 backdrop-blur-xl border-r border-gray-200/50 dark:border-white/5 transform transition-transform duration-500 cubic-bezier(0.32, 0.72, 0, 1)
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0 md:static flex flex-col shadow-[20px_0_40px_rgba(0,0,0,0.1)]
      `}>
          <div className="p-6 border-b border-gray-100/50 dark:border-white/5 flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={onHome}>
              <Logo size={28} />
              <span className="font-bold text-lg">Jainn AI</span>
            </div>
            <button onClick={() => setSidebarOpen(false)} className="md:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10">
              <X size={20} />
            </button>
          </div>

          <div className="p-4 space-y-3">
            <Button onClick={handleNewChat} variant="secondary" className="w-full justify-start text-gray-700 dark:text-gray-200 bg-gray-50/50 dark:bg-white/5 border-gray-200/50 dark:border-white/5 hover:border-blue-500/50 rounded-[20px] h-12 px-5 font-semibold shadow-sm hover:shadow-md transition-all">
              <Plus size={20} className="mr-2 text-blue-500" /> New Chat
            </Button>
            <Button onClick={onHome} variant="ghost" className="w-full justify-start px-5 h-12 rounded-[20px] text-gray-600 dark:text-gray-400 hover:bg-gray-100/50 dark:hover:bg-white/5 font-medium transition-all">
              <Home size={18} /> Home
            </Button>
          </div>

          <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2 scrollbar-hide">
            <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
              Chat History
            </h3>

            {loadingSessions ? (
              <div className="flex items-center justify-center py-8">
                <Loader className="animate-spin text-blue-500" size={20} />
              </div>
            ) : chatSessions.length === 0 ? (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">
                No chats yet
              </p>
            ) : (
              <ChatHistory
                sessions={chatSessions}
                currentSessionId={currentSessionId}
                onSelectChat={handleSelectSession}
                onDeleteChat={handleDeleteChat}
                onRenameChat={handleRenameChat}
              />
            )}
          </div>

          <div className="p-4 border-t border-gray-100 dark:border-white/5">
            <div className="flex items-center gap-3 mb-4 px-2">
              <div className="relative w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm shadow-lg overflow-hidden">
                {getUserAvatar() ? (
                  <img src={getUserAvatar()} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  getUserInitials()
                )}
                <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-[#161B22] rounded-full"></div>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate dark:text-white">
                  {user.displayName || userProfile?.name || 'User'}
                </p>
                <div className="flex items-center gap-1.5">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded uppercase ${user.tier === UserTier.FREE ? 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' :
                    user.tier === UserTier.PRO ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' :
                      user.tier === UserTier.ULTRA ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' :
                        'bg-gray-100 text-gray-600'
                    }`}>
                    {user.tier}
                  </span>
                  {(user.tier === UserTier.FREE || user.tier === UserTier.GUEST) && (
                    <span className="text-[10px] text-gray-400">
                      {user.tokensUsed}/{user.tier === UserTier.GUEST ? '10' : 'Limit'}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-colors">
              <Settings size={18} /> Settings
            </button>
            <button onClick={() => setLogoutConfirmOpen(true)} className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-600 dark:hover:text-red-400 rounded-xl transition-colors">
              <LogOut size={18} /> Logout
            </button>
          </div>
        </aside>

        {/* Main Chat Area */}
        <main className="flex-1 flex flex-col h-full relative bg-gray-50/50 dark:bg-[#0D1117]/50 backdrop-blur-sm">
          {/* Header */}
          <header className="h-16 border-b border-gray-200/50 dark:border-white/5 flex items-center justify-between px-4 sticky top-0 z-10 bg-white/80 dark:bg-[#161B22]/80 backdrop-blur-md transition-all duration-300">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 hover:bg-gray-100/50 dark:hover:bg-white/5 rounded-full transition-colors">
                <Menu size={20} />
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

                  <div className="max-w-full md:max-w-[85%] rounded-[24px] p-4 md:p-8 bg-white dark:bg-[#161B22] border border-gray-200 dark:border-white/10 shadow-lg rounded-bl-sm overflow-hidden group hover:shadow-md transition-all duration-300">
                    <div className="flex items-center gap-3 mb-4 md:mb-6 opacity-80 group-hover:opacity-100 transition-opacity select-none border-b border-gray-100 dark:border-white/5 pb-3">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-cyan-300 flex items-center justify-center text-[10px] font-black text-white shadow-sm">
                        AI
                      </div>
                      <span className="text-xs md:text-sm font-bold uppercase tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500 dark:from-blue-400 dark:to-cyan-300 font-sans">
                        {msg.model}
                      </span>
                    </div>
                    {
                      !msg.isImage && (
                        <button
                          onClick={() => navigator.clipboard.writeText(msg.content)}
                          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-full transition-all opacity-0 group-hover:opacity-100"
                          title="Copy Response"
                        >
                          <Copy size={16} />
                        </button>
                      )
                    }
                    {
                      msg.isImage ? (
                        <img src={msg.content} alt="Generated" className="rounded-[20px] w-full max-w-md border border-white/20 shadow-2xl transition-transform hover:scale-[1.01]" />
                      ) : (
                        <div className="markdown-content text-sm leading-relaxed">
                          <ReactMarkdown
                            remarkPlugins={[remarkGfm]}
                            components={{
                              code({ node, inline, className, children, ...props }: any) {
                                const match = /language-(\w+)/.exec(className || '');
                                return !inline && match ? (
                                  <CodeBlock language={match[1]} {...props}>
                                    {children}
                                  </CodeBlock>
                                ) : (
                                  <code className={`${className} bg-blue-100 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-md text-sm font-mono text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-500/20`} {...props}>
                                    {children}
                                  </code>
                                );
                              },
                              h1: ({ children }) => <h1 className="text-2xl md:text-3xl font-black mb-4 md:mb-6 mt-8 md:mt-10 text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-400 dark:to-indigo-400 tracking-tight">{children}</h1>,
                              h2: ({ children }) => <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4 mt-6 md:mt-8 text-gray-800 dark:text-white flex items-center gap-3"><span className="w-1.5 h-5 md:h-6 rounded-full bg-blue-500 shrink-0"></span>{children}</h2>,
                              h3: ({ children }) => <h3 className="text-lg md:text-xl font-bold mb-2 md:mb-3 mt-4 md:mt-6 text-gray-700 dark:text-gray-200">{children}</h3>,
                              p: ({ children }) => <p className="mb-4 last:mb-0 leading-relaxed text-gray-700 dark:text-gray-300/90 font-light tracking-wide text-sm md:text-base">{children}</p>,
                              ul: ({ children }) => <ul className="space-y-2 mb-6 ml-1">{children}</ul>,
                              ol: ({ children }) => <ol className="list-decimal pl-5 mb-6 space-y-2 marker:text-blue-500 marker:font-bold text-gray-700 dark:text-gray-300">{children}</ol>,
                              li: ({ children }) => (
                                <li className="flex gap-3 items-start group text-sm md:text-base">
                                  <div className="mt-2 w-1.5 h-1.5 rounded-full bg-blue-400 group-hover:bg-blue-300 shrink-0 shadow-[0_0_8px_rgba(96,165,250,0.6)] transition-colors"></div>
                                  <span className="group-hover:text-gray-900 dark:group-hover:text-white transition-colors">{children}</span>
                                </li>
                              ),
                              blockquote: ({ children }) => (
                                <blockquote className="border-l-4 border-blue-500/50 pl-6 italic my-6 text-gray-600 dark:text-gray-400 py-3 relative bg-blue-50/50 dark:bg-blue-900/10 rounded-r-lg shadow-sm">
                                  <div className="absolute top-2 left-1 opacity-20 text-3xl text-blue-500">“</div>
                                  {children}
                                </blockquote>
                              ),
                              a: ({ href, children }) => <a href={href} target="_blank" rel="noopener noreferrer" className="text-cyan-600 dark:text-cyan-400 hover:text-cyan-500 underline decoration-cyan-500/30 hover:decoration-cyan-500 transition-all font-medium">{children}</a>,
                              table: ({ children }) => <div className="overflow-x-auto my-6 rounded-lg border border-blue-200 dark:border-white/10 shadow-lg"><table className="w-full text-left border-collapse">{children}</table></div>,
                              th: ({ children }) => <th className="bg-blue-50 dark:bg-blue-900/20 p-4 border-b border-blue-200 dark:border-white/10 font-bold text-xs uppercase tracking-wider text-blue-700 dark:text-blue-300">{children}</th>,
                              td: ({ children }) => <td className="p-4 border-b border-gray-100 dark:border-white/5 text-sm">{children}</td>,
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </div>
                      )
                    }
                  </div>
                )}
              </div>
            ))}
            {isTyping && messages.length > 0 && String(messages[messages.length - 1].content).length === 0 && (
              <div className="flex justify-start animate-in fade-in duration-500 slide-in-from-bottom-2">
                <div className="max-w-[80%] rounded-[24px] p-6 bg-white/50 dark:bg-[#1C2128]/50 border border-blue-500/20 backdrop-blur-md rounded-bl-sm shadow-lg space-y-4">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="relative">
                      <div className="w-3 h-3 rounded-full bg-blue-500 animate-ping absolute opacity-75"></div>
                      <div className="w-3 h-3 rounded-full bg-blue-500 relative shadow-[0_0_10px_rgba(59,130,246,0.5)]"></div>
                    </div>
                    <span className="text-xs font-bold uppercase tracking-widest text-blue-500 animate-pulse">
                      {currentModel} is thinking...
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="h-2 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full w-3/4 animate-pulse"></div>
                    <div className="h-2 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full w-1/2 animate-pulse delay-75"></div>
                    <div className="h-2 bg-gradient-to-r from-blue-500/20 to-transparent rounded-full w-5/6 animate-pulse delay-150"></div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div >

          {/* Input Area */}
          <div className="p-3 md:p-6 bg-transparent">
            <div className="max-w-4xl mx-auto relative cursor-text">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-2 z-10">
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
                placeholder={mode === ChatMode.MULTI ? "Ask..." : `Ask ${currentModel}...`}
                className="w-full pl-14 pr-14 py-4 bg-white/90 dark:bg-[#161B22]/90 backdrop-blur-xl border border-gray-200/50 dark:border-white/10 rounded-[28px] shadow-lg focus:ring-2 focus:ring-blue-500/50 outline-none transition-all dark:text-white placeholder:text-gray-400 text-sm md:text-base"
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-md"
              >
                <Send size={18} />
              </button>
            </div>
          </div >
        </main >

        {/* Settings Modal */}
        {
          settingsOpen && (
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
                        className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors whitespace-nowrap ${activeSettingsTab === tab.id
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
                                    className={`w-full aspect-square rounded-xl transition-all hover:scale-110 ${user.themeColor === color ? 'ring-2 ring-offset-2 ring-blue-500 dark:ring-offset-[#161B22]' : ''
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
                              {user.tier !== 'ultra' && onUpgrade && (
                                <button
                                  onClick={() => {
                                    const targetPlan = user.tier === 'free' || user.tier === 'guest' ? 'pro' : 'ultra';
                                    onUpgrade(targetPlan);
                                    setSettingsOpen(false);
                                  }}
                                  className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 font-medium transition-colors whitespace-nowrap"
                                >
                                  {user.tier === 'free' || user.tier === 'guest' ? 'Upgrade to Pro' : 'Upgrade to Ultra'}
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
                                  className={`relative w-12 h-6 rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                >
                                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${notifications ? 'translate-x-6' : 'translate-x-0'
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
                                  className={`relative w-12 h-6 rounded-full transition-colors ${dataSharing ? 'bg-green-600' : 'bg-gray-300 dark:bg-gray-600'
                                    }`}
                                >
                                  <div className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full transition-transform ${dataSharing ? 'translate-x-6' : 'translate-x-0'
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
          )
        }

        {/* Logout Confirmation Modal */}
        {
          logoutConfirmOpen && (
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
          )
        }

      </div >
    </>
  );
};
