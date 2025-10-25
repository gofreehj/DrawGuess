'use client';

import { useState, useEffect } from 'react';
import Layout from '@/components/Layout';
import { GameSession } from '@/types/game';

interface GameHistoryData {
  games: GameSession[];
  totalGames: number;
  successRate: number;
  averageConfidence: number;
  successfulGuesses: number;
}

export default function HistoryPage() {
  const [historyData, setHistoryData] = useState<GameHistoryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameSession | null>(null);
  const [selectedGameIds, setSelectedGameIds] = useState<string[]>([]);
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/history?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch history');
      }
      
      const data = await response.json();
      setHistoryData(data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to load history');
    } finally {
      setIsLoading(false);
    }
  };

  const clearHistory = async () => {
    if (!confirm('确定要清除所有历史记录吗？此操作无法撤销。')) {
      return;
    }

    try {
      const response = await fetch('/api/history?action=all', {
        method: 'DELETE'
      });

      if (response.ok) {
        setHistoryData({
          games: [],
          totalGames: 0,
          successRate: 0,
          averageConfidence: 0,
          successfulGuesses: 0
        });
      }
    } catch (err) {
      console.error('Error clearing history:', err);
    }
  };

  const deleteGame = async (gameId: string) => {
    if (!confirm('确定要删除这条游戏记录吗？')) {
      return;
    }

    try {
      const response = await fetch(`/api/history/${gameId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        // 重新获取历史数据
        fetchHistory();
      }
    } catch (err) {
      console.error('Error deleting game:', err);
    }
  };

  const deleteSelectedGames = async () => {
    if (selectedGameIds.length === 0) return;
    
    if (!confirm(`确定要删除选中的 ${selectedGameIds.length} 条游戏记录吗？`)) {
      return;
    }

    try {
      const response = await fetch('/api/history?action=batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ gameIds: selectedGameIds })
      });

      if (response.ok) {
        setSelectedGameIds([]);
        setIsSelectionMode(false);
        // 重新获取历史数据
        fetchHistory();
      }
    } catch (err) {
      console.error('Error deleting selected games:', err);
    }
  };

  const toggleGameSelection = (gameId: string) => {
    setSelectedGameIds(prev => 
      prev.includes(gameId) 
        ? prev.filter(id => id !== gameId)
        : [...prev, gameId]
    );
  };

  const selectAllGames = () => {
    if (!historyData) return;
    setSelectedGameIds(historyData.games.map(game => game.id));
  };

  const clearSelection = () => {
    setSelectedGameIds([]);
  };

  const formatDuration = (seconds: number) => {
    if (seconds < 60) {
      return `${seconds}秒`;
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}分${remainingSeconds}秒`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Layout>
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-gray-600">加载历史记录中...</span>
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
              onClick={fetchHistory}
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
          <h1 className="text-3xl font-bold text-gray-800 mb-2">游戏历史</h1>
          <p className="text-gray-600">查看你的绘画猜测游戏记录和统计数据</p>
        </div>

        {/* Statistics Cards */}
        {historyData && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🎮</div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">{historyData.totalGames}</div>
                  <div className="text-sm text-gray-600">总游戏数</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🎯</div>
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {historyData.successRate.toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">成功率</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-3">✅</div>
                <div>
                  <div className="text-2xl font-bold text-blue-600">{historyData.successfulGuesses}</div>
                  <div className="text-sm text-gray-600">成功猜测</div>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-md p-6">
              <div className="flex items-center">
                <div className="text-3xl mr-3">🤖</div>
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {(historyData.averageConfidence * 100).toFixed(1)}%
                  </div>
                  <div className="text-sm text-gray-600">平均置信度</div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Game History */}
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-800">游戏记录</h2>
              {historyData && historyData.games.length > 0 && (
                <div className="flex items-center space-x-3">
                  {!isSelectionMode ? (
                    <>
                      <button
                        onClick={() => setIsSelectionMode(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        批量删除
                      </button>
                      <button
                        onClick={clearHistory}
                        className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        清除所有
                      </button>
                    </>
                  ) : (
                    <>
                      <span className="text-sm text-gray-600">
                        已选择 {selectedGameIds.length} 项
                      </span>
                      <button
                        onClick={selectAllGames}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        全选
                      </button>
                      <button
                        onClick={clearSelection}
                        className="bg-gray-500 hover:bg-gray-600 text-white px-3 py-1 rounded text-sm transition-colors"
                      >
                        清空选择
                      </button>
                      <button
                        onClick={deleteSelectedGames}
                        disabled={selectedGameIds.length === 0}
                        className="bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        删除选中
                      </button>
                      <button
                        onClick={() => {
                          setIsSelectionMode(false);
                          setSelectedGameIds([]);
                        }}
                        className="bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
                      >
                        取消
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-6">
            {!historyData || historyData.games.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-6xl mb-4">🎨</div>
                <div className="text-xl text-gray-600 mb-2">还没有游戏记录</div>
                <div className="text-gray-500 mb-6">开始你的第一个绘画猜测游戏吧！</div>
                <a
                  href="/"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors inline-flex items-center space-x-2"
                >
                  <span>🎮</span>
                  <span>开始游戏</span>
                </a>
              </div>
            ) : (
              <div className="space-y-4">
                {historyData.games.map((game) => (
                  <div
                    key={game.id}
                    className={`border border-gray-200 rounded-lg p-4 transition-colors ${
                      isSelectionMode 
                        ? selectedGameIds.includes(game.id)
                          ? 'bg-blue-50 border-blue-300'
                          : 'hover:bg-gray-50'
                        : 'hover:bg-gray-50 cursor-pointer'
                    }`}
                    onClick={() => {
                      if (isSelectionMode) {
                        toggleGameSelection(game.id);
                      } else {
                        setSelectedGame(game);
                      }
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        {isSelectionMode && (
                          <input
                            type="checkbox"
                            checked={selectedGameIds.includes(game.id)}
                            onChange={() => toggleGameSelection(game.id)}
                            className="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                            onClick={(e) => e.stopPropagation()}
                          />
                        )}
                        <div className={`text-2xl ${game.isCorrect ? '✅' : '❌'}`}></div>
                        <div>
                          <div className="font-medium text-gray-800">
                            题目: {game.prompt}
                          </div>
                          <div className="text-sm text-gray-600">
                            AI猜测: {game.aiGuess} ({(game.confidence * 100).toFixed(1)}% 置信度)
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right text-sm text-gray-500">
                          <div>{formatDate(game.startTime.toString())}</div>
                          <div>{formatDuration(game.duration)}</div>
                        </div>
                        {!isSelectionMode && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              deleteGame(game.id);
                            }}
                            className="text-red-500 hover:text-red-700 p-1 rounded transition-colors"
                            title="删除这条记录"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Game Detail Modal */}
        {selectedGame && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200">
                <div className="flex justify-between items-center">
                  <h3 className="text-xl font-semibold">游戏详情</h3>
                  <button
                    onClick={() => setSelectedGame(null)}
                    className="text-gray-400 hover:text-gray-600"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="font-medium text-gray-800 mb-3">游戏信息</h4>
                    <div className="space-y-2 text-sm">
                      <div><span className="text-gray-600">题目:</span> {selectedGame.prompt}</div>
                      <div><span className="text-gray-600">分类:</span> {selectedGame.promptCategory}</div>
                      <div><span className="text-gray-600">AI猜测:</span> {selectedGame.aiGuess}</div>
                      <div><span className="text-gray-600">置信度:</span> {(selectedGame.confidence * 100).toFixed(1)}%</div>
                      <div><span className="text-gray-600">结果:</span> 
                        <span className={selectedGame.isCorrect ? 'text-green-600' : 'text-red-600'}>
                          {selectedGame.isCorrect ? ' 正确' : ' 错误'}
                        </span>
                      </div>
                      <div><span className="text-gray-600">用时:</span> {formatDuration(selectedGame.duration)}</div>
                      <div><span className="text-gray-600">时间:</span> {formatDate(selectedGame.startTime.toString())}</div>
                    </div>
                  </div>
                  
                  {selectedGame.drawing && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-3">你的绘画</h4>
                      <div className="border border-gray-200 rounded-lg p-2 bg-gray-50">
                        <img
                          src={selectedGame.drawing}
                          alt="用户绘画"
                          className="w-full h-auto max-h-64 object-contain rounded"
                          style={{ imageRendering: 'pixelated' }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}