import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Only create client if both values exist AND are not empty or 'undefined' strings
export const supabase = (
  supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'undefined' && 
  supabaseAnonKey !== 'undefined' &&
  supabaseUrl.length > 0 &&
  supabaseAnonKey.length > 0
) 
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        storage: window.localStorage
      }
    })
  : null;

// Helper to check if Supabase is configured
export const isSupabaseConfigured = () => !!supabase;

// Get current user
export const getCurrentUser = async () => {
  if (!supabase) return null;
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Get user profile from database
export const getUserProfile = async (userId: string) => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();
    
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 = not found
    return data;
  } catch (error) {
    console.error('Error getting user profile:', error);
    return null;
  }
};

// Upsert user profile
export const upsertUserProfile = async (profile: any) => {
  if (!supabase) return null;
  
  try {
    const { data, error } = await supabase
      .from('users')
      .upsert(profile)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error upserting user profile:', error);
    return null;
  }
};

// Sign in with Google
export const signInWithGoogle = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured. Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env.local file.');
  }
  
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`
      }
    });
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error signing in with Google:', error);
    throw error;
  }
};
