'use client'

import React, { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/auth/AuthForm'
import Layout from '@/components/Layout'
import LoadingSpinner from '@/components/LoadingSpinner'

function SignInForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { isAuthenticated, loading } = useAuth()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signin')

  // Get redirect URL from query params
  const redirectTo = searchParams.get('redirect') || '/'

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push(redirectTo)
    }
  }, [isAuthenticated, loading, router, redirectTo])

  const handleAuthSuccess = () => {
    // Redirect to the intended page or home
    router.push(redirectTo)
  }

  const handleModeChange = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    // Update URL without page reload, preserve redirect param
    const newPath = mode === 'signup' ? '/auth/signup' : '/auth/signin'
    const url = new URL(window.location.href)
    url.pathname = newPath
    window.history.replaceState(null, '', url.toString())
  }

  // Show loading while checking auth status
  if (loading) {
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

  return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8">
          {/* Back to Home Link */}
          <div className="text-center">
            <Link 
              href="/"
              className="inline-flex items-center text-sm text-gray-600 hover:text-gray-900 transition-colors duration-200"
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              返回游戏
            </Link>
          </div>

          {/* Auth Form */}
          <AuthForm
            mode={authMode}
            onSuccess={handleAuthSuccess}
            onModeChange={handleModeChange}
          />

          {/* Forgot Password Link */}
          <div className="text-center">
            <Link
              href="/auth/forgot-password"
              className="text-sm text-blue-600 hover:text-blue-700 transition-colors duration-200"
            >
              忘记密码？
            </Link>
          </div>

          {/* Guest Access Notice */}
          <div className="text-center">
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-gray-800 mb-2">
                🎮 游客模式
              </h3>
              <p className="text-sm text-gray-600 mb-3">
                您也可以不登录直接开始游戏，但游戏数据将只保存在本地。
              </p>
              <Link
                href="/"
                className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
              >
                以游客身份继续
              </Link>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              登录即表示您同意我们的服务条款和隐私政策。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}

export default function SignInPage() {
  return (
    <Suspense fallback={<LoadingSpinner />}>
      <SignInForm />
    </Suspense>
  )
}