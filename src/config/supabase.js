import { createClient } from '@supabase/supabase-js'

export const SUPABASE_URL = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_URL || import.meta.env?.SUPABASE_URL)) || (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_URL || process.env?.SUPABASE_URL)) || 'https://mchqolkwwthnkkctuple.supabase.co'
export const SUPABASE_ANON_KEY = (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_SUPABASE_ANON_KEY || import.meta.env?.SUPABASE_PUBLISHABLE_KEY)) || (typeof process !== 'undefined' && (process.env?.VITE_SUPABASE_ANON_KEY || process.env?.SUPABASE_PUBLISHABLE_KEY)) || 'sb_publishable_5f0ozrR2Or5aj90m4uwS2A_8IQ5MSnT'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: typeof window !== 'undefined',
    detectSessionInUrl: typeof window !== 'undefined',
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
    storageKey: 'supabase.auth.token'
  }
})

export default supabase
