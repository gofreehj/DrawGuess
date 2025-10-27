'use client'

import React, { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import AuthForm from '@/components/auth/AuthForm'
import Layout from '@/components/Layout'

export default function SignUpPage() {
  const router = useRouter()
  const { isAuthenticated, loading } = useAuth()
  const [authMode, setAuthMode] = useState<'signin' | 'signup'>('signup')

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/')
    }
  }, [isAuthenticated, loading, router])

  const handleAuthSuccess = () => {
    // For signup, we don't redirect immediately since user needs to verify email
    // For signin, we redirect to home
    if (authMode === 'signin') {
      router.push('/')
    }
  }

  const handleModeChange = (mode: 'signin' | 'signup') => {
    setAuthMode(mode)
    // Update URL without page reload
    const newPath = mode === 'signup' ? '/auth/signup' : '/auth/signin'
    window.history.replaceState(null, '', newPath)
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

          {/* Additional Info */}
          <div className="text-center">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h3 className="text-sm font-medium text-blue-800 mb-2">
                🎨 为什么要注册？
              </h3>
              <ul className="text-sm text-blue-700 space-y-1 text-left">
                <li>• 保存您的游戏历史和进度</li>
                <li>• 在不同设备间同步数据</li>
                <li>• 查看个人统计和成就</li>
                <li>• 参与排行榜竞争</li>
              </ul>
            </div>
          </div>

          {/* Privacy Notice */}
          <div className="text-center">
            <p className="text-xs text-gray-500">
              注册即表示您同意我们的服务条款和隐私政策。
              <br />
              我们承诺保护您的个人信息安全。
            </p>
          </div>
        </div>
      </div>
    </Layout>
  )
}