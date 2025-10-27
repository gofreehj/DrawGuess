import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import { supabaseConfig, validateSupabaseConfig } from '@/lib/supabase-config'

/**
 * Creates a Supabase client with service role key for server-side operations
 * that require elevated permissions (bypassing RLS)
 * 
 * WARNING: Only use this on the server side and never expose the service role key to the client
 */
export function createServiceRoleClient() {
  const validation = validateSupabaseConfig()
  
  if (!validation.isValid) {
    throw new Error(`Supabase service role configuration error: ${validation.message}`)
  }

  if (!supabaseConfig.serviceRoleKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is required for service role operations')
  }

  return createClient<Database>(
    supabaseConfig.url!,
    supabaseConfig.serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}