import React, { useState, useEffect, useRef } from 'react';
import { Logo } from '../components/Logo';
import { Button } from '../components/Button';
import { User, ChatMode, Message, ModelType, UserTier, MultiResponse } from '../types';
import { generateResponse, generateRefereeAnalysis, generateImage } from '../services/gemini';
import { Settings, LogOut, Plus, Image as ImageIcon, Send, User as UserIcon, Bot, Award, Menu, X, Trash2, CheckCircle, Crown, Home, ChevronDown, Lock, User as ProfileIcon, Palette, CreditCard, ShieldCheck } from 'lucide-react';

interface ChatPageProps {
  user: User;
  onLogout: () => void;
  onHome: () => void;
}

export const ChatPage: React.FC<ChatPageProps> = ({ user, onLogout, onHome }) => {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>(ChatMode.SINGLE); 
  const [currentModel, setCurrentModel] = useState<ModelType>(ModelType.GEMINI);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false); // New state for dropdown
  const [logoutConfirmOpen, setLogoutConfirmOpen] = useState(false);
  const [activeSettingsTab, setActiveSettingsTab] = useState('appearance'); // 'profile', 'appearance', 'models', 'billing'
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping]);

  const handleModeSwitch = (newMode: ChatMode) => {
      // Check Free Tier Restriction for Multi Mode
      if (user.tier === UserTier.FREE && newMode === ChatMode.MULTI) {
          alert("Multi-Agent Mode is a PRO feature. Upgrade to Jainn Pro to access.");
          return;
      }

      if (newMode !== mode) {
          setMessages([]); // Clear chat history on mode switch
          setMode(newMode);
      }
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;
    
    // Guest Limit Check
    if (user.tier === UserTier.GUEST && messages.length > 10) {
      alert("Guest limit reached. Please sign up.");
      return;
    }

    // Image Gen Constraint: Strict check
    const isImageCmd = input.toLowerCase().startsWith('/image');
    if (isImageCmd) {
        if (mode !== ChatMode.SINGLE) {
            alert("Image generation is only available in Single Mode.");
            return;
        }
        if (currentModel !== ModelType.GEMINI) {
            alert("Image generation is only supported by Gemini model.");
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
        // Multi Agent Mode
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

        // Background Referee Analysis
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
      }
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

  return (
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
                <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">
                  {user.email[0].toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.email}</p>
                  <p className="text-xs text-gray-500 uppercase">{user.tier}</p>
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
              
              {/* Mode Toggle */}
              <div className="flex bg-gray-100 dark:bg-[#161B22] p-1 rounded-lg">
                <button 
                  onClick={() => handleModeSwitch(ChatMode.MULTI)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${mode === ChatMode.MULTI ? 'bg-white dark:bg-blue-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <Bot size={14} /> Multi-Agent
                </button>
                <button 
                  onClick={() => handleModeSwitch(ChatMode.SINGLE)}
                  className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all flex items-center gap-2 ${mode === ChatMode.SINGLE ? 'bg-white dark:bg-blue-600 shadow-sm text-blue-600 dark:text-white' : 'text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'}`}
                >
                  <UserIcon size={14} /> Single
                </button>
              </div>

              {/* Model Selector for Single Mode - Fixed Click Behavior */}
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

      {/* New Settings Modal Structure */}
      {settingsOpen && (
         <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in">
            <div className="bg-white dark:bg-[#161B22] rounded-[24px] max-w-4xl w-full h-[600px] shadow-2xl border border-gray-200 dark:border-white/10 animate-in zoom-in-95 flex overflow-hidden">
               
               {/* Settings Sidebar */}
               <div className="w-64 bg-gray-50 dark:bg-[#0D1117] border-r border-gray-200 dark:border-white/5 p-4 flex flex-col gap-1">
                  <h2 className="text-xl font-bold dark:text-white mb-6 px-4 mt-2">Settings</h2>
                  {[
                      { id: 'profile', icon: <ProfileIcon size={18} />, label: 'Profile' },
                      { id: 'appearance', icon: <Palette size={18} />, label: 'Appearance' },
                      { id: 'models', icon: <Bot size={18} />, label: 'AI Models' },
                      { id: 'billing', icon: <CreditCard size={18} />, label: 'Billing' },
                      { id: 'privacy', icon: <ShieldCheck size={18} />, label: 'Privacy' },
                  ].map(tab => (
                      <button
                          key={tab.id}
                          onClick={() => setActiveSettingsTab(tab.id)}
                          className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                              activeSettingsTab === tab.id 
                                  ? 'bg-blue-500 text-white shadow-md' 
                                  : 'text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-white/5'
                          }`}
                      >
                          {tab.icon}
                          {tab.label}
                      </button>
                  ))}
               </div>

               {/* Settings Content */}
               <div className="flex-1 flex flex-col relative bg-white dark:bg-[#161B22]">
                   <div className="absolute top-4 right-4">
                       <button onClick={() => setSettingsOpen(false)} className="p-2 hover:bg-gray-100 dark:hover:bg-white/10 rounded-full dark:text-white"><X size={20} /></button>
                   </div>
                   
                   <div className="flex-1 overflow-y-auto p-8">
                       {activeSettingsTab === 'appearance' && (
                           <div className="space-y-8">
                               <div>
                                   <h3 className="text-lg font-bold mb-4 dark:text-white">Theme Customization</h3>
                                   <div className="p-6 bg-gray-50 dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-white/5">
                                       <div className="flex items-center justify-between mb-4">
                                           <label className="text-sm font-semibold dark:text-gray-300">Accent Color</label>
                                           {user.tier === 'free' && <span className="text-[10px] bg-blue-500/10 text-blue-500 px-2 py-0.5 rounded-full font-bold border border-blue-500/20">PRO FEATURE</span>}
                                       </div>
                                       <div className="flex gap-3">
                                           <div className="w-10 h-10 rounded-full bg-blue-600 ring-2 ring-offset-2 ring-blue-500 cursor-pointer shadow-sm"></div>
                                           {/* Locked Colors */}
                                           {['#7C3AED', '#EC4899', '#10B981', '#F59E0B'].map(c => (
                                               <div key={c} className="w-10 h-10 rounded-full opacity-40 cursor-not-allowed relative flex items-center justify-center border border-transparent hover:border-gray-400" style={{ backgroundColor: c }}>
                                                   <Lock className="w-3 h-3 text-white" />
                                               </div>
                                           ))}
                                       </div>
                                       <p className="text-xs text-gray-500 mt-3">Upgrade to Pro to unlock 10+ custom accent colors and themes.</p>
                                   </div>
                               </div>
                               <div>
                                   <h3 className="text-lg font-bold mb-4 dark:text-white">Chat Density</h3>
                                   <div className="flex gap-4">
                                       <div className="flex-1 p-4 border border-blue-500 bg-blue-50 dark:bg-blue-900/20 rounded-xl cursor-pointer">
                                           <div className="text-sm font-bold text-blue-600 dark:text-blue-400">Normal</div>
                                       </div>
                                       <div className="flex-1 p-4 border border-gray-200 dark:border-white/10 rounded-xl opacity-50 cursor-not-allowed relative">
                                           <div className="text-sm font-bold dark:text-gray-400">Compact <Lock size={12} className="inline ml-1" /></div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}

                       {activeSettingsTab === 'models' && (
                           <div className="space-y-8">
                               <div>
                                   <h3 className="text-lg font-bold mb-4 dark:text-white">System Instructions</h3>
                                   <div className="p-6 bg-gray-50 dark:bg-[#0D1117] rounded-2xl border border-gray-200 dark:border-white/5 relative overflow-hidden">
                                       {user.tier === 'free' && (
                                           <div className="absolute inset-0 bg-white/50 dark:bg-black/50 backdrop-blur-[1px] flex items-center justify-center z-10">
                                               <Button className="shadow-xl" onClick={() => window.open('/pricing')}>Unlock Custom Instructions</Button>
                                           </div>
                                       )}
                                       <textarea 
                                            disabled={user.tier === 'free'}
                                            className="w-full bg-transparent border border-gray-200 dark:border-white/10 rounded-lg p-3 text-sm resize-none dark:text-white focus:ring-2 focus:ring-blue-500" 
                                            placeholder="Example: You are a senior software engineer. Be concise." 
                                            rows={4}
                                       ></textarea>
                                   </div>
                               </div>
                               <div>
                                   <h3 className="text-lg font-bold mb-4 dark:text-white">Model Parameters</h3>
                                   <div className="space-y-4 opacity-60 pointer-events-none">
                                       <div>
                                           <div className="flex justify-between text-sm mb-2 dark:text-gray-300">Temperature <Lock size={12} /></div>
                                           <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                               <div className="w-1/2 h-full bg-blue-500"></div>
                                           </div>
                                       </div>
                                       <div>
                                           <div className="flex justify-between text-sm mb-2 dark:text-gray-300">Max Tokens <Lock size={12} /></div>
                                           <div className="h-2 bg-gray-200 dark:bg-white/10 rounded-full overflow-hidden">
                                               <div className="w-1/3 h-full bg-blue-500"></div>
                                           </div>
                                       </div>
                                   </div>
                               </div>
                           </div>
                       )}

                       {activeSettingsTab === 'billing' && (
                           <div className="text-center py-10">
                               <div className="w-20 h-20 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                   <CreditCard size={32} className="text-blue-500" />
                               </div>
                               <h3 className="text-2xl font-bold dark:text-white mb-2">Current Plan: {user.tier.toUpperCase()}</h3>
                               <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-sm mx-auto">
                                   {user.tier === 'free' ? 'You are on the basic plan with limited features.' : 'You have access to premium features.'}
                               </p>
                               {user.tier === 'free' && (
                                   <Button className="w-full max-w-xs mx-auto text-lg py-3">Upgrade to Pro</Button>
                               )}
                           </div>
                       )}
                       
                       {/* Placeholder for other tabs */}
                       {['profile', 'privacy'].includes(activeSettingsTab) && (
                           <div className="flex flex-col items-center justify-center h-full text-gray-400">
                               <p>Settings content for {activeSettingsTab}...</p>
                           </div>
                       )}
                   </div>
               </div>
            </div>
         </div>
      )}

      {/* Logout Confirmation Modal */}
      {logoutConfirmOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
              <div className="bg-white dark:bg-[#161B22] rounded-[24px] max-w-sm w-full p-6 shadow-2xl border border-gray-200 dark:border-white/10 animate-in scale-95">
                  <h3 className="text-lg font-bold mb-2 dark:text-white">Sign Out?</h3>
                  <p className="text-gray-500 dark:text-gray-400 mb-6">Are you sure you want to end your session?</p>
                  <div className="flex gap-3">
                      <Button variant="secondary" onClick={() => setLogoutConfirmOpen(false)} className="flex-1 text-gray-700 dark:text-white border-gray-200 dark:border-white/10">Cancel</Button>
                      <Button onClick={onLogout} className="flex-1 bg-red-600 hover:bg-red-700 shadow-red-500/20">Sign Out</Button>
                  </div>
              </div>
          </div>
      )}

    </div>
  );
};