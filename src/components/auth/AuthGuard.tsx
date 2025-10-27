'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'

interface AuthGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
  requireAuth?: boolean
  redirectTo?: string
}

/**
 * AuthGuard component that protects routes based on authentication status
 */
export function AuthGuard({ 
  children, 
  fallback, 
  requireAuth = true,
  redirectTo 
}: AuthGuardProps) {
  const { isAuthenticated, loading, isSupabaseEnabled } = useAuth()

  // If Supabase is not enabled, render children directly
  if (!isSupabaseEnabled) {
    return <>{children}</>
  }

  // Show loading spinner while checking auth status
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <LoadingSpinner />
      </div>
    )
  }

  // If auth is required but user is not authenticated
  if (requireAuth && !isAuthenticated) {
    if (redirectTo && typeof window !== 'undefined') {
      // Schedule redirect after render to avoid side effects during render
      setTimeout(() => {
        window.location.href = redirectTo
      }, 0)
      return null
    }
    
    return (
      <div className="flex items-center justify-center min-h-screen">
        {fallback || (
          <div className="text-center">
            <h2 className="text-xl font-semibold mb-2">Authentication Required</h2>
            <p className="text-gray-600">Please sign in to access this page.</p>
          </div>
        )}
      </div>
    )
  }

  // If auth is not required or user is authenticated, render children
  return <>{children}</>
}

/**
 * Higher-order component for protecting pages
 */
export function withAuthGuard<P extends object>(
  Component: React.ComponentType<P>,
  options?: Omit<AuthGuardProps, 'children'>
) {
  return function AuthGuardedComponent(props: P) {
    return (
      <AuthGuard {...options}>
        <Component {...props} />
      </AuthGuard>
    )
  }
}

/**
 * Component that only renders children when user is authenticated
 */
export function AuthenticatedOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSupabaseEnabled } = useAuth()
  
  if (!isSupabaseEnabled || !isAuthenticated) {
    return null
  }
  
  return <>{children}</>
}

/**
 * Component that only renders children when user is NOT authenticated
 */
export function UnauthenticatedOnly({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, isSupabaseEnabled } = useAuth()
  
  if (!isSupabaseEnabled) {
    return <>{children}</>
  }
  
  if (loading || isAuthenticated) {
    return null
  }
  
  return <>{children}</>
}