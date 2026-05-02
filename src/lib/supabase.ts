import { createClient } from '@supabase/supabase-js';

const supabaseUrl = localStorage.getItem('SUPABASE_URL') || import.meta.env.VITE_SUPABASE_URL || "https://oqasfkyqixzvgosfoedz.supabase.co";
const supabaseAnonKey = localStorage.getItem('SUPABASE_ANON_KEY') || import.meta.env.VITE_SUPABASE_ANON_KEY || "sb_publishable_M6CMAh4mkjOF1M8tlakgrg_znf0k0NC";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Supabase URL o Anon Key no configurada. El sistema usará memoria local.');
}

export const isSupabaseConfigured = !!(supabaseUrl && supabaseAnonKey && !supabaseUrl.includes('placeholder'));

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder'
);
