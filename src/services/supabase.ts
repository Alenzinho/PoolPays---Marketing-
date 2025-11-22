import { createClient } from '@supabase/supabase-js';

// Types for Database mapping
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          user_id: string
          code: string | null
          title: string
          status: string
          owner: string
          category: string | null
          demand_type: string | null
          deadline: string | null
          week: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          code?: string | null
          title: string
          status: string
          owner: string
          category?: string | null
          demand_type?: string | null
          deadline?: string | null
          week?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          code?: string | null
          title?: string
          status?: string
          owner?: string
          category?: string | null
          demand_type?: string | null
          deadline?: string | null
          week?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      // Simplified definitions for other tables as they are mostly helpers
    }
  }
}

const supabaseUrl = (import.meta as any).env.VITE_SUPABASE_URL;
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn("⚠️ Supabase Environment Variables missing. Please check .env.local");
}

export const supabase = createClient<Database>(
  supabaseUrl || '', 
  supabaseAnonKey || ''
);

// Auth Helper
export const ensureAuth = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    console.log("🔄 No session found. Signing in anonymously...");
    const { error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.error("Auth Error:", error);
      throw error;
    }
  }
  
  return (await supabase.auth.getUser()).data.user;
};