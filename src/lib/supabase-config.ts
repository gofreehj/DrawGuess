// Supabase configuration and validation
export const supabaseConfig = {
  url: process.env.NEXT_PUBLIC_SUPABASE_URL,
  anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  enableSupabase: process.env.NEXT_PUBLIC_ENABLE_SUPABASE === 'true',
}

// Debug: Log configuration on startup
console.log('🔧 Supabase Config Debug:', {
  enableSupabase: supabaseConfig.enableSupabase,
  hasUrl: !!supabaseConfig.url,
  hasAnonKey: !!supabaseConfig.anonKey,
  hasServiceKey: !!supabaseConfig.serviceRoleKey,
  rawEnvValue: process.env.NEXT_PUBLIC_ENABLE_SUPABASE
});

// Validate required Supabase environment variables
export function validateSupabaseConfig() {
  if (!supabaseConfig.enableSupabase) {
    return { isValid: false, message: 'Supabase is disabled' }
  }

  if (!supabaseConfig.url) {
    return { 
      isValid: false, 
      message: 'NEXT_PUBLIC_SUPABASE_URL is required when Supabase is enabled' 
    }
  }

  if (!supabaseConfig.anonKey) {
    return { 
      isValid: false, 
      message: 'NEXT_PUBLIC_SUPABASE_ANON_KEY is required when Supabase is enabled' 
    }
  }

  // Validate URL format
  try {
    new URL(supabaseConfig.url)
  } catch {
    return { 
      isValid: false, 
      message: 'NEXT_PUBLIC_SUPABASE_URL must be a valid URL' 
    }
  }

  return { isValid: true, message: 'Supabase configuration is valid' }
}

// Check if Supabase is available and configured
export function isSupabaseEnabled(): boolean {
  const validation = validateSupabaseConfig()
  return validation.isValid
}