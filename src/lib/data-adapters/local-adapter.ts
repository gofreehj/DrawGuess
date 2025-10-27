import { 
  DataAdapter, 
  HistoryOptions, 
  GameStats, 
  SyncResult, 
  DataSourceHealth 
} from './types';
import { GameSession, User } from '@/types/game';

/**
 * 本地SQLite数据适配器
 * 实现基于SQLite数据库的数据访问
 */
export class LocalDataAdapter implements DataAdapter {
  readonly name = 'local';
  readonly type = 'local' as const;
  
  private initialized = false;

  async initialize(): Promise<void> {
    // Only initialize on server side
    if (typeof window !== 'undefined') {
      throw new Error('Local database adapter can only be used on the server side');
    }
    
    try {
      const { initializeDatabase } = await import('@/lib/database');
      initializeDatabase();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize local database:', error);
      throw error;
    }
  }

  async isHealthy(): Promise<DataSourceHealth> {
    const startTime = Date.now();
    
    try {
      if (!this.initialized) {
        return {
          isHealthy: false,
          lastChecked: new Date(),
          error: 'Adapter not initialized'
        };
      }

      // 执行简单查询测试连接
      const { getDatabase } = await import('@/lib/database');
      const db = getDatabase();
      db.prepare('SELECT 1').get();
      
      const latency = Date.now() - startTime;
      
      return {
        isHealthy: true,
        latency,
        lastChecked: new Date()
      };
    } catch (error) {
      return {
        isHealthy: false,
        latency: Date.now() - startTime,
        lastChecked: new Date(),
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  async close(): Promise<void> {
    try {
      const { closeDatabase } = await import('@/lib/database');
      closeDatabase();
      this.initialized = false;
    } catch (error) {
      console.error('Failed to close local database:', error);
      throw error;
    }
  }

  async createGameSession(session: Omit<GameSession, 'id'>): Promise<GameSession> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { createGameSession: dbCreateGameSession } = await import('@/lib/database');
      return dbCreateGameSession(session);
    } catch (error) {
      console.error('Failed to create game session:', error);
      throw error;
    }
  }

  async getGameSession(id: string): Promise<GameSession | null> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { getGameSessionById } = await import('@/lib/database');
      return getGameSessionById(id);
    } catch (error) {
      console.error('Failed to get game session:', error);
      throw error;
    }
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { updateGameSession: dbUpdateGameSession, getGameSessionById } = await import('@/lib/database');
      dbUpdateGameSession(id, updates);
      const updatedSession = getGameSessionById(id);
      
      if (!updatedSession) {
        throw new Error(`Game session ${id} not found after update`);
      }
      
