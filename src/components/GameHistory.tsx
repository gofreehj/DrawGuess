'use client';

import { useState, useEffect } from 'react';

interface GameHistoryProps {
  isVisible: boolean;
  onClose: () => void;
}

interface GameSessionResponse {
  id: string;
  userId?: string;
  prompt: string;
  promptCategory: string;
  drawing: string;
  aiGuess: string;
  confidence: number;
  isCorrect: boolean;
  startTime: string; // ISO string from API
  endTime: string;   // ISO string from API
  duration: number;
}

interface HistoryResponse {
  games: GameSessionResponse[];
  totalGames: number;
  successRate: number;
  averageConfidence: number;
  successfulGuesses: number;
}

export default function GameHistory({ isVisible, onClose }: GameHistoryProps) {
  const [history, setHistory] = useState<HistoryResponse | null>(null);
  const [selectedGame, setSelectedGame] = useState<GameSessionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGames, setSelectedGames] = useState<Set<string>>(new Set());
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<{
    type: 'single' | 'batch' | 'all' | 'old';
    gameId?: string;
    count?: number;
  } | null>(null);

  // Fetch game history when component becomes visible
  useEffect(() => {
    if (isVisible && !history) {
      fetchHistory();
    }
  }, [isVisible, history]);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/history?limit=50');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch history');
      }

      const data: HistoryResponse = await response.json();
      setHistory(data);
    } catch (err) {
      console.error('Error fetching history:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch history');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGameDetails = async (gameId: string) => {
    try {
      const response = await fetch(`/api/history/${gameId}`);
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to fetch game details');
      }

      const gameDetails: GameSessionResponse = await response.json();
      setSelectedGame(gameDetails);
    } catch (err) {
      console.error('Error fetching game details:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch game details');
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${remainingSeconds}s`;
  };

  // Toggle game selection for batch operations
  const toggleGameSelection = (gameId: string) => {
    const newSelected = new Set(selectedGames);
    if (newSelected.has(gameId)) {
      newSelected.delete(gameId);
    } else {
      newSelected.add(gameId);
    }
    setSelectedGames(newSelected);
  };

  // Select all games
  const selectAllGames = () => {
    if (history) {
      setSelectedGames(new Set(history.games.map(game => game.id)));
    }
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedGames(new Set());
  };

  // Delete single game
  const deleteSingleGame = async (gameId: string) => {
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/history/${gameId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete game');
      }

      // Refresh history and clear selection
      setHistory(null);
      setSelectedGame(null);
      await fetchHistory();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting game:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete game');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete selected games (batch)
  const deleteSelectedGames = async () => {
    if (selectedGames.size === 0) return;

    setIsDeleting(true);
    try {
      const response = await fetch('/api/history?action=batch', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          gameIds: Array.from(selectedGames)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete games');
      }

      // Refresh history and clear selection
      setHistory(null);
      setSelectedGame(null);
      setSelectedGames(new Set());
      await fetchHistory();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting games:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete games');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete all games
  const deleteAllGames = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/history?action=all', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete all games');
      }

      // Refresh history and clear selection
      setHistory(null);
      setSelectedGame(null);
      setSelectedGames(new Set());
      await fetchHistory();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting all games:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete all games');
    } finally {
      setIsDeleting(false);
    }
  };

  // Delete old games (older than 30 days)
  const deleteOldGames = async () => {
    setIsDeleting(true);
    try {
      const response = await fetch('/api/history?action=old', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          daysOld: 30
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to delete old games');
      }

      // Refresh history and clear selection
      setHistory(null);
      setSelectedGame(null);
      setSelectedGames(new Set());
      await fetchHistory();
      setShowDeleteConfirm(null);
    } catch (err) {
      console.error('Error deleting old games:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete old games');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white p-6">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold">游戏历史</h2>
              <p className="text-blue-100 mt-1">查看你的绘画历史和AI识别结果</p>
            </div>
            <button
              onClick={onClose}
              className="text-white hover:text-gray-200 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Statistics */}
          {history && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{history.totalGames}</div>
                <div className="text-sm text-blue-100">总游戏数</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{history.successfulGuesses}</div>
                <div className="text-sm text-blue-100">成功识别</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{history.successRate.toFixed(1)}%</div>
                <div className="text-sm text-blue-100">成功率</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-3 text-center">
                <div className="text-2xl font-bold">{(history.averageConfidence * 100).toFixed(1)}%</div>
                <div className="text-sm text-blue-100">平均置信度</div>
              </div>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex h-[calc(90vh-200px)]">
          {/* Game List */}
          <div className="w-1/2 border-r border-gray-200 overflow-y-auto">
            <div className="p-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold text-gray-800">游戏记录</h3>
                
                {/* Cleanup Actions */}
                <div className="flex items-center space-x-2">
                  {selectedGames.size > 0 && (
                    <>
                      <span className="text-sm text-gray-600">
                        已选择 {selectedGames.size} 项
                      </span>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'batch', count: selectedGames.size })}
                        disabled={isDeleting}
                        className="text-red-600 hover:text-red-800 text-sm font-medium disabled:opacity-50"
                      >
                        删除选中
                      </button>
                      <button
                        onClick={clearSelection}
                        className="text-gray-600 hover:text-gray-800 text-sm"
                      >
                        取消选择
                      </button>
                    </>
                  )}
                  
                  {/* Cleanup Menu */}
                  <div className="relative group">
                    <button className="text-gray-600 hover:text-gray-800 p-1">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </button>
                    
                    <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-lg shadow-lg py-2 min-w-[160px] opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                      <button
                        onClick={selectAllGames}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        全选
                      </button>
                      <button
                        onClick={clearSelection}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                      >
                        取消全选
                      </button>
                      <hr className="my-1" />
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'old' })}
                        disabled={isDeleting}
                        className="w-full text-left px-4 py-2 text-sm text-orange-600 hover:bg-orange-50 disabled:opacity-50"
                      >
                        删除30天前记录
                      </button>
                      <button
                        onClick={() => setShowDeleteConfirm({ type: 'all', count: history?.totalGames })}
                        disabled={isDeleting}
                        className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                      >
                        删除全部记录
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {isLoading && (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                  <p className="text-gray-600">加载中...</p>
                </div>
              )}

              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <p className="text-red-800">错误: {error}</p>
                  <button
                    onClick={fetchHistory}
                    className="mt-2 text-red-600 hover:text-red-800 underline"
                  >
                    重试
                  </button>
                </div>
              )}

              {history && history.games.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <p>还没有游戏记录</p>
                  <p className="text-sm mt-1">开始你的第一个游戏吧！</p>
                </div>
              )}

              {history && history.games.map((game) => (
                <div
                  key={game.id}
                  className={`border rounded-lg p-4 mb-3 transition-colors ${
                    selectedGame?.id === game.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-start space-x-3 mb-2">
                    {/* Selection Checkbox */}
                    <input
                      type="checkbox"
                      checked={selectedGames.has(game.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        toggleGameSelection(game.id);
                      }}
                      className="mt-1 w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    
                    {/* Game Content */}
                    <div 
                      className="flex-1 cursor-pointer"
                      onClick={() => fetchGameDetails(game.id)}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-gray-800">{game.prompt}</div>
                          <div className="text-sm text-gray-500">{game.promptCategory}</div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                            game.isCorrect
                              ? 'bg-green-100 text-green-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {game.isCorrect ? '✓ 正确' : '✗ 错误'}
                          </div>
                          
                          {/* Delete Single Game Button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setShowDeleteConfirm({ type: 'single', gameId: game.id });
                            }}
                            className="text-gray-400 hover:text-red-600 transition-colors"
                            title="删除此记录"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600 mb-2">
                        AI猜测: <span className="font-medium">{game.aiGuess || '未识别'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center text-xs text-gray-500">
                        <span>{formatDate(game.startTime)}</span>
                        <div className="flex items-center space-x-2">
                          <span>置信度: {((game.confidence || 0) * 100).toFixed(1)}%</span>
                          <span>用时: {formatDuration(game.duration || 0)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Game Details */}
          <div className="w-1/2 overflow-y-auto">
            <div className="p-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">游戏详情</h3>
              
              {!selectedGame && (
                <div className="text-center py-8 text-gray-500">
                  <svg className="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  </svg>
                  <p>选择一个游戏记录查看详情</p>
                </div>
              )}

              {selectedGame && (
                <div className="space-y-6">
                  {/* Game Info */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">游戏信息</h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">提示词:</span>
                        <div className="font-medium">{selectedGame.prompt}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">分类:</span>
                        <div className="font-medium">{selectedGame.promptCategory}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">AI猜测:</span>
                        <div className="font-medium">{selectedGame.aiGuess || '未识别'}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">置信度:</span>
                        <div className="font-medium">{((selectedGame.confidence || 0) * 100).toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-gray-600">结果:</span>
                        <div className={`font-medium ${selectedGame.isCorrect ? 'text-green-600' : 'text-red-600'}`}>
                          {selectedGame.isCorrect ? '✓ 识别正确' : '✗ 识别错误'}
                        </div>
                      </div>
                      <div>
                        <span className="text-gray-600">用时:</span>
                        <div className="font-medium">{formatDuration(selectedGame.duration || 0)}</div>
                      </div>
                    </div>
                  </div>

                  {/* Drawing */}
                  {selectedGame.drawing && (
                    <div className="bg-gray-50 rounded-lg p-4">
                      <h4 className="font-semibold text-gray-800 mb-3">你的绘画</h4>
                      <div className="flex justify-center">
                        <div className="bg-white rounded-lg border-2 border-gray-200 p-2 shadow-sm">
                          <img
                            src={selectedGame.drawing}
                            alt={`Drawing of ${selectedGame.prompt}`}
                            className="max-w-full max-h-64 object-contain rounded"
                            style={{ imageRendering: 'pixelated' }}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Timestamps */}
                  <div className="bg-gray-50 rounded-lg p-4">
                    <h4 className="font-semibold text-gray-800 mb-3">时间信息</h4>
                    <div className="text-sm space-y-2">
                      <div>
                        <span className="text-gray-600">开始时间:</span>
                        <div className="font-medium">{formatDate(selectedGame.startTime)}</div>
                      </div>
                      <div>
                        <span className="text-gray-600">结束时间:</span>
                        <div className="font-medium">{formatDate(selectedGame.endTime)}</div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0 w-10 h-10 mx-auto bg-red-100 rounded-full flex items-center justify-center">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
              </div>
              
              <div className="text-center">
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {showDeleteConfirm.type === 'single' && '删除游戏记录'}
                  {showDeleteConfirm.type === 'batch' && '批量删除记录'}
                  {showDeleteConfirm.type === 'all' && '删除全部记录'}
                  {showDeleteConfirm.type === 'old' && '删除旧记录'}
                </h3>
                
                <p className="text-sm text-gray-500 mb-6">
                  {showDeleteConfirm.type === 'single' && '确定要删除这个游戏记录吗？此操作无法撤销。'}
                  {showDeleteConfirm.type === 'batch' && `确定要删除选中的 ${showDeleteConfirm.count} 个游戏记录吗？此操作无法撤销。`}
                  {showDeleteConfirm.type === 'all' && `确定要删除全部 ${showDeleteConfirm.count} 个游戏记录吗？此操作无法撤销。`}
                  {showDeleteConfirm.type === 'old' && '确定要删除30天前的所有游戏记录吗？此操作无法撤销。'}
                </p>
              </div>
              
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowDeleteConfirm(null)}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                  取消
                </button>
                <button
                  onClick={() => {
                    if (showDeleteConfirm.type === 'single' && showDeleteConfirm.gameId) {
                      deleteSingleGame(showDeleteConfirm.gameId);
                    } else if (showDeleteConfirm.type === 'batch') {
                      deleteSelectedGames();
                    } else if (showDeleteConfirm.type === 'all') {
                      deleteAllGames();
                    } else if (showDeleteConfirm.type === 'old') {
                      deleteOldGames();
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 flex items-center justify-center"
                >
                  {isDeleting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      删除中...
                    </>
                  ) : (
                    '确认删除'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}