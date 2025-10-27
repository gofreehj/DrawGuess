'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'

export interface AuthFormProps {
  mode: 'signin' | 'signup'
  onSuccess?: () => void
  onModeChange: (mode: 'signin' | 'signup') => void
  className?: string
}

interface AuthFormState {
  email: string
  password: string
  confirmPassword: string
  displayName: string
  loading: boolean
  error: string | null
  success: string | null
}

const authErrorMessages: Record<string, string> = {
  'invalid_credentials': '邮箱或密码错误',
  'email_not_confirmed': '请先验证您的邮箱地址',
  'signup_disabled': '注册功能暂时关闭',
  'weak_password': '密码强度不够，请使用至少6个字符',
  'email_already_exists': '该邮箱已被注册',
  'invalid_email': '请输入有效的邮箱地址',
  'password_mismatch': '两次输入的密码不一致',
  'missing_email': '请输入邮箱地址',
  'missing_password': '请输入密码',
  'missing_display_name': '请输入显示名称',
}

export default function AuthForm({ mode, onSuccess, onModeChange, className = '' }: AuthFormProps) {
  const { signIn, signUp, isSupabaseEnabled } = useAuth()
  
  const [formState, setFormState] = useState<AuthFormState>({
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    loading: false,
    error: null,
    success: null,
  })

  const updateField = (field: keyof AuthFormState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      error: null, // Clear error when user starts typing
      success: null,
    }))
  }

  const validateForm = (): string | null => {
    const { email, password, confirmPassword, displayName } = formState

    if (!email.trim()) {
      return 'missing_email'
    }

    if (!password) {
      return 'missing_password'
    }

    if (mode === 'signup') {
      if (!displayName.trim()) {
        return 'missing_display_name'
      }

      if (password !== confirmPassword) {
        return 'password_mismatch'
      }

      if (password.length < 6) {
        return 'weak_password'
      }
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return 'invalid_email'
    }

    return null
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!isSupabaseEnabled) {
      setFormState(prev => ({
        ...prev,
        error: 'Supabase authentication is not enabled'
      }))
      return
    }

    const validationError = validateForm()
    if (validationError) {
      setFormState(prev => ({
        ...prev,
        error: authErrorMessages[validationError] || validationError
      }))
      return
    }

    setFormState(prev => ({ ...prev, loading: true, error: null, success: null }))

    try {
      const { email, password, displayName } = formState

      if (mode === 'signin') {
        const { error } = await signIn(email, password)
        
        if (error) {
          setFormState(prev => ({
            ...prev,
            loading: false,
            error: authErrorMessages[error.message] || error.message
          }))
        } else {
          setFormState(prev => ({
            ...prev,
            loading: false,
            success: '登录成功！'
          }))
          onSuccess?.()
        }
      } else {
        const { error } = await signUp(email, password, { displayName })
        
        if (error) {
          setFormState(prev => ({
            ...prev,
            loading: false,
            error: authErrorMessages[error.message] || error.message
          }))
        } else {
          setFormState(prev => ({
            ...prev,
            loading: false,
            success: '注册成功！请检查您的邮箱以验证账户。'
          }))
          // Don't call onSuccess for signup since user needs to verify email
        }
      }
    } catch (error) {
      console.error('Auth form error:', error)
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: '发生未知错误，请稍后重试'
      }))
    }
  }

  const isSignUp = mode === 'signup'
  const { email, password, confirmPassword, displayName, loading, error, success } = formState

  if (!isSupabaseEnabled) {
    return (
      <div className={`bg-yellow-50 border border-yellow-200 rounded-lg p-4 ${className}`}>
        <div className="flex items-center">
          <div className="text-yellow-600 mr-2">⚠️</div>
          <div>
            <h3 className="text-sm font-medium text-yellow-800">认证功能未启用</h3>
            <p className="text-sm text-yellow-700 mt-1">
              Supabase 认证功能当前未启用。请联系管理员启用此功能。
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {isSignUp ? '创建账户' : '登录账户'}
        </h2>
        <p className="text-gray-600 mt-2">
          {isSignUp 
            ? '注册以保存您的游戏进度和历史记录' 
            : '登录以访问您的个人游戏数据'
          }
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Display Name (Sign Up Only) */}
        {isSignUp && (
          <div>
            <label htmlFor="displayName" className="block text-sm font-medium text-gray-700 mb-1">
              显示名称
            </label>
            <input
              type="text"
              id="displayName"
              value={displayName}
              onChange={(e) => updateField('displayName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="输入您的显示名称"
              disabled={loading}
              required={isSignUp}
            />
          </div>
        )}

        {/* Email */}
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            邮箱地址
          </label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => updateField('email', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="输入您的邮箱地址"
            disabled={loading}
            required
          />
        </div>

        {/* Password */}
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            密码
          </label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => updateField('password', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder={isSignUp ? "至少6个字符" : "输入您的密码"}
            disabled={loading}
            required
            minLength={isSignUp ? 6 : undefined}
          />
        </div>

        {/* Confirm Password (Sign Up Only) */}
        {isSignUp && (
          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
              确认密码
            </label>
            <input
              type="password"
              id="confirmPassword"
              value={confirmPassword}
              onChange={(e) => updateField('confirmPassword', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="再次输入密码"
              disabled={loading}
              required={isSignUp}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center">
              <div className="text-red-500 mr-2">❌</div>
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {success && (
          <div className="bg-green-50 border border-green-200 rounded-md p-3">
            <div className="flex items-center">
              <div className="text-green-500 mr-2">✅</div>
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        >
          {loading ? (
            <div className="flex items-center justify-center">
              <LoadingSpinner size="sm" />
              <span className="ml-2">
                {isSignUp ? '注册中...' : '登录中...'}
              </span>
            </div>
          ) : (
            isSignUp ? '创建账户' : '登录'
          )}
        </button>

        {/* Mode Switch */}
        <div className="text-center pt-4 border-t border-gray-200">
          <p className="text-sm text-gray-600">
            {isSignUp ? '已有账户？' : '还没有账户？'}
            <button
              type="button"
              onClick={() => onModeChange(isSignUp ? 'signin' : 'signup')}
              className="ml-1 text-blue-600 hover:text-blue-700 font-medium focus:outline-none focus:underline"
              disabled={loading}
            >
              {isSignUp ? '立即登录' : '立即注册'}
            </button>
          </p>
        </div>
      </form>
    </div>
  )
}