'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'

interface ForgotPasswordState {
  email: string
  loading: boolean
  error: string | null
  success: boolean
}

export default function ForgotPasswordPage() {
  const router = useRouter()
  const { isAuthenticated, loading: authLoading, resetPassword, isSupabaseEnabled } = useAuth()
  
  const [formState, setFormState] = useState<ForgotPasswordState>({
    email: '',
    loading: false,
    error: null,
    success: false,
  })

  // Redirect if already authenticated
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, authLoading, router])

  const updateEmail = (email: string) => {
    setFormState(prev => ({
      ...prev,
      email,
      error: null,
    }))
  }

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
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

    const { email } = formState

    if (!email.trim()) {
      setFormState(prev => ({
        ...prev,
        error: '请输入邮箱地址'
      }))
      return
    }

    if (!validateEmail(email)) {
      setFormState(prev => ({
        ...prev,
        error: '请输入有效的邮箱地址'
      }))
      return
    }

    setFormState(prev => ({ ...prev, loading: true, error: null }))

    try {
      const { error } = await resetPassword(email)
      
      if (error) {
        setFormState(prev => ({
          ...prev,
          loading: false,
          error: error.message || '发送重置邮件失败，请稍后重试'
        }))
      } else {
        setFormState(prev => ({
          ...prev,
          loading: false,
          success: true,
        }))
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

  // Show loading while checking auth status
  if (authLoading) {
    return (
      <Layout>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-gray-600">加载中...</p>
          </div>
        </div>
      </Layout>
    )
  }

  // Don't render if already authenticated (will redirect)
  if (isAuthenticated) {
    return null
  }

  const { email, loading, error, success } = formState

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
            {success ? (
              // Success State
              <div className="text-center">
                <div className="text-green-500 text-4xl mb-4">✅</div>
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  重置邮件已发送
                </h2>
                <p className="text-gray-600 mb-6">
                  我们已向 <strong>{email}</strong> 发送了密码重置链接。
                  请检查您的邮箱（包括垃圾邮件文件夹）并点击链接重置密码。
                </p>
                <div className="space-y-3">
                  <Link
                    href="/auth/signin"
                    className="block w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition-colors duration-200 text-center"
                  >
                    返回登录
                  </Link>
                  <button
                    onClick={() => setFormState(prev => ({ ...prev, success: false, email: '' }))}
                    className="block w-full text-gray-600 hover:text-gray-900 text-sm"
                  >
                    重新发送到其他邮箱
                  </button>
                </div>
              </div>
            ) : (
              // Form State
              <>
                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">
                    重置密码
                  </h2>
                  <p className="text-gray-600 mt-2">
                    输入您的邮箱地址，我们将发送重置链接给您
                  </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* Email Input */}
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                      邮箱地址
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={email}
                      onChange={(e) => updateEmail(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="输入您注册时使用的邮箱"
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
                        <span className="ml-2">发送中...</span>
                      </div>
                    ) : (
                      '发送重置链接'
                    )}
                  </button>
                </form>

                {/* Additional Links */}
                <div className="text-center pt-4 border-t border-gray-200 mt-6">
                  <p className="text-sm text-gray-600">
                    想起密码了？
                    <Link
                      href="/auth/signin"
                      className="ml-1 text-blue-600 hover:text-blue-700 font-medium"
                    >
                      立即登录
                    </Link>
                  </p>
                </div>
              </>
            )}
          </div>

          {/* Help Text */}
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                💡 提示
              </h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• 重置链接将在24小时后过期</li>
                <li>• 请检查垃圾邮件文件夹</li>
                <li>• 如果仍未收到，请稍后重试</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  )
}