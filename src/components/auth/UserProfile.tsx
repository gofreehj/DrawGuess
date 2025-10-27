'use client'

import React, { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import { User } from '@supabase/supabase-js'

export interface UserProfileProps {
  user: User
  onUpdate?: (updates: UserProfileUpdate) => Promise<void>
  className?: string
}

export interface UserProfileUpdate {
  displayName?: string
  avatar?: File
}

interface ProfileFormState {
  displayName: string
  loading: boolean
  error: string | null
  success: string | null
}

export default function UserProfile({ user, onUpdate, className = '' }: UserProfileProps) {
  const { updateProfile } = useAuth()
  
  const [formState, setFormState] = useState<ProfileFormState>({
    displayName: user.user_metadata?.display_name || '',
    loading: false,
    error: null,
    success: null,
  })

  const [isEditing, setIsEditing] = useState(false)

  const updateField = (field: keyof ProfileFormState, value: string) => {
    setFormState(prev => ({
      ...prev,
      [field]: value,
      error: null,
      success: null,
    }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const { displayName } = formState

    if (!displayName.trim()) {
      setFormState(prev => ({
        ...prev,
        error: '显示名称不能为空'
      }))
      return
    }

    setFormState(prev => ({ ...prev, loading: true, error: null, success: null }))

    try {
      const updates = { displayName: displayName.trim() }
      
      // Use custom onUpdate if provided, otherwise use the auth context method
      if (onUpdate) {
        await onUpdate(updates)
      } else {
        const { error } = await updateProfile(updates)
        if (error) {
          throw error
        }
      }

      setFormState(prev => ({
        ...prev,
        loading: false,
        success: '资料更新成功！',
      }))
      
      setIsEditing(false)
    } catch (error: any) {
      console.error('Profile update error:', error)
      setFormState(prev => ({
        ...prev,
        loading: false,
        error: error.message || '更新失败，请稍后重试'
      }))
    }
  }

  const handleCancel = () => {
    setFormState(prev => ({
      ...prev,
      displayName: user.user_metadata?.display_name || '',
      error: null,
      success: null,
    }))
    setIsEditing(false)
  }

  const { displayName, loading, error, success } = formState

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900">个人资料</h2>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            编辑
          </button>
        )}
      </div>

      {/* Profile Avatar */}
      <div className="flex items-center space-x-4 mb-6">
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
          <span className="text-2xl font-bold text-blue-700">
            {(user.user_metadata?.display_name || user.email || 'U').charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-lg font-medium text-gray-900">
            {user.user_metadata?.display_name || '未设置显示名称'}
          </h3>
          <p className="text-sm text-gray-500">{user.email}</p>
          <p className="text-xs text-gray-400">
            注册时间: {new Date(user.created_at).toLocaleDateString('zh-CN')}
          </p>
        </div>
      </div>

      {/* Success Message */}
      {success && (
        <div className="bg-green-50 border border-green-200 rounded-md p-3 mb-4">
          <div className="flex items-center">
            <div className="text-green-500 mr-2">✅</div>
            <p className="text-sm text-green-700">{success}</p>
          </div>
        </div>
      )}

      {isEditing ? (
        // Edit Form
        <form onSubmit={handleSubmit} className="space-y-4">
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

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              {loading ? (
                <div className="flex items-center justify-center">
                  <LoadingSpinner size="sm" />
                  <span className="ml-2">保存中...</span>
                </div>
              ) : (
                '保存更改'
              )}
            </button>
            <button
              type="button"
              onClick={handleCancel}
              disabled={loading}
              className="flex-1 bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
            >
              取消
            </button>
          </div>
        </form>
      ) : (
        // Display Mode
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              显示名称
            </label>
            <p className="text-gray-900">
              {user.user_metadata?.display_name || '未设置'}
            </p>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              邮箱地址
            </label>
            <p className="text-gray-900">{user.email}</p>
            {!user.email_confirmed_at && (
              <p className="text-sm text-yellow-600 mt-1">
                ⚠️ 邮箱未验证
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              账户状态
            </label>
            <div className="flex items-center space-x-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                活跃
              </span>
              {user.email_confirmed_at && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  已验证
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Account Actions */}
      <div className="border-t border-gray-200 pt-6 mt-6">
        <h3 className="text-sm font-medium text-gray-900 mb-3">账户操作</h3>
        <div className="space-y-2">
          <button
            onClick={() => {
              // TODO: Implement change password functionality
              alert('更改密码功能即将推出')
            }}
            className="w-full text-left px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-md transition-colors duration-200"
          >
            更改密码
          </button>
          <button
            onClick={() => {
              // TODO: Implement delete account functionality
              if (confirm('确定要删除账户吗？此操作不可撤销。')) {
                alert('删除账户功能即将推出')
              }
            }}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:text-red-700 hover:bg-red-50 rounded-md transition-colors duration-200"
          >
            删除账户
          </button>
        </div>
      </div>
    </div>
  )
}