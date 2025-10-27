'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'
import { getSupabaseClient } from '@/lib/supabase-client-browser'

interface ResetPasswordState {
  password: string
  confirmPassword: string
  loading: boolean
  error: string | null
  success: boolean
}

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isSupabaseEnabled } = useAuth()
  
  const [formState, setFormState] = useState<ResetPasswordState>({
    password: '',
    confirmPassword: '',
    loading: false,
    error: null,
    success: false,
  })

  const [validatingToken, setValidatingToken] = useState(true)
  const [tokenValid, setTokenValid] = useState(false)

  // Validate the reset token on page load
  useEffect(() => {
    const validateResetToken = async () => {
      if (!isSupabaseEnabled) {
        setValidatingToken(false)
        return
      }

      try {
        const accessToken = searchParams.get('access_token')
        const refreshToken = searchParams.get('refresh_token')
        
        if (!accessToken || !refreshToken) {
          setFormState(prev => ({
            ...prev,
            error: '无效的重置链接。请重新申请密码重置。'
          }))
          setValidatingToken(false)
          return
        }

        const supabase = getSupabaseClient()
        
        // Set the session with the tokens from the URL
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        })

        if (error) {
          setFormState(prev => ({
            ...prev,
            error: '重置链接已过期或无效。请重新申请密码重置。'
          }))
        } else {
          setTokenValid(true)
        }
      } catch (error) {
        console.error('Token validation error:', error)
        setFormState(prev => ({
          ...prev,
          error: '验证重置链接时发生错误。请重新申请密码重置。'
        }))
      } finally {
        setValidatingToken(false)
      }
    }

    validateResetToken()
  }, [searchParams, isSupabaseEnabled])

  const updateField = (field: keyof ResetPasswordState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      error: null,
    }))
  }

  const validateForm = (): string | null => {
    const { password, confirmPassword } = formState

    if (!password) {
      return '请输入新密码'
    }

    if (password.length < 6) {
      return '密码至少需要6个字符'
    }

    if (password !== confirmPassword) {
      return '两次输入的密码不一致'
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
        error: validationError
      }))
      return
    }

    setFormState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const supabase = getSupabaseClient()
      
      const { error } = await supabase.auth.updateUser({
        password: formState.password
      })
      
      if (error) {
        setFormState(prev => ({
          ...prev,
          loading: false,
          error: error.message || '更新密码失败，请稍后重试'
        }))
      } else {
        setFormState(prev => ({
          ...prev,
          loading: false,
          success: true,
        }))
        
        // Redirect to sign in page after a short delay
        setTimeout(() => {
          router.push('/auth/signin')
        }, 3000)
      }
    } catch (error) {
      console.error('Reset password error:', error)
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: '发生未知错误，请稍后重试'
      }))
    }
  }

  const { password, confirmPassword, loading, error, success } = formState

  if (!isSupabaseEnabled) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full">
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="text-yellow-600 mr-3 text-2xl">⚠️</div>
                <div>
                  <h3 className="text-lg font-medium text-yellow-800">认证功能未启用</h3>
                  <p className="text-sm text-yellow-700 mt-1">
                    Supabase 认证功能当前未启用。请联系管理员启用此功能。
                  </p>
                </div>
              </div>
              <div className="mt-4">
                <Link
                  href="/"
                  className="text-sm text-blue-600 hover:text-blue-700"
                >
                  返回游戏
                </Link>
              </div>
            </div>
          </div>
        </div>
      </Layout>
    )
  }

  // Show loading while validating token
  if (validatingToken) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">验证重置链接...</p>
          </div>
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Back Link */}
          <div className="text-center">
            <Link 
              href="/auth/signin"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回登录
            </Link>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            {!tokenValid ? (
              // Invalid Token State
              <div className="text-center">
                <div className="text-red-500 text-4xl mb-4">❌</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  重置链接无效
                </h2>
                <p className="text-gray-600 mb-6">
                  {error || '重置链接已过期或无效。请重新申请密码重置。'}
                </p>
                <div className="space-y-3">
                  <Link
                    href="/auth/forgot-password"
                    className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-center"
                  >
                    重新申请重置
                  </Link>
                  <Link
                    href="/auth/signin"
                    className="block w-full text-gray-600 hover:text-gray-900 text-sm"
                  >
                    返回登录
                  </Link>
                </div>
              </div>
            ) : success ? (
              // Success State
              <div className="text-center">
                <div className="text-green-500 text-4xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  密码重置成功
                </h2>
                <p className="text-gray-600 mb-6">
                  您的密码已成功更新。正在跳转到登录页面...
                </p>
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2 text-sm text-gray-600">3秒后自动跳转</span>
                </div>
                <div className="mt-4">
                  <Link
                    href="/auth/signin"
                    className="text-blue-600 hover:text-blue-700 text-sm"
                  >
                    立即跳转
                  </Link>
                </div>
              </div>
            ) : (
              // Form State
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    设置新密码
                  </h2>
                  <p className="text-gray-600 mt-2">
                    请输入您的新密码
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New Password */}
                  <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                      新密码
                    </label>
                    <input
                      type="password"
                      id="password"
                      value={password}
                      onChange={(e) => updateField('password', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="至少6个字符"
                      disabled={loading}
                      required
                      minLength={6}
                    />
                  </div>

                  {/* Confirm Password */}
                  <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      id="confirmPassword"
                      value={confirmPassword}
                      onChange={(e) => updateField('confirmPassword', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="再次输入新密码"
                      disabled={loading}
                      required
                    />
                  </div>

                  {/* Error Message */}
                  {error && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <div className="flex items-center">
                        <div className="text-red-500 mr-2">❌</div>
                        <p className="text-sm text-red-700">{error}</p>
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
                        <span className="ml-2">更新中...</span>
                      </div>
                    ) : (
                      '更新密码'
                    )}
                  </button>
                </form>
              </>
            )}
          </div>

          {/* Security Notice */}
          {tokenValid && !success && (
            <div className="text-center">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-800 mb-2">
                  🔒 安全提示
                </h3>
                <ul className="text-sm text-blue-700 space-y-1 text-left">
                  <li>• 使用至少6个字符的强密码</li>
                  <li>• 包含字母、数字和特殊字符</li>
                  <li>• 不要使用常见的密码</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <ResetPasswordForm />
    </Suspense>
  )
}