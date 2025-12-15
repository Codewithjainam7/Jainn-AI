import { ChatSession, Message } from '../types';
import { supabase } from './supabase';

const STORAGE_KEY = 'jainn_chat_sessions';

/**
 * Get all chat sessions for a user - FIXED to fetch real user data
 */
export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    if (supabase && !userId.startsWith('guest_')) {
      console.log('📥 Fetching chat sessions from Supabase for user:', userId);
      
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('❌ Error fetching chat sessions:', error);
        return getLocalChatSessions(userId);
      }

      console.log(`✅ Fetched ${data?.length || 0} sessions from Supabase`);
      
      return (data || []).map(session => ({
        id: session.id,
        title: session.title,
        mode: session.mode,
        messages: JSON.parse(session.messages || '[]'),
        lastUpdated: new Date(session.last_updated).getTime(),
        userId: session.user_id
      }));
    } else {
      console.log('📦 Fetching chat sessions from localStorage for:', userId);
      return getLocalChatSessions(userId);
    }
  } catch (error) {
    console.error('❌ Error in getChatSessions:', error);
    return getLocalChatSessions(userId);
  }
};

/**
 * Get chat sessions from localStorage
 */
const getLocalChatSessions = (userId: string): ChatSession[] => {
  try {
    const stored = localStorage.getItem(`${STORAGE_KEY}_${userId}`);
    if (!stored) return [];
    const sessions = JSON.parse(stored);
    console.log(`✅ Retrieved ${sessions.length} sessions from localStorage`);
    return sessions;
  } catch (error) {
    console.error('❌ Error parsing local chat sessions:', error);
    return [];
  }
};

/**
 * Save a chat session - ENHANCED with better error handling
 */
export const saveChatSession = async (session: ChatSession): Promise<void> => {
  try {
    console.log('💾 Saving chat session:', session.id);
    
    if (supabase && !session.userId.startsWith('guest_')) {
      const { error } = await supabase
        .from('chat_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          title: session.title,
          mode: session.mode,
          messages: JSON.stringify(session.messages),
          last_updated: new Date(session.lastUpdated).toISOString()
        }, {
          onConflict: 'id'
        });

      if (error) {
        console.error('❌ Error saving chat session to Supabase:', error);
        saveLocalChatSession(session);
      } else {
        console.log('✅ Chat session saved to Supabase');
      }
    } else {
      saveLocalChatSession(session);
    }
  } catch (error) {
    console.error('❌ Error in saveChatSession:', error);
    saveLocalChatSession(session);
  }
};

/**
 * Save chat session to localStorage
 */
const saveLocalChatSession = (session: ChatSession): void => {
  try {
    const sessions = getLocalChatSessions(session.userId);
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.unshift(session);
    }

    const trimmedSessions = sessions.slice(0, 50);
    localStorage.setItem(`${STORAGE_KEY}_${session.userId}`, JSON.stringify(trimmedSessions));
    console.log('✅ Chat session saved to localStorage');
  } catch (error) {
    console.error('❌ Error saving local chat session:', error);
  }
};

/**
 * Delete a chat session - FIXED with proper error handling
 */
export const deleteChatSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    console.log('🗑️ Deleting chat session:', sessionId);
    
    if (supabase && !userId.startsWith('guest_')) {
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error deleting chat session from Supabase:', error);
        throw error;
      } else {
        console.log('✅ Chat session deleted from Supabase');
      }
    }
    
    // Always delete from localStorage as backup
    deleteLocalChatSession(sessionId, userId);
  } catch (error) {
    console.error('❌ Error in deleteChatSession:', error);
    // Still delete from localStorage even if Supabase fails
    deleteLocalChatSession(sessionId, userId);
    throw error;
  }
};

/**
 * Delete chat session from localStorage
 */
const deleteLocalChatSession = (sessionId: string, userId: string): void => {
  try {
    const sessions = getLocalChatSessions(userId);
    const filtered = sessions.filter(s => s.id !== sessionId);
    localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(filtered));
    console.log('✅ Chat session deleted from localStorage');
  } catch (error) {
    console.error('❌ Error deleting local chat session:', error);
  }
};

/**
 * Rename a chat session - FIXED implementation
 */
export const renameChatSession = async (sessionId: string, userId: string, newTitle: string): Promise<void> => {
  try {
    console.log('✏️ Renaming chat session:', sessionId, 'to:', newTitle);
    
    if (!newTitle || newTitle.trim() === '') {
      throw new Error('Title cannot be empty');
    }
    
    if (supabase && !userId.startsWith('guest_')) {
      const { error } = await supabase
        .from('chat_sessions')
        .update({ 
          title: newTitle.trim(),
          last_updated: new Date().toISOString()
        })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('❌ Error renaming chat session in Supabase:', error);
        throw error;
      } else {
        console.log('✅ Chat session renamed in Supabase');
      }
    }
    
    // Always update localStorage
    renameLocalChatSession(sessionId, userId, newTitle);
  } catch (error) {
    console.error('❌ Error in renameChatSession:', error);
    // Still update localStorage even if Supabase fails
    renameLocalChatSession(sessionId, userId, newTitle);
    throw error;
  }
};

/**
 * Rename chat session in localStorage
 */
const renameLocalChatSession = (sessionId: string, userId: string, newTitle: string): void => {
  try {
    const sessions = getLocalChatSessions(userId);
    const session = sessions.find(s => s.id === sessionId);
    
    if (session) {
      session.title = newTitle.trim();
      session.lastUpdated = Date.now();
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(sessions));
      console.log('✅ Chat session renamed in localStorage');
    }
  } catch (error) {
    console.error('❌ Error renaming local chat session:', error);
  }
};

/**
 * Generate title from first message
 */
export const generateSessionTitle = (messages: Message[]): string => {
  if (messages.length === 0) return 'New Chat';
  
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';
  
  // Get first 50 characters of the message
  const title = firstUserMessage.content.substring(0, 50);
  return title.length < firstUserMessage.content.length ? title + '...' : title;
};

/**
 * Create a new chat session
 */
export const createChatSession = (userId: string, mode: string, messages: Message[]): ChatSession => {
  return {
    id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    title: generateSessionTitle(messages),
    mode: mode as any,
    messages: messages,
    lastUpdated: Date.now(),
    userId: userId
  };
};
