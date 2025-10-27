import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/types/supabase'
import { supabaseConfig, validateSupabaseConfig } from '@/lib/supabase-config'

export function createClient() {
  const validation = validateSupabaseConfig()
  
  if (!validation.isValid) {
    throw new Error(`Supabase client configuration error: ${validation.message}`)
  }

  return createBrowserClient<Database>(
    supabaseConfig.url!,
    supabaseConfig.anonKey!,
    {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    }
  )
}