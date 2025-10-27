import { isSupabaseEnabled } from '@/lib/supabase-config'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'

/**
 * Supabase client manager that provides different client types based on context
 */
export class SupabaseClientManager {
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
      // Dynamic import to avoid bundling in server components
      const { createClient } = require('@/utils/supabase/client')
      this.browserClient = createClient()
    }
    
    if (!this.browserClient) {
      throw new Error('Failed to create Supabase client')
    }
    
    return this.browserClient
  }
  
  /**
   * Get server client (server-side only)
   * Note: This method should not be used in client-side code
   */
  static async getServerClient(): Promise<SupabaseClient<Database>> {
    if (!isSupabaseEnabled()) {
      throw new Error('Supabase is not enabled or configured properly')
    }
    
    if (typeof window !== 'undefined') {
      throw new Error('Server client can only be used on the server side')
    }
    
    // Dynamic import to avoid bundling server code in client
    const { createClient } = await import('@/utils/supabase/server')
    return await createClient()
  }
  
  /**
   * Get service role client (server-side only, elevated permissions)
   */
  static getServiceRoleClient(): SupabaseClient<Database> {
    if (!isSupabaseEnabled()) {
      throw new Error('Supabase is not enabled or configured properly')
    }
    
    if (typeof window !== 'undefined') {
      throw new Error('Service role client can only be used on the server side')
    }
    
    // Dynamic import to avoid bundling in client components
    const { createServiceRoleClient } = require('@/utils/supabase/service-role')
    return createServiceRoleClient()
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
export const getSupabaseClient = () => SupabaseClientManager.getBrowserClient()
export const getSupabaseServerClient = () => SupabaseClientManager.getServerClient()
export const getSupabaseServiceClient = () => SupabaseClientManager.getServiceRoleClient()
export const isSupabaseAvailable = () => SupabaseClientManager.isAvailable()