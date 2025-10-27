import { createClient } from '@/utils/supabase/client'
import { isSupabaseEnabled } from '@/lib/supabase-config'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Browser-only Supabase client manager
 * This version only includes client-side functionality to avoid server imports
 */
export class BrowserSupabaseClientManager {
  private static browserClient: SupabaseClient<Database> | null = null
  
  /**
   * Get browser client (client-side only)
   */
  static getBrowserClient(): SupabaseClient<Database> {
    if (!isSupabaseEnabled()) {
      throw new Error('Supabase is not enabled or configured properly')
    }
    
    if (typeof window === 'undefined') {
      throw new Error('Browser client can only be used on the client side')
    }
    
    if (!this.browserClient) {
      this.browserClient = createClient()
    }
    
    return this.browserClient
  }
  
  /**
   * Check if Supabase is available and properly configured
   */
  static isAvailable(): boolean {
    return isSupabaseEnabled()
  }
  
  /**
   * Reset browser client (useful for testing or when switching configurations)
   */
  static resetBrowserClient(): void {
    this.browserClient = null
  }
}

// Export convenience functions for common use cases
export const getSupabaseClient = () => BrowserSupabaseClientManager.getBrowserClient()
export const isSupabaseAvailable = () => BrowserSupabaseClientManager.isAvailable()