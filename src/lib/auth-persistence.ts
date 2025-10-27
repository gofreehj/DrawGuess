'use client'

import { User, Session } from '@supabase/supabase-js'

// Local storage keys for auth persistence
const AUTH_STORAGE_KEYS = {
  USER: 'drawguess_auth_user',
  SESSION: 'drawguess_auth_session',
  LAST_ACTIVITY: 'drawguess_last_activity',
  PREFERENCES: 'drawguess_auth_preferences',
} as const

// Auth preferences interface
export interface AuthPreferences {
  rememberMe: boolean
  autoSignIn: boolean
  sessionTimeout: number // in minutes
}

// Default auth preferences
const DEFAULT_PREFERENCES: AuthPreferences = {
  rememberMe: true,
  autoSignIn: false,
  sessionTimeout: 60 * 24, // 24 hours
}

/**
 * Auth persistence manager for handling local storage of auth state
 */
export class AuthPersistenceManager {
  private static isClient = typeof window !== 'undefined'

  /**
   * Save user data to local storage
   */
  static saveUser(user: User | null): void {
    if (!this.isClient) return

    try {
      if (user) {
        localStorage.setItem(AUTH_STORAGE_KEYS.USER, JSON.stringify(user))
        this.updateLastActivity()
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
      }
    } catch (error) {
      console.error('Error saving user to localStorage:', error)
    }
  }

  /**
   * Get user data from local storage
   */
  static getUser(): User | null {
    if (!this.isClient) return null

    try {
      const userData = localStorage.getItem(AUTH_STORAGE_KEYS.USER)
      if (!userData) return null

      const user = JSON.parse(userData) as User
      
      // Check if session is still valid
      if (this.isSessionExpired()) {
        this.clearAuthData()
        return null
      }

      return user
    } catch (error) {
      console.error('Error getting user from localStorage:', error)
      return null
    }
  }

  /**
   * Save session data to local storage
   */
  static saveSession(session: Session | null): void {
    if (!this.isClient) return

    try {
      if (session) {
        localStorage.setItem(AUTH_STORAGE_KEYS.SESSION, JSON.stringify(session))
        this.updateLastActivity()
      } else {
        localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION)
      }
    } catch (error) {
      console.error('Error saving session to localStorage:', error)
    }
  }

  /**
   * Get session data from local storage
   */
  static getSession(): Session | null {
    if (!this.isClient) return null

    try {
      const sessionData = localStorage.getItem(AUTH_STORAGE_KEYS.SESSION)
      if (!sessionData) return null

      const session = JSON.parse(sessionData) as Session
      
      // Check if session is still valid
      if (this.isSessionExpired()) {
        this.clearAuthData()
        return null
      }

      return session
    } catch (error) {
      console.error('Error getting session from localStorage:', error)
      return null
    }
  }

  /**
   * Save auth preferences
   */
  static savePreferences(preferences: Partial<AuthPreferences>): void {
    if (!this.isClient) return

    try {
      const currentPreferences = this.getPreferences()
      const updatedPreferences = { ...currentPreferences, ...preferences }
      localStorage.setItem(AUTH_STORAGE_KEYS.PREFERENCES, JSON.stringify(updatedPreferences))
    } catch (error) {
      console.error('Error saving auth preferences:', error)
    }
  }

  /**
   * Get auth preferences
   */
  static getPreferences(): AuthPreferences {
    if (!this.isClient) return DEFAULT_PREFERENCES

    try {
      const preferencesData = localStorage.getItem(AUTH_STORAGE_KEYS.PREFERENCES)
      if (!preferencesData) return DEFAULT_PREFERENCES

      const preferences = JSON.parse(preferencesData) as AuthPreferences
      return { ...DEFAULT_PREFERENCES, ...preferences }
    } catch (error) {
      console.error('Error getting auth preferences:', error)
      return DEFAULT_PREFERENCES
    }
  }

  /**
   * Update last activity timestamp
   */
  static updateLastActivity(): void {
    if (!this.isClient) return

    try {
      localStorage.setItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY, Date.now().toString())
    } catch (error) {
      console.error('Error updating last activity:', error)
    }
  }

  /**
   * Check if session is expired based on preferences
   */
  static isSessionExpired(): boolean {
    if (!this.isClient) return true

    try {
      const lastActivity = localStorage.getItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY)
      if (!lastActivity) return true

      const preferences = this.getPreferences()
      const lastActivityTime = parseInt(lastActivity, 10)
      const now = Date.now()
      const sessionTimeoutMs = preferences.sessionTimeout * 60 * 1000 // Convert to milliseconds

      return (now - lastActivityTime) > sessionTimeoutMs
    } catch (error) {
      console.error('Error checking session expiration:', error)
      return true
    }
  }

  /**
   * Clear all auth data from local storage
   */
  static clearAuthData(): void {
    if (!this.isClient) return

    try {
      localStorage.removeItem(AUTH_STORAGE_KEYS.USER)
      localStorage.removeItem(AUTH_STORAGE_KEYS.SESSION)
      localStorage.removeItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY)
    } catch (error) {
      console.error('Error clearing auth data:', error)
    }
  }

  /**
   * Clear all auth-related data including preferences
   */
  static clearAllAuthData(): void {
    if (!this.isClient) return

    try {
      Object.values(AUTH_STORAGE_KEYS).forEach(key => {
        localStorage.removeItem(key)
      })
    } catch (error) {
      console.error('Error clearing all auth data:', error)
    }
  }

  /**
   * Check if user has valid persisted auth data
   */
  static hasValidPersistedAuth(): boolean {
    if (!this.isClient) return false

    const user = this.getUser()
    const session = this.getSession()
    
    return !!(user && session && !this.isSessionExpired())
  }

  /**
   * Get auth state summary for debugging
   */
  static getAuthStateSummary(): {
    hasUser: boolean
    hasSession: boolean
    isExpired: boolean
    lastActivity: string | null
    preferences: AuthPreferences
  } {
    if (!this.isClient) {
      return {
        hasUser: false,
        hasSession: false,
        isExpired: true,
        lastActivity: null,
        preferences: DEFAULT_PREFERENCES
      }
    }

    const lastActivity = localStorage.getItem(AUTH_STORAGE_KEYS.LAST_ACTIVITY)
    
    return {
      hasUser: !!this.getUser(),
      hasSession: !!this.getSession(),
      isExpired: this.isSessionExpired(),
      lastActivity: lastActivity ? new Date(parseInt(lastActivity, 10)).toISOString() : null,
      preferences: this.getPreferences()
    }
  }
}