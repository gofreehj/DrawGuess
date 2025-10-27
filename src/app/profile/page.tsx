'use client'

import React from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { AuthGuard } from '@/components/auth/AuthGuard'
import UserProfile from '@/components/auth/UserProfile'
import UserStats from '@/components/UserStats'
import Layout from '@/components/Layout'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, isSupabaseEnabled } = useAuth()

  if (!isSupabaseEnabled) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
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
      <AuthGuard
        requireAuth={true}
        fallback={
          <div className="container mx-auto px-4 py-8">
            <div className="max-w-2xl mx-auto text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                需要登录
              </h1>
              <p className="text-gray-600 mb-6">
                请先登录以查看和管理您的个人资料。
              </p>
              <div className="space-x-4">
                <Link
                  href="/auth/signin"
                  className="inline-block bg-blue-600 text-white px-6 py-2 rounded-md hover:bg-blue-700 transition-colors duration-200"
                >
                  登录
                </Link>
                <Link
                  href="/auth/signup"
                  className="inline-block border border-gray-300 text-gray-700 px-6 py-2 rounded-md hover:bg-gray-50 transition-colors duration-200"
                >
                  注册
                </Link>
              </div>
            </div>
          </div>
        }
      >
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-2xl mx-auto">
            {/* Page Header */}
            <div className="mb-8">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">个人资料</h1>
                  <p className="text-gray-600 mt-2">
                    管理您的账户信息和偏好设置
                  </p>
                </div>
                <Link
                  href="/"
                  className="text-sm text-gray-600 hover:text-gray-900 flex items-center"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  返回游戏
                </Link>
              </div>
            </div>

            {/* Profile Component */}
            {user && (
              <UserProfile 
                user={user}
                className="mb-8"
              />
            )}

            {/* Game Statistics */}
            <UserStats userId={user?.id} />
          </div>
        </div>
      </AuthGuard>
    </Layout>
  )
}