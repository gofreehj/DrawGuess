import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/supabase'
import { supabaseConfig, validateSupabaseConfig } from '@/lib/supabase-config'

export async function createClient() {
  const validation = validateSupabaseConfig()
  
  if (!validation.isValid) {
    throw new Error(`Supabase server configuration error: ${validation.message}`)
  }

  const cookieStore = await cookies()

  return createServerClient<Database>(
    supabaseConfig.url!,
    supabaseConfig.anonKey!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}