      return updatedSession;
    } catch (error) {
      console.error('Failed to update game session:', error);
      throw error;
    }
  }

  async deleteGameSession(id: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { deleteGameSession: dbDeleteGameSession } = await import('@/lib/database');
      dbDeleteGameSession(id);
      return true;
    } catch (error) {
      console.error('Failed to delete game session:', error);
      return false;
    }
  }

  async getGameHistory(options: HistoryOptions = {}): Promise<GameSession[]> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'date',
        sortOrder = 'desc',
        userId
      } = options;

      const { getGameSessionsByUserId, getAllGameSessions } = await import('@/lib/database');
      let sessions: GameSession[];

      if (userId) {
        // 获取特定用户的游戏历史
        sessions = getGameSessionsByUserId(userId, limit + offset);
      } else {
        // 获取所有游戏历史
        sessions = getAllGameSessions(limit + offset);
      }

      // 应用排序
      sessions.sort((a, b) => {
        let comparison = 0;
        
        switch (sortBy) {
          case 'date':
            comparison = a.startTime.getTime() - b.startTime.getTime();
            break;
          case 'score':
            comparison = (a.confidence || 0) - (b.confidence || 0);
            break;
          case 'duration':
            comparison = (a.duration || 0) - (b.duration || 0);
            break;
        }
        
        return sortOrder === 'desc' ? -comparison : comparison;
      });

      // 应用分页
      return sessions.slice(offset, offset + limit);
    } catch (error) {
      console.error('Failed to get game history:', error);
      throw error;
    }
  }

  async getGameStats(userId?: string): Promise<GameStats> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { getGameSessionsByUserId, getGameStatistics } = await import('@/lib/database');
      
      if (userId) {
        // 获取特定用户的统计
        const sessions = getGameSessionsByUserId(userId);
        const completedSessions = sessions.filter(s => s.aiGuess && s.confidence !== undefined);
        
        const totalGames = completedSessions.length;
        const successfulGuesses = completedSessions.filter(s => s.isCorrect).length;
        const averageConfidence = totalGames > 0 
          ? completedSessions.reduce((sum, s) => sum + (s.confidence || 0), 0) / totalGames 
          : 0;
        const successRate = totalGames > 0 ? (successfulGuesses / totalGames) * 100 : 0;
        const averageDuration = totalGames > 0
          ? completedSessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalGames
          : 0;

        return {
          totalGames,
          successfulGuesses,
          averageConfidence,
          successRate,
          averageDuration
        };
      } else {
        // 获取全局统计
        const stats = getGameStatistics();
        return {
          totalGames: stats.totalGames,
          successfulGuesses: stats.successfulGuesses,
          averageConfidence: stats.averageConfidence,
          successRate: stats.successRate
        };
      }
    } catch (error) {
      console.error('Failed to get game stats:', error);
      throw error;
    }
  }

  async createUser(user: Omit<User, 'stats' | 'createdAt'>): Promise<User> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { createUser: dbCreateUser } = await import('@/lib/database');
      return dbCreateUser(user);
    } catch (error) {
      console.error('Failed to create user:', error);
      throw error;
    }
  }

  async getUser(id: string): Promise<User | null> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { getUserById } = await import('@/lib/database');
      return getUserById(id);
    } catch (error) {
      console.error('Failed to get user:', error);
      throw error;
    }
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { updateUserStats, getUserById } = await import('@/lib/database');
      
      // 更新用户统计
      if (updates.stats) {
        updateUserStats(id, updates.stats);
      }

      const updatedUser = getUserById(id);
      if (!updatedUser) {
        throw new Error(`User ${id} not found after update`);
      }

      return updatedUser;
    } catch (error) {
      console.error('Failed to update user:', error);
      throw error;
    }
  }

  // 本地适配器不支持图像存储，返回base64数据
  async uploadDrawing(gameId: string, imageData: string): Promise<string> {
    // 本地存储直接返回base64数据
    return imageData;
  }

  async getDrawingUrl(gameId: string): Promise<string> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { getGameSessionById } = await import('@/lib/database');
      const session = getGameSessionById(gameId);
      return session?.drawing || '';
    } catch (error) {
      console.error('Failed to get drawing URL:', error);
      throw error;
    }
  }

  async deleteDrawing(gameId: string): Promise<boolean> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { updateGameSession: dbUpdateGameSession } = await import('@/lib/database');
      // 清除游戏会话中的绘画数据
      dbUpdateGameSession(gameId, { drawing: '' });
      return true;
    } catch (error) {
      console.error('Failed to delete drawing:', error);
      return false;
    }
  }

  // 本地适配器的同步方法（用于与云端同步）
  async syncFromLocal(localData: GameSession[]): Promise<SyncResult> {
    // 本地适配器不需要从本地同步
    return {
      success: true,
      syncedRecords: 0,
      errors: [],
      lastSyncTime: new Date()
    };
  }

  async syncToLocal(): Promise<GameSession[]> {
    if (!this.initialized) {
      throw new Error('Adapter not initialized');
    }

    try {
      const { getAllGameSessions } = await import('@/lib/database');
      return getAllGameSessions();
    } catch (error) {
      console.error('Failed to sync to local:', error);
      throw error;
    }
  }
}