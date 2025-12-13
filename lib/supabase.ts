import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    storage: window.localStorage
  }
});

// Database Types
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          tier: 'free' | 'pro' | 'ultra' | 'guest';
          tokens_used: number;
          images_generated: number;
          theme_color: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          tier?: 'free' | 'pro' | 'ultra' | 'guest';
          tokens_used?: number;
          images_generated?: number;
          theme_color?: string;
        };
        Update: {
          tier?: 'free' | 'pro' | 'ultra' | 'guest';
          tokens_used?: number;
          images_generated?: number;
          theme_color?: string;
        };
      };
      chat_sessions: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          mode: 'single' | 'multi';
          messages: any;
          last_updated: string;
          created_at: string;
        };
        Insert: {
          user_id: string;
          title: string;
          mode: 'single' | 'multi';
          messages: any;
        };
        Update: {
          title?: string;
          messages?: any;
        };
      };
    };
  };
}

// Helper functions
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
      queryParams: {
        access_type: 'offline',
        prompt: 'consent',
      }
    }
  });
  
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentUser = async () => {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error) throw error;
  return user;
};

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', userId)
    .single();
  
  if (error) throw error;
  return data;
};

export const upsertUserProfile = async (profile: Database['public']['Tables']['users']['Insert']) => {
  const { data, error } = await supabase
    .from('users')
    .upsert(profile)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const saveChatSession = async (session: Database['public']['Tables']['chat_sessions']['Insert']) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .insert(session)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const getUserChatSessions = async (userId: string) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .select('*')
    .eq('user_id', userId)
    .order('last_updated', { ascending: false });
  
  if (error) throw error;
  return data;
};

export const updateChatSession = async (
  sessionId: string, 
  updates: Database['public']['Tables']['chat_sessions']['Update']
) => {
  const { data, error } = await supabase
    .from('chat_sessions')
    .update(updates)
    .eq('id', sessionId)
    .select()
    .single();
  
  if (error) throw error;
  return data;
};

export const deleteChatSession = async (sessionId: string) => {
  const { error } = await supabase
    .from('chat_sessions')
    .delete()
    .eq('id', sessionId);
  
  if (error) throw error;
};