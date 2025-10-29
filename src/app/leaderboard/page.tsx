'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';

interface LeaderboardEntry {
  rank: number;
  prompt: string;
  category: string;
  successRate: number;
  totalAttempts: number;
  averageConfidence: number;
  lastPlayed: string;
}

interface LeaderboardData {
  byPrompt: LeaderboardEntry[];
  byCategory: {
    category: string;
    successRate: number;
    totalGames: number;
    averageConfidence: number;
  }[];
  globalStats: {
    totalGames: number;
    totalPrompts: number;
    overallSuccessRate: number;
    mostDifficultPrompt: string;
    easiestPrompt: string;
  };
}

export default function LeaderboardPage() {
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'prompts' | 'categories'>('prompts');

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      setIsLoading(true);
      
      // 获取历史数据并计算排行榜
      const response = await fetch('/api/history?limit=100');
      if (!response.ok) {
        throw new Error('Failed to fetch data');
      }
      
      const historyData = await response.json();
      const leaderboard = calculateLeaderboard(historyData.games);
      setLeaderboardData(leaderboard);
      
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateLeaderboard = (games: any[]): LeaderboardData => {
    // 按题目统计
    const promptStats: Record<string, {
      correct: number;
      total: number;
      confidenceSum: number;
      category: string;
      lastPlayed: string;
    }> = {};

    // 按分类统计
    const categoryStats: Record<string, {
      correct: number;
      total: number;
      confidenceSum: number;
    }> = {};

    games.forEach(game => {
      // 题目统计
      if (!promptStats[game.prompt]) {
        promptStats[game.prompt] = {
          correct: 0,
          total: 0,
          confidenceSum: 0,
          category: game.promptCategory,
          lastPlayed: game.startTime
        };
      }
      
      const promptStat = promptStats[game.prompt]!;
      promptStat.total++;
      promptStat.confidenceSum += game.confidence;
      if (game.isCorrect) {
        promptStat.correct++;
      }
      
      if (new Date(game.startTime) > new Date(promptStat.lastPlayed)) {
        promptStat.lastPlayed = game.startTime;
      }

      // 分类统计
      if (!categoryStats[game.promptCategory]) {
        categoryStats[game.promptCategory] = {
          correct: 0,
          total: 0,
          confidenceSum: 0
        };
      }
      
      const categoryStat = categoryStats[game.promptCategory]!;
      categoryStat.total++;
      categoryStat.confidenceSum += game.confidence;
      if (game.isCorrect) {
        categoryStat.correct++;
      }
    });

    // 生成题目排行榜
    const byPrompt: LeaderboardEntry[] = Object.entries(promptStats)
      .map(([prompt, stats]) => ({
        rank: 0,
        prompt,
        category: stats.category,
        successRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        totalAttempts: stats.total,
        averageConfidence: stats.total > 0 ? (stats.confidenceSum / stats.total) * 100 : 0,
        lastPlayed: stats.lastPlayed
      }))
      .sort((a, b) => {
        // 先按成功率排序，再按尝试次数排序
        if (Math.abs(a.successRate - b.successRate) < 0.1) {
          return b.totalAttempts - a.totalAttempts;
        }
        return b.successRate - a.successRate;
      })
      .map((entry, index) => ({ ...entry, rank: index + 1 }));

    // 生成分类排行榜
    const byCategory = Object.entries(categoryStats)
      .map(([category, stats]) => ({
        category,
        successRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0,
        totalGames: stats.total,
        averageConfidence: stats.total > 0 ? (stats.confidenceSum / stats.total) * 100 : 0
      }))
      .sort((a, b) => b.successRate - a.successRate);

    // 全局统计
    const totalGames = games.length;
    const totalCorrect = games.filter(g => g.isCorrect).length;
    const overallSuccessRate = totalGames > 0 ? (totalCorrect / totalGames) * 100 : 0;
    
    const sortedByDifficulty = byPrompt.filter(p => p.totalAttempts >= 3);
    const mostDifficultPrompt = sortedByDifficulty.length > 0 ? 
      sortedByDifficulty[sortedByDifficulty.length - 1]?.prompt || '暂无数据' : '暂无数据';
    const easiestPrompt = sortedByDifficulty.length > 0 ? 
      sortedByDifficulty[0]?.prompt || '暂无数据' : '暂无数据';

    return {
      byPrompt,
      byCategory,
      globalStats: {
        totalGames,
        totalPrompts: Object.keys(promptStats).length,
        overallSuccessRate,
        mostDifficultPrompt,
        easiestPrompt
      }
    };
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN');
  };

  const getDifficultyColor = (successRate: number) => {
    if (successRate >= 80) return 'text-green-600 bg-green-100';
    if (successRate >= 60) return 'text-yellow-600 bg-yellow-100';
    if (successRate >= 40) return 'text-orange-600 bg-orange-100';
    return 'text-red-600 bg-red-100';
  };

  const getDifficultyLabel = (successRate: number) => {
    if (successRate >= 80) return '简单';
    if (successRate >= 60) return '中等';
    if (successRate >= 40) return '困难';
    return '极难';
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载排行榜中...</span>
          </div>
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
            <div className="text-red-600 text-lg font-medium mb-2">加载失败</div>
            <div className="text-red-500 mb-4">{error}</div>
            <button
              onClick={fetchLeaderboard}
              className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors"
            >
              重试
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8 flex-1 flex flex-col">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">排行榜</h1>
          <p className="text-gray-600">查看题目难度和分类统计数据</p>
        </div>

        {/* Global Stats */}
        {leaderboardData && (
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-8">
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-blue-600">{leaderboardData.globalStats.totalGames}</div>
              <div className="text-sm text-gray-600">总游戏数</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-purple-600">{leaderboardData.globalStats.totalPrompts}</div>
              <div className="text-sm text-gray-600">题目总数</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-2xl font-bold text-green-600">
                {leaderboardData.globalStats.overallSuccessRate.toFixed(1)}%
              </div>
              <div className="text-sm text-gray-600">整体成功率</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-lg font-bold text-red-600 truncate" title={leaderboardData.globalStats.mostDifficultPrompt}>
                {leaderboardData.globalStats.mostDifficultPrompt}
              </div>
              <div className="text-sm text-gray-600">最难题目</div>
            </div>
            <div className="bg-white rounded-lg shadow-md p-4 text-center">
              <div className="text-lg font-bold text-green-600 truncate" title={leaderboardData.globalStats.easiestPrompt}>
                {leaderboardData.globalStats.easiestPrompt}
              </div>
              <div className="text-sm text-gray-600">最简单题目</div>
            </div>
          </div>
        )}

        {/* Tabs */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="border-b border-gray-200">
            <nav className="flex space-x-8 px-6">
              <button
                onClick={() => setActiveTab('prompts')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'prompts'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                题目排行榜
              </button>
              <button
                onClick={() => setActiveTab('categories')}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === 'categories'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                分类统计
              </button>
            </nav>
          </div>

          <div className="p-6">
            {activeTab === 'prompts' && leaderboardData && (
              <div>
                {leaderboardData.byPrompt.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">🏆</div>
                    <div className="text-xl text-gray-600 mb-2">还没有排行榜数据</div>
                    <div className="text-gray-500">开始游戏来生成排行榜吧！</div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {leaderboardData.byPrompt.map((entry) => (
                      <div
                        key={entry.prompt}
                        className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 text-sm font-bold">
                            {entry.rank}
                          </div>
                          <div>
                            <div className="font-medium text-gray-800">{entry.prompt}</div>
                            <div className="text-sm text-gray-600">
                              {entry.category} • {entry.totalAttempts} 次尝试 • 最后游戏: {formatDate(entry.lastPlayed)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <div className="font-medium text-gray-800">{entry.successRate.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">成功率</div>
                          </div>
                          <div className="text-right">
                            <div className="font-medium text-gray-800">{entry.averageConfidence.toFixed(1)}%</div>
                            <div className="text-sm text-gray-600">平均置信度</div>
                          </div>
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(entry.successRate)}`}>
                            {getDifficultyLabel(entry.successRate)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'categories' && leaderboardData && (
              <div>
                {leaderboardData.byCategory.length === 0 ? (
                  <div className="text-center py-12">
                    <div className="text-6xl mb-4">📊</div>
                    <div className="text-xl text-gray-600 mb-2">还没有分类数据</div>
                    <div className="text-gray-500">开始游戏来生成统计数据吧！</div>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {leaderboardData.byCategory.map((category, index) => (
                      <div
                        key={category.category}
                        className="bg-gradient-to-br from-blue-50 to-purple-50 border border-gray-200 rounded-lg p-6"
                      >
                        <div className="flex items-center justify-between mb-4">
                          <h3 className="text-lg font-semibold text-gray-800">{category.category}</h3>
                          <div className="text-2xl">
                            {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : '📊'}
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-gray-600">成功率</span>
                            <span className="font-medium text-green-600">{category.successRate.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">游戏数</span>
                            <span className="font-medium">{category.totalGames}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">平均置信度</span>
                            <span className="font-medium text-blue-600">{category.averageConfidence.toFixed(1)}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2 mt-4">
                            <div
                              className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full"
                              style={{ width: `${Math.min(category.successRate, 100)}%` }}
                            ></div>
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
      </div>
    </Layout>
  );
}