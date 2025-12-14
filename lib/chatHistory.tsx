import { ChatSession, Message } from '../types';
import { supabase } from './supabase';

const STORAGE_KEY = 'jainn_chat_sessions';

/**
 * Get all chat sessions for a user
 */
export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    if (supabase && !userId.startsWith('guest_')) {
      // Try to get from Supabase
      const { data, error } = await supabase
        .from('chat_sessions')
        .select('*')
        .eq('user_id', userId)
        .order('last_updated', { ascending: false });

      if (error) {
        console.error('Error fetching chat sessions:', error);
        return getLocalChatSessions(userId);
      }

      return data.map(session => ({
        id: session.id,
        title: session.title,
        mode: session.mode,
        messages: JSON.parse(session.messages || '[]'),
        lastUpdated: new Date(session.last_updated).getTime(),
        userId: session.user_id
      }));
    } else {
      // Get from localStorage for guest users
      return getLocalChatSessions(userId);
    }
  } catch (error) {
    console.error('Error in getChatSessions:', error);
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
    return JSON.parse(stored);
  } catch (error) {
    console.error('Error parsing local chat sessions:', error);
    return [];
  }
};

/**
 * Save a chat session
 */
export const saveChatSession = async (session: ChatSession): Promise<void> => {
  try {
    if (supabase && !session.userId.startsWith('guest_')) {
      // Save to Supabase
      const { error } = await supabase
        .from('chat_sessions')
        .upsert({
          id: session.id,
          user_id: session.userId,
          title: session.title,
          mode: session.mode,
          messages: JSON.stringify(session.messages),
          last_updated: new Date(session.lastUpdated).toISOString()
        });

      if (error) {
        console.error('Error saving chat session to Supabase:', error);
        saveLocalChatSession(session);
      }
    } else {
      // Save to localStorage
      saveLocalChatSession(session);
    }
  } catch (error) {
    console.error('Error in saveChatSession:', error);
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

    // Keep only last 50 sessions
    const trimmedSessions = sessions.slice(0, 50);
    localStorage.setItem(`${STORAGE_KEY}_${session.userId}`, JSON.stringify(trimmedSessions));
  } catch (error) {
    console.error('Error saving local chat session:', error);
  }
};

/**
 * Delete a chat session
 */
export const deleteChatSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    if (supabase && !userId.startsWith('guest_')) {
      // Delete from Supabase
      const { error } = await supabase
        .from('chat_sessions')
        .delete()
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting chat session from Supabase:', error);
        deleteLocalChatSession(sessionId, userId);
      }
    } else {
      // Delete from localStorage
      deleteLocalChatSession(sessionId, userId);
    }
  } catch (error) {
    console.error('Error in deleteChatSession:', error);
    deleteLocalChatSession(sessionId, userId);
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
  } catch (error) {
    console.error('Error deleting local chat session:', error);
  }
};

/**
 * Rename a chat session
 */
export const renameChatSession = async (sessionId: string, userId: string, newTitle: string): Promise<void> => {
  try {
    if (supabase && !userId.startsWith('guest_')) {
      // Update in Supabase
      const { error } = await supabase
        .from('chat_sessions')
        .update({ title: newTitle })
        .eq('id', sessionId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error renaming chat session in Supabase:', error);
        renameLocalChatSession(sessionId, userId, newTitle);
      }
    } else {
      // Update in localStorage
      renameLocalChatSession(sessionId, userId, newTitle);
    }
  } catch (error) {
    console.error('Error in renameChatSession:', error);
    renameLocalChatSession(sessionId, userId, newTitle);
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
      session.title = newTitle;
      localStorage.setItem(`${STORAGE_KEY}_${userId}`, JSON.stringify(sessions));
    }
  } catch (error) {
    console.error('Error renaming local chat session:', error);
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
