import { supabase } from './supabase';
import { ChatSession, Message, ChatMode } from '../types';

/**
 * Save or update a chat session
 */
export const saveChatSession = async (
  userId: string,
  sessionId: string,
  title: string,
  mode: ChatMode,
  messages: Message[]
): Promise<void> => {
  try {
    // For guest users, save to localStorage
    if (userId.startsWith('guest_')) {
      const sessions = getLocalChatSessions(userId);
      const existingIndex = sessions.findIndex(s => s.id === sessionId);
      
      const session: ChatSession = {
        id: sessionId,
        userId,
        title,
        mode,
        messages,
        lastUpdated: Date.now()
      };

      if (existingIndex >= 0) {
        sessions[existingIndex] = session;
      } else {
        sessions.push(session);
      }

      // Keep only last 50 sessions for guest users
      const limitedSessions = sessions.slice(-50);
      localStorage.setItem(`jainn_chat_sessions_${userId}`, JSON.stringify(limitedSessions));
      return;
    }

    // For authenticated users, save to Supabase
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('chat_sessions')
      .upsert({
        id: sessionId,
        user_id: userId,
        title,
        mode,
        messages: JSON.stringify(messages),
        last_updated: new Date().toISOString()
      });

    if (error) throw error;
  } catch (error) {
    console.error('Error saving chat session:', error);
    throw error;
  }
};

/**
 * Get all chat sessions for a user
 */
export const getChatSessions = async (userId: string): Promise<ChatSession[]> => {
  try {
    // For guest users, get from localStorage
    if (userId.startsWith('guest_')) {
      return getLocalChatSessions(userId);
    }

    // For authenticated users, get from Supabase
    if (!supabase) {
      return [];
    }

    const { data, error } = await supabase
      .from('chat_sessions')
      .select('*')
      .eq('user_id', userId)
      .order('last_updated', { ascending: false });

    if (error) throw error;

    return (data || []).map(session => ({
      id: session.id,
      userId: session.user_id,
      title: session.title,
      mode: session.mode as ChatMode,
      messages: JSON.parse(session.messages),
      lastUpdated: new Date(session.last_updated).getTime()
    }));
  } catch (error) {
    console.error('Error fetching chat sessions:', error);
    return [];
  }
};

/**
 * Delete a chat session
 */
export const deleteChatSession = async (sessionId: string, userId: string): Promise<void> => {
  try {
    // For guest users
    if (userId.startsWith('guest_')) {
      const sessions = getLocalChatSessions(userId);
      const filtered = sessions.filter(s => s.id !== sessionId);
      localStorage.setItem(`jainn_chat_sessions_${userId}`, JSON.stringify(filtered));
      return;
    }

    // For authenticated users
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('chat_sessions')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error deleting chat session:', error);
    throw error;
  }
};

/**
 * Rename a chat session
 */
export const renameChatSession = async (
  sessionId: string,
  userId: string,
  newTitle: string
): Promise<void> => {
  try {
    // For guest users
    if (userId.startsWith('guest_')) {
      const sessions = getLocalChatSessions(userId);
      const session = sessions.find(s => s.id === sessionId);
      if (session) {
        session.title = newTitle;
        session.lastUpdated = Date.now();
        localStorage.setItem(`jainn_chat_sessions_${userId}`, JSON.stringify(sessions));
      }
      return;
    }

    // For authenticated users
    if (!supabase) {
      throw new Error('Supabase not configured');
    }

    const { error } = await supabase
      .from('chat_sessions')
      .update({ 
        title: newTitle,
        last_updated: new Date().toISOString()
      })
      .eq('id', sessionId)
      .eq('user_id', userId);

    if (error) throw error;
  } catch (error) {
    console.error('Error renaming chat session:', error);
    throw error;
  }
};

/**
 * Generate a smart title from the first user message
 */
export const generateChatTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find(m => m.role === 'user');
  if (!firstUserMessage) return 'New Chat';

  const content = firstUserMessage.content.trim();
  if (content.length <= 40) return content;

  // Extract first sentence or 40 characters
  const firstSentence = content.split(/[.!?]/)[0];
  if (firstSentence.length <= 40) return firstSentence;

  return content.substring(0, 37) + '...';
};

/**
 * Helper: Get chat sessions from localStorage
 */
function getLocalChatSessions(userId: string): ChatSession[] {
  try {
    const data = localStorage.getItem(`jainn_chat_sessions_${userId}`);
    return data ? JSON.parse(data) : [];
  } catch (error) {
    console.error('Error parsing local chat sessions:', error);
    return [];
  }
}
