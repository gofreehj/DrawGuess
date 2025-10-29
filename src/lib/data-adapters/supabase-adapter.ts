import { 
  DataAdapter, 
  HistoryOptions, 
  GameStats, 
  SyncResult, 
  DataSourceHealth 
} from './types';
import { GameSession, User } from '@/types/game';
import { createClient } from '@/utils/supabase/client';
import { getSupabaseServerClient } from '@/lib/supabase-client';
import { isSupabaseEnabled } from '@/lib/supabase-config';
import type { SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase云端数据适配器
 * 实现基于Supabase的数据访问和存储
 */
export class SupabaseDataAdapter implements DataAdapter {
  readonly name = 'supabase';
  readonly type = 'cloud' as const;
  
  private client: SupabaseClient<any> | null = null;
  private initialized = false;

  async initialize(): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'development') {
        console.log('🔧 Supabase adapter initialization - isSupabaseEnabled():', isSupabaseEnabled());
      }
      
      if (!isSupabaseEnabled()) {
        throw new Error('Supabase is not available or configured');
      }

      // Initialize on both client and server side
      if (typeof window !== 'undefined') {
        // Client side - use browser client
        this.client = createClient();
        this.initialized = true;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Supabase adapter initialized on client side');
        }
      } else {
        // Server side - client will be created when needed
        this.initialized = true;
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ Supabase adapter initialized on server side');
        }
      }
    } catch (error) {
      console.error('Failed to initialize Supabase adapter:', error);
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

      // On server side, assume healthy if configured
      if (typeof window === 'undefined') {
        return {
          isHealthy: isSupabaseEnabled(),
          lastChecked: new Date(),
          error: isSupabaseEnabled() ? undefined : 'Supabase not configured'
        };
      }

      if (!this.client) {
        return {
          isHealthy: false,
          lastChecked: new Date(),
          error: 'Client not available'
        };
      }

      // 执行简单查询测试连接
      const { error } = await this.client!
        .from('game_sessions')
        .select('id')
        .limit(1);
      
      if (error) {
        throw error;
      }
      
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
    // Supabase客户端不需要显式关闭
    this.initialized = false;
    this.client = null;
  }

  private async ensureInitialized(): Promise<void> {
    if (!this.initialized) {
      throw new Error('Supabase adapter not initialized');
    }
    
    // Initialize client if not already done
    if (!this.client) {
      if (typeof window !== 'undefined') {
        // Client side - use browser client
        this.client = createClient();
      } else {
        // Server side - use server client
        this.client = await getSupabaseServerClient();
      }
    }
    
    if (!this.client) {
      throw new Error('Supabase client not available');
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    if (!this.client) return null;
    
    // 获取当前认证用户ID
    const { data: { user } } = await this.client!.auth.getUser();
    return user?.id || null;
  }

  async createGameSession(session: Omit<GameSession, 'id'>): Promise<GameSession> {
    await this.ensureInitialized();

    try {
      const userId = await this.getCurrentUserId();
      
      const insertData = {
        user_id: userId,
        prompt: session.prompt,
        prompt_category: session.promptCategory,
        drawing_url: session.drawing || null,
        ai_guess: session.aiGuess || null,
        confidence: session.confidence || null,
        is_correct: session.isCorrect || null,
        start_time: session.startTime.toISOString(),
        end_time: session.endTime?.toISOString() || null,
        duration: session.duration || null
      };

      const { data, error } = await this.client!
        .from('game_sessions')
        .insert(insertData)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapSupabaseToGameSession(data);
    } catch (error) {
      console.error('Failed to create game session in Supabase:', error);
      throw error;
    }
  }

  async getGameSession(id: string): Promise<GameSession | null> {
    await this.ensureInitialized();

    try {
      const { data, error } = await this.client!
        .from('game_sessions')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No rows returned
          return null;
        }
        throw error;
      }

      return this.mapSupabaseToGameSession(data);
    } catch (error) {
      console.error('Failed to get game session from Supabase:', error);
      throw error;
    }
  }

  async updateGameSession(id: string, updates: Partial<GameSession>): Promise<GameSession> {
    await this.ensureInitialized();

    try {
      const updateData: any = {};
      
      if (updates.drawing !== undefined) updateData.drawing_url = updates.drawing;
      if (updates.aiGuess !== undefined) updateData.ai_guess = updates.aiGuess;
      if (updates.confidence !== undefined) updateData.confidence = updates.confidence;
      if (updates.isCorrect !== undefined) updateData.is_correct = updates.isCorrect;
      if (updates.endTime !== undefined) updateData.end_time = updates.endTime.toISOString();
      if (updates.duration !== undefined) updateData.duration = updates.duration;

      const { data, error } = await this.client!
        .from('game_sessions')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return this.mapSupabaseToGameSession(data);
    } catch (error) {
      console.error('Failed to update game session in Supabase:', error);
      throw error;
    }
  }

  async deleteGameSession(id: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const { error } = await this.client!
        .from('game_sessions')
        .delete()
        .eq('id', id);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete game session from Supabase:', error);
      return false;
    }
  }

  async getGameHistory(options: HistoryOptions = {}): Promise<GameSession[]> {
    await this.ensureInitialized();

    try {
      const {
        limit = 50,
        offset = 0,
        sortBy = 'date',
        sortOrder = 'desc',
        userId
      } = options;

      let query = this.client!
        .from('game_sessions')
        .select('*');

      // 如果指定了用户ID，则筛选该用户的数据
      if (userId) {
        query = query.eq('user_id', userId);
      } else {
        // 如果没有指定用户ID，则只返回当前用户的数据
        const currentUserId = await this.getCurrentUserId();
        if (currentUserId) {
          query = query.eq('user_id', currentUserId);
        }
      }

      // 应用排序
      const orderColumn = sortBy === 'date' ? 'created_at' : 
                         sortBy === 'score' ? 'confidence' : 'duration';
      query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

      // 应用分页
      query = query.range(offset, offset + limit - 1);

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      return (data || []).map(row => this.mapSupabaseToGameSession(row));
    } catch (error) {
      console.error('Failed to get game history from Supabase:', error);
      throw error;
    }
  }

  async getGameStats(userId?: string): Promise<GameStats> {
    await this.ensureInitialized();

    try {
      const targetUserId = userId || await this.getCurrentUserId();
      
      if (!targetUserId) {
        return {
          totalGames: 0,
          successfulGuesses: 0,
          averageConfidence: 0,
          successRate: 0,
          averageDuration: 0
        };
      }

      const { data, error } = await this.client!
        .from('game_sessions')
        .select('confidence, is_correct, duration')
        .eq('user_id', targetUserId)
        .not('ai_guess', 'is', null);

      if (error) {
        throw error;
      }

      const sessions = data || [];
      const totalGames = sessions.length;
      const successfulGuesses = sessions.filter(s => s.is_correct === true).length;
      const averageConfidence = totalGames > 0 
        ? sessions.reduce((sum, s) => sum + (s.confidence || 0), 0) / totalGames 
        : 0;
      const successRate = totalGames > 0 ? (successfulGuesses / totalGames) * 100 : 0;
      const averageDuration = totalGames > 0
        ? sessions.reduce((sum, s) => sum + (s.duration || 0), 0) / totalGames
        : 0;

      return {
        totalGames,
        successfulGuesses,
        averageConfidence,
        successRate,
        averageDuration
      };
    } catch (error) {
      console.error('Failed to get game stats from Supabase:', error);
      throw error;
    }
  }

  async createUser(user: Omit<User, 'stats' | 'createdAt'>): Promise<User> {
    // Simplified: return a mock user for anonymous gaming
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      stats: {
        totalGames: 0,
        successfulGuesses: 0,
        averageConfidence: 0
      },
      createdAt: new Date()
    };
  }

  async getUser(id: string): Promise<User | null> {
    // Simplified: return a mock user for anonymous gaming
    if (id === 'anonymous') {
      return {
        id: 'anonymous',
        username: 'Anonymous User',
        email: undefined,
        stats: await this.getGameStats(id),
        createdAt: new Date()
      };
    }
    return null;
  }

  async updateUser(id: string, updates: Partial<User>): Promise<User> {
    // Simplified: return updated mock user for anonymous gaming
    const currentUser = await this.getUser(id);
    if (!currentUser) {
      throw new Error('User not found');
    }
    
    return {
      ...currentUser,
      ...updates,
      stats: updates.stats || currentUser.stats
    };
  }

  async uploadDrawing(gameId: string, imageData: string, userId?: string): Promise<string> {
    await this.ensureInitialized();

    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        throw new Error('No user ID available for drawing upload');
      }

      // 将base64转换为Blob
      const base64Data = imageData.replace(/^data:image\/[a-z]+;base64,/, '');
      const byteCharacters = atob(base64Data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: 'image/png' });

      const fileName = `${targetUserId}/${gameId}.png`;
      
      const { data, error } = await this.client!.storage
        .from('drawings')
        .upload(fileName, blob, {
          contentType: 'image/png',
          cacheControl: '3600'
        });

      if (error) {
        throw error;
      }

      return data.path;
    } catch (error) {
      console.error('Failed to upload drawing to Supabase:', error);
      throw error;
    }
  }

  async getDrawingUrl(gameId: string, userId?: string): Promise<string> {
    await this.ensureInitialized();

    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        throw new Error('No user ID available for drawing URL');
      }

      // Try different possible file names (with timestamp variations)
      const possibleFileNames = [
        `${targetUserId}/${gameId}.png`,
        `${targetUserId}/${gameId}_*.png` // Pattern for timestamped files
      ];
      
      // First, try to list files to find the actual filename
      const { data: files, error: listError } = await this.client!.storage
        .from('drawings')
        .list(targetUserId, {
          search: gameId
        });

      if (!listError && files && files.length > 0) {
        // Find the file that matches our game ID
        const matchingFile = files.find(file => 
          file.name.startsWith(gameId) && file.name.endsWith('.png')
        );
        
        if (matchingFile) {
          const { data } = this.client!.storage
            .from('drawings')
            .getPublicUrl(`${targetUserId}/${matchingFile.name}`);
          
          return data.publicUrl;
        }
      }

      // Fallback to the basic filename pattern
      const fileName = `${targetUserId}/${gameId}.png`;
      const { data } = this.client!.storage
        .from('drawings')
        .getPublicUrl(fileName);

      return data.publicUrl;
    } catch (error) {
      console.error('Failed to get drawing URL from Supabase:', error);
      throw error;
    }
  }

  async deleteDrawing(gameId: string, userId?: string): Promise<boolean> {
    await this.ensureInitialized();

    try {
      const targetUserId = userId || await this.getCurrentUserId();
      if (!targetUserId) {
        throw new Error('No user ID available for drawing deletion');
      }

      const fileName = `${targetUserId}/${gameId}.png`;
      
      const { error } = await this.client!.storage
        .from('drawings')
        .remove([fileName]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Failed to delete drawing from Supabase:', error);
      return false;
    }
  }

  async syncFromLocal(localData: GameSession[]): Promise<SyncResult> {
    await this.ensureInitialized();

    const errors: string[] = [];
    let syncedRecords = 0;

    try {
      for (const session of localData) {
        try {
          await this.createGameSession(session);
          syncedRecords++;
        } catch (error) {
          errors.push(`Failed to sync session ${session.id}: ${error}`);
        }
      }

      return {
        success: errors.length === 0,
        syncedRecords,
        errors,
        lastSyncTime: new Date()
      };
    } catch (error) {
      console.error('Failed to sync from local to Supabase:', error);
      return {
        success: false,
        syncedRecords,
        errors: [...errors, `Sync failed: ${error}`],
        lastSyncTime: new Date()
      };
    }
  }

  async syncToLocal(): Promise<GameSession[]> {
    await this.ensureInitialized();

    try {
      const sessions = await this.getGameHistory({ limit: 1000 });
      return sessions;
    } catch (error) {
      console.error('Failed to sync from Supabase to local:', error);
      throw error;
    }
  }

  // 辅助方法：将Supabase数据映射为GameSession
  private mapSupabaseToGameSession(data: any): GameSession {
    return {
      id: data.id,
      userId: data.user_id || undefined,
      prompt: data.prompt,
      promptCategory: data.prompt_category,
      drawing: data.drawing_url || '',
      aiGuess: data.ai_guess || '',
      confidence: data.confidence || 0,
      isCorrect: data.is_correct || false,
      startTime: new Date(data.start_time),
      endTime: data.end_time ? new Date(data.end_time) : new Date(),
      duration: data.duration || 0
    };
  }


}