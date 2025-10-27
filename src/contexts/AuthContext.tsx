'use client'

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react'
import { User, Session, AuthError, AuthResponse } from '@supabase/supabase-js'
import { getSupabaseClient, isSupabaseAvailable } from '@/lib/supabase-client-browser'
import { AuthPersistenceManager } from '@/lib/auth-persistence'
// Sync service will be imported dynamically when needed
// Database type is used in the Supabase client type definitions

// Auth context type definition
export interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  isAuthenticated: boolean
  signIn: (email: string, password: string) => Promise<AuthResponse>
  signUp: (email: string, password: string, options?: { displayName?: string }) => Promise<AuthResponse>
  signOut: () => Promise<{ error: AuthError | null }>
  resetPassword: (email: string) => Promise<{ error: AuthError | null }>
  updateProfile: (updates: { displayName?: string; avatarUrl?: string }) => Promise<{ error: AuthError | null }>
  refreshSession: () => Promise<void>
  isSupabaseEnabled: boolean
}

// Create the auth context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider props
export interface AuthProviderProps {
  children: React.ReactNode
}

// Auth provider component
export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [supabaseEnabled] = useState(() => isSupabaseAvailable())

  // Initialize auth state
  useEffect(() => {
    if (!supabaseEnabled) {
      setLoading(false)
      return
    }

    let mounted = true

    async function getInitialSession() {
      try {
        const supabase = getSupabaseClient()
        
        // First, try to get persisted auth data
        const persistedUser = AuthPersistenceManager.getUser()
        const persistedSession = AuthPersistenceManager.getSession()
        
        if (persistedUser && persistedSession && !AuthPersistenceManager.isSessionExpired()) {
          console.log('Restored auth state from persistence')
          if (mounted) {
            setUser(persistedUser)
            setSession(persistedSession)
          }
        }
        
        // Get current session from Supabase
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (mounted) {
          if (error) {
            console.error('Error getting initial session:', error)
            // Clear persisted data if there's an error
            AuthPersistenceManager.clearAuthData()
          } else {
            setSession(session)
            setUser(session?.user ?? null)
            
            // Update persistence with fresh data
            AuthPersistenceManager.saveUser(session?.user ?? null)
            AuthPersistenceManager.saveSession(session)
          }
          setLoading(false)
        }
      } catch (error) {
        console.error('Error initializing auth:', error)
        if (mounted) {
          AuthPersistenceManager.clearAuthData()
          setLoading(false)
        }
      }
    }

    getInitialSession()

    return () => {
      mounted = false
    }
  }, [supabaseEnabled])

  // Set up auth state listener
  useEffect(() => {
    if (!supabaseEnabled) return

    const supabase = getSupabaseClient()
    
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id)
      
      setSession(session)
      setUser(session?.user ?? null)
      
      // Update persistence
      AuthPersistenceManager.saveUser(session?.user ?? null)
      AuthPersistenceManager.saveSession(session)
      
      // Handle specific auth events
      switch (event) {
        case 'SIGNED_IN':
          console.log('User signed in:', session?.user?.email)
          AuthPersistenceManager.updateLastActivity()
          // Start data sync when user signs in
          try {
            const { syncService } = await import('@/lib/sync-service')
            await syncService.startSync({
              resolveConflicts: 'merge',
              batchSize: 50
            })
            console.log('✅ Data sync started for authenticated user')
          } catch (error) {
            console.error('❌ Failed to start data sync:', error)
          }
          break
        case 'SIGNED_OUT':
          console.log('User signed out')
          AuthPersistenceManager.clearAuthData()
          // Stop data sync when user signs out
          try {
            const { syncService } = await import('@/lib/sync-service')
            await syncService.stopSync()
            console.log('🛑 Data sync stopped')
          } catch (error) {
            console.error('❌ Failed to stop data sync:', error)
          }
          break
        case 'TOKEN_REFRESHED':
          console.log('Token refreshed')
          AuthPersistenceManager.updateLastActivity()
          break
        case 'USER_UPDATED':
          console.log('User updated')
          AuthPersistenceManager.updateLastActivity()
          break
      }
      
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [supabaseEnabled])

  // Sign in function
  const signIn = useCallback(async (email: string, password: string): Promise<AuthResponse> => {
    if (!supabaseEnabled) {
      return {
        data: { user: null, session: null },
        error: { name: 'AuthError', message: 'Supabase authentication is not enabled' } as AuthError
      }
    }

    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      const response = await supabase.auth.signInWithPassword({
        email,
        password,
      })
      
      return response
    } catch (error) {
      console.error('Sign in error:', error)
      return {
        data: { user: null, session: null },
        error: error as AuthError
      }
    } finally {
      setLoading(false)
    }
  }, [supabaseEnabled])

  // Sign up function
  const signUp = useCallback(async (
    email: string, 
    password: string, 
    options?: { displayName?: string }
  ): Promise<AuthResponse> => {
    if (!supabaseEnabled) {
      return {
        data: { user: null, session: null },
        error: { name: 'AuthError', message: 'Supabase authentication is not enabled' } as AuthError
      }
    }

    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      const response = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: options?.displayName || null,
          }
        }
      })
      
      return response
    } catch (error) {
      console.error('Sign up error:', error)
      return {
        data: { user: null, session: null },
        error: error as AuthError
      }
    } finally {
      setLoading(false)
    }
  }, [supabaseEnabled])

  // Sign out function
  const signOut = useCallback(async () => {
    if (!supabaseEnabled) {
      return { error: { name: 'AuthError', message: 'Supabase authentication is not enabled' } as AuthError }
    }

    try {
      setLoading(true)
      const supabase = getSupabaseClient()
      
      const { error } = await supabase.auth.signOut()
      
      if (!error) {
        setUser(null)
        setSession(null)
      }
      
      return { error }
    } catch (error) {
      console.error('Sign out error:', error)
      return { error: error as AuthError }
    } finally {
      setLoading(false)
    }
  }, [supabaseEnabled])

  // Reset password function
  const resetPassword = useCallback(async (email: string) => {
    if (!supabaseEnabled) {
      return { error: { name: 'AuthError', message: 'Supabase authentication is not enabled' } as AuthError }
    }

    try {
      const supabase = getSupabaseClient()
      
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      })
      
      return { error }
    } catch (error) {
      console.error('Reset password error:', error)
      return { error: error as AuthError }
    }
  }, [supabaseEnabled])

  // Update profile function
  const updateProfile = useCallback(async (updates: { displayName?: string; avatarUrl?: string }) => {
    if (!supabaseEnabled || !user) {
      return { error: { name: 'AuthError', message: 'User not authenticated or Supabase not enabled' } as AuthError }
    }

    try {
      const supabase = getSupabaseClient()
      
      const { error } = await supabase.auth.updateUser({
        data: {
          display_name: updates.displayName,
          avatar_url: updates.avatarUrl,
        }
      })
      
      return { error }
    } catch (error) {
      console.error('Update profile error:', error)
      return { error: error as AuthError }
    }
  }, [supabaseEnabled, user])

  // Refresh session function
  const refreshSession = useCallback(async () => {
    if (!supabaseEnabled) return

    try {
      const supabase = getSupabaseClient()
      const { error } = await supabase.auth.refreshSession()
      
      if (error) {
        console.error('Refresh session error:', error)
      }
    } catch (error) {
      console.error('Refresh session error:', error)
    }
  }, [supabaseEnabled])

  // Context value
  const value: AuthContextType = {
    user,
    session,
    loading,
    isAuthenticated: !!user,
    signIn,
    signUp,
    signOut,
    resetPassword,
    updateProfile,
    refreshSession,
    isSupabaseEnabled: supabaseEnabled,
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}

// Custom hook to use auth context
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext)
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  
  return context
}

// Helper hooks for common use cases
export function useUser() {
  const { user, loading } = useAuth()
  return { user, loading }
}

export function useSession() {
  const { session, loading } = useAuth()
  return { session, loading }
}

export function useAuthActions() {
  const { signIn, signUp, signOut, resetPassword, updateProfile, refreshSession } = useAuth()
  return { signIn, signUp, signOut, resetPassword, updateProfile, refreshSession }
}