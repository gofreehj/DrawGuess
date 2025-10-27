'use client'

import { useState, useEffect, useCallback } from 'react'
import { AuthPersistenceManager, AuthPreferences } from '@/lib/auth-persistence'

/**
 * Hook for managing authentication preferences
 */
export function useAuthPreferences() {
  const [preferences, setPreferences] = useState<AuthPreferences>(() => 
    AuthPersistenceManager.getPreferences()
  )

  // Load preferences on mount
  useEffect(() => {
    const loadedPreferences = AuthPersistenceManager.getPreferences()
    // Only update if preferences are different to avoid unnecessary re-renders
    if (JSON.stringify(loadedPreferences) !== JSON.stringify(preferences)) {
      setPreferences(loadedPreferences)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Update preferences
  const updatePreferences = useCallback((updates: Partial<AuthPreferences>) => {
    const newPreferences = { ...preferences, ...updates }
    setPreferences(newPreferences)
    AuthPersistenceManager.savePreferences(updates)
  }, [preferences])

  // Reset preferences to defaults
  const resetPreferences = useCallback(() => {
    const defaultPreferences = AuthPersistenceManager.getPreferences()
    setPreferences(defaultPreferences)
    AuthPersistenceManager.savePreferences(defaultPreferences)
  }, [])

  // Individual preference setters for convenience
  const setRememberMe = useCallback((rememberMe: boolean) => {
    updatePreferences({ rememberMe })
  }, [updatePreferences])

  const setAutoSignIn = useCallback((autoSignIn: boolean) => {
    updatePreferences({ autoSignIn })
  }, [updatePreferences])

  const setSessionTimeout = useCallback((sessionTimeout: number) => {
    updatePreferences({ sessionTimeout })
  }, [updatePreferences])

  return {
    preferences,
    updatePreferences,
    resetPreferences,
    setRememberMe,
    setAutoSignIn,
    setSessionTimeout,
  }
}