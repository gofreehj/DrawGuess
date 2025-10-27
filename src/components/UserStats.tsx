'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface UserStats {
  totalGames: number;
  successfulGuesses: number;
  averageConfidence: number;
  successRate: number;
  averageDuration: number;
  streakCurrent: number;
  streakBest: number;
  categoryStats: CategoryStats[];
  achievements: Achievement[];
}

interface CategoryStats {
  category: string;
  totalGames: number;
  successRate: number;
  averageConfidence: number;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface UserStatsProps {
  userId?: string;
  className?: string;
}

export default function UserStats({ userId, className = '' }: UserStatsProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<'overview' | 'categories' | 'achievements'>('overview');

  const targetUserId = userId || user?.id;

  useEffect(() => {
    if (targetUserId) {
      fetchUserStats();
    }
  }, [targetUserId]);

  const fetchUserStats = async () => {
    if (!targetUserId) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/user/stats?userId=${targetUserId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch user stats');
      }

      const data: UserStats = await response.json();
      setStats(data);
    } catch (err) {
      console.error('Error fetching user stats:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch user stats');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  const getAchievementProgress = (achievement: Achievement) => {
    if (!achievement.maxProgress) return 100;
    return Math.min(100, ((achievement.progress || 0) / achievement.maxProgress) * 100);
  };

  if (!targetUserId) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>请登录查看统计数据</p>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
        <p className="text-gray-600">加载统计数据中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`bg-red-50 border border-red-200 rounded-lg p-4 ${className}`}>
        <p className="text-red-800">错误: {error}</p>
        <button
          onClick={fetchUserStats}
          className="mt-2 text-red-600 hover:text-red-800 underline"
        >
          重试
        </button>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center py-8 text-gray-500 ${className}`}>
        <p>暂无统计数据</p>
      </div>
    );
  }

  return (
    <div className={`bg-white rounded-lg shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
        <h2 className="text-2xl font-bold">用户统计</h2>
        <p className="text-blue-100 mt-1">查看你的游戏表现和成就</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="flex space-x-8 px-6">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'overview'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            总览
          </button>
          <button
            onClick={() => setSelectedTab('categories')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'categories'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            分类统计
          </button>
          <button
            onClick={() => setSelectedTab('achievements')}
            className={`py-4 px-1 border-b-2 font-medium text-sm ${
              selectedTab === 'achievements'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            成就 ({stats.achievements.filter(a => a.unlockedAt).length})
          </button>
        </nav>
      </div>

      {/* Content */}
      <div className="p-6">
        {selectedTab === 'overview' && (
          <div className="space-y-6">
            {/* Main Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
                <div className="text-sm text-blue-800">总游戏数</div>
              </div>
              <div className="bg-green-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-green-600">{stats.successfulGuesses}</div>
                <div className="text-sm text-green-800">成功识别</div>
              </div>
              <div className="bg-purple-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-purple-600">{stats.successRate.toFixed(1)}%</div>
                <div className="text-sm text-purple-800">成功率</div>
              </div>
              <div className="bg-orange-50 rounded-lg p-4 text-center">
                <div className="text-2xl font-bold text-orange-600">{(stats.averageConfidence * 100).toFixed(1)}%</div>
                <div className="text-sm text-orange-800">平均置信度</div>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">平均用时</h3>
                <div className="text-xl font-bold text-gray-600">
                  {formatDuration(stats.averageDuration)}
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">当前连胜</h3>
                <div className="text-xl font-bold text-yellow-600">
                  {stats.streakCurrent} 局
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg p-4">
                <h3 className="font-semibold text-gray-800 mb-2">最佳连胜</h3>
                <div className="text-xl font-bold text-red-600">
                  {stats.streakBest} 局
                </div>
              </div>
            </div>

            {/* Progress Bars */}
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>成功率</span>
                  <span>{stats.successRate.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${Math.min(100, stats.successRate)}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm text-gray-600 mb-1">
                  <span>平均置信度</span>
                  <span>{(stats.averageConfidence * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${stats.averageConfidence * 100}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {selectedTab === 'categories' && (
          <div className="space-y-4">
            {stats.categoryStats.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无分类统计数据</p>
              </div>
            ) : (
              stats.categoryStats.map((category) => (
                <div key={category.category} className="border border-gray-200 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="font-semibold text-gray-800">{category.category}</h3>
                    <span className="text-sm text-gray-600">{category.totalGames} 局</span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <div className="text-sm text-gray-600 mb-1">成功率</div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min(100, category.successRate)}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {category.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm text-gray-600 mb-1">平均置信度</div>
                      <div className="flex items-center space-x-2">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${category.averageConfidence * 100}%` }}
                          ></div>
                        </div>
                        <span className="text-sm font-medium text-gray-800">
                          {(category.averageConfidence * 100).toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {selectedTab === 'achievements' && (
          <div className="space-y-4">
            {stats.achievements.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>暂无成就数据</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {stats.achievements.map((achievement) => (
                  <div 
                    key={achievement.id} 
                    className={`border rounded-lg p-4 ${
                      achievement.unlockedAt 
                        ? 'border-yellow-300 bg-yellow-50' 
                        : 'border-gray-200 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start space-x-3">
                      <div className={`text-2xl ${achievement.unlockedAt ? '' : 'grayscale opacity-50'}`}>
                        {achievement.icon}
                      </div>
                      <div className="flex-1">
                        <h3 className={`font-semibold ${
                          achievement.unlockedAt ? 'text-yellow-800' : 'text-gray-600'
                        }`}>
                          {achievement.name}
                        </h3>
                        <p className={`text-sm ${
                          achievement.unlockedAt ? 'text-yellow-700' : 'text-gray-500'
                        }`}>
                          {achievement.description}
                        </p>
                        
                        {achievement.unlockedAt && (
                          <div className="text-xs text-yellow-600 mt-1">
                            解锁于 {achievement.unlockedAt.toLocaleDateString('zh-CN')}
                          </div>
                        )}
                        
                        {!achievement.unlockedAt && achievement.maxProgress && (
                          <div className="mt-2">
                            <div className="flex justify-between text-xs text-gray-600 mb-1">
                              <span>进度</span>
                              <span>{achievement.progress || 0}/{achievement.maxProgress}</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-1">
                              <div 
                                className="bg-gray-400 h-1 rounded-full transition-all duration-300"
                                style={{ width: `${getAchievementProgress(achievement)}%` }}
                              ></div>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}